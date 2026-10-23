/**
 * Types, the fixed catalogue (departments, categories, statuses…) and the business rules shared by the
 * website and the server. Keep this free of browser- and Node-specific code.
 */
import { C } from './colors';

export type L = { hi: string; en: string };
export type Icon = string;
export type Visual = { icon: Icon; color: string; soft: string };

export const l = (hi: string, en: string): L => ({ hi, en });

// ---------- Departments ----------
export const DEPARTMENTS: Record<string, L> = {
  panchayat: l('ग्राम पंचायत', 'Gram Panchayat'),
  phed: l('जलदाय विभाग (PHED)', 'Water Supply Dept (PHED)'),
  power: l('बिजली विभाग', 'Electricity Dept'),
  pwd: l('लोक निर्माण विभाग (PWD)', 'Public Works Dept (PWD)'),
  education: l('शिक्षा विभाग', 'Education Dept'),
  health: l('स्वास्थ्य विभाग', 'Health Dept'),
  social: l('सामाजिक न्याय विभाग', 'Social Justice Dept'),
  agri: l('कृषि विभाग', 'Agriculture Dept'),
  skill: l('कौशल एवं रोजगार विभाग', 'Skill & Employment Dept'),
};

// ---------- Complaint categories ----------
export type Category = Visual & { id: string; name: L; dept: string };

export const CATEGORIES: Category[] = [
  { id: 'water', name: l('पानी', 'Water'), dept: 'phed', icon: 'water', color: C.blue, soft: C.blueSoft },
  { id: 'light', name: l('स्ट्रीट लाइट / बिजली', 'Street Light / Electricity'), dept: 'power', icon: 'lightbulb-on-outline', color: C.green, soft: C.greenSoft },
  { id: 'road', name: l('सड़क', 'Road'), dept: 'pwd', icon: 'road-variant', color: C.orange, soft: C.orangeSoft },
  { id: 'clean', name: l('सफाई / स्वच्छता', 'Sanitation'), dept: 'panchayat', icon: 'trash-can-outline', color: C.teal, soft: C.tealSoft },
  { id: 'school', name: l('स्कूल', 'School'), dept: 'education', icon: 'school-outline', color: C.purple, soft: C.purpleSoft },
  { id: 'health', name: l('स्वास्थ्य', 'Health'), dept: 'health', icon: 'medical-bag', color: C.red, soft: C.redSoft },
  { id: 'other', name: l('अन्य', 'Other'), dept: 'panchayat', icon: 'dots-horizontal-circle-outline', color: C.sub, soft: '#EDF1F6' },
];

// ---------- Schemes ----------
/** Scheme groups are fixed: each matches a citizen occupation and has its own look. */
export type SchemeGroup = Visual & { id: string; name: L; occupation: string };
/** Schemes are managed by the Panchayat through the API; a closed scheme takes no new applications. */
export type Scheme = { id: string; groupId: string; name: L; desc: L; dept: string; open: boolean };

export const SCHEME_GROUPS: SchemeGroup[] = [
  { id: 'student', name: l('छात्र', 'Students'), occupation: 'student', icon: 'school', color: C.blue, soft: C.blueSoft },
  { id: 'farmer', name: l('किसान', 'Farmers'), occupation: 'farmer', icon: 'sprout', color: C.green, soft: C.greenSoft },
  { id: 'women', name: l('महिला', 'Women'), occupation: 'homemaker', icon: 'face-woman', color: C.orange, soft: C.orangeSoft },
  { id: 'senior', name: l('वरिष्ठ नागरिक', 'Senior Citizens'), occupation: 'senior', icon: 'human-cane', color: C.navy, soft: C.blueSoft },
  { id: 'jobseeker', name: l('नौकरी चाहने वाले', 'Job Seekers'), occupation: 'jobseeker', icon: 'briefcase-account', color: C.red, soft: C.redSoft },
];

// ---------- Registration options ----------
export const AGE_GROUPS: { id: string; name: L }[] = [
  { id: '18-25', name: l('18 – 25 वर्ष', '18 – 25 years') },
  { id: '26-40', name: l('26 – 40 वर्ष', '26 – 40 years') },
  { id: '41-60', name: l('41 – 60 वर्ष', '41 – 60 years') },
  { id: '60+', name: l('60 वर्ष से अधिक', 'Above 60 years') },
];

export const WARDS: { id: string; name: L }[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `w${n}`,
  name: l(`रूपावास – वार्ड ${n}`, `Roopawas – Ward ${n}`),
}));

export const OCCUPATIONS: { id: string; name: L }[] = [
  { id: 'farmer', name: l('किसान', 'Farmer') },
  { id: 'student', name: l('छात्र', 'Student') },
  { id: 'employed', name: l('नौकरीपेशा', 'Employed') },
  { id: 'jobseeker', name: l('नौकरी की तलाश में', 'Job Seeker') },
  { id: 'homemaker', name: l('गृहिणी', 'Homemaker') },
  { id: 'business', name: l('व्यवसाय', 'Business') },
  { id: 'senior', name: l('वरिष्ठ नागरिक', 'Senior Citizen') },
];

// ---------- Requests ----------
export type Status = 'submitted' | 'received' | 'under_review' | 'forwarded' | 'action_taken' | 'resolved' | 'rejected';

export const FLOW: Status[] = ['submitted', 'received', 'under_review', 'forwarded', 'action_taken', 'resolved'];

export const STATUS: Record<Status, { name: L; color: string; soft: string }> = {
  submitted: { name: l('जमा', 'Submitted'), color: C.blue, soft: C.blueSoft },
  received: { name: l('प्राप्त', 'Received'), color: C.blue, soft: C.blueSoft },
  under_review: { name: l('समीक्षाधीन', 'Under Review'), color: C.amber, soft: C.amberSoft },
  forwarded: { name: l('विभाग को भेजा', 'Forwarded'), color: C.orange, soft: C.orangeSoft },
  action_taken: { name: l('कार्रवाई हुई', 'Action Taken'), color: C.teal, soft: C.tealSoft },
  resolved: { name: l('हल', 'Resolved'), color: C.green, soft: C.greenSoft },
  rejected: { name: l('अस्वीकृत', 'Rejected'), color: C.red, soft: C.redSoft },
};

// What each step means to the citizen, mirroring the six-step flow on the board.
export const FLOW_HINT: Record<Status, L> = {
  submitted: l('नागरिक ने अनुरोध भेजा', 'Citizen submitted the request'),
  received: l('पंचायत ने प्राप्त कर जांच की', 'Panchayat received and verified it'),
  under_review: l('पंचायत समिति में समीक्षा', 'Under review by the Panchayat Samiti'),
  forwarded: l('संबंधित विभाग को भेजा गया', 'Forwarded to the concerned department'),
  action_taken: l('विभाग ने कार्रवाई की', 'Department took action'),
  resolved: l('समाधान हुआ, नागरिक को सूचित किया', 'Resolved and citizen notified'),
  rejected: l('अनुरोध अस्वीकृत', 'Request rejected'),
};

/** `by` is the staff member's name at the time of the change (kept if the account is later removed); `byId` is their account. */
export type HistoryEntry = { status: Status; at: number; note?: string; by?: string; byId?: string };

/** Where an admin can move a request: any later step of the flow, or rejection. Resolved and rejected requests are closed. */
export const nextStatuses = (current: Status): Status[] =>
  current === 'resolved' || current === 'rejected' ? [] : [...FLOW.slice(FLOW.indexOf(current) + 1), 'rejected'];

export type Request = {
  id: string;
  kind: 'complaint' | 'application';
  title: L;
  categoryId?: string; // complaints
  schemeId?: string; // applications
  groupId?: string; // applications: the scheme's group at the time, for the icon (the scheme may later be removed)
  description: string;
  location: string;
  /** GPS position from the citizen's device, when they shared it. */
  coords?: Coords;
  /**
   * Where to load the photo from. The server returns a short-lived signed link relative to the API's address
   * (/photos/RP-…?expires=…&sig=…); the website's mock returns the data: URL itself.
   */
  photo?: string;
  status: Status;
  department: string;
  createdAt: number;
  history: HistoryEntry[];
  citizen: { name: string; mobile: string; ward?: string }; // ward as registered when the request was raised
  confirmed?: boolean;
  /** How many times the citizen reopened it because the problem was not actually fixed. */
  reopened?: number;
};

/** Latitude/longitude in degrees, with the device's accuracy in metres. */
export type Coords = { lat: number; lng: number; accuracy?: number };

export const mapLink = ({ lat, lng }: Coords) => `https://www.google.com/maps?q=${lat},${lng}`;

export const requestVisual = (r: Request): Visual => {
  if (r.kind === 'application') {
    return SCHEME_GROUPS.find((g) => g.id === r.groupId) ?? { icon: 'file-document-outline', color: C.blue, soft: C.blueSoft };
  }
  return CATEGORIES.find((c) => c.id === r.categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
};

export const statusLabel = (r: Request): L =>
  r.status === 'resolved' && r.kind === 'application' ? l('पूर्ण', 'Completed') : STATUS[r.status].name;

export const isClosed = (r: Request) => r.status === 'resolved' || r.status === 'rejected';

/** Status groups used by the request filters. */
export type RequestFilter = 'all' | 'active' | 'done' | 'rejected';

export const matchesFilter = (r: Request, f: RequestFilter) =>
  f === 'all' ||
  (f === 'done' && r.status === 'resolved') ||
  (f === 'rejected' && r.status === 'rejected') ||
  (f === 'active' && !isClosed(r));

/** When the request last changed (its latest history entry). */
export const updatedAt = (r: Request) => r.history[r.history.length - 1]?.at ?? r.createdAt;

/** Whole days a request has been open, or for a closed one, how many days it took to close. */
export const daysOpen = (r: Request, now = Date.now()) => Math.floor(((isClosed(r) ? updatedAt(r) : now) - r.createdAt) / DAY);

/** Open requests older than this many days are flagged as overdue. */
export const OVERDUE_DAYS = 15;

/** A citizen can reopen a resolved complaint within this many days, unless they already confirmed it. */
export const REOPEN_DAYS = 30;

export const canReopen = (r: Request, now = Date.now()) =>
  r.kind === 'complaint' && r.status === 'resolved' && !r.confirmed && now - updatedAt(r) <= REOPEN_DAYS * DAY;

/** Where a reopened complaint goes back to: the Panchayat reviews it again. */
export const REOPEN_STATUS: Status = 'under_review';

export const DAY = 86400000;

// ---------- Notices ----------
export type NoticeTag = 'govt' | 'panchayat' | 'health';
/** `updatedAt` is set when a published notice is edited. */
export type Notice = Visual & { id: string; tag: NoticeTag; title: L; body: L; source: L; publishedAt: number; updatedAt?: number };

export const NOTICE_TAGS: { id: NoticeTag; name: L }[] = [
  { id: 'govt', name: l('सरकारी', 'Government') },
  { id: 'panchayat', name: l('पंचायत', 'Panchayat') },
  { id: 'health', name: l('स्वास्थ्य', 'Health') },
];

export const TAG_VISUAL: Record<NoticeTag, Visual> = {
  govt: { icon: 'bank', color: C.blue, soft: C.blueSoft },
  panchayat: { icon: 'account-group', color: C.orange, soft: C.orangeSoft },
  health: { icon: 'medical-bag', color: C.red, soft: C.redSoft },
};

// ---------- Village dashboard ----------
/**
 * Figures recorded outside this portal (before it started, or offline at the Panchayat office).
 * Staff keep them up to date; the public dashboard adds live request counts on top.
 */
export type Baseline = {
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

export const BASELINE_FIELDS: { id: keyof Baseline; name: L }[] = [
  { id: 'total', name: l('कुल अनुरोध', 'Total requests') },
  { id: 'resolved', name: l('निपटाए गए', 'Resolved') },
  { id: 'inProgress', name: l('प्रगति पर', 'In progress') },
  { id: 'forwarded', name: l('विभाग को भेजे', 'Sent to department') },
  { id: 'roads', name: l('सड़क – खुले अनुरोध', 'Roads – open requests') },
  { id: 'water', name: l('पेयजल – खुले अनुरोध', 'Drinking water – open requests') },
  { id: 'lightsFixed', name: l('स्ट्रीट लाइट – ठीक की गईं', 'Street lights – fixed') },
  { id: 'schemeApplications', name: l('योजना आवेदन सहायता', 'Scheme applications assisted') },
  { id: 'schoolWorks', name: l('स्कूल सुधार कार्य', 'School repair works') },
  { id: 'trees', name: l('लगाए गए पेड़', 'Trees planted') },
];

// ---------- Village Yojnas (development works with their funds) ----------
/** Public, like everything about a yojna: villagers see its status, approvals, money received and spent. */
export type YojnaStatus = 'proposed' | 'processing' | 'onhold' | 'active' | 'completed';

export const YOJNA_STATUSES: YojnaStatus[] = ['proposed', 'processing', 'onhold', 'active', 'completed'];

export const YOJNA_STATUS: Record<YojnaStatus, Visual & { name: L; hint: L }> = {
  proposed: { name: l('प्रस्तावित', 'Proposed'), hint: l('प्रस्ताव तैयार है, स्वीकृति के लिए अभी भेजा नहीं गया', 'Proposal ready, not yet sent for approval'), icon: 'lightbulb-outline', color: C.purple, soft: C.purpleSoft },
  processing: { name: l('स्वीकृति प्रक्रिया में', 'Processing'), hint: l('स्वीकृति के लिए विभिन्न स्तरों पर', 'Going through the approval levels'), icon: 'progress-clock', color: C.blue, soft: C.blueSoft },
  onhold: { name: l('रुकी हुई', 'On hold'), hint: l('किसी कारण से अभी रुकी है', 'Paused for now'), icon: 'pause-circle-outline', color: C.red, soft: C.redSoft },
  active: { name: l('कार्य चालू', 'Active'), hint: l('स्वीकृत, काम चल रहा है', 'Approved, work in progress'), icon: 'hammer-wrench', color: C.orange, soft: C.orangeSoft },
  completed: { name: l('पूर्ण', 'Completed'), hint: l('काम पूरा हो गया', 'Work finished'), icon: 'check-circle-outline', color: C.green, soft: C.greenSoft },
};

/** Where a yojna's money comes from. */
export const FUND_SOURCES: Record<string, L> = {
  central: l('केंद्र सरकार', 'Central Government'),
  state: l('राज्य सरकार', 'State Government'),
  district: l('ज़िला परिषद', 'Zila Parishad (District)'),
  samiti: l('पंचायत समिति', 'Panchayat Samiti'),
  panchayat: l('ग्राम पंचायत निधि', 'Gram Panchayat funds'),
  mpmla: l('सांसद / विधायक निधि', 'MP / MLA fund'),
  public: l('जन सहयोग', 'Public contribution'),
  other: l('अन्य', 'Other'),
};

export const EXPENSE_CATEGORIES: Record<string, Visual & { name: L }> = {
  material: { name: l('सामग्री', 'Material'), icon: 'package-variant-closed', color: C.blue, soft: C.blueSoft },
  labour: { name: l('मज़दूरी', 'Labour'), icon: 'account-hard-hat', color: C.orange, soft: C.orangeSoft },
  machinery: { name: l('मशीन / उपकरण', 'Machinery / Equipment'), icon: 'excavator', color: C.teal, soft: C.tealSoft },
  contractor: { name: l('ठेकेदार भुगतान', 'Contractor payment'), icon: 'handshake-outline', color: C.purple, soft: C.purpleSoft },
  transport: { name: l('ढुलाई', 'Transport'), icon: 'truck-outline', color: C.green, soft: C.greenSoft },
  other: { name: l('अन्य', 'Other'), icon: 'dots-horizontal-circle-outline', color: C.sub, soft: '#EDF1F6' },
};

/** The usual places a yojna needs approval from, offered when staff set up its levels. */
export const APPROVAL_LEVEL_PRESETS: L[] = [
  l('ग्राम पंचायत', 'Gram Panchayat'),
  l('पंचायत समिति', 'Panchayat Samiti'),
  l('ज़िला परिषद / ज़िला प्रशासन', 'Zila Parishad / District'),
  l('राज्य सरकार', 'State Government'),
  l('केंद्र सरकार', 'Central Government'),
];

/** One place the yojna needs approval from, in order; `approvedAt` is set once it has approved. */
export type ApprovalLevel = { name: L; approvedAt?: number };
/** Money in whole rupees. */
export type Instalment = { id: string; amount: number; date: number; note: string };
export type Fund = { id: string; source: string; sanctioned: number; note: string; instalments: Instalment[] };
/** `fundId`: which fund paid for it, when known. `bill`: link to the photo of the bill or receipt. */
export type Expense = { id: string; date: number; purpose: string; amount: number; category: string; fundId?: string; bill?: string };

export type Yojna = {
  id: string;
  name: L;
  desc: L;
  dept: string;
  status: YojnaStatus;
  /** Why it is on hold, what is awaited… shown with the status. */
  statusNote: string;
  /** Work done, 0–100 %. */
  progress: number;
  levels: ApprovalLevel[];
  funds: Fund[];
  expenses: Expense[];
  createdAt: number;
  updatedAt: number;
};

/** The level the yojna is waiting on: the first one not yet approved, or -1 when all have approved. */
export const currentLevel = (y: Pick<Yojna, 'levels'>) => y.levels.findIndex((lv) => !lv.approvedAt);

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
export const fundReceived = (f: Fund) => sum(f.instalments.map((i) => i.amount));

export function yojnaTotals(y: Pick<Yojna, 'funds' | 'expenses'>) {
  const sanctioned = sum(y.funds.map((f) => f.sanctioned));
  const received = sum(y.funds.map(fundReceived));
  const spent = sum(y.expenses.map((e) => e.amount));
  return { sanctioned, received, spent, balance: received - spent };
}

/** Indian digit grouping: ₹ 18,50,000. */
export const fmtRupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`;

// ---------- Accounts ----------
export type Role = 'citizen' | 'admin' | 'superadmin';

export type Account = {
  id: string;
  role: Role;
  name: string;
  /** What the user types to log in: the mobile number for citizens, a user ID for staff. */
  loginId: string;
  pin: string;
  mobile: string;
  active: boolean;
  createdAt: number;
  // Citizens
  ageGroup?: string;
  ward?: string;
  occupation?: string;
  family?: string;
  // Staff
  designation?: string;
};

export const isStaff = (a: { role: Role } | null | undefined) => a?.role === 'admin' || a?.role === 'superadmin';

/** Login IDs are matched case-insensitively and without spaces (mobile numbers are typed with gaps). */
export const normaliseLoginId = (v: string) => v.replace(/\s+/g, '').toLowerCase();

/** An Indian mobile number: 10 digits starting with 6–9. */
export const isMobile = (v: string) => /^[6-9]\d{9}$/.test(v);
export const isPin = (v: string) => /^\d{4}$/.test(v);
/** A staff user ID, already normalised: 3–20 characters, starting with a letter (a-z, 0-9, . _ -). */
export const isStaffLoginId = (v: string) => /^[a-z][a-z0-9._-]{2,19}$/.test(v);

export const ROLE_NAME: Record<Role, L> = {
  citizen: l('नागरिक', 'Citizen'),
  admin: l('प्रशासक', 'Admin'),
  superadmin: l('सुपर एडमिन', 'Super Admin'),
};

export const DESIGNATIONS: { id: string; name: L }[] = [
  { id: 'sarpanch', name: l('सरपंच', 'Sarpanch') },
  { id: 'upsarpanch', name: l('उप-सरपंच', 'Deputy Sarpanch') },
  { id: 'secretary', name: l('ग्राम सचिव', 'Village Secretary') },
  { id: 'wardpanch', name: l('वार्ड पंच', 'Ward Member') },
  { id: 'staff', name: l('पंचायत कर्मचारी', 'Panchayat Staff') },
  { id: 'district', name: l('ज़िला प्रशासन', 'District Administration') },
];

export const fmtDate = (ts: number) => {
  const dt = new Date(ts);
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
  return `${String(dt.getDate()).padStart(2, '0')} ${mon} ${dt.getFullYear()}`;
};
