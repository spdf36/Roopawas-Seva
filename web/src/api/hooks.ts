import { Baseline, Yojna } from '@shared/data';
import { MutationCache, QueryCache, QueryClient, keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useStore } from '../store';
import {
  AccountFilter, ApiError, CitizenDetails, ExpenseInput, FundInput, InstalmentInput, NewAdmin, NewComplaint, NewNotice, ProfilePatch,
  RequestQuery, SchemeInput, Session, StatusUpdate, YojnaInput, api,
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
  yojnas: ['yojnas'],
  yojna: (id: string) => ['yojnas', id],
  stats: ['stats'],
  baseline: ['baseline'],
  accounts: (filter: AccountFilter) => ['accounts', filter],
};

const invalidate = (...queryKeys: string[][]) => Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));

/** Whether the server is a demo (shows demo logins, the any-OTP hint and Reset demo). Fetched once. */
export const useServerInfo = () => useQuery({ queryKey: ['info'], queryFn: () => api.serverInfo(), staleTime: Infinity });

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

// ---------- Schemes ----------

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

// ---------- Village Yojnas ----------

export const useYojnas = () => useQuery({ queryKey: keys.yojnas, queryFn: () => api.listYojnas() });

export const useYojna = (id: string) => useQuery({ queryKey: keys.yojna(id), queryFn: () => api.getYojna(id) });

/** Every change answers with the whole yojna: show it at once, and refresh the list behind it. */
function savedYojna(y: Yojna) {
  queryClient.setQueryData(keys.yojna(y.id), y);
  return invalidate(keys.yojnas);
}

export const useSaveYojna = () => useMutation({
  /** Creates the yojna, or updates its details when an `id` is given. */
  mutationFn: ({ id, yojna }: { id?: string; yojna: YojnaInput }) => (id ? api.updateYojna(id, yojna) : api.createYojna(yojna)),
  onSuccess: savedYojna,
});

export const useDeleteYojna = () => useMutation({
  mutationFn: (id: string) => api.deleteYojna(id),
  onSuccess: () => invalidate(keys.yojnas),
});

/** Adds a fund, or updates it when a `fundId` is given. */
export const useSaveFund = (yojnaId: string) => useMutation({
  mutationFn: ({ fundId, fund }: { fundId?: string; fund: FundInput }) => (fundId ? api.updateFund(yojnaId, fundId, fund) : api.addFund(yojnaId, fund)),
  onSuccess: savedYojna,
});

export const useDeleteFund = (yojnaId: string) => useMutation({ mutationFn: (fundId: string) => api.deleteFund(yojnaId, fundId), onSuccess: savedYojna });

export const useAddInstalment = (yojnaId: string) => useMutation({
  mutationFn: ({ fundId, instalment }: { fundId: string; instalment: InstalmentInput }) => api.addInstalment(yojnaId, fundId, instalment),
  onSuccess: savedYojna,
});

export const useDeleteInstalment = (yojnaId: string) => useMutation({
  mutationFn: ({ fundId, instalmentId }: { fundId: string; instalmentId: string }) => api.deleteInstalment(yojnaId, fundId, instalmentId),
  onSuccess: savedYojna,
});

/** Adds an expense, or updates it when an `expenseId` is given. */
export const useSaveExpense = (yojnaId: string) => useMutation({
  mutationFn: ({ expenseId, expense }: { expenseId?: string; expense: ExpenseInput }) =>
    (expenseId ? api.updateExpense(yojnaId, expenseId, expense) : api.addExpense(yojnaId, expense)),
  onSuccess: savedYojna,
});

export const useDeleteExpense = (yojnaId: string) => useMutation({ mutationFn: (expenseId: string) => api.deleteExpense(yojnaId, expenseId), onSuccess: savedYojna });

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
