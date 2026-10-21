import { MutationCache, QueryCache, QueryClient, keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Baseline } from '../data';
import { useStore } from '../store';
import {
  AccountFilter, ApiError, CitizenDetails, NewAdmin, NewComplaint, NewNotice, ProfilePatch, RequestQuery, SchemeInput, Session, StatusUpdate,
  WorkInput, api,
} from './index';

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
  requestList: (query: RequestQuery) => ['requests', 'list', query],
  request: (id: string) => ['requests', id],
  notices: ['notices'],
  schemes: ['schemes'],
  works: ['works'],
  stats: ['stats'],
  baseline: ['baseline'],
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

/** The request list, filtered and sorted by the server. While new filters load, the previous results stay on screen. */
export const useRequests = (query: RequestQuery = {}, enabled = true) => useQuery({
  queryKey: keys.requestList(query),
  queryFn: () => api.listRequests(query),
  enabled,
  placeholderData: keepPreviousData,
});

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

export const useReopenRequest = () => useMutation({
  mutationFn: ({ id, reason }: { id: string; reason: string }) => api.reopenRequest(id, reason),
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

export const useSaveNotice = () => useMutation({
  /** Publishes the notice, or updates it when an `id` is given. */
  mutationFn: ({ id, notice }: { id?: string; notice: NewNotice }) => (id ? api.updateNotice(id, notice) : api.createNotice(notice)),
  onSuccess: () => invalidate(keys.notices),
});

export const useDeleteNotice = () => useMutation({
  mutationFn: (id: string) => api.deleteNotice(id),
  onSuccess: () => invalidate(keys.notices),
});

export const useVillageStats = () => useQuery({ queryKey: keys.stats, queryFn: () => api.getVillageStats() });

export const useBaseline = () => useQuery({ queryKey: keys.baseline, queryFn: () => api.getBaseline() });

export const useUpdateBaseline = () => useMutation({
  mutationFn: (b: Baseline) => api.updateBaseline(b),
  onSuccess: (b) => {
    queryClient.setQueryData(keys.baseline, b);
    return invalidate(keys.stats);
  },
});

// ---------- Schemes and development works ----------

export const useSchemes = () => useQuery({ queryKey: keys.schemes, queryFn: () => api.listSchemes() });

export const useSaveScheme = () => useMutation({
  /** Creates the scheme, or updates it when an `id` is given. */
  mutationFn: ({ id, scheme }: { id?: string; scheme: SchemeInput }) => (id ? api.updateScheme(id, scheme) : api.createScheme(scheme)),
  onSuccess: () => invalidate(keys.schemes),
});

export const useDeleteScheme = () => useMutation({
  mutationFn: (id: string) => api.deleteScheme(id),
  onSuccess: () => invalidate(keys.schemes),
});

export const useWorks = () => useQuery({ queryKey: keys.works, queryFn: () => api.listWorks() });

export const useSaveWork = () => useMutation({
  /** Creates the work, or updates it when an `id` is given. */
  mutationFn: ({ id, work }: { id?: string; work: WorkInput }) => (id ? api.updateWork(id, work) : api.createWork(work)),
  onSuccess: () => invalidate(keys.works),
});

export const useDeleteWork = () => useMutation({
  mutationFn: (id: string) => api.deleteWork(id),
  onSuccess: () => invalidate(keys.works),
});

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
