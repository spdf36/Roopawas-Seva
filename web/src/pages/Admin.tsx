import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Badge, Chips, Empty, Field, Icon, PageHead, RequestSummary, Select, StatusBadge, TextArea, Timeline, tint } from '../components/ui';
import {
  CATEGORIES, DEPARTMENTS, DESIGNATIONS, DEVELOPMENT_WORKS, FLOW, Icon as IconName, L, NOTICE_TAGS, NoticeTag, OCCUPATIONS, ROLE_NAME,
  SEED_ACCOUNTS, STATUS, Status, WARDS, fmtDate, nextStatuses,
} from '../data';
import { RequestFilter, matchesFilter, useFilterOptions } from '../filters';
import { useVillageStats } from '../stats';
import { NewAdmin, useStore, useT, useUser } from '../store';

const isOpen = (s: Status) => s !== 'resolved' && s !== 'rejected';

/** Staff area shell. Access is checked by the route guard in App.tsx. */
export function AdminLayout() {
  const { t, tl } = useT();
  const navigate = useNavigate();
  const user = useUser();
  const logout = useStore((s) => s.logout);
  const fresh = useStore((s) => s.requests.filter((r) => r.status === 'submitted').length);
  const isSuper = user?.role === 'superadmin';
  const designation = DESIGNATIONS.find((d) => d.id === user?.designation);

  const menu: { to: string; icon: IconName; label: string; count?: number; end?: boolean }[] = [
    { to: '/admin', end: true, icon: 'view-dashboard-outline', label: t('डैशबोर्ड', 'Dashboard') },
    ...(isSuper ? [{ to: '/admin/admins', icon: 'shield-account', label: t('एडमिन प्रबंधन', 'Admin management') }] : []),
    { to: '/admin/requests', icon: 'file-document-multiple-outline', label: t('सभी आवेदन देखें', 'View all applications'), count: fresh },
    { to: '/admin/reports', icon: 'file-chart-outline', label: t('विभागवार रिपोर्ट & Analytics', 'Reports & Analytics') },
    { to: '/admin/plan', icon: 'target', label: t('ग्राम विकास योजना', 'Village development plan') },
    { to: '/admin/users', icon: 'account-outline', label: t('उपयोगकर्ता प्रबंधन', 'User management') },
    { to: '/admin/notices', icon: 'bell-outline', label: t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications') },
  ];

  return (
    <div className="container page admin">
      <aside className="card admin-side">
        <div className="row" style={{ padding: '4px 6px 12px' }}>
          <span className="bubble" style={{ width: 46, height: 46, background: isSuper ? '#f0e6fa' : 'var(--blue-soft)' }}>
            <Icon name={isSuper ? 'shield-crown' : 'account-tie'} size={28} color={isSuper ? 'var(--purple)' : 'var(--navy)'} />
          </span>
          <div>
            <b style={{ color: 'var(--navy)' }}>{user?.name}</b>
            <div className="tiny sub">{designation ? tl(designation.name) : ''}</div>
            {user ? <Badge label={tl(ROLE_NAME[user.role])} color={isSuper ? 'var(--purple)' : 'var(--blue)'} soft={isSuper ? '#f0e6fa' : 'var(--blue-soft)'} /> : null}
          </div>
        </div>
        {menu.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end}>
            <Icon name={m.icon} />{m.label}{m.count ? <span className="count">{m.count}</span> : null}
          </NavLink>
        ))}
        <button className="btn sm outline block" style={{ ...tint('var(--red)'), marginTop: 12 }} onClick={() => { logout(); navigate('/'); }}>
          <Icon name="logout" size={17} />{t('लॉग आउट', 'Log out')}
        </button>
      </aside>
      <div><Outlet /></div>
    </div>
  );
}

export function AdminHome() {
  const { t, tl } = useT();
  const navigate = useNavigate();
  const requests = useStore((s) => s.requests);
  const recent = useMemo(() => [...requests].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5), [requests]);
  const stat = (label: string, value: number, color: string) => (
    <div className="card center"><div className="big" style={{ color }}>{value}</div><div className="sub">{label}</div></div>
  );

  return (
    <>
      <PageHead title={t('प्रशासक डैशबोर्ड', 'Admin Dashboard')} subtitle="Admin / Sarpanch Dashboard" />
      <div className="stack" style={{ gap: 16 }}>
        <div className="grid g4">
          {stat(t('कुल आवेदन', 'Total'), requests.length, 'var(--navy)')}
          {stat(t('नए आवेदन', 'New'), requests.filter((r) => r.status === 'submitted').length, 'var(--blue)')}
          {stat(t('लंबित', 'Pending'), requests.filter((r) => isOpen(r.status)).length, 'var(--amber)')}
          {stat(t('निपटाए गए', 'Resolved'), requests.filter((r) => r.status === 'resolved').length, 'var(--green)')}
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={{ padding: '14px 16px' }}>{t('हाल के आवेदन', 'Recent applications')}</h3>
          <div className="table-wrap">
            <table>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="click" onClick={() => navigate(`/admin/requests/${r.id}`)}>
                    <td><b>{tl(r.title)}</b><div className="tiny sub">{r.id}</div></td>
                    <td>{r.citizen.name}</td>
                    <td className="sub">{fmtDate(r.createdAt)}</td>
                    <td><StatusBadge r={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminRequests() {
  const { t, tl } = useT();
  const navigate = useNavigate();
  const requests = useStore((s) => s.requests);
  const [filter, setFilter] = useState<RequestFilter>('all');
  const options = useFilterOptions();
  const list = useMemo(() => requests.filter((r) => matchesFilter(r, filter)).sort((a, b) => b.createdAt - a.createdAt), [requests, filter]);

  return (
    <>
      <PageHead icon="file-document-multiple-outline" title={t('सभी आवेदन', 'All Applications')} subtitle={t(`कुल ${list.length}`, `${list.length} total`)} />
      <div className="stack">
        <Chips value={filter} options={options} onChange={setFilter} />
        {list.length === 0 ? <Empty icon="clipboard-text-off-outline" text={t('यहाँ कोई आवेदन नहीं है', 'No applications here')} /> : (
          <div className="card table-wrap" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>{t('आवेदन', 'Application')}</th><th>{t('नागरिक', 'Citizen')}</th><th>{t('विभाग', 'Department')}</th>
                  <th>{t('तारीख', 'Date')}</th><th>{t('स्थिति', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="click" onClick={() => navigate(`/admin/requests/${r.id}`)}>
                    <td><b>{tl(r.title)}</b><div className="tiny sub">{r.id}</div></td>
                    <td>{r.citizen.name}<div className="tiny sub">+91 {r.citizen.mobile}</div></td>
                    <td>{tl(DEPARTMENTS[r.department] ?? DEPARTMENTS.panchayat)}</td>
                    <td className="sub">{fmtDate(r.createdAt)}</td>
                    <td><StatusBadge r={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function AdminRequest() {
  const { t, tl } = useT();
  const { id } = useParams();
  const r = useStore((s) => s.requests.find((x) => x.id === id));
  const setStatus = useStore((s) => s.setStatus);
  const [next, setNext] = useState<Status>();
  const [department, setDepartment] = useState<string>();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  if (!r) return <Empty icon="file-question-outline" text={t('यह आवेदन नहीं मिला', 'This request was not found')} />;

  const update = () => {
    if (!next) return;
    setStatus(r.id, next, note, department);
    setNext(undefined);
    setNote('');
    setSaved(true);
  };

  const choices = nextStatuses(r.status);
  const savedNote = saved ? <div className="ok row" style={{ gap: 6 }}><Icon name="check-circle" />{t('स्थिति अपडेट हो गई। नागरिक को उनके खाते में यह दिखेगी।', 'Status updated. The citizen will see it in their account.')}</div> : null;

  return (
    <>
      <PageHead icon="file-document-edit-outline" title={r.id} subtitle={t('स्थिति अपडेट करें और नागरिक को सूचित करें', 'Update status and notify the citizen')} />
      <div className="split">
        <div className="stack">
          <RequestSummary r={r} showCitizen />
          {choices.length === 0 ? (
            <div className="card stack">
              <div className="row sub" style={{ gap: 6 }}>
                <Icon name="lock-outline" />
                {t(`यह आवेदन बंद है (${tl(STATUS[r.status].name)})। इसकी स्थिति अब नहीं बदली जा सकती।`, `This request is closed (${tl(STATUS[r.status].name)}). Its status can no longer be changed.`)}
              </div>
              {savedNote}
            </div>
          ) : (
            <div className="card stack">
              <h3>{t('स्थिति अपडेट करें', 'Update Status')}</h3>
              <div className="small sub">{t('स्थिति केवल आगे बढ़ाई जा सकती है।', 'Status can only move forward.')}</div>
              <div className="row wrap" style={{ gap: 8 }}>
                {choices.map((s) => (
                  <button key={s} type="button" className={`status-pick${next === s ? ' on' : ''}`} style={tint(STATUS[s].color)} onClick={() => { setNext(s); setSaved(false); }}>
                    {tl(STATUS[s].name)}
                  </button>
                ))}
              </div>
              <Select label={t('संबंधित विभाग', 'Concerned department')} icon="office-building-outline" value={department ?? r.department} options={Object.entries(DEPARTMENTS).map(([key, name]) => ({ id: key, label: tl(name) }))} onChange={setDepartment} />
              <TextArea label={t('नागरिक के लिए टिप्पणी (वैकल्पिक)', 'Note for the citizen (optional)')} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('जैसे: टीम कल सुबह मौके पर पहुँचेगी।', 'e.g. The team will visit the site tomorrow morning.')} style={{ minHeight: 80 }} />
              <button className="btn" style={tint('var(--navy)')} disabled={!next} onClick={update}><Icon name="send" />{t('अपडेट करें और सूचित करें', 'Update & notify')}</button>
              {savedNote}
            </div>
          )}
        </div>
        <Timeline r={r} />
      </div>
    </>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="row small"><span className="grow">{label}</span><b>{value}</b></div>
      <div className="bar"><div style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} /></div>
    </div>
  );
}

export function AdminReports() {
  const { t, tl } = useT();
  const requests = useStore((s) => s.requests);
  const village = useVillageStats();

  const byDept = Object.entries(DEPARTMENTS)
    .map(([id, name]) => {
      const rows = requests.filter((r) => r.department === id);
      return { id, name, total: rows.length, pending: rows.filter((r) => isOpen(r.status)).length, resolved: rows.filter((r) => r.status === 'resolved').length };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);
  const statuses: Status[] = [...FLOW, 'rejected'];
  const byStatus = statuses.map((st) => ({ st, n: requests.filter((r) => r.status === st).length }));
  const byCategory = CATEGORIES.map((c) => ({ c, n: requests.filter((r) => r.categoryId === c.id).length })).filter((x) => x.n > 0);
  const applications = requests.filter((r) => r.kind === 'application').length;
  const maxStatus = Math.max(1, ...byStatus.map((x) => x.n));
  const maxCat = Math.max(1, applications, ...byCategory.map((x) => x.n));
  const rate = Math.round((village.resolved / village.total) * 100);

  return (
    <>
      <PageHead icon="chart-box-outline" title={t('रिपोर्ट & Analytics', 'Reports & Analytics')} />
      <div className="stack" style={{ gap: 16 }}>
        <div className="card row">
          <div className="big" style={{ color: 'var(--green)' }}>{rate}%</div>
          <div>
            <h3>{t('समाधान दर', 'Resolution rate')}</h3>
            <div className="small sub">{t(`गाँव के कुल ${village.total} अनुरोधों में से ${village.resolved} निपटाए गए`, `${village.resolved} of ${village.total} village requests resolved`)}</div>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={{ padding: '14px 16px' }}>{t('विभागवार रिपोर्ट', 'Department-wise Report')}</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t('विभाग', 'Department')}</th><th className="num-cell">{t('कुल', 'Total')}</th><th className="num-cell">{t('लंबित', 'Pending')}</th><th className="num-cell">{t('हल', 'Resolved')}</th></tr></thead>
              <tbody>
                {byDept.map((d) => (
                  <tr key={d.id}>
                    <td>{tl(d.name)}</td>
                    <td className="num-cell">{d.total}</td>
                    <td className="num-cell" style={{ color: 'var(--amber)' }}>{d.pending}</td>
                    <td className="num-cell" style={{ color: 'var(--green)' }}>{d.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid g2 collapse">
          <div className="card stack" style={{ gap: 10 }}>
            <h3>{t('स्थिति के अनुसार', 'By status')}</h3>
            {byStatus.map(({ st, n }) => <Bar key={st} label={tl(STATUS[st].name)} value={n} max={maxStatus} color={STATUS[st].color} />)}
          </div>
          <div className="card stack" style={{ gap: 10 }}>
            <h3>{t('श्रेणी के अनुसार', 'By category')}</h3>
            {byCategory.map(({ c, n }) => <Bar key={c.id} label={tl(c.name)} value={n} max={maxCat} color={c.color} />)}
            <Bar label={t('योजना आवेदन', 'Scheme applications')} value={applications} max={maxCat} color="var(--navy)" />
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminPlan() {
  const { t, tl } = useT();
  return (
    <>
      <PageHead icon="target" title={t('ग्राम विकास योजना', 'Village Development Plan')} subtitle={t('चालू विकास कार्य और उनकी प्रगति', 'Ongoing works and their progress')} />
      <div className="stack">
        {DEVELOPMENT_WORKS.map((w) => {
          const color = w.progress >= 80 ? 'var(--green)' : 'var(--amber)';
          return (
            <div className="card" key={w.id}>
              <div className="row"><b className="grow" style={{ fontSize: 17 }}>{tl(w.name)}</b><b style={{ color }}>{w.progress}%</b></div>
              <div className="bar" style={{ margin: '6px 0' }}><div style={{ width: `${w.progress}%`, background: color }} /></div>
              <div className="small sub">{t('बजट', 'Budget')}: {w.budget}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const SEEDED = new Set(SEED_ACCOUNTS.map((a) => a.id));

export function AdminUsers() {
  const { t, tl } = useT();
  const accounts = useStore((s) => s.accounts);
  const requests = useStore((s) => s.requests);
  const setAccountActive = useStore((s) => s.setAccountActive);
  const citizens = accounts.filter((a) => a.role === 'citizen').sort((a, b) => b.createdAt - a.createdAt);
  const label = (list: { id: string; name: L }[], id?: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };

  return (
    <>
      <PageHead icon="account-multiple-outline" title={t('उपयोगकर्ता प्रबंधन', 'User Management')} subtitle={t(`${citizens.length} पंजीकृत नागरिक`, `${citizens.length} registered citizens`)} />
      <div className="card table-wrap" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>{t('नाम', 'Name')}</th><th>{t('मोबाइल (लॉगिन)', 'Mobile (login)')}</th><th>{t('पेशा', 'Occupation')}</th><th>{t('वार्ड', 'Ward')}</th><th className="num-cell">{t('आवेदन', 'Requests')}</th><th></th></tr></thead>
          <tbody>
            {citizens.map((u) => (
              <tr key={u.id} style={u.active ? undefined : { opacity: 0.6 }}>
                <td>
                  <b>{u.name}</b>{' '}
                  {SEEDED.has(u.id) ? null : <Badge label={t('नया', 'New')} color="var(--green)" soft="var(--green-soft)" />}{' '}
                  {u.active ? null : <Badge label={t('निष्क्रिय', 'Inactive')} color="var(--red)" soft="#fde5e8" />}
                </td>
                <td>+91 {u.mobile}</td>
                <td>{label(OCCUPATIONS, u.occupation)}</td>
                <td>{label(WARDS, u.ward)}</td>
                <td className="num-cell">{requests.filter((r) => r.citizen.mobile === u.mobile).length}</td>
                <td>
                  <button className="btn sm outline" style={tint(u.active ? 'var(--red)' : 'var(--green)')} onClick={() => setAccountActive(u.id, !u.active)}>
                    {u.active ? t('निष्क्रिय करें', 'Deactivate') : t('सक्रिय करें', 'Activate')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminNotices() {
  const { t, tl } = useT();
  const notices = useStore((s) => s.notices);
  const addNotice = useStore((s) => s.addNotice);
  const [tag, setTag] = useState<NoticeTag>('panchayat');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [sent, setSent] = useState(false);

  // The English text is optional; English readers see the Hindi text when it is left blank.
  const publish = () => {
    addNotice({
      tag,
      title: { hi: title.trim(), en: titleEn.trim() || title.trim() },
      body: { hi: body.trim(), en: bodyEn.trim() || body.trim() },
    });
    setTitle('');
    setBody('');
    setTitleEn('');
    setBodyEn('');
    setSent(true);
  };

  return (
    <>
      <PageHead icon="bell-outline" title={t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications')} subtitle={t('गाँव के लिए नई सूचना जारी करें', 'Publish a new notice for the village')} />
      <div className="split">
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); publish(); }}>
          <Select label={t('श्रेणी', 'Category')} required value={tag} options={NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))} onChange={(v) => setTag(v as NoticeTag)} />
          <Field label={t('शीर्षक (हिंदी)', 'Title (Hindi)')} required value={title} onChange={(e) => { setTitle(e.target.value); setSent(false); }} placeholder="जैसे: ग्राम सभा बैठक" />
          <TextArea label={t('विवरण (हिंदी)', 'Details (Hindi)')} required value={body} onChange={(e) => { setBody(e.target.value); setSent(false); }} placeholder="तारीख, समय और स्थान लिखें" style={{ minHeight: 80 }} />
          <Field label={t('शीर्षक (अंग्रेज़ी, वैकल्पिक)', 'Title (English, optional)')} value={titleEn} onChange={(e) => { setTitleEn(e.target.value); setSent(false); }} placeholder="e.g. Gram Sabha meeting" />
          <TextArea label={t('विवरण (अंग्रेज़ी, वैकल्पिक)', 'Details (English, optional)')} value={bodyEn} onChange={(e) => { setBodyEn(e.target.value); setSent(false); }} placeholder="Add the date, time and place" style={{ minHeight: 60 }} />
          <div className="tiny sub">{t('अंग्रेज़ी खाली छोड़ने पर अंग्रेज़ी में भी हिंदी पाठ दिखेगा।', 'If English is left blank, the Hindi text is shown in English too.')}</div>
          <button type="submit" className="btn" style={tint('var(--purple)')} disabled={!title.trim() || !body.trim()}><Icon name="bullhorn" />{t('सूचना जारी करें', 'Publish notice')}</button>
          {sent ? <div className="ok">{t('सूचना जारी हो गई। यह नागरिकों को “सूचनाएँ” में दिखेगी।', 'Notice published. Citizens will see it under “Updates”.')}</div> : null}
        </form>
        <div className="stack">
          <h3>{t('जारी सूचनाएँ', 'Published notices')} ({notices.length})</h3>
          {notices.map((n) => (
            <div className="card" key={n.id} style={{ padding: 12 }}>
              <div className="row"><b className="grow">{tl(n.title)}</b><Badge label={tl(NOTICE_TAGS.find((x) => x.id === n.tag)!.name)} color={n.color} soft={n.soft} /></div>
              <div className="small sub">{tl(n.body)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const EMPTY_ADMIN: NewAdmin = { name: '', loginId: '', pin: '', mobile: '', designation: 'wardpanch' };

/** Superadmin only: create, deactivate and remove admin accounts. */
export function AdminAdmins() {
  const { t, tl } = useT();
  const me = useUser();
  const accounts = useStore((s) => s.accounts);
  const createAdmin = useStore((s) => s.createAdmin);
  const setAccountActive = useStore((s) => s.setAccountActive);
  const removeAccount = useStore((s) => s.removeAccount);
  const [form, setForm] = useState<NewAdmin>(EMPTY_ADMIN);
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');

  const staff = accounts.filter((a) => a.role !== 'citizen').sort((a, b) => (a.role === b.role ? a.createdAt - b.createdAt : a.role === 'superadmin' ? -1 : 1));
  const set = (patch: Partial<NewAdmin>) => { setForm({ ...form, ...patch }); setError(''); setCreated(''); };

  const submit = () => {
    if (!form.name.trim() || !form.loginId.trim() || !form.designation) return setError(t('कृपया सभी ज़रूरी (*) जानकारी भरें।', 'Please fill in all required (*) fields.'));
    if (!/^[a-zA-Z][a-zA-Z0-9._-]{2,19}$/.test(form.loginId.trim())) return setError(t('यूज़र आईडी 3–20 अक्षर की हो, अक्षर से शुरू हो (a-z, 0-9, . _ -)।', 'User ID must be 3–20 characters and start with a letter (a-z, 0-9, . _ -).'));
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError(t('कृपया 10 अंकों का सही मोबाइल नंबर डालें।', 'Please enter a valid 10-digit mobile number.'));
    if (!/^\d{4}$/.test(form.pin)) return setError(t('कृपया 4 अंकों का पिन डालें।', 'Please enter a 4-digit PIN.'));
    if (createAdmin({ ...form, name: form.name.trim(), loginId: form.loginId.trim() }) === 'exists') return setError(t('यह यूज़र आईडी पहले से मौजूद है।', 'This user ID is already taken.'));
    const id = form.loginId.trim().toLowerCase();
    setCreated(t(`एडमिन खाता बन गया। लॉगिन: ${id} / ${form.pin}`, `Admin account created. Login: ${id} / ${form.pin}`));
    setForm(EMPTY_ADMIN);
  };

  return (
    <>
      <PageHead icon="shield-account" title={t('एडमिन प्रबंधन', 'Admin Management')} subtitle={t('पंचायत के एडमिन खाते बनाएँ और संभालें', 'Create and manage Panchayat admin accounts')} />
      <div className="split">
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <h3>{t('नया एडमिन बनाएँ', 'Create a new admin')}</h3>
          <Field label={t('नाम', 'Name')} required icon="account" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={t('जैसे: राधा देवी', 'e.g. Radha Devi')} />
          <Select label={t('पद', 'Designation')} required icon="badge-account-horizontal-outline" value={form.designation} options={DESIGNATIONS.filter((d) => d.id !== 'district').map((d) => ({ id: d.id, label: tl(d.name) }))} onChange={(designation) => set({ designation })} />
          <Field label={t('मोबाइल नंबर', 'Mobile Number')} required icon="cellphone" value={form.mobile} inputMode="numeric" maxLength={10} placeholder="98765 43210" onChange={(e) => set({ mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          <Field label={t('यूज़र आईडी (लॉगिन के लिए)', 'User ID (for login)')} required icon="at" value={form.loginId} autoCapitalize="none" placeholder={t('जैसे: wardpanch2', 'e.g. wardpanch2')} onChange={(e) => set({ loginId: e.target.value })} />
          <Field label={t('पिन (4 अंक)', 'PIN (4 digits)')} required icon="lock-outline" value={form.pin} inputMode="numeric" maxLength={4} placeholder="••••" autoComplete="off" onChange={(e) => set({ pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
          {error ? <div className="error">{error}</div> : null}
          <button type="submit" className="btn" style={tint('var(--purple)')}><Icon name="account-plus" />{t('एडमिन बनाएँ', 'Create admin')}</button>
          {created ? <div className="ok row" style={{ gap: 6 }}><Icon name="check-circle" />{created}</div> : null}
        </form>
        <div className="stack">
          <h3>{t('सभी एडमिन', 'All admins')} ({staff.length})</h3>
          {staff.map((a) => {
            const self = a.id === me?.id;
            const designation = DESIGNATIONS.find((d) => d.id === a.designation);
            return (
              <div className="card" key={a.id} style={{ padding: 12, opacity: a.active ? 1 : 0.65 }}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <Icon name={a.role === 'superadmin' ? 'shield-crown' : 'account-tie'} size={28} color={a.role === 'superadmin' ? 'var(--purple)' : 'var(--navy)'} />
                  <div className="grow">
                    <b>{a.name}</b>{' '}
                    {self ? <Badge label={t('आप', 'You')} color="var(--green)" soft="var(--green-soft)" /> : null}{' '}
                    {a.active ? null : <Badge label={t('निष्क्रिय', 'Inactive')} color="var(--red)" soft="#fde5e8" />}
                    <div className="small sub">{designation ? tl(designation.name) : tl(ROLE_NAME[a.role])}  •  {t('लॉगिन', 'Login')}: {a.loginId}</div>
                    <div className="tiny" style={{ color: 'var(--faint)' }}>+91 {a.mobile}  •  {t('बनाया', 'Created')} {fmtDate(a.createdAt)}</div>
                  </div>
                </div>
                {self || a.role === 'superadmin' ? null : (
                  <div className="row" style={{ marginTop: 8, gap: 8 }}>
                    <button className="btn sm outline" style={tint(a.active ? 'var(--amber)' : 'var(--green)')} onClick={() => setAccountActive(a.id, !a.active)}>
                      <Icon name={a.active ? 'account-off-outline' : 'account-check-outline'} size={16} />{a.active ? t('निष्क्रिय करें', 'Deactivate') : t('सक्रिय करें', 'Activate')}
                    </button>
                    <button
                      className="btn sm outline" style={tint('var(--red)')}
                      onClick={() => { if (window.confirm(t(`${a.name} का खाता हटाएँ?`, `Remove the account of ${a.name}?`))) removeAccount(a.id); }}
                    >
                      <Icon name="delete-outline" size={16} />{t('हटाएँ', 'Remove')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
