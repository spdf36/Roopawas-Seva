import { Account, Baseline, DevelopmentWork, L, Notice, NoticeTag, Request, Scheme, Status } from '../data';

/** An account as the API returns it: the PIN never leaves the server. */
export type User = Omit<Account, 'pin'>;
export type Session = { token: string; user: User };

export type CitizenDetails = Pick<User, 'name' | 'mobile'> & Required<Pick<User, 'ageGroup' | 'ward' | 'occupation' | 'family'>>;
export type ProfilePatch = Partial<Omit<CitizenDetails, 'mobile'>>;
export type NewAdmin = Pick<Account, 'name' | 'loginId' | 'pin' | 'mobile'> & { designation: string };
export type NewComplaint = { categoryId: string; description: string; location: string; photo?: string };
export type StatusUpdate = { status: Status; note?: string; department?: string };
/** Text in both languages; a blank English text falls back to the Hindi one on the server. */
export type NewNotice = { tag: NoticeTag; title: L; body: L };
export type SchemeInput = Omit<Scheme, 'id'>;
export type WorkInput = Omit<DevelopmentWork, 'id'>;
export type AccountFilter = 'citizen' | 'staff';

/** Public village figures: the recorded baseline plus live request counts. */
export type VillageStats = Baseline;

export type ErrorCode =
  | 'invalid_login' // wrong login ID or PIN
  | 'inactive' // account deactivated
  | 'unauthorized' // not logged in, or the session ended
  | 'forbidden' // logged in, but this role cannot do that
  | 'not_found'
  | 'exists' // mobile number / user ID / application already exists
  | 'in_use' // cannot delete: other records still refer to it (e.g. a scheme with applications)
  | 'invalid' // the request body failed validation
  | 'network'; // the server could not be reached

export class ApiError extends Error {
  constructor(public status: number, public code: ErrorCode) {
    super(code);
  }
}

/**
 * Everything the website needs from the server. The comment on each method is the REST route the
 * backend exposes; the session token travels as `Authorization: Bearer <token>`.
 * All rules (roles, ownership, status flow, validation) are enforced behind this interface,
 * never only in the UI.
 */
export interface Api {
  // ---- Auth ----
  /** POST /auth/login → 401 invalid_login, 403 inactive */
  login(loginId: string, pin: string): Promise<Session>;
  /** POST /auth/logout – must send the current token at call time; the caller clears its session straight after */
  logout(): Promise<void>;
  /** POST /auth/otp – sends the registration OTP to a mobile number → 409 exists */
  sendOtp(mobile: string): Promise<void>;
  /** POST /auth/register – creates a citizen account and logs it in → 400 invalid (bad OTP), 409 exists */
  register(details: CitizenDetails, otp: string, pin: string): Promise<Session>;
  /** GET /auth/me */
  me(): Promise<User>;
  /** PATCH /auth/me – citizens only */
  updateProfile(patch: ProfilePatch): Promise<User>;

  // ---- Requests (complaints and scheme applications) ----
  /** GET /requests – citizens get their own, staff get all */
  listRequests(): Promise<Request[]>;
  /** GET /requests/:id – 404 when a citizen asks for someone else's */
  getRequest(id: string): Promise<Request>;
  /** POST /requests/complaints – citizens only */
  createComplaint(c: NewComplaint): Promise<Request>;
  /** POST /requests/applications – citizens only; open schemes only (400 invalid) → 409 exists when already applied */
  applyScheme(schemeId: string): Promise<Request>;
  /** PATCH /requests/:id/status – staff only; forward along the flow only → 400 invalid */
  updateStatus(id: string, update: StatusUpdate): Promise<Request>;
  /** POST /requests/:id/confirm – the citizen who raised a resolved request */
  confirmResolution(id: string): Promise<Request>;

  // ---- Notices ----
  /** GET /notices – public */
  listNotices(): Promise<Notice[]>;
  /** POST /notices – staff only */
  createNotice(n: NewNotice): Promise<Notice>;
  /** PUT /notices/:id – staff only */
  updateNotice(id: string, n: NewNotice): Promise<Notice>;
  /** DELETE /notices/:id – staff only */
  deleteNotice(id: string): Promise<void>;

  // ---- Schemes ----
  /** GET /schemes – public: open schemes only; staff also get closed ones */
  listSchemes(): Promise<Scheme[]>;
  /** POST /schemes – staff only */
  createScheme(s: SchemeInput): Promise<Scheme>;
  /** PUT /schemes/:id – staff only */
  updateScheme(id: string, s: SchemeInput): Promise<Scheme>;
  /** DELETE /schemes/:id – staff only → 409 in_use when citizens have applied (close it instead) */
  deleteScheme(id: string): Promise<void>;

  // ---- Village development works ----
  /** GET /works – public */
  listWorks(): Promise<DevelopmentWork[]>;
  /** POST /works – staff only */
  createWork(w: WorkInput): Promise<DevelopmentWork>;
  /** PUT /works/:id – staff only */
  updateWork(id: string, w: WorkInput): Promise<DevelopmentWork>;
  /** DELETE /works/:id – staff only */
  deleteWork(id: string): Promise<void>;

  // ---- Village dashboard ----
  /** GET /stats/village – public */
  getVillageStats(): Promise<VillageStats>;
  /** GET /stats/baseline – staff only: the recorded figures the public numbers start from */
  getBaseline(): Promise<Baseline>;
  /** PUT /stats/baseline – staff only; whole, non-negative numbers */
  updateBaseline(b: Baseline): Promise<Baseline>;

  // ---- Accounts ----
  /** GET /accounts?role=citizen|staff – citizens: staff; staff accounts: super admin */
  listAccounts(filter: AccountFilter): Promise<User[]>;
  /** POST /accounts – super admin only → 409 exists */
  createAdmin(a: NewAdmin): Promise<User>;
  /** PATCH /accounts/:id { active } – admins manage citizens, the super admin also manages admins */
  setAccountActive(id: string, active: boolean): Promise<User>;
  /** DELETE /accounts/:id – super admin only, admin accounts only */
  removeAccount(id: string): Promise<void>;

  // ---- Demo ----
  /** POST /demo/reset – restores the sample data (demo builds only) */
  resetDemo(): Promise<void>;
}
