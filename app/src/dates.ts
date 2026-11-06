// Dates are typed as DD-MM-YYYY and stored as noon local time, so they show as the same day everywhere in
// India (the website stores its date inputs the same way).

const pad = (n: number) => String(n).padStart(2, '0');

export const toDateText = (ts: number) => {
  const d = new Date(ts);
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

export const todayText = () => toDateText(Date.now());

/** The timestamp for a typed DD-MM-YYYY date, or NaN when it is not a real date or lies in the future. */
export function fromDateText(s: string): number {
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s.trim());
  if (!m) return NaN;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(year, month - 1, day, 12);
  if (d.getDate() !== day || d.getMonth() !== month - 1) return NaN;
  return d.getTime() > Date.now() + 86400000 ? NaN : d.getTime();
}

/** Whole rupees typed as text; NaN for anything else. */
export const rupees = (s: string) => (/^\d{1,11}$/.test(s.trim()) ? Number(s.trim()) : NaN);
