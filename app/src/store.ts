import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Account, CATEGORIES, FIRST_NEW_SEQ, L, Notice, NoticeTag, Request, SEED_ACCOUNTS, SEED_NOTICES, SEED_REQUESTS, Status,
  TAG_VISUAL, findScheme,
} from './data';

export type Lang = 'hi' | 'en';

export type CitizenDetails = Pick<Account, 'name' | 'mobile'> & Required<Pick<Account, 'ageGroup' | 'ward' | 'occupation' | 'family'>>;
export type NewAdmin = Pick<Account, 'name' | 'loginId' | 'pin' | 'mobile'> & { designation: string };

type State = {
  hydrated: boolean;
  lang: Lang;
  accounts: Account[];
  sessionId: string | null;
  requests: Request[];
  notices: Notice[];
  seq: number;
  setLang: (lang: Lang) => void;
  login: (loginId: string, pin: string) => 'ok' | 'invalid' | 'inactive';
  logout: () => void;
  /** Creates a citizen account and logs it in. */
  register: (details: CitizenDetails, pin: string) => 'ok' | 'exists';
  updateProfile: (patch: Partial<Omit<CitizenDetails, 'mobile'>>) => void;
  addComplaint: (c: { categoryId: string; description: string; location: string; photo?: string }) => string;
  applyScheme: (schemeId: string) => string;
  setStatus: (id: string, status: Status, note?: string, department?: string) => void;
  confirmResolution: (id: string) => void;
  addNotice: (n: { tag: NoticeTag; title: string; body: string }) => void;
  createAdmin: (a: NewAdmin) => 'ok' | 'exists';
  setAccountActive: (id: string, active: boolean) => void;
  removeAccount: (id: string) => void;
  resetDemo: () => void;
};

const nextId = (seq: number) => `RP-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
/** Login IDs are matched case-insensitively and without spaces (mobile numbers are typed with gaps). */
export const normaliseLoginId = (v: string) => v.replace(/\s+/g, '').toLowerCase();

const SEED = { accounts: SEED_ACCOUNTS, sessionId: null, requests: SEED_REQUESTS, notices: SEED_NOTICES, seq: FIRST_NEW_SEQ };

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const me = () => get().accounts.find((a) => a.id === get().sessionId);
      const newRequest = (fields: Omit<Request, 'id' | 'status' | 'createdAt' | 'history' | 'citizen'>) => {
        const { seq, requests } = get();
        const user = me();
        const now = Date.now();
        const id = nextId(seq);
        const req: Request = {
          ...fields, id, status: 'submitted', createdAt: now,
          history: [{ status: 'submitted', at: now }],
          citizen: { name: user?.name ?? '', mobile: user?.mobile ?? '' },
        };
        set({ requests: [req, ...requests], seq: seq + 1 });
        return id;
      };

      return {
        hydrated: false,
        lang: 'hi',
        ...SEED,

        setLang: (lang) => set({ lang }),

        login: (loginId, pin) => {
          const key = normaliseLoginId(loginId);
          const acc = get().accounts.find((a) => normaliseLoginId(a.loginId) === key && a.pin === pin);
          if (!acc) return 'invalid';
          if (!acc.active) return 'inactive';
          set({ sessionId: acc.id });
          return 'ok';
        },
        logout: () => set({ sessionId: null }),

        register: (details, pin) => {
          const { accounts } = get();
          if (accounts.some((a) => normaliseLoginId(a.loginId) === details.mobile || a.mobile === details.mobile)) return 'exists';
          const acc: Account = {
            ...details, id: `u-${Date.now()}`, role: 'citizen', loginId: details.mobile, pin, active: true, createdAt: Date.now(),
          };
          set({ accounts: [...accounts, acc], sessionId: acc.id });
          return 'ok';
        },

        updateProfile: (patch) => {
          const id = get().sessionId;
          set({ accounts: get().accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
        },

        addComplaint: ({ categoryId, description, location, photo }) => {
          const cat = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
          const title: L = { hi: `${cat.name.hi} की समस्या`, en: `${cat.name.en} Problem` };
          return newRequest({ kind: 'complaint', title, categoryId: cat.id, description, location, photo, department: cat.dept });
        },

        applyScheme: (schemeId) => {
          const found = findScheme(schemeId);
          return newRequest({
            kind: 'application', schemeId,
            title: found?.scheme.name ?? { hi: 'योजना आवेदन', en: 'Scheme Application' },
            description: `${found?.scheme.name.hi ?? 'योजना'} के लिए आवेदन।`,
            location: 'रूपावास',
            department: found?.scheme.dept ?? 'panchayat',
          });
        },

        setStatus: (id, status, note, department) => {
          const by = me()?.name;
          set({
            requests: get().requests.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status,
                    department: department ?? r.department,
                    confirmed: status === 'resolved' ? r.confirmed : false,
                    history: [...r.history, { status, at: Date.now(), note: note?.trim() || undefined, by }],
                  }
                : r,
            ),
          });
        },

        confirmResolution: (id) =>
          set({ requests: get().requests.map((r) => (r.id === id ? { ...r, confirmed: true } : r)) }),

        addNotice: ({ tag, title, body }) =>
          set({
            notices: [
              {
                id: `n${Date.now()}`, tag, ...TAG_VISUAL[tag],
                title: { hi: title, en: title },
                body: { hi: body, en: body },
                source: { hi: 'ग्राम पंचायत रूपावास', en: 'Gram Panchayat Roopawas' },
              },
              ...get().notices,
            ],
          }),

        createAdmin: ({ name, loginId, pin, mobile, designation }) => {
          const { accounts } = get();
          const key = normaliseLoginId(loginId);
          if (accounts.some((a) => normaliseLoginId(a.loginId) === key)) return 'exists';
          const acc: Account = {
            id: `u-${Date.now()}`, role: 'admin', name, loginId: key, pin, mobile, designation, active: true, createdAt: Date.now(),
          };
          set({ accounts: [...accounts, acc] });
          return 'ok';
        },

        // The logged-in account cannot deactivate or remove itself.
        setAccountActive: (id, active) => {
          if (id === get().sessionId) return;
          set({ accounts: get().accounts.map((a) => (a.id === id ? { ...a, active } : a)) });
        },
        removeAccount: (id) => {
          if (id === get().sessionId) return;
          set({ accounts: get().accounts.filter((a) => a.id !== id) });
        },

        resetDemo: () => set(SEED),
      };
    },
    {
      name: 'roopawas-seva',
      // v2 replaced the single on-device profile with role-based accounts; older saved data is dropped.
      version: 2,
      migrate: (persisted, version) => (version < 2 ? { lang: (persisted as { lang?: Lang })?.lang ?? 'hi' } : persisted) as State,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ lang, accounts, sessionId, requests, notices, seq }) => ({
        lang, accounts, sessionId, notices, seq,
        // Browser-picked photos are large data/blob URIs that would overflow web storage.
        requests: requests.map((r) => (r.photo && !r.photo.startsWith('file:') ? { ...r, photo: undefined } : r)),
      }),
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

/** The logged-in account, or null. */
export const useUser = () => useStore((s) => s.accounts.find((a) => a.id === s.sessionId) ?? null);

/** Bilingual helper: `t('हिंदी', 'English')` for inline copy, `tl(obj)` for `{hi, en}` data. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return {
    lang,
    t: (hi: string, en: string) => (lang === 'hi' ? hi : en),
    tl: (v: L) => v[lang],
  };
}
