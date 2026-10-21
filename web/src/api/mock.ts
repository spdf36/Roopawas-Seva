import {
  Account, CATEGORIES, DASHBOARD_BASE, DEPARTMENTS, FIRST_NEW_SEQ, L, NOTICE_TAGS, Notice, Request, Role, SEED_ACCOUNTS, SEED_NOTICES,
  SEED_REQUESTS, TAG_VISUAL, findScheme, isStaff, nextStatuses,
} from '../data';
import { Api, ApiError, User } from './types';

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
  seq: number;
  /** Session token → account ID. */
  sessions: Record<string, string>;
};

const seed = (): Db => structuredClone({ accounts: SEED_ACCOUNTS, requests: SEED_REQUESTS, notices: SEED_NOTICES, seq: FIRST_NEW_SEQ, sessions: {} });

function load(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Db;
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
const isOpen = (r: Request) => r.status !== 'resolved' && r.status !== 'rejected';
const newToken = () => crypto.randomUUID();

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

  /** The logged-in account; rejects missing, ended or deactivated sessions and the wrong roles. */
  function auth(db: Db, roles?: Role[]): Account {
    const token = getToken();
    const acc = token ? db.accounts.find((a) => a.id === db.sessions[token]) : undefined;
    if (!acc || !acc.active) return fail(401, 'unauthorized');
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
      citizen: { name: user.name, mobile: user.mobile },
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

    listRequests: () =>
      call((db) => {
        const user = auth(db);
        const list = isStaff(user) ? db.requests : db.requests.filter((r) => r.citizen.mobile === user.mobile);
        return [...list].sort((a, b) => b.createdAt - a.createdAt);
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
        const found = findScheme(schemeId);
        if (!found) return fail(400, 'invalid');
        if (db.requests.some((r) => r.schemeId === schemeId && r.citizen.mobile === user.mobile)) return fail(409, 'exists');
        return addRequest(db, user, {
          kind: 'application', schemeId, department: found.scheme.dept, location: 'रूपावास', title: found.scheme.name,
          description: `${found.scheme.name.hi} के लिए आवेदन।`,
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

    createNotice: ({ tag, title, body }) =>
      call((db) => {
        auth(db, ['admin', 'superadmin']);
        if (!NOTICE_TAGS.some((x) => x.id === tag) || !filled(title) || !filled(body)) return fail(400, 'invalid');
        const notice: Notice = {
          id: `n${Date.now()}`, tag, ...TAG_VISUAL[tag],
          title: { hi: title.hi.trim(), en: title.en.trim() || title.hi.trim() },
          body: { hi: body.hi.trim(), en: body.en.trim() || body.hi.trim() },
          source: { hi: 'ग्राम पंचायत रूपावास', en: 'Gram Panchayat Roopawas' },
        };
        db.notices.unshift(notice);
        return notice;
      }),

    getVillageStats: () =>
      call((db) => {
        const B = DASHBOARD_BASE;
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
