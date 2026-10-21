import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Session, User } from './api/types';
import { L } from './data';

export type Lang = 'hi' | 'en';

/**
 * Client-only state: the language and the login session. Everything else (requests, notices,
 * accounts…) belongs to the server and is loaded through the hooks in src/api/hooks.ts.
 */
type State = {
  lang: Lang;
  token: string | null;
  /** The logged-in account as last returned by the server. */
  user: User | null;
  setLang: (lang: Lang) => void;
  setSession: (session: Session | null) => void;
  setUser: (user: User) => void;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      lang: 'hi',
      token: null,
      user: null,
      setLang: (lang) => set({ lang }),
      setSession: (session) => set({ token: session?.token ?? null, user: session?.user ?? null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'roopawas-seva',
      // v3 moved all data behind the API; earlier saved data (accounts, requests…) is dropped and the language kept.
      version: 3,
      migrate: (persisted, version) => (version < 3 ? { lang: (persisted as { lang?: Lang })?.lang ?? 'hi' } : persisted) as State,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** The logged-in account, or null. */
export const useUser = () => useStore((s) => s.user);

/** Bilingual helper: `t('हिंदी', 'English')` for inline copy, `tl(obj)` for `{hi, en}` data. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return {
    lang,
    t: (hi: string, en: string) => (lang === 'hi' ? hi : en),
    tl: (v: L) => v[lang],
  };
}
