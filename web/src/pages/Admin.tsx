import { useMemo, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Badge, Chips, Empty, Field, Icon, PageHead, RequestSummary, Select, StatusBadge, TextArea, Timeline, tint } from '../components/ui';
import {
  CATEGORIES, DEPARTMENTS, DEVELOPMENT_WORKS, FLOW, Icon as IconName, NOTICE_TAGS, NoticeTag, OCCUPATIONS, SEED_USERS,
  STATUS, Status, WARDS, fmtDate,
} from '../data';
import { RequestFilter, matchesFilter, useFilterOptions } from '../filters';
import { useVillageStats } from '../stats';
import { ADMIN_PIN, ADMIN_USER, useStore, useT } from '../store';

const isOpen = (s: Status) => s !== 'resolved' && s !== 'rejected';

export function AdminLogin() {
  const { t } = useT();
  const navigate = useNavigate();
  const isAdmin = useStore((s) => s.isAdmin);
  const adminLogin = useStore((s) => s.adminLogin);
  const [user, setUser] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="container page" style={{ maxWidth: 440 }}>
      <form className="card stack" onSubmit={(e) => { e.preventDefault(); if (adminLogin(user, pin)) navigate('/admin'); else setError(true); }}>
        <div className="center">
          <span className="bubble" style={{ width: 76, height: 76, background: 'var(--blue-soft)' }}><Icon name="account-tie" size={44} color="var(--navy)" /></span>
          <h2 style={{ marginTop: 6 }}>{t('मुखिया / प्रशासक लॉगिन', 'Sarpanch / Admin Login')}</h2>
        </div>
        <Field label={t('यूज़र आईडी', 'User ID')} required icon="account" value={user} autoCapitalize="none" placeholder={ADMIN_USER} onChange={(e) => { setUser(e.target.value); setError(false); }} />
        <Field label={t('पिन', 'PIN')} required icon="lock-outline" type="password" inputMode="numeric" maxLength={4} value={pin} placeholder="••••" onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(false); }} />
        {error ? <div className="error">{t('यूज़र आईडी या पिन गलत है।', 'Incorrect user ID or PIN.')}</div> : null}
        <button type="submit" className="btn block" style={tint('var(--navy)')}><Icon name="login" />{t('लॉगिन करें', 'Log in')}</button>
        <div className="demo-hint">{t('डेमो लॉगिन', 'Demo login')}:  <b>{ADMIN_USER}</b>  /  <b>{ADMIN_PIN}</b></div>
      </form>
    </div>
  );
}

export function AdminLayout() {
  const { t } = useT();
  const navigate = useNavigate();
  const isAdmin = useStore((s) => s.isAdmin);
  const adminLogout = useStore((s) => s.adminLogout);
  const fresh = useStore((s) => s.requests.filter((r) => r.status === 'submitted').length);

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const menu: { to: string; icon: IconName; label: string; count?: number; end?: boolean }[] = [
    { to: '/admin', end: true, icon: 'view-dashboard-outline', label: t('डैशबोर्ड', 'Dashboard') },
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
          <span className="bubble" style={{ width: 46, height: 46, background: 'var(--blue-soft)' }}><Icon name="account-tie" size={28} color="var(--navy)" /></span>
          <div>
            <b style={{ color: 'var(--navy)' }}>{t('मुखिया / प्रशासक', 'Sarpanch / Admin')}</b>
            <div className="tiny sub">{t('ग्राम पंचायत रूपावास', 'Gram Panchayat Roopawas')}</div>
          </div>
        </div>
        {menu.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end}>
            <Icon name={m.icon} />{m.label}{m.count ? <span className="count">{m.count}</span> : null}
          </NavLink>
        ))}
        <button className="btn sm outline block" style={{ ...tint('var(--red)'), marginTop: 12 }} onClick={() => { adminLogout(); navigate('/'); }}>
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

const CHOICES: Status[] = [...FLOW.slice(1), 'rejected'];

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

  return (
    <>
      <PageHead icon="file-document-edit-outline" title={r.id} subtitle={t('स्थिति अपडेट करें और नागरिक को सूचित करें', 'Update status and notify the citizen')} />
      <div className="split">
        <div className="stack">
          <RequestSummary r={r} showCitizen />
          <div className="card stack">
            <h3>{t('स्थिति अपडेट करें', 'Update Status')}</h3>
            <div className="row wrap" style={{ gap: 8 }}>
              {CHOICES.map((s) => (
                <button key={s} type="button" className={`status-pick${next === s ? ' on' : ''}`} style={tint(STATUS[s].color)} disabled={s === r.status} onClick={() => { setNext(s); setSaved(false); }}>
                  {tl(STATUS[s].name)}
                </button>
              ))}
            </div>
            <Select label={t('संबंधित विभाग', 'Concerned department')} icon="office-building-outline" value={department ?? r.department} options={Object.entries(DEPARTMENTS).map(([key, name]) => ({ id: key, label: tl(name) }))} onChange={setDepartment} />
            <TextArea label={t('नागरिक के लिए टिप्पणी (वैकल्पिक)', 'Note for the citizen (optional)')} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('जैसे: टीम कल सुबह मौके पर पहुँचेगी।', 'e.g. The team will visit the site tomorrow morning.')} style={{ minHeight: 80 }} />
            <button className="btn" style={tint('var(--navy)')} disabled={!next} onClick={update}><Icon name="send" />{t('अपडेट करें और सूचित करें', 'Update & notify')}</button>
            {saved ? <div className="ok row" style={{ gap: 6 }}><Icon name="check-circle" />{t('स्थिति अपडेट हो गई। नागरिक को उनके खाते में यह दिखेगी।', 'Status updated. The citizen will see it in their account.')}</div> : null}
          </div>
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

export function AdminUsers() {
  const { t, tl } = useT();
  const profile = useStore((s) => s.profile);
  const requests = useStore((s) => s.requests);
  const users = [
    ...(profile ? [{ name: profile.name, mobile: profile.mobile, occupation: profile.occupation, ward: profile.ward, fresh: true }] : []),
    ...SEED_USERS.filter((u) => u.mobile !== profile?.mobile).map((u) => ({ ...u, fresh: false })),
  ];
  const label = (list: typeof OCCUPATIONS, id: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };

  return (
    <>
      <PageHead icon="account-multiple-outline" title={t('उपयोगकर्ता प्रबंधन', 'User Management')} subtitle={t(`${users.length} पंजीकृत नागरिक`, `${users.length} registered citizens`)} />
      <div className="card table-wrap" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>{t('नाम', 'Name')}</th><th>{t('मोबाइल', 'Mobile')}</th><th>{t('पेशा', 'Occupation')}</th><th>{t('वार्ड', 'Ward')}</th><th className="num-cell">{t('आवेदन', 'Requests')}</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.mobile}>
                <td><b>{u.name}</b> {u.fresh ? <Badge label={t('नया', 'New')} color="var(--green)" soft="var(--green-soft)" /> : null}</td>
                <td>+91 {u.mobile}</td>
                <td>{label(OCCUPATIONS, u.occupation)}</td>
                <td>{label(WARDS, u.ward)}</td>
                <td className="num-cell">{requests.filter((r) => r.citizen.mobile === u.mobile).length}</td>
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
  const [sent, setSent] = useState(false);

  const publish = () => {
    addNotice({ tag, title: title.trim(), body: body.trim() });
    setTitle('');
    setBody('');
    setSent(true);
  };

  return (
    <>
      <PageHead icon="bell-outline" title={t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications')} subtitle={t('गाँव के लिए नई सूचना जारी करें', 'Publish a new notice for the village')} />
      <div className="split">
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); publish(); }}>
          <Select label={t('श्रेणी', 'Category')} required value={tag} options={NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))} onChange={(v) => setTag(v as NoticeTag)} />
          <Field label={t('शीर्षक', 'Title')} required value={title} onChange={(e) => { setTitle(e.target.value); setSent(false); }} placeholder={t('जैसे: ग्राम सभा बैठक', 'e.g. Gram Sabha meeting')} />
          <TextArea label={t('विवरण', 'Details')} required value={body} onChange={(e) => { setBody(e.target.value); setSent(false); }} placeholder={t('तारीख, समय और स्थान लिखें', 'Add the date, time and place')} style={{ minHeight: 80 }} />
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
