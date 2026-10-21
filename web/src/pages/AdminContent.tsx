import { ReactNode, useState } from 'react';
import { ApiError, NewNotice, SchemeInput, WorkInput } from '../api';
import {
  useBaseline, useDeleteNotice, useDeleteScheme, useDeleteWork, useNotices, useSaveNotice, useSaveScheme, useSaveWork, useSchemes,
  useUpdateBaseline, useWorks,
} from '../api/hooks';
import { Badge, BiField, Bubble, Field, Icon, Loaded, PageHead, Select, tint, useErrorText } from '../components/ui';
import { BASELINE_FIELDS, Baseline, DEPARTMENTS, NOTICE_TAGS, NoticeTag, SCHEME_GROUPS, Scheme } from '../data';
import { useT } from '../store';

// Staff pages for the content citizens see: notices, schemes, development works and the
// dashboard's recorded figures. Each list item can be edited in the form at the top of its page.

const blank = { hi: '', en: '' };

/** Edit / delete buttons shown on each managed item, with the error of a failed delete right below them. */
function ItemActions({ onEdit, onDelete, busy, error, children }: {
  onEdit: () => void; onDelete: () => void; busy: boolean; error?: string; children?: ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
      <button type="button" className="btn sm outline" onClick={onEdit}><Icon name="pencil" size={16} />{t('बदलें', 'Edit')}</button>
      {children}
      <button type="button" className="btn sm outline" style={tint('var(--red)')} disabled={busy} onClick={onDelete}>
        <Icon name="delete-outline" size={16} />{t('हटाएँ', 'Delete')}
      </button>
      {error ? <div className="error" style={{ flexBasis: '100%' }}>{error}</div> : null}
    </div>
  );
}

/** Save and (while editing) cancel buttons for a content form, with its outcome below. */
function FormFooter({ editing, saving, disabled, color, saveLabel, error, done, onCancel }: {
  editing: boolean; saving: boolean; disabled?: boolean; color: string; saveLabel: string; error?: string; done?: string; onCancel: () => void;
}) {
  const { t } = useT();
  return (
    <>
      {error ? <div className="error">{error}</div> : null}
      <div className="row wrap">
        <button type="submit" className="btn" style={tint(color)} disabled={disabled || saving}>
          <Icon name={saving ? 'loading' : editing ? 'content-save-outline' : 'plus'} spin={saving} />{editing ? t('बदलाव सेव करें', 'Save changes') : saveLabel}
        </button>
        {editing ? <button type="button" className="btn outline" style={tint('var(--sub)')} onClick={onCancel}>{t('रद्द करें', 'Cancel')}</button> : null}
      </div>
      {done ? <div className="ok row" style={{ gap: 6 }}><Icon name="check-circle" />{done}</div> : null}
    </>
  );
}

// ---------- Notices ----------

const EMPTY_NOTICE: NewNotice = { tag: 'panchayat', title: blank, body: blank };

export function AdminNotices() {
  const { t, tl } = useT();
  const notices = useNotices();
  const save = useSaveNotice();
  const remove = useDeleteNotice();
  const errorText = useErrorText();
  const [form, setForm] = useState<NewNotice>(EMPTY_NOTICE);
  const [editId, setEditId] = useState<string>();
  const [done, setDone] = useState('');

  const reset = () => { setForm(EMPTY_NOTICE); setEditId(undefined); save.reset(); };
  const change = (patch: Partial<NewNotice>) => { setForm({ ...form, ...patch }); setDone(''); };
  const submit = () => save.mutate({ id: editId, notice: form }, {
    onSuccess: () => {
      setDone(editId ? t('सूचना अपडेट हो गई।', 'Notice updated.') : t('सूचना जारी हो गई। यह नागरिकों को “सूचनाएँ” में दिखेगी।', 'Notice published. Citizens will see it under “Updates”.'));
      reset();
    },
  });

  return (
    <>
      <PageHead icon="bell-outline" title={t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications')} subtitle={t('गाँव के लिए सूचना जारी करें, बदलें या हटाएँ', 'Publish, edit or remove notices for the village')} />
      <div className="split">
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <h3>{editId ? t('सूचना बदलें', 'Edit notice') : t('नई सूचना', 'New notice')}</h3>
          <Select label={t('श्रेणी', 'Category')} required value={form.tag} options={NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))} onChange={(v) => change({ tag: v as NoticeTag })} />
          <BiField label={t('शीर्षक', 'Title')} required value={form.title} onChange={(title) => change({ title })} placeholder={{ hi: 'जैसे: ग्राम सभा बैठक', en: 'e.g. Gram Sabha meeting' }} />
          <BiField label={t('विवरण', 'Details')} required multiline value={form.body} onChange={(body) => change({ body })} placeholder={{ hi: 'तारीख, समय और स्थान लिखें', en: 'Add the date, time and place' }} />
          <FormFooter
            editing={!!editId} saving={save.isPending} disabled={!form.title.hi.trim() || !form.body.hi.trim()} color="var(--purple)"
            saveLabel={t('सूचना जारी करें', 'Publish notice')} error={save.isError ? errorText(save.error) : undefined} done={done} onCancel={reset}
          />
        </form>
        <div className="stack">
          <Loaded q={notices}>
            {(list) => (
              <>
                <h3>{t('जारी सूचनाएँ', 'Published notices')} ({list.length})</h3>
                {list.map((n) => (
                  <div className="card" key={n.id} style={{ padding: 12, outline: n.id === editId ? '2px solid var(--purple)' : undefined }}>
                    <div className="row"><b className="grow">{tl(n.title)}</b><Badge label={tl(NOTICE_TAGS.find((x) => x.id === n.tag)!.name)} color={n.color} soft={n.soft} /></div>
                    <div className="small sub">{tl(n.body)}</div>
                    <ItemActions
                      busy={remove.isPending} error={remove.isError && remove.variables === n.id ? errorText(remove.error) : undefined}
                      onEdit={() => { setEditId(n.id); setForm({ tag: n.tag, title: n.title, body: n.body }); setDone(''); save.reset(); window.scrollTo(0, 0); }}
                      onDelete={() => {
                        if (!window.confirm(t(`“${tl(n.title)}” सूचना हटाएँ?`, `Remove the notice “${tl(n.title)}”?`))) return;
                        remove.mutate(n.id, { onSuccess: () => { if (n.id === editId) reset(); } });
                      }}
                    />
                  </div>
                ))}
              </>
            )}
          </Loaded>
        </div>
      </div>
    </>
  );
}

// ---------- Schemes ----------

const EMPTY_SCHEME: SchemeInput = { groupId: 'student', dept: 'education', name: blank, desc: blank, open: true };

export function AdminSchemes() {
  const { t, tl } = useT();
  const schemes = useSchemes();
  const save = useSaveScheme();
  const remove = useDeleteScheme();
  const errorText = useErrorText();
  const [form, setForm] = useState<SchemeInput>(EMPTY_SCHEME);
  const [editId, setEditId] = useState<string>();
  const [done, setDone] = useState('');

  const reset = () => { setForm(EMPTY_SCHEME); setEditId(undefined); save.reset(); };
  const change = (patch: Partial<SchemeInput>) => { setForm({ ...form, ...patch }); setDone(''); };
  const submit = () => save.mutate({ id: editId, scheme: form }, {
    onSuccess: () => {
      setDone(editId ? t('योजना अपडेट हो गई।', 'Scheme updated.') : t('योजना जुड़ गई। नागरिक अब इसके लिए आवेदन कर सकते हैं।', 'Scheme added. Citizens can now apply for it.'));
      reset();
    },
  });
  const toggleOpen = ({ id, ...s }: Scheme) => save.mutate({ id, scheme: { ...s, open: !s.open } }, { onSuccess: () => { if (id === editId) reset(); } });
  const removeError = remove.error instanceof ApiError && remove.error.code === 'in_use'
    ? t('इस योजना के लिए नागरिकों ने आवेदन किया है, इसलिए इसे हटाया नहीं जा सकता। इसके बजाय इसे बंद करें।', 'Citizens have applied for this scheme, so it cannot be deleted. Close it instead.')
    : remove.isError ? errorText(remove.error) : undefined;

  return (
    <>
      <PageHead icon="bank-outline" title={t('योजना प्रबंधन', 'Scheme Management')} subtitle={t('योजनाएँ जोड़ें, बदलें, बंद करें या हटाएँ', 'Add, edit, close or remove government schemes')} />
      <div className="split">
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <h3>{editId ? t('योजना बदलें', 'Edit scheme') : t('नई योजना', 'New scheme')}</h3>
          <div className="grid g2 collapse">
            <Select label={t('वर्ग', 'Group')} required value={form.groupId} options={SCHEME_GROUPS.map((g) => ({ id: g.id, label: tl(g.name) }))} onChange={(groupId) => change({ groupId })} />
            <Select label={t('विभाग', 'Department')} required value={form.dept} options={Object.entries(DEPARTMENTS).map(([id, name]) => ({ id, label: tl(name) }))} onChange={(dept) => change({ dept })} />
          </div>
          <BiField label={t('योजना का नाम', 'Scheme name')} required value={form.name} onChange={(name) => change({ name })} />
          <BiField label={t('विवरण', 'Description')} required multiline value={form.desc} onChange={(desc) => change({ desc })} />
          <label className="row small" style={{ gap: 8 }}>
            <input type="checkbox" checked={form.open} onChange={(e) => change({ open: e.target.checked })} />
            {t('आवेदन के लिए खुली', 'Open for applications')}
          </label>
          <FormFooter
            editing={!!editId} saving={save.isPending} disabled={!form.name.hi.trim() || !form.desc.hi.trim()} color="var(--orange)"
            saveLabel={t('योजना जोड़ें', 'Add scheme')} error={save.isError ? errorText(save.error) : undefined} done={done} onCancel={reset}
          />
        </form>
        <div className="stack">
          <Loaded q={schemes}>
            {(list) => SCHEME_GROUPS.map((g) => {
              const inGroup = list.filter((s) => s.groupId === g.id);
              return (
                <section key={g.id} className="stack" style={{ gap: 8 }}>
                  <div className="row"><Bubble v={g} size={34} /><h3 className="grow">{tl(g.name)}</h3><span className="tiny sub">{inGroup.length}</span></div>
                  {inGroup.length === 0 ? <div className="tiny sub">{t('इस वर्ग में कोई योजना नहीं', 'No schemes in this group')}</div> : null}
                  {inGroup.map((s) => (
                    <div className="card" key={s.id} style={{ padding: 12, opacity: s.open ? 1 : 0.7, outline: s.id === editId ? '2px solid var(--orange)' : undefined }}>
                      <div className="row">
                        <b className="grow">{tl(s.name)}</b>
                        {s.open ? <Badge label={t('खुली', 'Open')} color="var(--green)" soft="var(--green-soft)" /> : <Badge label={t('बंद', 'Closed')} color="var(--red)" soft="#fde5e8" />}
                      </div>
                      <div className="small sub">{tl(s.desc)}</div>
                      <div className="tiny" style={{ color: g.color, fontWeight: 600 }}>{tl(DEPARTMENTS[s.dept])}</div>
                      <ItemActions
                        busy={remove.isPending} error={remove.variables === s.id ? removeError : undefined}
                        onEdit={() => { setEditId(s.id); setForm({ groupId: s.groupId, dept: s.dept, name: s.name, desc: s.desc, open: s.open }); setDone(''); save.reset(); window.scrollTo(0, 0); }}
                        onDelete={() => {
                          if (!window.confirm(t(`“${tl(s.name)}” योजना हटाएँ?`, `Remove the scheme “${tl(s.name)}”?`))) return;
                          remove.mutate(s.id, { onSuccess: () => { if (s.id === editId) reset(); } });
                        }}
                      >
                        <button type="button" className="btn sm outline" style={tint(s.open ? 'var(--amber)' : 'var(--green)')} disabled={save.isPending} onClick={() => toggleOpen(s)}>
                          <Icon name={s.open ? 'lock-outline' : 'lock-open-variant-outline'} size={16} />{s.open ? t('बंद करें', 'Close') : t('खोलें', 'Open')}
                        </button>
                      </ItemActions>
                    </div>
                  ))}
                </section>
              );
            })}
          </Loaded>
        </div>
      </div>
    </>
  );
}

// ---------- Development works ----------

const EMPTY_WORK: WorkInput = { name: blank, progress: 0, budget: '' };
const progressColor = (p: number) => (p >= 80 ? 'var(--green)' : 'var(--amber)');

export function AdminPlan() {
  const { t, tl } = useT();
  const works = useWorks();
  const save = useSaveWork();
  const remove = useDeleteWork();
  const errorText = useErrorText();
  const [form, setForm] = useState<WorkInput>(EMPTY_WORK);
  const [editId, setEditId] = useState<string>();
  const [done, setDone] = useState('');

  const reset = () => { setForm(EMPTY_WORK); setEditId(undefined); save.reset(); };
  const change = (patch: Partial<WorkInput>) => { setForm({ ...form, ...patch }); setDone(''); };
  const submit = () => save.mutate({ id: editId, work: form }, {
    onSuccess: () => {
      setDone(editId ? t('कार्य अपडेट हो गया।', 'Work updated.') : t('कार्य जुड़ गया। यह “गाँव की प्रगति” पर दिखेगा।', 'Work added. It is shown on the Village Dashboard.'));
      reset();
    },
  });

  return (
    <>
      <PageHead icon="target" title={t('ग्राम विकास योजना', 'Village Development Plan')} subtitle={t('विकास कार्य और उनकी प्रगति – “गाँव की प्रगति” पर सार्वजनिक', 'Development works and their progress – public on the Village Dashboard')} />
      <div className="split">
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <h3>{editId ? t('कार्य बदलें', 'Edit work') : t('नया विकास कार्य', 'New development work')}</h3>
          <BiField label={t('कार्य का नाम', 'Work')} required value={form.name} onChange={(name) => change({ name })} placeholder={{ hi: 'जैसे: नई पानी की टंकी (वार्ड 4)', en: 'e.g. New water tank (Ward 4)' }} />
          <div className="field">
            <label>{t('प्रगति', 'Progress')}: <b style={{ color: progressColor(form.progress) }}>{form.progress}%</b></label>
            <input type="range" min={0} max={100} step={5} value={form.progress} onChange={(e) => change({ progress: Number(e.target.value) })} />
          </div>
          <Field label={t('बजट', 'Budget')} icon="currency-inr" value={form.budget} placeholder="₹ 12 लाख" onChange={(e) => change({ budget: e.target.value })} />
          <FormFooter
            editing={!!editId} saving={save.isPending} disabled={!form.name.hi.trim()} color="var(--teal)"
            saveLabel={t('कार्य जोड़ें', 'Add work')} error={save.isError ? errorText(save.error) : undefined} done={done} onCancel={reset}
          />
        </form>
        <div className="stack">
          <Loaded q={works}>
            {(list) => list.length === 0 ? <div className="sub">{t('अभी कोई विकास कार्य नहीं', 'No development works yet')}</div> : list.map((w) => (
              <div className="card" key={w.id} style={{ outline: w.id === editId ? '2px solid var(--teal)' : undefined }}>
                <div className="row"><b className="grow" style={{ fontSize: 17 }}>{tl(w.name)}</b><b style={{ color: progressColor(w.progress) }}>{w.progress}%</b></div>
                <div className="bar" style={{ margin: '6px 0' }}><div style={{ width: `${w.progress}%`, background: progressColor(w.progress) }} /></div>
                {w.budget ? <div className="small sub">{t('बजट', 'Budget')}: {w.budget}</div> : null}
                <ItemActions
                  busy={remove.isPending} error={remove.isError && remove.variables === w.id ? errorText(remove.error) : undefined}
                  onEdit={() => { setEditId(w.id); setForm({ name: w.name, progress: w.progress, budget: w.budget }); setDone(''); save.reset(); window.scrollTo(0, 0); }}
                  onDelete={() => {
                    if (!window.confirm(t(`“${tl(w.name)}” कार्य हटाएँ?`, `Remove the work “${tl(w.name)}”?`))) return;
                    remove.mutate(w.id, { onSuccess: () => { if (w.id === editId) reset(); } });
                  }}
                />
              </div>
            ))}
          </Loaded>
        </div>
      </div>
    </>
  );
}

// ---------- Dashboard figures ----------

export function AdminFigures() {
  const { t } = useT();
  const baseline = useBaseline();
  return (
    <>
      <PageHead icon="counter" title={t('गाँव के आँकड़े', 'Village Figures')} subtitle={t('“गाँव की प्रगति” पर दिखने वाले दर्ज आँकड़े', 'Recorded figures shown on the Village Dashboard')} />
      <Loaded q={baseline}>{(b) => <FiguresForm initial={b} />}</Loaded>
    </>
  );
}

function FiguresForm({ initial }: { initial: Baseline }) {
  const { t, tl } = useT();
  const save = useUpdateBaseline();
  const errorText = useErrorText();
  // Kept as text while typing so a field can be empty; checked when saving.
  const [form, setForm] = useState<Record<keyof Baseline, string>>(() => Object.fromEntries(BASELINE_FIELDS.map(({ id }) => [id, String(initial[id])])) as Record<keyof Baseline, string>);
  const [error, setError] = useState('');

  const submit = () => {
    if (BASELINE_FIELDS.some(({ id }) => !/^\d+$/.test(form[id]))) return setError(t('सभी आँकड़े 0 या उससे बड़ी पूर्ण संख्या होने चाहिए।', 'Every figure must be a whole number, 0 or more.'));
    setError('');
    save.mutate(Object.fromEntries(BASELINE_FIELDS.map(({ id }) => [id, Number(form[id])])) as Baseline, { onError: (e) => setError(errorText(e)) });
  };

  return (
    <form className="card stack" style={{ maxWidth: 760 }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <p className="small sub">
        {t(
          'ये आँकड़े इस पोर्टल के बाहर दर्ज कार्य हैं (पोर्टल शुरू होने से पहले या पंचायत कार्यालय में)। सार्वजनिक डैशबोर्ड इनमें पोर्टल पर आए अनुरोधों की गिनती अपने आप जोड़ता है।',
          'These are figures recorded outside this portal (before it started, or at the Panchayat office). The public dashboard adds the requests made on the portal on top of them automatically.',
        )}
      </p>
      <div className="grid g2 collapse">
        {BASELINE_FIELDS.map(({ id, name }) => (
          <Field
            key={id} label={tl(name)} required inputMode="numeric" value={form[id]}
            onChange={(e) => { setForm({ ...form, [id]: e.target.value.replace(/\D/g, '').slice(0, 7) }); setError(''); save.reset(); }}
          />
        ))}
      </div>
      {error ? <div className="error">{error}</div> : null}
      <div className="row wrap">
        <button type="submit" className="btn" disabled={save.isPending}>
          <Icon name={save.isPending ? 'loading' : 'content-save-outline'} spin={save.isPending} />{t('आँकड़े सेव करें', 'Save figures')}
        </button>
      </div>
      {save.isSuccess ? <div className="ok row" style={{ gap: 6 }}><Icon name="check-circle" />{t('आँकड़े अपडेट हो गए।', 'Figures updated.')}</div> : null}
    </form>
  );
}
