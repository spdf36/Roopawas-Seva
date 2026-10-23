import { ApiError, ExpenseInput, FundInput, InstalmentInput, NewNotice, SchemeInput, YojnaInput } from './api';
import {
  ApprovalLevel, BASELINE_FIELDS, Baseline, DAY, DEPARTMENTS, EXPENSE_CATEGORIES, FUND_SOURCES, L, NOTICE_TAGS, NoticeTag, SCHEME_GROUPS,
  YOJNA_STATUSES, YojnaStatus,
} from './data';

// Checks for the content staff publish (notices, schemes, yojnas, figures), used by both the server and the
// website's mock API. Input may be anything (it comes from JSON), so every field's type is checked; anything
// wrong throws ApiError 400 invalid. Each function returns a clean copy with text trimmed.

const MAX_TITLE = 150;
const MAX_TEXT = 1000;
const MAX_FIGURE = 10_000_000;

const invalid = (): never => {
  throw new ApiError(400, 'invalid');
};

const record = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const trimmed = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** A department ID. An own-key check, so names like "constructor" or "__proto__" do not count. */
export const isDepartment = (id: unknown): id is string => typeof id === 'string' && Object.hasOwn(DEPARTMENTS, id);

/** Bilingual text: Hindi is required; a blank English text falls back to the Hindi one. */
export function cleanText(v: unknown, max: number): L {
  const o = record(v);
  const hi = trimmed(o.hi);
  const en = trimmed(o.en);
  if (!hi || hi.length > max || en.length > max) invalid();
  return { hi, en: en || hi };
}

export function cleanNotice(v: unknown): NewNotice {
  const o = record(v);
  if (!NOTICE_TAGS.some((t) => t.id === o.tag)) invalid();
  return { tag: o.tag as NoticeTag, title: cleanText(o.title, MAX_TITLE), body: cleanText(o.body, MAX_TEXT) };
}

export function cleanScheme(v: unknown): SchemeInput {
  const o = record(v);
  if (!SCHEME_GROUPS.some((g) => g.id === o.groupId) || !isDepartment(o.dept) || typeof o.open !== 'boolean') invalid();
  return { groupId: o.groupId as string, dept: o.dept as string, open: o.open as boolean, name: cleanText(o.name, MAX_TITLE), desc: cleanText(o.desc, MAX_TEXT) };
}

// ---------- Yojnas ----------

const MAX_LEVELS = 10;
const MAX_NOTE = 300;
/** ₹ 1,000 crore: far above any village yojna, low enough to catch a mistyped amount. */
const MAX_AMOUNT = 10_000_000_000;
/** Dates from 2000 up to a day ahead (allowing for time zones); nothing is recorded in the future. */
const FIRST_DATE = Date.UTC(2000, 0, 1);

const isWhole = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
const own = (table: object, id: unknown): id is string => typeof id === 'string' && Object.hasOwn(table, id);

/** Optional plain text (a note, a purpose): missing reads as ''. */
function cleanPlain(v: unknown, max: number): string {
  if (v !== undefined && typeof v !== 'string') invalid();
  const s = trimmed(v);
  if (s.length > max) invalid();
  return s;
}

/** Optional bilingual text, e.g. a description: blank Hindi means none. */
function cleanOptionalText(v: unknown, max: number): L {
  const o = record(v);
  return trimmed(o.hi) || trimmed(o.en) ? cleanText(v, max) : { hi: '', en: '' };
}

const cleanDate = (v: unknown, now: number): number => (isWhole(v, FIRST_DATE, now + DAY) ? v : invalid());
const cleanAmount = (v: unknown, min = 1): number => (isWhole(v, min, MAX_AMOUNT) ? v : invalid());

/** Levels in order; the approved ones must come first (a level cannot approve before the ones below it). */
function cleanLevels(v: unknown, now: number): ApprovalLevel[] {
  if (!Array.isArray(v) || v.length > MAX_LEVELS) invalid();
  let pending = false;
  return (v as unknown[]).map((item) => {
    const o = record(item);
    const name = cleanText(o.name, MAX_TITLE);
    if (o.approvedAt === undefined || o.approvedAt === null) {
      pending = true;
      return { name };
    }
    if (pending) invalid();
    return { name, approvedAt: cleanDate(o.approvedAt, now) };
  });
}

export function cleanYojna(v: unknown, now = Date.now()): YojnaInput {
  const o = record(v);
  if (!YOJNA_STATUSES.includes(o.status as YojnaStatus) || !isDepartment(o.dept) || !isWhole(o.progress, 0, 100)) invalid();
  const status = o.status as YojnaStatus;
  return {
    name: cleanText(o.name, MAX_TITLE),
    desc: cleanOptionalText(o.desc, MAX_TEXT),
    dept: o.dept as string,
    status,
    statusNote: cleanPlain(o.statusNote, MAX_NOTE),
    // A completed yojna is, by definition, fully done.
    progress: status === 'completed' ? 100 : (o.progress as number),
    levels: cleanLevels(o.levels, now),
  };
}

export function cleanFund(v: unknown): FundInput {
  const o = record(v);
  if (!own(FUND_SOURCES, o.source)) invalid();
  return { source: o.source as string, sanctioned: cleanAmount(o.sanctioned, 0), note: cleanPlain(o.note, MAX_NOTE) };
}

export function cleanInstalment(v: unknown, now = Date.now()): InstalmentInput {
  const o = record(v);
  return { amount: cleanAmount(o.amount), date: cleanDate(o.date, now), note: cleanPlain(o.note, MAX_NOTE) };
}

/** Everything but the bill photo, which the server checks itself. `fundId` is checked against the yojna's funds by the caller. */
export function cleanExpense(v: unknown, now = Date.now()): Omit<ExpenseInput, 'bill'> {
  const o = record(v);
  if (!own(EXPENSE_CATEGORIES, o.category)) invalid();
  if (o.fundId !== undefined && o.fundId !== null && typeof o.fundId !== 'string') invalid();
  const purpose = cleanPlain(o.purpose, MAX_TITLE);
  if (!purpose) invalid();
  return {
    date: cleanDate(o.date, now),
    purpose,
    amount: cleanAmount(o.amount),
    category: o.category as string,
    ...(o.fundId ? { fundId: o.fundId as string } : {}),
  };
}

/** Every figure is required and must be a whole number from 0 to 10 million. */
export function cleanBaseline(v: unknown): Baseline {
  const o = record(v);
  const out = {} as Baseline;
  for (const { id } of BASELINE_FIELDS) {
    const n = o[id];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > MAX_FIGURE) invalid();
    out[id] = n as number;
  }
  return out;
}
