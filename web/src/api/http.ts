import { Api, ApiError, ErrorCode, RequestQuery } from '@shared/api';
import { Request } from '@shared/data';

/**
 * The real API over HTTP: each method calls the route documented on it in shared/api.ts.
 * Errors arrive as JSON `{ code }` and are thrown as ApiError, like the mock does; a server that cannot be
 * reached becomes ApiError 0 'network'.
 */
export function createHttpApi(baseUrl: string, getToken: () => string | null): Api {
  const root = baseUrl.replace(/\/+$/, '');

  async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
    // Read the token now, before any await: logout clears the session straight after calling.
    const token = getToken();
    let res: Response;
    try {
      res = await fetch(root + path, {
        method,
        headers: {
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, 'network');
    }
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => undefined);
    if (!res.ok) {
      const code = typeof data?.code === 'string' ? (data.code as ErrorCode) : res.status >= 500 ? 'server_error' : 'network';
      throw new ApiError(res.status, code);
    }
    return data as T;
  }

  const get = <T>(path: string) => send<T>('GET', path);
  const id = (value: string) => encodeURIComponent(value);
  /** Photo links come back relative to the API (/photos/…); images need the full address. */
  const withPhoto = (r: Request): Request => (r.photo?.startsWith('/') ? { ...r, photo: root + r.photo } : r);
  const request = async (p: Promise<Request>) => withPhoto(await p);

  return {
    serverInfo: () => get('/info'),

    login: (loginId, pin) => send('POST', '/auth/login', { loginId, pin }),
    logout: () => send('POST', '/auth/logout'),
    sendOtp: (mobile) => send('POST', '/auth/otp', { mobile }),
    register: (details, otp, pin) => send('POST', '/auth/register', { details, otp, pin }),
    me: () => get('/auth/me'),
    updateProfile: (patch) => send('PATCH', '/auth/me', patch),

    listRequests: async (query: RequestQuery = {}) => {
      const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]);
      const list = await get<Request[]>(`/requests${params.size ? `?${params}` : ''}`);
      return list.map(withPhoto);
    },
    getRequest: (rid) => request(get(`/requests/${id(rid)}`)),
    createComplaint: (c) => request(send('POST', '/requests/complaints', c)),
    applyScheme: (schemeId) => request(send('POST', '/requests/applications', { schemeId })),
    updateStatus: (rid, update) => request(send('PATCH', `/requests/${id(rid)}/status`, update)),
    confirmResolution: (rid) => request(send('POST', `/requests/${id(rid)}/confirm`)),
    reopenRequest: (rid, reason) => request(send('POST', `/requests/${id(rid)}/reopen`, { reason })),

    listNotices: () => get('/notices'),
    createNotice: (n) => send('POST', '/notices', n),
    updateNotice: (nid, n) => send('PUT', `/notices/${id(nid)}`, n),
    deleteNotice: (nid) => send('DELETE', `/notices/${id(nid)}`),

    listSchemes: () => get('/schemes'),
    createScheme: (s) => send('POST', '/schemes', s),
    updateScheme: (sid, s) => send('PUT', `/schemes/${id(sid)}`, s),
    deleteScheme: (sid) => send('DELETE', `/schemes/${id(sid)}`),

    listWorks: () => get('/works'),
    createWork: (w) => send('POST', '/works', w),
    updateWork: (wid, w) => send('PUT', `/works/${id(wid)}`, w),
    deleteWork: (wid) => send('DELETE', `/works/${id(wid)}`),

    getVillageStats: () => get('/stats/village'),
    getBaseline: () => get('/stats/baseline'),
    updateBaseline: (b) => send('PUT', '/stats/baseline', b),

    listAccounts: (filter) => get(`/accounts?role=${id(filter)}`),
    createAdmin: (a) => send('POST', '/accounts', a),
    setAccountActive: (aid, active) => send('PATCH', `/accounts/${id(aid)}`, { active }),
    removeAccount: (aid) => send('DELETE', `/accounts/${id(aid)}`),

    resetDemo: () => send('POST', '/demo/reset'),
  };
}
