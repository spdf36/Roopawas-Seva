import { Baseline, BASELINE_FIELDS, FLOW, NoticeTag, Role, Status, YOJNA_STATUSES, YojnaStatus } from '@shared/data';
import { Schema, Types, model } from 'mongoose';

// MongoDB collections. Dates are stored as Date; src/serialize.ts turns documents into the shared API types
// (with millisecond timestamps), so nothing here is ever sent to a client as-is.

type LText = { hi: string; en: string };
const lText = new Schema<LText>({ hi: { type: String, required: true }, en: { type: String, required: true } }, { _id: false });

const ROLES: Role[] = ['citizen', 'admin', 'superadmin'];
const STATUSES: Status[] = [...FLOW, 'rejected'];

// ---------- Accounts ----------
export interface AccountDoc {
  _id: Types.ObjectId;
  role: Role;
  name: string;
  /** Stored normalised (normaliseLoginId): lower case, no spaces. Citizens use their mobile number. */
  loginId: string;
  /** bcrypt hash of the 4-digit PIN; the PIN itself is never stored. */
  pinHash: string;
  mobile: string;
  active: boolean;
  ageGroup?: string;
  ward?: string;
  occupation?: string;
  family?: string;
  designation?: string;
  createdAt: Date;
}

const accountSchema = new Schema<AccountDoc>({
  role: { type: String, enum: ROLES, required: true },
  name: { type: String, required: true, trim: true },
  loginId: { type: String, required: true, unique: true },
  pinHash: { type: String, required: true },
  mobile: { type: String, required: true },
  active: { type: Boolean, required: true, default: true },
  ageGroup: String,
  ward: String,
  occupation: String,
  family: String,
  designation: String,
  createdAt: { type: Date, required: true, default: Date.now },
});
// One citizen account per mobile number (staff may share a number with their citizen account).
accountSchema.index({ mobile: 1 }, { unique: true, partialFilterExpression: { role: 'citizen' } });

export const AccountModel = model<AccountDoc>('Account', accountSchema);

// ---------- Sessions ----------
export interface SessionDoc {
  /** SHA-256 of the session token: a leaked database does not hand out working logins. */
  _id: string;
  accountId: Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

const sessionSchema = new Schema<SessionDoc>({
  _id: { type: String, required: true },
  accountId: { type: Schema.Types.ObjectId, required: true, index: true },
  createdAt: { type: Date, required: true, default: Date.now },
  // MongoDB deletes the session once this time has passed.
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const SessionModel = model<SessionDoc>('Session', sessionSchema);

// ---------- Registration OTPs ----------
export interface OtpDoc {
  /** The mobile number the code was sent to: one pending code per number. */
  _id: string;
  /** SHA-256 of the code. */
  codeHash: string;
  /** Wrong guesses so far; the code stops working after OTP_MAX_ATTEMPTS. */
  attempts: number;
  expiresAt: Date;
}

const otpSchema = new Schema<OtpDoc>({
  _id: { type: String, required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const OtpModel = model<OtpDoc>('Otp', otpSchema);

// ---------- Requests (complaints and scheme applications) ----------
export interface HistoryDoc { status: Status; at: Date; note?: string; by?: string; byId?: string }

export interface RequestDoc {
  /** The request number shown to citizens, e.g. RP-2026-00128. */
  _id: string;
  kind: 'complaint' | 'application';
  title: LText;
  categoryId?: string;
  schemeId?: string;
  groupId?: string;
  description: string;
  location: string;
  coords?: { lat: number; lng: number; accuracy?: number };
  /** File name of the photo inside the uploads folder. */
  photo?: string;
  status: Status;
  department: string;
  createdAt: Date;
  /** Time of the latest history entry, kept alongside it so the list can be sorted by it. */
  updatedAt: Date;
  history: HistoryDoc[];
  citizen: { name: string; mobile: string; ward?: string };
  confirmed?: boolean;
  reopened?: number;
}

const requestSchema = new Schema<RequestDoc>({
  _id: { type: String, required: true },
  kind: { type: String, enum: ['complaint', 'application'], required: true },
  title: { type: lText, required: true },
  categoryId: String,
  schemeId: String,
  groupId: String,
  description: { type: String, required: true },
  location: { type: String, required: true },
  coords: { type: new Schema({ lat: Number, lng: Number, accuracy: Number }, { _id: false }) },
  photo: String,
  status: { type: String, enum: STATUSES, required: true },
  department: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  history: [new Schema<HistoryDoc>({
    status: { type: String, enum: STATUSES, required: true },
    at: { type: Date, required: true },
    note: String,
    by: String,
    byId: String,
  }, { _id: false })],
  citizen: {
    type: new Schema({ name: { type: String, required: true }, mobile: { type: String, required: true }, ward: String }, { _id: false }),
    required: true,
  },
  confirmed: Boolean,
  reopened: Number,
});
// A citizen's own list, and the staff list by date raised or last change (the filters narrow it further).
requestSchema.index({ 'citizen.mobile': 1, createdAt: -1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ updatedAt: -1 });
requestSchema.index({ schemeId: 1 });

export const RequestModel = model<RequestDoc>('Request', requestSchema);

/** Hands out request numbers: `seq` is the last number used. One document per sequence. */
const counterSchema = new Schema<{ _id: string; seq: number }>({ _id: String, seq: { type: Number, required: true } });
export const CounterModel = model('Counter', counterSchema);

// ---------- Notices ----------
export interface NoticeDoc {
  _id: Types.ObjectId;
  tag: NoticeTag;
  icon: string;
  color: string;
  soft: string;
  title: LText;
  body: LText;
  source: LText;
  publishedAt: Date;
  updatedAt?: Date;
}

const noticeSchema = new Schema<NoticeDoc>({
  tag: { type: String, enum: ['govt', 'panchayat', 'health'], required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  soft: { type: String, required: true },
  title: { type: lText, required: true },
  body: { type: lText, required: true },
  source: { type: lText, required: true },
  publishedAt: { type: Date, required: true, default: Date.now, index: -1 },
  updatedAt: Date,
});

export const NoticeModel = model<NoticeDoc>('Notice', noticeSchema);

// ---------- Schemes ----------
export interface SchemeDoc {
  /** Short ID that applications refer to, e.g. "pension". */
  _id: string;
  groupId: string;
  name: LText;
  desc: LText;
  dept: string;
  open: boolean;
  createdAt: Date;
}

const schemeSchema = new Schema<SchemeDoc>({
  _id: { type: String, required: true },
  groupId: { type: String, required: true },
  name: { type: lText, required: true },
  desc: { type: lText, required: true },
  dept: { type: String, required: true },
  open: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

export const SchemeModel = model<SchemeDoc>('Scheme', schemeSchema);

// ---------- Village Yojnas ----------
// One document per yojna with its funds, instalments and expenses inside: they are always read together, and
// saving the whole yojna under a version check (optimisticConcurrency) keeps two staff edits from overwriting each other.
export interface InstalmentDoc { _id: Types.ObjectId; amount: number; date: Date; note: string }
export interface FundDoc { _id: Types.ObjectId; source: string; sanctioned: number; note: string; instalments: InstalmentDoc[] }
export interface ExpenseDoc {
  _id: Types.ObjectId;
  date: Date;
  purpose: string;
  amount: number;
  category: string;
  /** The fund that paid for it, as its ID string. */
  fundId?: string;
  /** File name of the bill photo inside the uploads folder. */
  bill?: string;
}
export interface LevelDoc { name: LText; approvedAt?: Date }

export interface YojnaDoc {
  _id: Types.ObjectId;
  name: LText;
  desc: LText;
  dept: string;
  status: YojnaStatus;
  statusNote: string;
  progress: number;
  levels: LevelDoc[];
  funds: FundDoc[];
  expenses: ExpenseDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const money = { type: Number, required: true, min: 0 };

const yojnaSchema = new Schema<YojnaDoc>({
  name: { type: lText, required: true },
  desc: { type: new Schema<LText>({ hi: String, en: String }, { _id: false }), default: () => ({ hi: '', en: '' }) },
  dept: { type: String, required: true },
  status: { type: String, enum: YOJNA_STATUSES, required: true },
  statusNote: { type: String, default: '' },
  progress: { type: Number, required: true, min: 0, max: 100 },
  levels: [new Schema<LevelDoc>({ name: { type: lText, required: true }, approvedAt: Date }, { _id: false })],
  funds: [new Schema<FundDoc>({
    source: { type: String, required: true },
    sanctioned: money,
    note: { type: String, default: '' },
    instalments: [new Schema<InstalmentDoc>({ amount: money, date: { type: Date, required: true }, note: { type: String, default: '' } })],
  })],
  expenses: [new Schema<ExpenseDoc>({
    date: { type: Date, required: true },
    purpose: { type: String, required: true },
    amount: money,
    category: { type: String, required: true },
    fundId: String,
    bill: String,
  })],
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
}, { optimisticConcurrency: true });

export const YojnaModel = model<YojnaDoc>('Yojna', yojnaSchema);

// ---------- Village figures ----------
/** A single document holding the recorded figures the public dashboard starts from. */
export const BASELINE_ID = 'baseline';

const baselineSchema = new Schema<Baseline & { _id: string }>({
  _id: { type: String, required: true },
  ...Object.fromEntries(BASELINE_FIELDS.map(({ id }) => [id, { type: Number, required: true, min: 0, default: 0 }])),
});

export const BaselineModel = model<Baseline & { _id: string }>('Baseline', baselineSchema);
