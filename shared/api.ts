import { Account, ApprovalLevel, Baseline, Coords, Expense, Fund, Instalment, L, Notice, NoticeTag, Request, RequestFilter, Scheme, Status, Yojna } from './data';

/** An account as the API returns it: the PIN never leaves the server. */
export type User = Omit<Account, 'pin'>;
export type Session = { token: string; user: User };

export type CitizenDetails = Pick<User, 'name' | 'mobile'> & Required<Pick<User, 'ageGroup' | 'ward' | 'occupation' | 'family'>>;
export type ProfilePatch = Partial<Omit<CitizenDetails, 'mobile'>>;
export type NewAdmin = Pick<Account, 'name' | 'loginId' | 'pin' | 'mobile'> & { designation: string };
/** `photo` is a JPEG data: URL, compressed on the device (see web/src/photo.ts). */
export type NewComplaint = { categoryId: string; description: string; location: string; coords?: Coords; photo?: string };
export type StatusUpdate = { status: Status; note?: string; department?: string };
/** Text in both languages; a blank English text falls back to the Hindi one on the server. */
export type NewNotice = { tag: NoticeTag; title: L; body: L };
export type SchemeInput = Omit<Scheme, 'id'>;
/** A yojna's own details; its money is recorded through the fund and expense endpoints. */
export type YojnaInput = Pick<Yojna, 'name' | 'desc' | 'dept' | 'status' | 'statusNote' | 'progress'> & { levels: ApprovalLevel[] };
export type FundInput = Omit<Fund, 'id' | 'instalments'>;
export type InstalmentInput = Omit<Instalment, 'id'>;
/** `bill`: a JPEG data: URL of the bill or receipt (compressed like complaint photos). On an update, leaving it
 * out keeps the current bill and `null` removes it. */
export type ExpenseInput = Omit<Expense, 'id' | 'bill'> & { bill?: string | null };
export type AccountFilter = 'citizen' | 'staff';

/** `demoMode`: sample data, demo logins, any-4-digit OTPs and the Reset demo button. */
export type ServerInfo = { demoMode: boolean };

export type RequestSort = 'newest' | 'oldest' | 'updated';

/** Filters for the request list; sent as query parameters. Every field is optional. */
export type RequestQuery = {
  /** Matches the request number, the citizen's name or their mobile number. */
  q?: string;
  status?: RequestFilter;
  /** A complaint category ID, or 'application' for scheme applications. */
  category?: string;
  department?: string;
  ward?: string;
  /** newest (default) / oldest by date raised, or updated = most recently changed first. */
  sort?: RequestSort;
};

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
  | 'too_large' // 413: the upload (e.g. a photo) is too big
  | 'rate_limited' // 429: too many attempts (logins, OTPs); try again later
  | 'server_error' // 500: something unexpected failed on the server
  | 'unavailable' // 501: needs the real server (the website's offline mock does not have this feature)
  | 'network'; // the server could not be reached

/** Largest photo the server accepts, as the length of its data: URL (about 525 KB of image). */
export const MAX_PHOTO_BYTES = 700_000;

export class ApiError extends Error {
  constructor(public status: number, public code: ErrorCode) {
    super(code);
  }
}

/**
 * Everything the website needs from the server. The comment on each method is the REST route the
 * backend exposes, with its JSON body where it has one; the session token travels as
 * `Authorization: Bearer <token>`. Responses are the return type as JSON; a `void` method answers 204.
 * All rules (roles, ownership, status flow, validation) are enforced behind this interface,
 * never only in the UI.
 */
export interface Api {
  /** GET /info – public: how this server is set up (e.g. demo mode shows the demo logins and Reset demo) */
  serverInfo(): Promise<ServerInfo>;

  // ---- Auth ----
  /** POST /auth/login { loginId, pin } → 401 invalid_login, 403 inactive, 429 rate_limited */
  login(loginId: string, pin: string): Promise<Session>;
  /** POST /auth/logout – must send the current token at call time; the caller clears its session straight after */
  logout(): Promise<void>;
  /** POST /auth/otp { mobile } – sends the registration OTP to a mobile number → 409 exists, 429 rate_limited */
  sendOtp(mobile: string): Promise<void>;
  /** POST /auth/register { details, otp, pin } – creates a citizen account and logs it in → 400 invalid (bad OTP), 409 exists */
  register(details: CitizenDetails, otp: string, pin: string): Promise<Session>;
  /** GET /auth/me */
  me(): Promise<User>;
  /** PATCH /auth/me ProfilePatch – citizens only */
  updateProfile(patch: ProfilePatch): Promise<User>;

  // ---- Requests (complaints and scheme applications) ----
  /** GET /requests?q=&status=&category=&department=&ward=&sort= – citizens get their own, staff get all */
  listRequests(query?: RequestQuery): Promise<Request[]>;
  /** GET /requests/:id – 404 when a citizen asks for someone else's */
  getRequest(id: string): Promise<Request>;
  /** POST /requests/complaints – citizens only → 413 too_large for a photo over MAX_PHOTO_BYTES */
  createComplaint(c: NewComplaint): Promise<Request>;
  /** POST /requests/applications – citizens only; open schemes only (400 invalid) → 409 exists when already applied */
  applyScheme(schemeId: string): Promise<Request>;
  /** PATCH /requests/:id/status – staff only; forward along the flow only → 400 invalid */
  updateStatus(id: string, update: StatusUpdate): Promise<Request>;
  /** POST /requests/:id/confirm – the citizen who raised a resolved request */
  confirmResolution(id: string): Promise<Request>;
  /**
   * POST /requests/:id/reopen { reason } – the citizen who raised a resolved complaint, within REOPEN_DAYS and
   * before confirming it; it goes back to REOPEN_STATUS with the reason as a note → 400 invalid otherwise
   */
  reopenRequest(id: string, reason: string): Promise<Request>;

  // ---- Notices ----
  /** GET /notices – public, newest first */
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

  // ---- Village Yojnas (public to read, staff to change; every change answers with the whole yojna) ----
  /** GET /yojnas – public, oldest first */
  listYojnas(): Promise<Yojna[]>;
  /** GET /yojnas/:id – public */
  getYojna(id: string): Promise<Yojna>;
  /** POST /yojnas YojnaInput – staff only. Approved levels must come first, in order (400 invalid otherwise) */
  createYojna(y: YojnaInput): Promise<Yojna>;
  /** PUT /yojnas/:id YojnaInput – staff only */
  updateYojna(id: string, y: YojnaInput): Promise<Yojna>;
  /** DELETE /yojnas/:id – staff only → 409 in_use while funds or expenses are recorded (remove those first) */
  deleteYojna(id: string): Promise<void>;
  /** POST /yojnas/:id/funds FundInput – staff only */
  addFund(yojnaId: string, f: FundInput): Promise<Yojna>;
  /** PUT /yojnas/:id/funds/:fundId FundInput – staff only; the sanctioned amount cannot go below what was received → 400 invalid */
  updateFund(yojnaId: string, fundId: string, f: FundInput): Promise<Yojna>;
  /** DELETE /yojnas/:id/funds/:fundId – staff only → 409 in_use while it has instalments or expenses */
  deleteFund(yojnaId: string, fundId: string): Promise<Yojna>;
  /** POST /yojnas/:id/funds/:fundId/instalments InstalmentInput – staff only; never more than sanctioned in total → 400 invalid */
  addInstalment(yojnaId: string, fundId: string, i: InstalmentInput): Promise<Yojna>;
  /** DELETE /yojnas/:id/funds/:fundId/instalments/:instalmentId – staff only */
  deleteInstalment(yojnaId: string, fundId: string, instalmentId: string): Promise<Yojna>;
  /** POST /yojnas/:id/expenses ExpenseInput – staff only → 413 too_large for a bill photo over MAX_PHOTO_BYTES */
  addExpense(yojnaId: string, e: ExpenseInput): Promise<Yojna>;
  /** PUT /yojnas/:id/expenses/:expenseId ExpenseInput – staff only */
  updateExpense(yojnaId: string, expenseId: string, e: ExpenseInput): Promise<Yojna>;
  /** DELETE /yojnas/:id/expenses/:expenseId – staff only */
  deleteExpense(yojnaId: string, expenseId: string): Promise<Yojna>;

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
  /** POST /accounts NewAdmin – super admin only → 409 exists */
  createAdmin(a: NewAdmin): Promise<User>;
  /** PATCH /accounts/:id { active } – admins manage citizens, the super admin also manages admins */
  setAccountActive(id: string, active: boolean): Promise<User>;
  /** DELETE /accounts/:id – super admin only, admin accounts only */
  removeAccount(id: string): Promise<void>;

  // ---- Demo ----
  /** POST /demo/reset – restores the sample data (demo builds only) */
  resetDemo(): Promise<void>;
}
