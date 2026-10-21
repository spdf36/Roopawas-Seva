import { ApiError, NewNotice, SchemeInput, WorkInput } from './api';
import { BASELINE_FIELDS, Baseline, DEPARTMENTS, L, NOTICE_TAGS, NoticeTag, SCHEME_GROUPS } from './data';

// Checks for the content staff publish (notices, schemes, works, figures), used by both the server and the
// website's mock API. Input may be anything (it comes from JSON), so every field's type is checked; anything
// wrong throws ApiError 400 invalid. Each function returns a clean copy with text trimmed.

const MAX_TITLE = 150;
const MAX_TEXT = 1000;
const MAX_BUDGET = 60;
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

export function cleanWork(v: unknown): WorkInput {
  const o = record(v);
  const { progress } = o;
  const budget = o.budget === undefined ? '' : trimmed(o.budget);
  if (typeof progress !== 'number' || !Number.isInteger(progress) || progress < 0 || progress > 100) invalid();
  if ((o.budget !== undefined && typeof o.budget !== 'string') || budget.length > MAX_BUDGET) invalid();
  return { name: cleanText(o.name, MAX_TITLE), progress: progress as number, budget };
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
