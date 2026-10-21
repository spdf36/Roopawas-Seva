import { UseQueryResult } from '@tanstack/react-query';
import { CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api';
import {
  DEPARTMENTS, FLOW, FLOW_HINT, Icon as IconName, L, Request, STATUS, Visual, fmtDate, mapLink, requestVisual, statusLabel,
} from '../data';
import { useStore, useT } from '../store';

export function Icon({ name, size = 20, color, style, spin }: { name: IconName; size?: number; color?: string; style?: CSSProperties; spin?: boolean }) {
  return <i className={`mdi mdi-${name}${spin ? ' mdi-spin' : ''}`} aria-hidden="true" style={{ fontSize: size, color, ...style }} />;
}

/** A user-facing message for any error thrown by the API (or anything else). */
export function useErrorText() {
  const { t } = useT();
  return (error: unknown): string => {
    const code = error instanceof ApiError ? error.code : 'network';
    switch (code) {
      case 'invalid_login': return t('मोबाइल नंबर / यूज़र आईडी या पिन गलत है।', 'Incorrect mobile number / user ID or PIN.');
      case 'inactive': return t('यह खाता निष्क्रिय है। पंचायत कार्यालय से संपर्क करें।', 'This account is deactivated. Please contact the Panchayat office.');
      case 'unauthorized': return t('आपका सत्र समाप्त हो गया। कृपया फिर से लॉगिन करें।', 'Your session has ended. Please log in again.');
      case 'forbidden': return t('आपको यह करने की अनुमति नहीं है।', 'You are not allowed to do this.');
      case 'not_found': return t('यह जानकारी नहीं मिली।', 'This could not be found.');
      case 'exists': return t('यह पहले से मौजूद है।', 'This already exists.');
      case 'in_use': return t('इसे हटाया नहीं जा सकता क्योंकि इससे जुड़े आवेदन मौजूद हैं।', 'This cannot be deleted because applications refer to it.');
      case 'invalid': return t('जानकारी सही नहीं है। कृपया जाँचकर फिर से भेजें।', 'Some details are not valid. Please check and try again.');
      case 'too_large': return t('फोटो बहुत बड़ी है या जगह भर गई है। कृपया छोटी फोटो चुनें या फोटो हटाकर भेजें।', 'The photo is too large, or storage is full. Choose a smaller photo or send without one.');
      default: return t('सर्वर से संपर्क नहीं हो सका। कृपया फिर से प्रयास करें।', 'Could not reach the server. Please try again.');
    }
  };
}

export function Loading() {
  const { t } = useT();
  return (
    <div className="center sub" style={{ padding: 40 }} role="status">
      <Icon name="loading" size={34} spin color="var(--navy)" />
      <p>{t('लोड हो रहा है…', 'Loading…')}</p>
    </div>
  );
}

/** Shows why something failed to load, with a retry button. `notFound` replaces the text for a 404. */
export function ErrorBox({ error, retry, notFound }: { error: unknown; retry?: () => void; notFound?: string }) {
  const { t } = useT();
  const errorText = useErrorText();
  const missing = error instanceof ApiError && error.code === 'not_found';
  return (
    <div className="card center sub stack" style={{ padding: 32, alignItems: 'center' }} role="alert">
      <Icon name={missing ? 'file-question-outline' : 'alert-circle-outline'} size={44} color={missing ? 'var(--faint)' : 'var(--red)'} />
      <p>{missing && notFound ? notFound : errorText(error)}</p>
      {retry && !missing ? <button type="button" className="btn sm outline" onClick={retry}><Icon name="refresh" size={17} />{t('फिर से प्रयास करें', 'Try again')}</button> : null}
    </div>
  );
}

/** Renders a query's data once it has loaded, and its loading or error state until then. */
export function Loaded<T>({ q, notFound, children }: { q: UseQueryResult<T>; notFound?: string; children: (data: T) => ReactNode }) {
  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorBox error={q.error} retry={() => q.refetch()} notFound={notFound} />;
  return <>{children(q.data)}</>;
}

export function Bubble({ v, size = 46 }: { v: Visual; size?: number }) {
  return (
    <span className="bubble" style={{ width: size, height: size, background: v.soft }}>
      <Icon name={v.icon} size={size * 0.52} color={v.color} />
    </span>
  );
}

export function Badge({ label, color, soft }: { label: string; color: string; soft: string }) {
  return <span className="badge" style={{ color, background: soft }}>{label}</span>;
}

export function StatusBadge({ r }: { r: Request }) {
  const { tl } = useT();
  const st = STATUS[r.status];
  return <Badge label={tl(statusLabel(r))} color={st.color} soft={st.soft} />;
}

/** Sets the button colour through the `--c` custom property used by `.btn`. */
export const tint = (color: string) => ({ '--c': color }) as CSSProperties;

export function PageHead({ icon, color, title, subtitle, right }: { icon?: IconName; color?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="page-head row wrap">
      <div className="grow">
        <h1>{icon ? <Icon name={icon} size={30} color={color} /> : null}{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

function FieldLabel({ label, required, icon }: { label: string; required?: boolean; icon?: IconName }) {
  return (
    <label>
      {icon ? <Icon name={icon} /> : null}
      {label}
      {required ? <span className="req">*</span> : null}
    </label>
  );
}

type Common = { label: string; required?: boolean; icon?: IconName };

export function Field({ label, required, icon, ...p }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return <div className="field"><FieldLabel label={label} required={required} icon={icon} /><input {...p} /></div>;
}

export function TextArea({ label, required, icon, ...p }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <div className="field"><FieldLabel label={label} required={required} icon={icon} /><textarea {...p} /></div>;
}

/** One piece of bilingual text: Hindi is required, English optional (the server falls back to Hindi). */
export function BiField({ label, value, onChange, required, multiline, placeholder }: {
  label: string; value: L; onChange: (v: L) => void; required?: boolean; multiline?: boolean; placeholder?: L;
}) {
  const { t } = useT();
  const hi = { label: `${label} (${t('हिंदी', 'Hindi')})`, required, value: value.hi, placeholder: placeholder?.hi };
  const en = { label: `${label} (${t('अंग्रेज़ी, वैकल्पिक', 'English, optional')})`, value: value.en, placeholder: placeholder?.en };
  return multiline ? (
    <>
      <TextArea {...hi} style={{ minHeight: 70 }} onChange={(e) => onChange({ ...value, hi: e.target.value })} />
      <TextArea {...en} style={{ minHeight: 70 }} onChange={(e) => onChange({ ...value, en: e.target.value })} />
    </>
  ) : (
    <>
      <Field {...hi} onChange={(e) => onChange({ ...value, hi: e.target.value })} />
      <Field {...en} onChange={(e) => onChange({ ...value, en: e.target.value })} />
    </>
  );
}

type SelectProps = Common & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  placeholder?: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
};

export function Select({ label, required, icon, placeholder, options, onChange, ...p }: SelectProps) {
  return (
    <div className="field">
      <FieldLabel label={label} required={required} icon={icon} />
      <select {...p} onChange={(e) => onChange(e.target.value)}>
        {placeholder ? <option value="" disabled>{placeholder}</option> : null}
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Chips<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (id: T) => void }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o.id} type="button" className={o.id === value ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

export function LangToggle() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <div className="lang" role="radiogroup" aria-label="Language">
      <button type="button" role="radio" aria-checked={lang === 'hi'} className={lang === 'hi' ? 'on' : ''} onClick={() => setLang('hi')}>हिंदी</button>
      <button type="button" role="radio" aria-checked={lang === 'en'} className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
    </div>
  );
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="card center sub" style={{ padding: 40 }}>
      <Icon name={icon} size={46} color="var(--faint)" />
      <p>{text}</p>
    </div>
  );
}

export function RequestRow({ r, to, showCitizen }: { r: Request; to: string; showCitizen?: boolean }) {
  const { tl } = useT();
  return (
    <Link to={to} className="card list-row">
      <Bubble v={requestVisual(r)} />
      <div className="grow">
        <b style={{ fontSize: 17 }}>{tl(r.title)}</b>
        <div className="tiny sub">{r.id}  •  {fmtDate(r.createdAt)}{showCitizen && r.citizen.name ? `  •  ${r.citizen.name}` : ''}</div>
      </div>
      <ReopenedBadge r={r} />
      <StatusBadge r={r} />
      <Icon name="chevron-right" color="var(--faint)" />
    </Link>
  );
}

/** Prompts a visitor to log in (or register) before applying or raising a complaint. */
export function NeedLogin({ next }: { next: string }) {
  const { t } = useT();
  return (
    <div className="card row wrap" style={{ background: 'var(--blue-soft)', borderColor: '#bcd3f5' }}>
      <Icon name="account-lock-outline" size={30} color="var(--navy)" />
      <p className="grow">{t('आवेदन करने के लिए नागरिक के रूप में लॉगिन करें।', 'Log in as a citizen to apply.')}</p>
      <Link to={`/login?next=${encodeURIComponent(next)}`} className="btn sm" style={tint('var(--navy)')}><Icon name="login" size={17} />{t('लॉगिन करें', 'Log in')}</Link>
      <Link to="/register" className="btn sm outline" style={tint('var(--green)')}>{t('पंजीकरण करें', 'Register')}</Link>
    </div>
  );
}

/** Marks a complaint the citizen reopened because it was not actually fixed. */
export function ReopenedBadge({ r }: { r: Request }) {
  const { t } = useT();
  if (!r.reopened) return null;
  const label = r.reopened > 1 ? t(`${r.reopened} बार दोबारा खोला`, `Reopened ${r.reopened}×`) : t('दोबारा खोला गया', 'Reopened');
  return <Badge label={label} color="var(--red)" soft="#fde5e8" />;
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return <div className="row small sub" style={{ gap: 8 }}><Icon name={icon} size={17} />{text}</div>;
}

export function RequestSummary({ r, showCitizen }: { r: Request; showCitizen?: boolean }) {
  const { t, tl } = useT();
  return (
    <div className="card stack" style={{ gap: 10 }}>
      <div className="row">
        <Bubble v={requestVisual(r)} size={50} />
        <div className="grow">
          <h3>{tl(r.title)}</h3>
          <div className="tiny sub">{r.id}  •  {fmtDate(r.createdAt)}</div>
        </div>
        <div className="stack" style={{ gap: 4, alignItems: 'flex-end' }}>
          <StatusBadge r={r} />
          <ReopenedBadge r={r} />
        </div>
      </div>
      <p>{r.description}</p>
      {r.photo ? (
        <a href={r.photo} target="_blank" rel="noreferrer" title={t('पूरी फोटो देखें', 'View full photo')}>
          <img src={r.photo} alt={t('समस्या की फोटो', 'Photo of the problem')} style={{ maxHeight: 240, borderRadius: 8, objectFit: 'cover' }} />
        </a>
      ) : null}
      <div>
        <Meta icon="map-marker-outline" text={r.location} />
        {r.coords ? (
          <a className="row small" style={{ gap: 8, color: 'var(--blue)', fontWeight: 600 }} href={mapLink(r.coords)} target="_blank" rel="noreferrer">
            <Icon name="crosshairs-gps" size={17} />{t('नक्शे पर देखें', 'View on map')} ({r.coords.lat.toFixed(5)}, {r.coords.lng.toFixed(5)}{r.coords.accuracy ? ` ±${r.coords.accuracy} m` : ''})
          </a>
        ) : null}
        <Meta icon="office-building-outline" text={tl(DEPARTMENTS[r.department] ?? DEPARTMENTS.panchayat)} />
        {showCitizen && r.citizen.name ? <Meta icon="account-outline" text={`${r.citizen.name}  •  +91 ${r.citizen.mobile}`} /> : null}
      </div>
    </div>
  );
}

/** The six-step status timeline, shared by the citizen and admin views. */
export function Timeline({ r }: { r: Request }) {
  const { t, tl } = useT();
  const rejected = r.status === 'rejected';
  const reached = FLOW.indexOf(r.status);
  // Latest history entry per status, so a step shows the date and note of its most recent update.
  const last = Object.fromEntries(r.history.map((h) => [h.status, h]));
  const steps = rejected ? [...FLOW.filter((s) => last[s]), 'rejected' as const] : FLOW;

  return (
    <div className="card">
      <h3 style={{ marginBottom: 12 }}>{t('स्थिति ट्रैकिंग', 'Status Tracking')}</h3>
      {steps.map((s, i) => {
        const done = rejected || i <= reached;
        const entry = done ? last[s] : undefined;
        const color = s === 'rejected' ? 'var(--red)' : done ? 'var(--green)' : 'var(--faint)';
        return (
          <div className="tl" key={s}>
            <div className="tl-rail">
              <div className="tl-dot" style={done ? { background: color, borderColor: color, color: '#fff' } : undefined}>
                {done ? <Icon name={s === 'rejected' ? 'close' : 'check'} size={17} /> : i + 1}
              </div>
              {i < steps.length - 1 ? <div className="tl-line" style={!rejected && i < reached ? { background: 'var(--green)' } : undefined} /> : null}
            </div>
            <div className="tl-body" style={done ? undefined : { color: 'var(--faint)' }}>
              <b>{tl(STATUS[s].name)}</b>
              <div className="small" style={{ color: done ? 'var(--sub)' : 'var(--faint)' }}>{tl(FLOW_HINT[s])}</div>
              {entry ? <div className="tiny sub">{fmtDate(entry.at)}{entry.by ? `  •  ${entry.by}` : ''}</div> : null}
              {entry?.note ? <div className="tl-note">{entry.note}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
