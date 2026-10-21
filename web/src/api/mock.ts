import {
  Account, BASELINE_FIELDS, Baseline, CATEGORIES, DEPARTMENTS, DevelopmentWork, FIRST_NEW_SEQ, L, NOTICE_TAGS, Notice, Request, Role,
  SCHEME_GROUPS, SEED_ACCOUNTS, SEED_BASELINE, SEED_NOTICES, SEED_REQUESTS, SEED_SCHEMES, SEED_WORKS, Scheme, TAG_VISUAL, isStaff,
  matchesFilter, nextStatuses, updatedAt,
} from '../data';
import { Api, ApiError, NewNotice, SchemeInput, User, WorkInput } from './types';

/**
 * A stand-in for the backend that runs in the browser and keeps its "database" in localStorage.
 * It enforces the same rules the real server must, so the website behaves the same once the
 * backend replaces it. Nothing outside src/api should import this file.
 */

const DB_KEY = 'roopawas-seva-db';
/** Simulated network delay, so loading states are exercised during development. */
const LATENCY_MS = 150;

type Db = {
  accounts: Account[];
  requests: Request[];
  notices: Notice[];
  schemes: Scheme[];
  works: DevelopmentWork[];
  baseline: Baseline;
  seq: number;
  /** Session token → account ID. */
  sessions: Record<string, string>;
};

const seed = (): Db => structuredClone({
  accounts: SEED_ACCOUNTS, requests: SEED_REQUESTS, notices: SEED_NOTICES, schemes: SEED_SCHEMES, works: SEED_WORKS, baseline: SEED_BASELINE,
  seq: FIRST_NEW_SEQ, sessions: {},
});

function load(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      // Collections added since the data was saved start from the sample data.
      const db: Db = { ...seed(), ...(JSON.parse(raw) as Partial<Db>) };
      // Requests saved before wards were recorded on them take the citizen's current ward.
      for (const r of db.requests) r.citizen.ward ??= db.accounts.find((a) => a.mobile === r.citizen.mobile)?.ward;
      return db;
    }
  } catch {
    // Unreadable storage falls back to the sample data.
  }
  return seed();
}

function save(db: Db) {
  // Only data: URLs survive a reload; object URLs from a file picker die with the page.
  const requests = db.requests.map((r) => (r.photo && !r.photo.startsWith('data:') ? { ...r, photo: undefined } : r));
  try {
    localStorage.setItem(DB_KEY, JSON.stringify({ ...db, requests }));
  } catch {
    // Storage full or blocked: the change lives until the page reloads.
  }
}

const fail = (status: number, code: ApiError['code']): never => {
  throw new ApiError(status, code);
};

const toUser = ({ pin: _pin, ...user }: Account): User => user;
const normaliseLoginId = (v: string) => v.replace(/\s+/g, '').toLowerCase();
const isMobile = (v: string) => /^[6-9]\d{9}$/.test(v);
const isPin = (v: string) => /^\d{4}$/.test(v);
const filled = (v: L) => !!v.hi.trim();
/** Trims bilingual text; a blank English text falls back to the Hindi one. */
const bilingual = (v: L): L => ({ hi: v.hi.trim(), en: v.en.trim() || v.hi.trim() });
const isOpen = (r: Request) => r.status !== 'resolved' && r.status !== 'rejected';
const newToken = () => crypto.randomUUID();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

function cleanNotice({ tag, title, body }: NewNotice): Pick<Notice, 'tag' | 'title' | 'body'> {
  if (!NOTICE_TAGS.some((x) => x.id === tag) || !filled(title) || !filled(body)) return fail(400, 'invalid');
  return { tag, title: bilingual(title), body: bilingual(body) };
}

function cleanScheme({ groupId, name, desc, dept, open }: SchemeInput): SchemeInput {
  if (!SCHEME_GROUPS.some((g) => g.id === groupId) || !DEPARTMENTS[dept] || !filled(name) || !filled(desc)) return fail(400, 'invalid');
  return { groupId, dept, open: !!open, name: bilingual(name), desc: bilingual(desc) };
}

function cleanWork({ name, progress, budget }: WorkInput): WorkInput {
  if (!filled(name) || !Number.isInteger(progress) || progress < 0 || progress > 100) return fail(400, 'invalid');
  return { name: bilingual(name), progress, budget: budget.trim() };
}

function cleanBaseline(b: Baseline): Baseline {
  const out = {} as Baseline;
  for (const { id } of BASELINE_FIELDS) {
    const n = b[id];
    if (!Number.isInteger(n) || n < 0) return fail(400, 'invalid');
    out[id] = n;
  }
  return out;
}

function find<T extends { id: string }>(list: T[], id: string): T {
  return list.find((x) => x.id === id) ?? fail(404, 'not_found');
}

export function createMockApi(getToken: () => string | null): Api {
  /** Runs one "request" against the database, with latency, and saves it afterwards. */
  async function call<T>(handler: (db: Db) => T): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
    const db = load();
    const result = handler(db);
    save(db);
    // Callers get copies, as they would from a real server.
    return result === undefined ? result : structuredClone(result);
  }

  /** The logged-in, active account, if any (for endpoints that guests may also call). */
  function currentUser(db: Db): Account | undefined {
    const token = getToken();
    return token ? db.accounts.find((a) => a.id === db.sessions[token] && a.active) : undefined;
  }

  /** The logged-in account; rejects missing, ended or deactivated sessions and the wrong roles. */
  function auth(db: Db, roles?: Role[]): Account {
    const acc = currentUser(db);
    if (!acc) return fail(401, 'unauthorized');
    if (roles && !roles.includes(acc.role)) return fail(403, 'forbidden');
    return acc;
  }

  function findRequest(db: Db, id: string, user: Account): Request {
    const r = db.requests.find((x) => x.id === id);
    // Someone else's request looks exactly like a missing one.
    if (!r || (!isStaff(user) && r.citizen.mobile !== user.mobile)) return fail(404, 'not_found');
    return r;
  }

  function addRequest(db: Db, user: Account, fields: Omit<Request, 'id' | 'status' | 'createdAt' | 'history' | 'citizen'>): Request {
    const now = Date.now();
    const req: Request = {
      ...fields,
      id: `RP-${new Date().getFullYear()}-${String(db.seq).padStart(5, '0')}`,
      status: 'submitted',
      createdAt: now,
      history: [{ status: 'submitted', at: now }],
      citizen: { name: user.name, mobile: user.mobile, ward: user.ward },
    };
    db.requests.unshift(req);
    db.seq += 1;
    return req;
  }

  function startSession(db: Db, acc: Account) {
    const token = newToken();
    db.sessions[token] = acc.id;
    return { token, user: toUser(acc) };
  }

  /** Ends every session of an account, e.g. when it is deactivated or removed. */
  function endSessions(db: Db, accountId: string) {
    for (const [token, id] of Object.entries(db.sessions)) if (id === accountId) delete db.sessions[token];
  }

  const mobileTaken = (db: Db, mobile: string) => db.accounts.some((a) => a.mobile === mobile || normaliseLoginId(a.loginId) === mobile);

  return {
    login: (loginId, pin) =>
      call((db) => {
        const key = normaliseLoginId(loginId);
        const acc = db.accounts.find((a) => normaliseLoginId(a.loginId) === key && a.pin === pin);
        if (!acc) return fail(401, 'invalid_login');
        if (!acc.active) return fail(403, 'inactive');
        return startSession(db, acc);
      }),

    logout: () => {
      // Read the token now: the caller clears its session without waiting for the reply.
      const token = getToken();
      return call((db) => {
        if (token) delete db.sessions[token];
      });
    },

    sendOtp: (mobile) =>
      call((db) => {
        if (!isMobile(mobile)) return fail(400, 'invalid');
        if (mobileTaken(db, mobile)) return fail(409, 'exists');
        // Demo: no SMS is sent and any 4-digit OTP is accepted.
      }),

    register: (details, otp, pin) =>
      call((db) => {
        const { name, mobile, ageGroup, ward, occupation, family } = details;
        if (!name.trim() || !ageGroup || !ward || !occupation || !isMobile(mobile) || !isPin(pin) || !isPin(otp)) return fail(400, 'invalid');
        if (mobileTaken(db, mobile)) return fail(409, 'exists');
        const acc: Account = {
          id: `u-${Date.now()}`, role: 'citizen', name: name.trim(), mobile, loginId: mobile, pin,
          ageGroup, ward, occupation, family: family.trim(), active: true, createdAt: Date.now(),
        };
        db.accounts.push(acc);
        return startSession(db, acc);
      }),

    me: () => call((db) => toUser(auth(db))),

    updateProfile: (patch) =>
      call((db) => {
        const acc = auth(db, ['citizen']);
        const { name, ageGroup, ward, occupation, family } = patch;
        if (name !== undefined && !name.trim()) return fail(400, 'invalid');
        if (name !== undefined) acc.name = name.trim();
        if (ageGroup) acc.ageGroup = ageGroup;
        if (ward) acc.ward = ward;
        if (occupation) acc.occupation = occupation;
        if (family !== undefined) acc.family = family.trim();
        return toUser(acc);
      }),

    listRequests: ({ q, status = 'all', category, department, ward, sort = 'newest' } = {}) =>
      call((db) => {
        const user = auth(db);
        const text = q?.trim().toLowerCase();
        const digits = q?.replace(/\D/g, '');
        const list = db.requests.filter((r) =>
          (isStaff(user) || r.citizen.mobile === user.mobile) &&
          matchesFilter(r, status) &&
          (!category || (category === 'application' ? r.kind === 'application' : r.categoryId === category)) &&
          (!department || r.department === department) &&
          (!ward || r.citizen.ward === ward) &&
          (!text || r.id.toLowerCase().includes(text) || r.citizen.name.toLowerCase().includes(text) || (!!digits && digits.length >= 3 && r.citizen.mobile.includes(digits))),
        );
        const key = sort === 'updated' ? updatedAt : (r: Request) => r.createdAt;
        return list.sort((a, b) => (sort === 'oldest' ? key(a) - key(b) : key(b) - key(a)));
      }),

    getRequest: (id) => call((db) => findRequest(db, id, auth(db))),

    createComplaint: ({ categoryId, description, location, photo }) =>
      call((db) => {
        const user = auth(db, ['citizen']);
        const cat = CATEGORIES.find((c) => c.id === categoryId);
        if (!cat || description.trim().length < 5 || !location.trim()) return fail(400, 'invalid');
        return addRequest(db, user, {
          kind: 'complaint', categoryId: cat.id, department: cat.dept, description: description.trim(), location: location.trim(), photo,
          title: { hi: `${cat.name.hi} की समस्या`, en: `${cat.name.en} Problem` },
        });
      }),

    applyScheme: (schemeId) =>
      call((db) => {
        const user = auth(db, ['citizen']);
        const scheme = db.schemes.find((s) => s.id === schemeId);
        if (!scheme?.open) return fail(400, 'invalid');
        if (db.requests.some((r) => r.schemeId === schemeId && r.citizen.mobile === user.mobile)) return fail(409, 'exists');
        return addRequest(db, user, {
          kind: 'application', schemeId, groupId: scheme.groupId, department: scheme.dept, location: 'रूपावास', title: scheme.name,
          description: `${scheme.name.hi} के लिए आवेदन।`,
        });
      }),

    updateStatus: (id, { status, note, department }) =>
      call((db) => {
        const user = auth(db, ['admin', 'superadmin']);
        const r = findRequest(db, id, user);
        if (!nextStatuses(r.status).includes(status)) return fail(400, 'invalid');
        if (department !== undefined && !DEPARTMENTS[department]) return fail(400, 'invalid');
        r.status = status;
        r.department = department ?? r.department;
        r.confirmed = status === 'resolved' ? r.confirmed : false;
        r.history.push({ status, at: Date.now(), note: note?.trim() || undefined, by: user.name, byId: user.id });
        return r;
      }),

    confirmResolution: (id) =>
      call((db) => {
        const user = auth(db, ['citizen']);
        const r = findRequest(db, id, user);
        if (r.status !== 'resolved') return fail(400, 'invalid');
        r.confirmed = true;
        return r;
      }),

    listNotices: () => call((db) => db.notices),

    createNotice: (n) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        const fields = cleanNotice(n);
        const notice: Notice = {
          id: newId('n'), ...fields, ...TAG_VISUAL[fields.tag],
          source: { hi: 'ग्राम पंचायत रूपावास', en: 'Gram Panchayat Roopawas' },
        };
        db.notices.unshift(notice);
        return notice;
      }),

    updateNotice: (id, n) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        const notice = find(db.notices, id);
        const fields = cleanNotice(n);
        // A notice keeps its own icon unless its category changes.
        Object.assign(notice, fields, fields.tag !== notice.tag ? TAG_VISUAL[fields.tag] : {});
        return notice;
      }),

    deleteNotice: (id) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        find(db.notices, id);
        db.notices = db.notices.filter((n) => n.id !== id);
      }),

    listSchemes: () =>
      call((db) => (isStaff(currentUser(db)) ? db.schemes : db.schemes.filter((s) => s.open))),

    createScheme: (s) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        const scheme: Scheme = { id: newId('s'), ...cleanScheme(s) };
        db.schemes.push(scheme);
        return scheme;
      }),

    updateScheme: (id, s) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        // Existing applications keep their own title, department and group, so editing is safe.
        return Object.assign(find(db.schemes, id), cleanScheme(s));
      }),

    deleteScheme: (id) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        find(db.schemes, id);
        if (db.requests.some((r) => r.schemeId === id)) return fail(409, 'in_use');
        db.schemes = db.schemes.filter((s) => s.id !== id);
      }),

    listWorks: () => call((db) => db.works),

    createWork: (w) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        const work: DevelopmentWork = { id: newId('w'), ...cleanWork(w) };
        db.works.push(work);
        return work;
      }),

    updateWork: (id, w) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        return Object.assign(find(db.works, id), cleanWork(w));
      }),

    deleteWork: (id) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        find(db.works, id);
        db.works = db.works.filter((w) => w.id !== id);
      }),

    getBaseline: () =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        return db.baseline;
      }),

    updateBaseline: (b) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        db.baseline = cleanBaseline(b);
        return db.baseline;
      }),

    getVillageStats: () =>
      call((db) => {
        const B = db.baseline;
        const count = (fn: (r: Request) => boolean) => db.requests.filter(fn).length;
        return {
          total: B.total + db.requests.length,
          resolved: B.resolved + count((r) => r.status === 'resolved'),
          inProgress: B.inProgress + count((r) => isOpen(r) && r.status !== 'forwarded'),
          forwarded: B.forwarded + count((r) => r.status === 'forwarded'),
          roads: B.roads + count((r) => r.categoryId === 'road' && isOpen(r)),
          water: B.water + count((r) => r.categoryId === 'water' && isOpen(r)),
          lightsFixed: B.lightsFixed + count((r) => r.categoryId === 'light' && r.status === 'resolved'),
          schemeApplications: B.schemeApplications + count((r) => r.kind === 'application'),
          schoolWorks: B.schoolWorks,
          trees: B.trees,
        };
      }),

    listAccounts: (filter) =>
      call((db) => {
        auth(db, filter === 'citizen' ? ['admin', 'superadmin'] : ['superadmin']);
        return db.accounts.filter((a) => (filter === 'citizen' ? a.role === 'citizen' : isStaff(a))).map(toUser);
      }),

    createAdmin: ({ name, loginId, pin, mobile, designation }) =>
      call((db) => {
        auth(db, ['superadmin']);
        const key = normaliseLoginId(loginId);
        if (!name.trim() || !designation || !/^[a-z][a-z0-9._-]{2,19}$/.test(key) || !isMobile(mobile) || !isPin(pin)) return fail(400, 'invalid');
        if (db.accounts.some((a) => normaliseLoginId(a.loginId) === key)) return fail(409, 'exists');
        const acc: Account = { id: `u-${Date.now()}`, role: 'admin', name: name.trim(), loginId: key, pin, mobile, designation, active: true, createdAt: Date.now() };
        db.accounts.push(acc);
        return toUser(acc);
      }),

    setAccountActive: (id, active) =>
      call((db) => {
        const me = auth(db, ['admin', 'superadmin']);
        const acc = db.accounts.find((a) => a.id === id);
        if (!acc) return fail(404, 'not_found');
        // Nobody can switch themselves off; admins manage citizens; only the super admin manages admins.
        if (acc.id === me.id || acc.role === 'superadmin' || (acc.role === 'admin' && me.role !== 'superadmin')) return fail(403, 'forbidden');
        acc.active = active;
        if (!active) endSessions(db, acc.id);
        return toUser(acc);
      }),

    removeAccount: (id) =>
      call((db) => {
        auth(db, ['superadmin']);
        const acc = db.accounts.find((a) => a.id === id);
        if (!acc) return fail(404, 'not_found');
        if (acc.role !== 'admin') return fail(403, 'forbidden');
        db.accounts = db.accounts.filter((a) => a.id !== id);
        endSessions(db, id);
      }),

    resetDemo: () =>
      call((db) => {
        Object.assign(db, seed());
      }),
  };
}
