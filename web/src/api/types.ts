import { Account, L, Notice, NoticeTag, Request, Status } from '../data';

/** An account as the API returns it: the PIN never leaves the server. */
export type User = Omit<Account, 'pin'>;
export type Session = { token: string; user: User };

export type CitizenDetails = Pick<User, 'name' | 'mobile'> & Required<Pick<User, 'ageGroup' | 'ward' | 'occupation' | 'family'>>;
export type ProfilePatch = Partial<Omit<CitizenDetails, 'mobile'>>;
export type NewAdmin = Pick<Account, 'name' | 'loginId' | 'pin' | 'mobile'> & { designation: string };
export type NewComplaint = { categoryId: string; description: string; location: string; photo?: string };
export type StatusUpdate = { status: Status; note?: string; department?: string };
export type NewNotice = { tag: NoticeTag; title: L; body: L };
export type AccountFilter = 'citizen' | 'staff';

/** Public village figures: the recorded baseline plus live request counts. */
export type VillageStats = {
  total: number;
  resolved: number;
  inProgress: number;
  forwarded: number;
  roads: number;
  water: number;
  lightsFixed: number;
  schemeApplications: number;
  schoolWorks: number;
  trees: number;
};

export type ErrorCode =
  | 'invalid_login' // wrong login ID or PIN
  | 'inactive' // account deactivated
  | 'unauthorized' // not logged in, or the session ended
  | 'forbidden' // logged in, but this role cannot do that
  | 'not_found'
  | 'exists' // mobile number / user ID / application already exists
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
  /** POST /requests/applications – citizens only → 409 exists when already applied */
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

  // ---- Village dashboard ----
  /** GET /stats/village – public */
  getVillageStats(): Promise<VillageStats>;

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
