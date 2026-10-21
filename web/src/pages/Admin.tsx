import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, NewAdmin, RequestQuery, RequestSort } from '../api';
import {
  useAccounts, useCreateAdmin, useLogout, useRemoveAccount, useRequest, useRequests, useSetAccountActive, useUpdateStatus, useVillageStats,
} from '../api/hooks';
import { Badge, Chips, Empty, Field, Icon, Loaded, PageHead, RequestSummary, Select, StatusBadge, TextArea, Timeline, tint, useErrorText } from '../components/ui';
import {
  CATEGORIES, DEPARTMENTS, DESIGNATIONS, FLOW, Icon as IconName, L, OCCUPATIONS, OVERDUE_DAYS, ROLE_NAME, Request, RequestFilter, SEED_ACCOUNTS,
  STATUS, Status, WARDS, daysOpen, fmtDate, isClosed, nextStatuses,
} from '../data';
import { useFilterOptions } from '../filters';
import { useT, useUser } from '../store';

const isOpen = (s: Status) => s !== 'resolved' && s !== 'rejected';

/** Staff area shell. Access is checked by the route guard in App.tsx. */
export function AdminLayout() {
  const { t, tl } = useT();
  const navigate = useNavigate();
  const user = useUser();
  const logout = useLogout();
  const requests = useRequests();
  const fresh = requests.data?.filter((r) => r.status === 'submitted').length;
  const isSuper = user?.role === 'superadmin';
  const designation = DESIGNATIONS.find((d) => d.id === user?.designation);

  const menu: { to: string; icon: IconName; label: string; count?: number; end?: boolean }[] = [
    { to: '/admin', end: true, icon: 'view-dashboard-outline', label: t('डैशबोर्ड', 'Dashboard') },
    ...(isSuper ? [{ to: '/admin/admins', icon: 'shield-account', label: t('एडमिन प्रबंधन', 'Admin management') }] : []),
    { to: '/admin/requests', icon: 'file-document-multiple-outline', label: t('सभी आवेदन देखें', 'View all applications'), count: fresh },
    { to: '/admin/reports', icon: 'file-chart-outline', label: t('विभागवार रिपोर्ट & Analytics', 'Reports & Analytics') },
    { to: '/admin/users', icon: 'account-outline', label: t('उपयोगकर्ता प्रबंधन', 'User management') },
    { to: '/admin/notices', icon: 'bell-outline', label: t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications') },
    { to: '/admin/schemes', icon: 'bank-outline', label: t('योजना प्रबंधन', 'Scheme management') },
    { to: '/admin/plan', icon: 'target', label: t('ग्राम विकास योजना', 'Village development plan') },
    { to: '/admin/figures', icon: 'counter', label: t('गाँव के आँकड़े', 'Village figures') },
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
        <button
          className="btn sm outline block" style={{ ...tint('var(--red)'), marginTop: 12 }} disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/') })}
        >
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
  const requests = useRequests();
  const stat = (label: string, value: number, color: string) => (
    <div className="card center"><div className="big" style={{ color }}>{value}</div><div className="sub">{label}</div></div>
  );

  return (
    <>
      <PageHead title={t('प्रशासक डैशबोर्ड', 'Admin Dashboard')} subtitle="Admin / Sarpanch Dashboard" />
      <Loaded q={requests}>
        {(list) => (
          <div className="stack" style={{ gap: 16 }}>
            <div className="grid g4">
              {stat(t('कुल आवेदन', 'Total'), list.length, 'var(--navy)')}
              {stat(t('नए आवेदन', 'New'), list.filter((r) => r.status === 'submitted').length, 'var(--blue)')}
              {stat(t('लंबित', 'Pending'), list.filter((r) => isOpen(r.status)).length, 'var(--amber)')}
              {stat(t('निपटाए गए', 'Resolved'), list.filter((r) => r.status === 'resolved').length, 'var(--green)')}
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <h3 style={{ padding: '14px 16px' }}>{t('हाल के आवेदन', 'Recent applications')}</h3>
              <div className="table-wrap">
                <table>
                  <tbody>
                    {/* The server returns requests newest first. */}
                    {list.slice(0, 5).map((r) => (
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
        )}
      </Loaded>
    </>
  );
}

/** Days a request has been open (coloured as it gets old), or how long a closed one took. */
function Age({ r }: { r: Request }) {
  const { t } = useT();
  const days = daysOpen(r);
  if (isClosed(r)) return <span className="tiny sub">{t(`${days} दिन में`, `in ${days} days`)}</span>;
  const color = days >= OVERDUE_DAYS ? 'var(--red)' : days >= 7 ? 'var(--amber)' : 'var(--sub)';
  return (
    <b style={{ color, whiteSpace: 'nowrap' }} title={days >= OVERDUE_DAYS ? t(`${OVERDUE_DAYS} दिन से अधिक से लंबित`, `Pending for more than ${OVERDUE_DAYS} days`) : undefined}>
      {days >= OVERDUE_DAYS ? <Icon name="alert" size={15} /> : null} {t(`${days} दिन`, `${days} days`)}
    </b>
  );
}

const SORTS: RequestSort[] = ['newest', 'oldest', 'updated'];
const isSort = (v: string | null): v is RequestSort => SORTS.includes(v as RequestSort);
const isStatusFilter = (v: string | null): v is RequestFilter => ['all', 'active', 'done', 'rejected'].includes(v ?? '');

export function AdminRequests() {
  const { t, tl } = useT();
  const navigate = useNavigate();
  const options = useFilterOptions();
  // Filters live in the URL, so they survive opening a request and coming back, and can be shared as a link.
  const [params, setParams] = useSearchParams();
  const param = (key: string) => params.get(key) ?? '';
  const query: RequestQuery = {
    q: param('q') || undefined,
    status: isStatusFilter(params.get('status')) ? params.get('status') as RequestFilter : 'all',
    category: param('category') || undefined,
    department: param('department') || undefined,
    ward: param('ward') || undefined,
    sort: isSort(params.get('sort')) ? params.get('sort') as RequestSort : 'newest',
  };
  const requests = useRequests(query);
  // Always build on the latest URL: the delayed search update below must not bring back filters cleared meanwhile.
  const latest = useRef(params);
  latest.current = params;
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(latest.current);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // The search box updates the URL (and so the query) once typing pauses; only the typed text restarts the timer.
  const [search, setSearch] = useState(param('q'));
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== (latest.current.get('q') ?? '')) setParam('q', search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  // …and follows the URL when it changes some other way (a link, the back button).
  const urlSearch = param('q');
  useEffect(() => {
    setSearch((typed) => (typed.trim() === urlSearch ? typed : urlSearch));
  }, [urlSearch]);

  const filtered = ['q', 'status', 'category', 'department', 'ward'].some((k) => params.get(k));
  const all = { id: '', label: t('सभी', 'All') };
  const list = requests.data;

  return (
    <>
      <PageHead icon="file-document-multiple-outline" title={t('सभी आवेदन', 'All Applications')} subtitle={list ? t(`${list.length} आवेदन`, `${list.length} requests`) : undefined} />
      <div className="stack">
        <div className="card stack" style={{ gap: 10 }}>
          <Field
            label={t('खोजें', 'Search')} icon="magnify" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('आवेदन नंबर, नाम या मोबाइल नंबर', 'Request number, name or mobile number')}
          />
          <div className="grid g4 collapse">
            <Select
              label={t('श्रेणी', 'Category')} value={param('category')} onChange={(v) => setParam('category', v)}
              options={[all, ...CATEGORIES.map((c) => ({ id: c.id, label: tl(c.name) })), { id: 'application', label: t('योजना आवेदन', 'Scheme applications') }]}
            />
            <Select
              label={t('विभाग', 'Department')} value={param('department')} onChange={(v) => setParam('department', v)}
              options={[all, ...Object.entries(DEPARTMENTS).map(([id, name]) => ({ id, label: tl(name) }))]}
            />
            <Select label={t('वार्ड', 'Ward')} value={param('ward')} onChange={(v) => setParam('ward', v)} options={[all, ...WARDS.map((w) => ({ id: w.id, label: tl(w.name) }))]} />
            <Select
              label={t('क्रम', 'Sort by')} value={query.sort} onChange={(v) => setParam('sort', v === 'newest' ? '' : v)}
              options={[
                { id: 'newest', label: t('नए पहले', 'Newest first') },
                { id: 'oldest', label: t('पुराने पहले', 'Oldest first') },
                { id: 'updated', label: t('हाल में बदले', 'Recently updated') },
              ]}
            />
          </div>
          <div className="row wrap">
            <div className="grow"><Chips value={query.status ?? 'all'} options={options} onChange={(v) => setParam('status', v === 'all' ? '' : v)} /></div>
            {filtered ? (
              <button type="button" className="btn sm outline" onClick={() => { setSearch(''); setParams(query.sort === 'newest' ? {} : { sort: query.sort! }, { replace: true }); }}>
                <Icon name="filter-remove-outline" size={17} />{t('फ़िल्टर हटाएँ', 'Clear filters')}
              </button>
            ) : null}
          </div>
        </div>
        <Loaded q={requests}>
          {(rows) => rows.length === 0 ? (
            <Empty icon="clipboard-text-search-outline" text={filtered ? t('इन फ़िल्टर से कोई आवेदन नहीं मिला', 'No requests match these filters') : t('यहाँ कोई आवेदन नहीं है', 'No applications here')} />
          ) : (
            // Dimmed while results for changed filters are loading.
            <div className="card table-wrap" style={{ padding: 0, opacity: requests.isPlaceholderData ? 0.6 : 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('आवेदन', 'Application')}</th><th>{t('नागरिक', 'Citizen')}</th><th>{t('विभाग', 'Department')}</th>
                    <th>{t('तारीख', 'Date')}</th><th>{t('कितने दिन', 'Days open')}</th><th>{t('स्थिति', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="click" onClick={() => navigate(`/admin/requests/${r.id}`)}>
                      <td><b>{tl(r.title)}</b><div className="tiny sub">{r.id}</div></td>
                      <td>
                        {r.citizen.name}
                        <div className="tiny sub">+91 {r.citizen.mobile}{r.citizen.ward ? `  •  ${tl(WARDS.find((w) => w.id === r.citizen.ward)?.name ?? { hi: '', en: '' })}` : ''}</div>
                      </td>
                      <td>{tl(DEPARTMENTS[r.department] ?? DEPARTMENTS.panchayat)}</td>
                      <td className="sub">{fmtDate(r.createdAt)}</td>
                      <td><Age r={r} /></td>
                      <td><StatusBadge r={r} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Loaded>
      </div>
    </>
  );
}

export function AdminRequest() {
  const { t } = useT();
  const { id = '' } = useParams();
  const request = useRequest(id);
  return (
    <Loaded q={request} notFound={t('यह आवेदन नहीं मिला', 'This request was not found')}>
      {(r) => <RequestEditor r={r} />}
    </Loaded>
  );
}

function RequestEditor({ r }: { r: Request }) {
  const { t, tl } = useT();
  const updateStatus = useUpdateStatus();
  const errorText = useErrorText();
  const [next, setNext] = useState<Status>();
  const [department, setDepartment] = useState<string>();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const update = () => {
    if (!next) return;
    updateStatus.mutate({ id: r.id, update: { status: next, note, department } }, {
      onSuccess: () => {
        setNext(undefined);
        setNote('');
        setSaved(true);
      },
    });
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
                  <button key={s} type="button" className={`status-pick${next === s ? ' on' : ''}`} style={tint(STATUS[s].color)} onClick={() => { setNext(s); setSaved(false); updateStatus.reset(); }}>
                    {tl(STATUS[s].name)}
                  </button>
                ))}
              </div>
              <Select label={t('संबंधित विभाग', 'Concerned department')} icon="office-building-outline" value={department ?? r.department} options={Object.entries(DEPARTMENTS).map(([key, name]) => ({ id: key, label: tl(name) }))} onChange={setDepartment} />
              <TextArea label={t('नागरिक के लिए टिप्पणी (वैकल्पिक)', 'Note for the citizen (optional)')} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('जैसे: टीम कल सुबह मौके पर पहुँचेगी।', 'e.g. The team will visit the site tomorrow morning.')} style={{ minHeight: 80 }} />
              {updateStatus.isError ? <div className="error">{errorText(updateStatus.error)}</div> : null}
              <button className="btn" style={tint('var(--navy)')} disabled={!next || updateStatus.isPending} onClick={update}>
                <Icon name={updateStatus.isPending ? 'loading' : 'send'} spin={updateStatus.isPending} />{t('अपडेट करें और सूचित करें', 'Update & notify')}
              </button>
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
  const { t } = useT();
  const requests = useRequests();
  const stats = useVillageStats();
  return (
    <>
      <PageHead icon="chart-box-outline" title={t('रिपोर्ट & Analytics', 'Reports & Analytics')} />
      <Loaded q={requests}>
        {(list) => <Loaded q={stats}>{(village) => <Reports requests={list} resolved={village.resolved} total={village.total} />}</Loaded>}
      </Loaded>
    </>
  );
}

function Reports({ requests, resolved, total }: { requests: Request[]; resolved: number; total: number }) {
  const { t, tl } = useT();
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
  const rate = Math.round((resolved / total) * 100);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card row">
        <div className="big" style={{ color: 'var(--green)' }}>{rate}%</div>
        <div>
          <h3>{t('समाधान दर', 'Resolution rate')}</h3>
          <div className="small sub">{t(`गाँव के कुल ${total} अनुरोधों में से ${resolved} निपटाए गए`, `${resolved} of ${total} village requests resolved`)}</div>
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
  );
}

const SEEDED = new Set(SEED_ACCOUNTS.map((a) => a.id));

export function AdminUsers() {
  const { t, tl } = useT();
  const accounts = useAccounts('citizen');
  const requests = useRequests();
  const setActive = useSetAccountActive();
  const errorText = useErrorText();
  const label = (list: { id: string; name: L }[], id?: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };
  const citizens = accounts.data ? [...accounts.data].sort((a, b) => b.createdAt - a.createdAt) : undefined;

  return (
    <>
      <PageHead icon="account-multiple-outline" title={t('उपयोगकर्ता प्रबंधन', 'User Management')} subtitle={citizens ? t(`${citizens.length} पंजीकृत नागरिक`, `${citizens.length} registered citizens`) : undefined} />
      {setActive.isError ? <div className="error" style={{ marginBottom: 10 }}>{errorText(setActive.error)}</div> : null}
      <Loaded q={accounts}>
        {() => (
          <div className="card table-wrap" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>{t('नाम', 'Name')}</th><th>{t('मोबाइल (लॉगिन)', 'Mobile (login)')}</th><th>{t('पेशा', 'Occupation')}</th><th>{t('वार्ड', 'Ward')}</th><th className="num-cell">{t('आवेदन', 'Requests')}</th><th></th></tr></thead>
              <tbody>
                {citizens?.map((u) => (
                  <tr key={u.id} style={u.active ? undefined : { opacity: 0.6 }}>
                    <td>
                      <b>{u.name}</b>{' '}
                      {SEEDED.has(u.id) ? null : <Badge label={t('नया', 'New')} color="var(--green)" soft="var(--green-soft)" />}{' '}
                      {u.active ? null : <Badge label={t('निष्क्रिय', 'Inactive')} color="var(--red)" soft="#fde5e8" />}
                    </td>
                    <td>+91 {u.mobile}</td>
                    <td>{label(OCCUPATIONS, u.occupation)}</td>
                    <td>{label(WARDS, u.ward)}</td>
                    <td className="num-cell">
                      <Link to={`/admin/requests?q=${u.mobile}`} style={{ color: 'var(--blue)', fontWeight: 700 }} title={t('इस नागरिक के आवेदन देखें', "View this citizen's requests")}>
                        {requests.data ? requests.data.filter((r) => r.citizen.mobile === u.mobile).length : '…'}
                      </Link>
                    </td>
                    <td>
                      <button className="btn sm outline" style={tint(u.active ? 'var(--red)' : 'var(--green)')} disabled={setActive.isPending} onClick={() => setActive.mutate({ id: u.id, active: !u.active })}>
                        {u.active ? t('निष्क्रिय करें', 'Deactivate') : t('सक्रिय करें', 'Activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Loaded>
    </>
  );
}

const EMPTY_ADMIN: NewAdmin = { name: '', loginId: '', pin: '', mobile: '', designation: 'wardpanch' };

/** Superadmin only: create, deactivate and remove admin accounts. */
export function AdminAdmins() {
  const { t, tl } = useT();
  const me = useUser();
  const accounts = useAccounts('staff');
  const createAdmin = useCreateAdmin();
  const setActive = useSetAccountActive();
  const remove = useRemoveAccount();
  const errorText = useErrorText();
  const [form, setForm] = useState<NewAdmin>(EMPTY_ADMIN);
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');

  const set = (patch: Partial<NewAdmin>) => { setForm({ ...form, ...patch }); setError(''); setCreated(''); };
  const actionError = setActive.error ?? remove.error;

  const submit = () => {
    if (!form.name.trim() || !form.loginId.trim() || !form.designation) return setError(t('कृपया सभी ज़रूरी (*) जानकारी भरें।', 'Please fill in all required (*) fields.'));
    if (!/^[a-zA-Z][a-zA-Z0-9._-]{2,19}$/.test(form.loginId.trim())) return setError(t('यूज़र आईडी 3–20 अक्षर की हो, अक्षर से शुरू हो (a-z, 0-9, . _ -)।', 'User ID must be 3–20 characters and start with a letter (a-z, 0-9, . _ -).'));
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError(t('कृपया 10 अंकों का सही मोबाइल नंबर डालें।', 'Please enter a valid 10-digit mobile number.'));
    if (!/^\d{4}$/.test(form.pin)) return setError(t('कृपया 4 अंकों का पिन डालें।', 'Please enter a 4-digit PIN.'));
    createAdmin.mutate({ ...form, name: form.name.trim(), loginId: form.loginId.trim() }, {
      onSuccess: (admin) => {
        setCreated(t(`एडमिन खाता बन गया। लॉगिन: ${admin.loginId} / ${form.pin}`, `Admin account created. Login: ${admin.loginId} / ${form.pin}`));
        setForm(EMPTY_ADMIN);
      },
      onError: (e) => setError(e instanceof ApiError && e.code === 'exists' ? t('यह यूज़र आईडी पहले से मौजूद है।', 'This user ID is already taken.') : errorText(e)),
    });
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
          <button type="submit" className="btn" style={tint('var(--purple)')} disabled={createAdmin.isPending}>
            <Icon name={createAdmin.isPending ? 'loading' : 'account-plus'} spin={createAdmin.isPending} />{t('एडमिन बनाएँ', 'Create admin')}
          </button>
          {created ? <div className="ok row" style={{ gap: 6 }}><Icon name="check-circle" />{created}</div> : null}
        </form>
        <div className="stack">
          {actionError ? <div className="error">{errorText(actionError)}</div> : null}
          <Loaded q={accounts}>
            {(list) => {
              const staff = [...list].sort((a, b) => (a.role === b.role ? a.createdAt - b.createdAt : a.role === 'superadmin' ? -1 : 1));
              return (
                <>
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
                            <button className="btn sm outline" style={tint(a.active ? 'var(--amber)' : 'var(--green)')} disabled={setActive.isPending} onClick={() => setActive.mutate({ id: a.id, active: !a.active })}>
                              <Icon name={a.active ? 'account-off-outline' : 'account-check-outline'} size={16} />{a.active ? t('निष्क्रिय करें', 'Deactivate') : t('सक्रिय करें', 'Activate')}
                            </button>
                            <button
                              className="btn sm outline" style={tint('var(--red)')} disabled={remove.isPending}
                              onClick={() => { if (window.confirm(t(`${a.name} का खाता हटाएँ?`, `Remove the account of ${a.name}?`))) remove.mutate(a.id); }}
                            >
                              <Icon name="delete-outline" size={16} />{t('हटाएँ', 'Remove')}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            }}
          </Loaded>
        </div>
      </div>
    </>
  );
}
