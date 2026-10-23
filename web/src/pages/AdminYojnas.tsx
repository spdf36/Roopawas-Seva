import {
  APPROVAL_LEVEL_PRESETS, ApprovalLevel, DEPARTMENTS, EXPENSE_CATEGORIES, Expense, FUND_SOURCES, Fund, YOJNA_STATUS, YOJNA_STATUSES, Yojna,
  fmtRupees, fundReceived,
} from '@shared/data';
import { ReactNode, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, ExpenseInput, FundInput, YojnaInput } from '../api';
import {
  useAddInstalment, useDeleteExpense, useDeleteFund, useDeleteInstalment, useDeleteYojna, useSaveExpense, useSaveFund, useSaveYojna, useYojna,
  useYojnas,
} from '../api/hooks';
import { BiField, Field, Icon, Loaded, PageHead, Select, tint, useErrorText } from '../components/ui';
import { compressPhoto } from '../photo';
import { useT } from '../store';
import { ApprovalSteps, ExpensesTable, FundsList, MoneySummary, YojnaHeader, YojnaList, YojnaTotals } from './Yojnas';

// Staff pages for Village Yojnas: create a yojna, keep its status and approval levels current, and record the
// funds sanctioned, the instalments received and every expense with its bill. Everything here is public.

const blank = { hi: '', en: '' };

// Dates are picked as calendar days and stored as noon local time, so they show as the same day everywhere in India.
const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (ts: number) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fromDateInput = (s: string) => new Date(`${s}T12:00`).getTime();
const today = () => toDateInput(Date.now());
/** Whole rupees typed as text; NaN for anything else. */
const rupees = (s: string) => (/^\d{1,11}$/.test(s.trim()) ? Number(s.trim()) : NaN);

const departmentOptions = (tl: (v: { hi: string; en: string }) => string) => Object.entries(DEPARTMENTS).map(([id, name]) => ({ id, label: tl(name) }));

function SmallButton({ icon, label, color, onClick, disabled }: { icon: string; label: string; color?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="btn sm outline" style={color ? tint(color) : undefined} disabled={disabled} onClick={onClick}>
      <Icon name={icon} size={16} />{label}
    </button>
  );
}

function Saved({ text }: { text: string }) {
  return text ? <div className="ok row" style={{ gap: 6 }}><Icon name="check-circle" />{text}</div> : null;
}

// ---------- Details, status and approval levels ----------

const EMPTY_YOJNA: YojnaInput = { name: blank, desc: blank, dept: 'panchayat', status: 'proposed', statusNote: '', progress: 0, levels: [] };

const inputOf = (y: Yojna): YojnaInput => ({ name: y.name, desc: y.desc, dept: y.dept, status: y.status, statusNote: y.statusNote, progress: y.progress, levels: y.levels });

function LevelsEditor({ levels, onChange }: { levels: ApprovalLevel[]; onChange: (levels: ApprovalLevel[]) => void }) {
  const { t, tl } = useT();
  const set = (i: number, patch: Partial<ApprovalLevel>) => onChange(levels.map((lv, n) => (n === i ? { ...lv, ...patch } : lv)));
  const move = (i: number, by: number) => {
    const next = [...levels];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };
  const unused = APPROVAL_LEVEL_PRESETS.filter((p) => !levels.some((lv) => lv.name.hi === p.hi));

  return (
    <div className="stack" style={{ gap: 8 }}>
      <b className="small sub">{t('स्वीकृति के स्तर (क्रम से)', 'Approval levels (in order)')}</b>
      <div className="small sub">
        {t('जिस स्तर से स्वीकृति मिल गई, उसकी तारीख भरें। पहला बिना तारीख वाला स्तर “अभी यहाँ” दिखेगा।', 'Enter the date for each level that has approved. The first level without a date is shown as “now at”.')}
      </div>
      {levels.map((lv, i) => (
        <div key={i} className="row wrap" style={{ gap: 6, padding: 8, background: 'var(--bg)', borderRadius: 8 }}>
          <b style={{ width: 22 }}>{i + 1}.</b>
          <input style={{ flex: '1 1 150px' }} className="level-input" aria-label={t('स्तर (हिंदी)', 'Level (Hindi)')} placeholder={t('स्तर (हिंदी)', 'Level (Hindi)')} value={lv.name.hi} onChange={(e) => set(i, { name: { ...lv.name, hi: e.target.value } })} />
          <input style={{ flex: '1 1 150px' }} className="level-input" aria-label={t('स्तर (अंग्रेज़ी)', 'Level (English)')} placeholder={t('अंग्रेज़ी (वैकल्पिक)', 'English (optional)')} value={lv.name.en} onChange={(e) => set(i, { name: { ...lv.name, en: e.target.value } })} />
          <label className="row small sub" style={{ gap: 4 }}>
            {t('स्वीकृत', 'Approved')}
            <input type="date" className="level-input" max={today()} value={lv.approvedAt ? toDateInput(lv.approvedAt) : ''} onChange={(e) => set(i, { approvedAt: e.target.value ? fromDateInput(e.target.value) : undefined })} />
          </label>
          <button type="button" className="btn sm outline" title={t('ऊपर', 'Up')} aria-label={t('ऊपर', 'Up')} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="arrow-up" size={16} /></button>
          <button type="button" className="btn sm outline" title={t('नीचे', 'Down')} aria-label={t('नीचे', 'Down')} disabled={i === levels.length - 1} onClick={() => move(i, 1)}><Icon name="arrow-down" size={16} /></button>
          <button type="button" className="btn sm outline" style={tint('var(--red)')} title={t('हटाएँ', 'Remove')} aria-label={t('हटाएँ', 'Remove')} onClick={() => onChange(levels.filter((_, n) => n !== i))}><Icon name="close" size={16} /></button>
        </div>
      ))}
      <div className="row wrap" style={{ gap: 6 }}>
        {unused.map((p) => (
          <button key={p.hi} type="button" className="btn sm outline" style={tint('var(--teal)')} onClick={() => onChange([...levels, { name: p }])}>
            <Icon name="plus" size={16} />{tl(p)}
          </button>
        ))}
        <button type="button" className="btn sm outline" onClick={() => onChange([...levels, { name: blank }])}><Icon name="plus" size={16} />{t('दूसरा स्तर', 'Other level')}</button>
      </div>
    </div>
  );
}

/** Creates a yojna (no `yojna`) or edits its details, status and levels. */
function YojnaForm({ yojna, onSaved, onCancel }: { yojna?: Yojna; onSaved: (y: Yojna) => void; onCancel?: () => void }) {
  const { t, tl } = useT();
  const save = useSaveYojna();
  const errorText = useErrorText();
  const [form, setForm] = useState<YojnaInput>(yojna ? inputOf(yojna) : EMPTY_YOJNA);
  const [error, setError] = useState('');
  const change = (patch: Partial<YojnaInput>) => { setForm({ ...form, ...patch }); setError(''); };
  const showProgress = form.status === 'active' || form.status === 'completed';

  const submit = () => {
    if (!form.name.hi.trim()) return setError(t('कृपया योजना का नाम (हिंदी) लिखें।', 'Please enter the yojna’s name (Hindi).'));
    if (form.levels.some((lv) => !lv.name.hi.trim())) return setError(t('हर स्तर का नाम (हिंदी) लिखें या खाली स्तर हटाएँ।', 'Name every level (Hindi) or remove the empty ones.'));
    const firstPending = form.levels.findIndex((lv) => !lv.approvedAt);
    if (firstPending >= 0 && form.levels.slice(firstPending).some((lv) => lv.approvedAt)) {
      return setError(t('कोई स्तर अपने से पहले के स्तरों के बाद ही स्वीकृत हो सकता है।', 'A level can only approve after the levels before it.'));
    }
    save.mutate({ id: yojna?.id, yojna: form }, { onSuccess: onSaved, onError: (e) => setError(errorText(e)) });
  };

  return (
    <form className="card stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <h3>{yojna ? t('विवरण, स्थिति और स्तर बदलें', 'Edit details, status and levels') : t('नई योजना', 'New yojna')}</h3>
      <BiField label={t('योजना का नाम', 'Yojna name')} required value={form.name} onChange={(name) => change({ name })} placeholder={{ hi: 'जैसे: नई पानी की टंकी (वार्ड 4)', en: 'e.g. New water tank (Ward 4)' }} />
      <BiField label={t('विवरण', 'Description')} multiline value={form.desc} onChange={(desc) => change({ desc })} />
      <Select label={t('विभाग', 'Department')} value={form.dept} options={departmentOptions(tl)} onChange={(dept) => change({ dept })} />
      <div className="field">
        <label>{t('स्थिति', 'Status')}</label>
        <div className="row wrap" style={{ gap: 6 }}>
          {YOJNA_STATUSES.map((s) => (
            <button key={s} type="button" className={`status-pick${form.status === s ? ' on' : ''}`} style={tint(YOJNA_STATUS[s].color)} onClick={() => change({ status: s, progress: s === 'completed' ? 100 : form.progress })}>
              {tl(YOJNA_STATUS[s].name)}
            </button>
          ))}
        </div>
        <div className="small sub">{tl(YOJNA_STATUS[form.status].hint)}</div>
      </div>
      <Field
        label={t('स्थिति पर टिप्पणी (सबको दिखेगी)', 'Status note (shown to everyone)')} value={form.statusNote} maxLength={300}
        placeholder={t('जैसे: ज़िला परिषद से तकनीकी स्वीकृति का इंतज़ार', 'e.g. Awaiting technical approval from the Zila Parishad')}
        onChange={(e) => change({ statusNote: e.target.value })}
      />
      {showProgress ? (
        <div className="field">
          <label>{t('कार्य प्रगति', 'Work done')}: <b>{form.progress}%</b></label>
          <input type="range" min={0} max={100} step={5} value={form.progress} disabled={form.status === 'completed'} onChange={(e) => change({ progress: Number(e.target.value) })} />
        </div>
      ) : null}
      <LevelsEditor levels={form.levels} onChange={(levels) => change({ levels })} />
      {error ? <div className="error">{error}</div> : null}
      <div className="row wrap">
        <button type="submit" className="btn" style={tint('var(--orange)')} disabled={save.isPending}>
          <Icon name={save.isPending ? 'loading' : yojna ? 'content-save-outline' : 'plus'} spin={save.isPending} />{yojna ? t('बदलाव सेव करें', 'Save changes') : t('योजना जोड़ें', 'Add yojna')}
        </button>
        {onCancel ? <button type="button" className="btn outline" style={tint('var(--sub)')} onClick={onCancel}>{t('रद्द करें', 'Cancel')}</button> : null}
      </div>
    </form>
  );
}

export function AdminYojnas() {
  const { t } = useT();
  const navigate = useNavigate();
  const yojnas = useYojnas();
  const [adding, setAdding] = useState(false);
  return (
    <>
      <PageHead
        icon="hammer-wrench" title={t('ग्राम विकास योजनाएँ', 'Village Yojnas')}
        subtitle={t('स्थिति, स्वीकृति के स्तर, राशि और खर्च – “ग्राम विकास योजनाएँ” पेज पर सबको दिखते हैं', 'Status, approval levels, funds and expenses – everyone sees them on the Village Yojnas page')}
        right={adding ? null : <button type="button" className="btn" style={tint('var(--orange)')} onClick={() => setAdding(true)}><Icon name="plus" />{t('नई योजना', 'New yojna')}</button>}
      />
      <div className="stack" style={{ gap: 16 }}>
        {/* A new yojna opens on its own page, where its funds and expenses are added. */}
        {adding ? <YojnaForm onSaved={(y) => navigate(`/admin/yojnas/${y.id}`)} onCancel={() => setAdding(false)} /> : null}
        <Loaded q={yojnas}>
          {(list) => (
            <div className="stack" style={{ gap: 16 }}>
              {list.length ? <YojnaTotals list={list} /> : null}
              <YojnaList list={list} linkTo={(id) => `/admin/yojnas/${id}`} />
            </div>
          )}
        </Loaded>
      </div>
    </>
  );
}

// ---------- Funds and instalments ----------

const EMPTY_FUND = { source: 'state', sanctioned: '', note: '' };

/** Adds a fund (no `fund`) or edits one. */
function FundForm({ yojnaId, fund, onDone }: { yojnaId: string; fund?: Fund; onDone: () => void }) {
  const { t, tl } = useT();
  const save = useSaveFund(yojnaId);
  const errorText = useErrorText();
  const [form, setForm] = useState(fund ? { source: fund.source, sanctioned: String(fund.sanctioned), note: fund.note } : EMPTY_FUND);
  const [error, setError] = useState('');
  const received = fund ? fundReceived(fund) : 0;

  const submit = () => {
    const sanctioned = rupees(form.sanctioned);
    if (Number.isNaN(sanctioned)) return setError(t('स्वीकृत राशि पूरे रुपयों में लिखें।', 'Enter the sanctioned amount in whole rupees.'));
    if (sanctioned < received) return setError(t(`स्वीकृत राशि, प्राप्त राशि (${fmtRupees(received)}) से कम नहीं हो सकती।`, `The sanctioned amount cannot be less than what was received (${fmtRupees(received)}).`));
    const input: FundInput = { source: form.source, sanctioned, note: form.note };
    save.mutate({ fundId: fund?.id, fund: input }, { onSuccess: onDone, onError: (e) => setError(errorText(e)) });
  };

  return (
    <form className="stack" style={{ gap: 10, padding: 12, background: 'var(--bg)', borderRadius: 8 }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <b>{fund ? t('राशि का स्रोत बदलें', 'Edit fund') : t('नई स्वीकृत राशि', 'New fund')}</b>
      <div className="grid g2 collapse" style={{ gap: 10 }}>
        <Select label={t('स्रोत', 'Source')} value={form.source} options={Object.entries(FUND_SOURCES).map(([id, name]) => ({ id, label: tl(name) }))} onChange={(source) => setForm({ ...form, source })} />
        <Field label={t('स्वीकृत राशि (₹)', 'Sanctioned amount (₹)')} required inputMode="numeric" value={form.sanctioned} placeholder="1500000" onChange={(e) => { setForm({ ...form, sanctioned: e.target.value }); setError(''); }} />
      </div>
      <Field label={t('योजना / मद (वैकल्पिक)', 'Scheme / head (optional)')} value={form.note} maxLength={300} placeholder={t('जैसे: जल जीवन मिशन', 'e.g. Jal Jeevan Mission')} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      {error ? <div className="error">{error}</div> : null}
      <div className="row wrap" style={{ gap: 8 }}>
        <button type="submit" className="btn sm" style={tint('var(--blue)')} disabled={save.isPending}><Icon name={save.isPending ? 'loading' : 'content-save-outline'} spin={save.isPending} size={16} />{t('सेव करें', 'Save')}</button>
        <button type="button" className="btn sm outline" style={tint('var(--sub)')} onClick={onDone}>{t('रद्द करें', 'Cancel')}</button>
      </div>
    </form>
  );
}

function InstalmentForm({ yojnaId, fund, onDone }: { yojnaId: string; fund: Fund; onDone: () => void }) {
  const { t } = useT();
  const add = useAddInstalment(yojnaId);
  const errorText = useErrorText();
  const [form, setForm] = useState({ amount: '', date: today(), note: '' });
  const [error, setError] = useState('');
  const left = fund.sanctioned - fundReceived(fund);

  const submit = () => {
    const amount = rupees(form.amount);
    if (!amount) return setError(t('राशि पूरे रुपयों में लिखें।', 'Enter the amount in whole rupees.'));
    if (!form.date) return setError(t('तारीख चुनें।', 'Choose the date.'));
    if (amount > left) return setError(t(`यह स्वीकृत राशि से अधिक होगा (${fmtRupees(left)} बाकी)। पहले स्वीकृत राशि बढ़ाएँ।`, `That is more than the sanctioned amount (${fmtRupees(left)} left). Increase the sanctioned amount first.`));
    add.mutate({ fundId: fund.id, instalment: { amount, date: fromDateInput(form.date), note: form.note } }, { onSuccess: onDone, onError: (e) => setError(errorText(e)) });
  };

  return (
    <form className="stack" style={{ gap: 10, padding: 12, background: 'var(--blue-soft)', borderRadius: 8 }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <b>{t('प्राप्त किस्त दर्ज करें', 'Record an instalment received')} <span className="small sub">({fmtRupees(left)} {t('बाकी', 'left')})</span></b>
      <div className="grid g2 collapse" style={{ gap: 10 }}>
        <Field label={t('राशि (₹)', 'Amount (₹)')} required inputMode="numeric" value={form.amount} onChange={(e) => { setForm({ ...form, amount: e.target.value }); setError(''); }} />
        <Field label={t('प्राप्ति की तारीख', 'Date received')} required type="date" max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </div>
      <Field label={t('टिप्पणी (वैकल्पिक)', 'Note (optional)')} value={form.note} maxLength={300} placeholder={t('जैसे: प्रथम किस्त', 'e.g. First instalment')} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      {error ? <div className="error">{error}</div> : null}
      <div className="row wrap" style={{ gap: 8 }}>
        <button type="submit" className="btn sm" style={tint('var(--blue)')} disabled={add.isPending}><Icon name={add.isPending ? 'loading' : 'plus'} spin={add.isPending} size={16} />{t('किस्त जोड़ें', 'Add instalment')}</button>
        <button type="button" className="btn sm outline" style={tint('var(--sub)')} onClick={onDone}>{t('रद्द करें', 'Cancel')}</button>
      </div>
    </form>
  );
}

/** What the funds card is showing a form for. */
type FundEdit = { kind: 'new' } | { kind: 'edit' | 'instalment'; fundId: string } | null;

function FundsEditor({ y }: { y: Yojna }) {
  const { t } = useT();
  const remove = useDeleteFund(y.id);
  const removeInstalment = useDeleteInstalment(y.id);
  const errorText = useErrorText();
  const [open, setOpen] = useState<FundEdit>(null);
  const [done, setDone] = useState('');
  const close = (message = '') => { setOpen(null); setDone(message); };
  const fundOf = (id: string) => y.funds.find((f) => f.id === id)!;

  const actions = (fundId: string): ReactNode => {
    if (open && open.kind !== 'new' && open.fundId === fundId) {
      return open.kind === 'edit'
        ? <FundForm yojnaId={y.id} fund={fundOf(fundId)} onDone={() => close()} />
        : <InstalmentForm yojnaId={y.id} fund={fundOf(fundId)} onDone={() => close()} />;
    }
    return (
      <div className="row wrap" style={{ gap: 8 }}>
        <SmallButton icon="bank-transfer-in" label={t('किस्त जोड़ें', 'Add instalment')} color="var(--blue)" onClick={() => { setOpen({ kind: 'instalment', fundId }); setDone(''); }} />
        <SmallButton icon="pencil" label={t('बदलें', 'Edit')} onClick={() => { setOpen({ kind: 'edit', fundId }); setDone(''); }} />
        <SmallButton
          icon="delete-outline" label={t('हटाएँ', 'Delete')} color="var(--red)" disabled={remove.isPending}
          onClick={() => { if (window.confirm(t('यह राशि का स्रोत हटाएँ?', 'Remove this fund?'))) remove.mutate(fundId, { onSuccess: () => setDone(t('हटा दिया गया।', 'Removed.')) }); }}
        />
        {remove.isError && remove.variables === fundId ? (
          <div className="error" style={{ flexBasis: '100%' }}>
            {remove.error instanceof ApiError && remove.error.code === 'in_use'
              ? t('इस स्रोत की किस्तें या इससे हुए खर्च दर्ज हैं; पहले उन्हें हटाएँ।', 'Instalments or expenses are recorded against this fund; remove them first.')
              : errorText(remove.error)}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="card stack">
      <div className="row wrap">
        <h3 className="grow">{t('राशि के स्रोत और किस्तें', 'Funds and instalments')}</h3>
        {open?.kind !== 'new' ? <SmallButton icon="plus" label={t('नई स्वीकृत राशि', 'New fund')} color="var(--blue)" onClick={() => { setOpen({ kind: 'new' }); setDone(''); }} /> : null}
      </div>
      {open?.kind === 'new' ? <FundForm yojnaId={y.id} onDone={() => close()} /> : null}
      <Saved text={done} />
      <FundsList
        y={y} actions={actions}
        instalmentAction={(fundId, instalmentId) => (
          <button
            type="button" className="btn sm outline" style={{ ...tint('var(--red)'), padding: '2px 6px' }} title={t('किस्त हटाएँ', 'Remove instalment')} aria-label={t('किस्त हटाएँ', 'Remove instalment')}
            disabled={removeInstalment.isPending}
            onClick={() => { if (window.confirm(t('यह किस्त हटाएँ?', 'Remove this instalment?'))) removeInstalment.mutate({ fundId, instalmentId }); }}
          >
            <Icon name="close" size={14} />
          </button>
        )}
      />
      {removeInstalment.isError ? <div className="error">{errorText(removeInstalment.error)}</div> : null}
    </div>
  );
}

// ---------- Expenses ----------

/** Adds an expense (no `expense`) or edits one, with its bill photo. */
function ExpenseForm({ y, expense, onDone }: { y: Yojna; expense?: Expense; onDone: (saved: boolean) => void }) {
  const { t, tl } = useT();
  const save = useSaveExpense(y.id);
  const errorText = useErrorText();
  const [form, setForm] = useState({
    date: expense ? toDateInput(expense.date) : today(),
    purpose: expense?.purpose ?? '',
    amount: expense ? String(expense.amount) : '',
    category: expense?.category ?? 'material',
    fundId: expense?.fundId ?? '',
  });
  // undefined: keep the current bill; null: remove it; a data: URL: the new bill.
  const [bill, setBill] = useState<string | null>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shownBill = bill === undefined ? expense?.bill : bill;

  const pickBill = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      setBill(await compressPhoto(file));
    } catch {
      setError(t('यह फोटो नहीं खुल सकी या बहुत बड़ी है। कृपया दूसरी फोटो चुनें।', 'This photo could not be opened or is too large. Please choose another.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const amount = rupees(form.amount);
    if (!form.purpose.trim()) return setError(t('लिखें कि किस पर खर्च हुआ।', 'Enter what the money was spent on.'));
    if (!amount) return setError(t('राशि पूरे रुपयों में लिखें।', 'Enter the amount in whole rupees.'));
    if (!form.date) return setError(t('तारीख चुनें।', 'Choose the date.'));
    const input: ExpenseInput = {
      date: fromDateInput(form.date), purpose: form.purpose, amount, category: form.category,
      ...(form.fundId ? { fundId: form.fundId } : {}), ...(bill !== undefined ? { bill } : {}),
    };
    save.mutate({ expenseId: expense?.id, expense: input }, { onSuccess: () => onDone(true), onError: (e) => setError(errorText(e)) });
  };

  return (
    <form className="stack" style={{ gap: 10, padding: 12, background: 'var(--bg)', borderRadius: 8 }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <b>{expense ? t('खर्च बदलें', 'Edit expense') : t('नया खर्च दर्ज करें', 'Record an expense')}</b>
      <Field label={t('किस पर खर्च', 'Spent on')} required value={form.purpose} maxLength={150} placeholder={t('जैसे: सीमेंट – 200 बोरी', 'e.g. Cement – 200 bags')} onChange={(e) => { setForm({ ...form, purpose: e.target.value }); setError(''); }} />
      <div className="grid g2 collapse" style={{ gap: 10 }}>
        <Field label={t('राशि (₹)', 'Amount (₹)')} required inputMode="numeric" value={form.amount} onChange={(e) => { setForm({ ...form, amount: e.target.value }); setError(''); }} />
        <Field label={t('तारीख', 'Date')} required type="date" max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Select label={t('श्रेणी', 'Category')} value={form.category} options={Object.entries(EXPENSE_CATEGORIES).map(([id, c]) => ({ id, label: tl(c.name) }))} onChange={(category) => setForm({ ...form, category })} />
        <Select
          label={t('किस निधि से (वैकल्पिक)', 'Paid from (optional)')} value={form.fundId}
          options={[{ id: '', label: t('– नहीं बताया –', '– not given –') }, ...y.funds.map((f) => ({ id: f.id, label: `${tl(FUND_SOURCES[f.source] ?? FUND_SOURCES.other)}${f.note ? ` – ${f.note}` : ''}` }))]}
          onChange={(fundId) => setForm({ ...form, fundId })}
        />
      </div>
      <div className="field">
        <label>{t('बिल / रसीद की फोटो (वैकल्पिक, सबको दिखेगी)', 'Photo of the bill / receipt (optional, shown to everyone)')}</label>
        {shownBill ? <img src={shownBill} alt={t('बिल', 'Bill')} style={{ maxHeight: 160, width: 'fit-content', borderRadius: 8 }} /> : null}
        <div className="row wrap" style={{ gap: 8 }}>
          <label className="btn sm outline" style={tint('var(--teal)')}>
            <Icon name={busy ? 'loading' : 'camera-outline'} spin={busy} size={16} />{shownBill ? t('फोटो बदलें', 'Change photo') : t('फोटो चुनें', 'Choose photo')}
            <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) pickBill(f); }} />
          </label>
          {shownBill ? <SmallButton icon="close" label={t('फोटो हटाएँ', 'Remove photo')} color="var(--red)" onClick={() => setBill(expense?.bill ? null : undefined)} /> : null}
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}
      <div className="row wrap" style={{ gap: 8 }}>
        <button type="submit" className="btn sm" style={tint('var(--orange)')} disabled={save.isPending || busy}><Icon name={save.isPending ? 'loading' : 'content-save-outline'} spin={save.isPending} size={16} />{t('सेव करें', 'Save')}</button>
        <button type="button" className="btn sm outline" style={tint('var(--sub)')} onClick={() => onDone(false)}>{t('रद्द करें', 'Cancel')}</button>
      </div>
    </form>
  );
}

function ExpensesEditor({ y }: { y: Yojna }) {
  const { t } = useT();
  const remove = useDeleteExpense(y.id);
  const errorText = useErrorText();
  // 'new', an expense ID being edited, or nothing.
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState('');
  const editing = open && open !== 'new' ? y.expenses.find((e) => e.id === open) : undefined;

  return (
    <div className="card stack">
      <div className="row wrap">
        <h3 className="grow">{t('खर्च का ब्योरा', 'Expenses')}</h3>
        {!open ? <SmallButton icon="plus" label={t('नया खर्च', 'New expense')} color="var(--orange)" onClick={() => { setOpen('new'); setDone(''); }} /> : null}
      </div>
      {open ? (
        <ExpenseForm
          key={open} y={y} expense={editing}
          onDone={(saved) => { setOpen(null); setDone(saved ? t('खर्च सेव हो गया।', 'Expense saved.') : ''); }}
        />
      ) : null}
      <Saved text={done} />
      {remove.isError ? <div className="error">{errorText(remove.error)}</div> : null}
      <ExpensesTable
        y={y}
        actions={(expenseId) => (
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn sm outline" title={t('बदलें', 'Edit')} aria-label={t('बदलें', 'Edit')} onClick={() => { setOpen(expenseId); setDone(''); window.scrollTo({ top: 0 }); }}><Icon name="pencil" size={16} /></button>
            <button
              type="button" className="btn sm outline" style={tint('var(--red)')} title={t('हटाएँ', 'Delete')} aria-label={t('हटाएँ', 'Delete')} disabled={remove.isPending}
              onClick={() => { if (window.confirm(t('यह खर्च हटाएँ?', 'Remove this expense?'))) remove.mutate(expenseId, { onSuccess: () => setDone(t('हटा दिया गया।', 'Removed.')) }); }}
            >
              <Icon name="delete-outline" size={16} />
            </button>
          </div>
        )}
      />
    </div>
  );
}

// ---------- One yojna ----------

export function AdminYojna() {
  const { t } = useT();
  const { id = '' } = useParams();
  const yojna = useYojna(id);
  return (
    <>
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <Link to="/admin/yojnas" className="row small grow" style={{ gap: 4, color: 'var(--blue)', fontWeight: 600 }}>
          <Icon name="arrow-left" size={18} />{t('सभी योजनाएँ', 'All yojnas')}
        </Link>
        <Link to={`/yojnas/${id}`} className="row small" style={{ gap: 4, color: 'var(--blue)', fontWeight: 600 }}>
          <Icon name="eye-outline" size={18} />{t('सार्वजनिक पेज देखें', 'View public page')}
        </Link>
      </div>
      <Loaded q={yojna} notFound={t('यह योजना नहीं मिली।', 'This yojna was not found.')}>{(y) => <ManageYojna y={y} />}</Loaded>
    </>
  );
}

function ManageYojna({ y }: { y: Yojna }) {
  const { t } = useT();
  const navigate = useNavigate();
  const remove = useDeleteYojna();
  const errorText = useErrorText();
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState('');

  return (
    <div className="stack" style={{ gap: 16 }}>
      {editing ? (
        <YojnaForm yojna={y} onSaved={() => { setEditing(false); setDone(t('योजना अपडेट हो गई।', 'Yojna updated.')); }} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <YojnaHeader y={y} />
          <div className="row wrap">
            <SmallButton icon="pencil" label={t('विवरण, स्थिति और स्तर बदलें', 'Edit details, status and levels')} color="var(--orange)" onClick={() => { setEditing(true); setDone(''); }} />
            <Saved text={done} />
          </div>
        </>
      )}
      <MoneySummary y={y} />
      <div className="split">
        <FundsEditor y={y} />
        <ApprovalSteps y={y} />
      </div>
      <ExpensesEditor y={y} />
      <div className="card row wrap">
        <div className="grow small sub">{t('राशि या खर्च दर्ज होने पर योजना हटाई नहीं जा सकती।', 'A yojna with funds or expenses recorded cannot be removed.')}</div>
        <SmallButton
          icon="delete-outline" label={t('योजना हटाएँ', 'Remove yojna')} color="var(--red)" disabled={remove.isPending}
          onClick={() => { if (window.confirm(t('यह योजना हटाएँ?', 'Remove this yojna?'))) remove.mutate(y.id, { onSuccess: () => navigate('/admin/yojnas') }); }}
        />
        {remove.isError ? (
          <div className="error" style={{ flexBasis: '100%' }}>
            {remove.error instanceof ApiError && remove.error.code === 'in_use'
              ? t('इस योजना की राशि या खर्च दर्ज हैं; पहले उन्हें हटाएँ।', 'This yojna has funds or expenses recorded; remove them first.')
              : errorText(remove.error)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
