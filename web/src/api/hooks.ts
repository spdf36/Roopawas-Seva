import { MutationCache, QueryCache, QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useStore } from '../store';
import { AccountFilter, ApiError, CitizenDetails, NewAdmin, NewComplaint, NewNotice, ProfilePatch, Session, StatusUpdate, api } from './index';

/** A 401 means the session is over (logged out elsewhere, or deactivated): drop it everywhere. */
function onError(error: Error) {
  if (error instanceof ApiError && error.status === 401 && useStore.getState().token) endSession();
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying cannot fix a rule the server enforced (401/403/404/400…), only a lost connection.
      retry: (count, error) => !(error instanceof ApiError && error.code !== 'network') && count < 2,
    },
  },
});

/** Switching accounts must never show the previous account's cached data. */
function startSession(session: Session) {
  queryClient.clear();
  useStore.getState().setSession(session);
}

function endSession() {
  useStore.getState().setSession(null);
  queryClient.clear();
}

const keys = {
  me: ['me'],
  requests: ['requests'],
  request: (id: string) => ['requests', id],
  notices: ['notices'],
  stats: ['stats'],
  accounts: (filter: AccountFilter) => ['accounts', filter],
};

const invalidate = (...queryKeys: string[][]) => Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));

// ---------- Auth ----------

/** Re-checks the stored session with the server (and refreshes the user) whenever the site loads. */
export function useSessionCheck() {
  const token = useStore((s) => s.token);
  const setUser = useStore((s) => s.setUser);
  return useQuery({
    queryKey: keys.me,
    queryFn: async () => {
      const user = await api.me();
      setUser(user);
      return user;
    },
    enabled: !!token,
  });
}

export const useLogin = () => useMutation({
  mutationFn: ({ loginId, pin }: { loginId: string; pin: string }) => api.login(loginId, pin),
  onSuccess: startSession,
});

export const useLogout = () => useMutation({
  // Logging out takes effect locally at once, even if the server is slow or unreachable.
  mutationFn: () => {
    const done = api.logout();
    endSession();
    return done;
  },
});

export const useSendOtp = () => useMutation({ mutationFn: (mobile: string) => api.sendOtp(mobile) });

export const useRegister = () => useMutation({
  mutationFn: ({ details, otp, pin }: { details: CitizenDetails; otp: string; pin: string }) => api.register(details, otp, pin),
  onSuccess: startSession,
});

export const useUpdateProfile = () => useMutation({
  mutationFn: (patch: ProfilePatch) => api.updateProfile(patch),
  onSuccess: (user) => useStore.getState().setUser(user),
});

// ---------- Requests ----------

export const useRequests = (enabled = true) => useQuery({ queryKey: keys.requests, queryFn: () => api.listRequests(), enabled });

export const useRequest = (id: string) => useQuery({ queryKey: keys.request(id), queryFn: () => api.getRequest(id) });

export const useCreateComplaint = () => useMutation({
  mutationFn: (c: NewComplaint) => api.createComplaint(c),
  onSuccess: () => invalidate(keys.requests, keys.stats),
});

export const useApplyScheme = () => useMutation({
  mutationFn: (schemeId: string) => api.applyScheme(schemeId),
  onSuccess: () => invalidate(keys.requests, keys.stats),
});

export const useUpdateStatus = () => useMutation({
  mutationFn: ({ id, update }: { id: string; update: StatusUpdate }) => api.updateStatus(id, update),
  onSuccess: (r) => {
    queryClient.setQueryData(keys.request(r.id), r);
    return invalidate(keys.requests, keys.stats);
  },
});

export const useConfirmResolution = () => useMutation({
  mutationFn: (id: string) => api.confirmResolution(id),
  onSuccess: (r) => {
    queryClient.setQueryData(keys.request(r.id), r);
    return invalidate(keys.requests);
  },
});

// ---------- Notices and village figures ----------

export const useNotices = () => useQuery({ queryKey: keys.notices, queryFn: () => api.listNotices() });

export const useCreateNotice = () => useMutation({
  mutationFn: (n: NewNotice) => api.createNotice(n),
  onSuccess: () => invalidate(keys.notices),
});

export const useVillageStats = () => useQuery({ queryKey: keys.stats, queryFn: () => api.getVillageStats() });

// ---------- Accounts ----------

export const useAccounts = (filter: AccountFilter) => useQuery({ queryKey: keys.accounts(filter), queryFn: () => api.listAccounts(filter) });

export const useCreateAdmin = () => useMutation({
  mutationFn: (a: NewAdmin) => api.createAdmin(a),
  onSuccess: () => invalidate(keys.accounts('staff')),
});

export const useSetAccountActive = () => useMutation({
  mutationFn: ({ id, active }: { id: string; active: boolean }) => api.setAccountActive(id, active),
  onSuccess: () => invalidate(keys.accounts('citizen'), keys.accounts('staff')),
});

export const useRemoveAccount = () => useMutation({
  mutationFn: (id: string) => api.removeAccount(id),
  onSuccess: () => invalidate(keys.accounts('staff')),
});

// ---------- Demo ----------

export const useResetDemo = () => useMutation({
  mutationFn: () => api.resetDemo(),
  onSuccess: endSession,
});
