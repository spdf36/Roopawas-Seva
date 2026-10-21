import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CATEGORIES, FIRST_NEW_SEQ, L, Notice, NoticeTag, Request, SEED_NOTICES, SEED_REQUESTS, Status, TAG_VISUAL, findScheme,
} from './data';

export type Lang = 'hi' | 'en';

export type Profile = {
  name: string;
  mobile: string;
  ageGroup: string;
  ward: string;
  occupation: string;
  family: string;
};

// Demo-only admin credentials, shown on the login screen.
export const ADMIN_USER = 'sarpanch';
export const ADMIN_PIN = '1234';

type State = {
  hydrated: boolean;
  lang: Lang;
  profile: Profile | null;
  requests: Request[];
  notices: Notice[];
  seq: number;
  isAdmin: boolean;
  setLang: (lang: Lang) => void;
  saveProfile: (p: Profile) => void;
  clearProfile: () => void;
  addComplaint: (c: { categoryId: string; description: string; location: string; photo?: string }) => string;
  applyScheme: (schemeId: string) => string;
  setStatus: (id: string, status: Status, note?: string, department?: string) => void;
  confirmResolution: (id: string) => void;
  addNotice: (n: { tag: NoticeTag; title: string; body: string }) => void;
  adminLogin: (user: string, pin: string) => boolean;
  adminLogout: () => void;
  resetDemo: () => void;
};

const nextId = (seq: number) => `RP-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      lang: 'hi',
      profile: null,
      requests: SEED_REQUESTS,
      notices: SEED_NOTICES,
      seq: FIRST_NEW_SEQ,
      isAdmin: false,

      setLang: (lang) => set({ lang }),
      saveProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),

      addComplaint: ({ categoryId, description, location, photo }) => {
        const { seq, profile, requests } = get();
        const cat = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
        const now = Date.now();
        const id = nextId(seq);
        const title: L = { hi: `${cat.name.hi} की समस्या`, en: `${cat.name.en} Problem` };
        const req: Request = {
          id, kind: 'complaint', title, categoryId: cat.id, description, location, photo,
          status: 'submitted', department: cat.dept, createdAt: now,
          history: [{ status: 'submitted', at: now }],
          citizen: { name: profile?.name ?? '', mobile: profile?.mobile ?? '' },
          mine: true,
        };
        set({ requests: [req, ...requests], seq: seq + 1 });
        return id;
      },

      applyScheme: (schemeId) => {
        const { seq, profile, requests } = get();
        const found = findScheme(schemeId);
        const now = Date.now();
        const id = nextId(seq);
        const req: Request = {
          id, kind: 'application', schemeId,
          title: found?.scheme.name ?? { hi: 'योजना आवेदन', en: 'Scheme Application' },
          description: `${found?.scheme.name.hi ?? 'योजना'} के लिए आवेदन।`,
          location: 'रूपावास',
          status: 'submitted', department: found?.scheme.dept ?? 'panchayat', createdAt: now,
          history: [{ status: 'submitted', at: now }],
          citizen: { name: profile?.name ?? '', mobile: profile?.mobile ?? '' },
          mine: true,
        };
        set({ requests: [req, ...requests], seq: seq + 1 });
        return id;
      },

      setStatus: (id, status, note, department) =>
        set({
          requests: get().requests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  department: department ?? r.department,
                  confirmed: status === 'resolved' ? r.confirmed : false,
                  history: [...r.history, { status, at: Date.now(), note: note?.trim() || undefined }],
                }
              : r,
          ),
        }),

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

      adminLogin: (user, pin) => {
        const ok = user.trim().toLowerCase() === ADMIN_USER && pin === ADMIN_PIN;
        if (ok) set({ isAdmin: true });
        return ok;
      },
      adminLogout: () => set({ isAdmin: false }),

      resetDemo: () =>
        set({ profile: null, requests: SEED_REQUESTS, notices: SEED_NOTICES, seq: FIRST_NEW_SEQ, isAdmin: false }),
    }),
    {
      name: 'roopawas-seva',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ lang, profile, requests, notices, seq, isAdmin }) => ({
        lang, profile, notices, seq, isAdmin,
        // Browser-picked photos are large data/blob URIs that would overflow web storage.
        requests: requests.map((r) => (r.photo && !r.photo.startsWith('file:') ? { ...r, photo: undefined } : r)),
      }),
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

/** Bilingual helper: `t('हिंदी', 'English')` for inline copy, `tl(obj)` for `{hi, en}` data. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return {
    lang,
    t: (hi: string, en: string) => (lang === 'hi' ? hi : en),
    tl: (v: L) => v[lang],
  };
}
