import {
  DEPARTMENTS, EXPENSE_CATEGORIES, FUND_SOURCES, YOJNA_STATUS, YOJNA_STATUSES, Yojna, YojnaStatus, currentLevel, fmtDate, fmtRupees,
  fundReceived, yojnaTotals,
} from '@shared/data';
import { ReactNode, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useYojna, useYojnas } from '../api/hooks';
import { Badge, Bubble, Chips, Icon, Loaded, PageHead } from '../components/ui';
import { useT } from '../store';

// Village Yojnas, public: what each yojna is, where it stands in its approvals, the money received from
// each source and what it was spent on. The display pieces here are also used by the admin pages.

export function YojnaStatusBadge({ status }: { status: YojnaStatus }) {
  const { tl } = useT();
  const st = YOJNA_STATUS[status];
  return <Badge label={tl(st.name)} color={st.color} soft={st.soft} />;
}

const progressColor = (p: number) => (p >= 80 ? 'var(--green)' : 'var(--amber)');

/** Where a yojna stands: the level it waits on while Processing / On hold, or its progress once work has started. */
export function YojnaStage({ y }: { y: Yojna }) {
  const { t, tl } = useT();
  const at = currentLevel(y);
  if ((y.status === 'processing' || y.status === 'onhold') && at >= 0) {
    return (
      <div className="row small" style={{ gap: 6, color: YOJNA_STATUS[y.status].color, fontWeight: 600 }}>
        <Icon name="map-marker-radius-outline" size={17} />
        {t('अभी यहाँ', 'Now at')}: {tl(y.levels[at].name)} ({t(`स्तर ${at + 1} / ${y.levels.length}`, `level ${at + 1} of ${y.levels.length}`)})
      </div>
    );
  }
  if (y.status === 'active' || y.status === 'completed') {
    return (
      <div>
        <div className="row small sub" style={{ gap: 6 }}><span className="grow">{t('कार्य प्रगति', 'Work done')}</span><b style={{ color: progressColor(y.progress) }}>{y.progress}%</b></div>
        <div className="bar"><div style={{ width: `${y.progress}%`, background: progressColor(y.progress) }} /></div>
      </div>
    );
  }
  return null;
}

/** A yojna in a list: links to its page. */
export function YojnaCard({ y, to }: { y: Yojna; to: string }) {
  const { t, tl } = useT();
  const st = YOJNA_STATUS[y.status];
  const money = yojnaTotals(y);
  return (
    <Link to={to} className="card stack" style={{ gap: 8 }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Bubble v={st} size={42} />
        <div className="grow">
          <b style={{ fontSize: 17 }}>{tl(y.name)}</b>
          <div className="tiny sub">{tl(DEPARTMENTS[y.dept] ?? DEPARTMENTS.panchayat)}</div>
        </div>
        <YojnaStatusBadge status={y.status} />
      </div>
      <YojnaStage y={y} />
      <div className="row wrap small sub" style={{ gap: 14 }}>
        <span>{t('स्वीकृत', 'Sanctioned')}: <b style={{ color: 'var(--text)' }}>{fmtRupees(money.sanctioned)}</b></span>
        <span>{t('प्राप्त', 'Received')}: <b style={{ color: 'var(--blue)' }}>{fmtRupees(money.received)}</b></span>
        <span>{t('खर्च', 'Spent')}: <b style={{ color: 'var(--orange)' }}>{fmtRupees(money.spent)}</b></span>
      </div>
    </Link>
  );
}

function Figure({ label, value, color, hint }: { label: string; value: number; color: string; hint?: string }) {
  return (
    <div>
      <div className="small sub">{label}</div>
      <b style={{ fontSize: 22, color }}>{fmtRupees(value)}</b>
      {hint ? <div className="tiny sub">{hint}</div> : null}
    </div>
  );
}

/** Sanctioned → received → spent → balance, with a bar of how much of the money received has been spent. */
export function MoneySummary({ y }: { y: Pick<Yojna, 'funds' | 'expenses'> }) {
  const { t } = useT();
  const m = yojnaTotals(y);
  const used = m.received ? Math.min(100, Math.round((m.spent / m.received) * 100)) : 0;
  return (
    <div className="card stack">
      <h3>{t('पैसों का हिसाब', 'Money')}</h3>
      <div className="grid g4">
        <Figure label={t('कुल स्वीकृत राशि', 'Total sanctioned')} value={m.sanctioned} color="var(--navy)" />
        <Figure label={t('अब तक प्राप्त', 'Received so far')} value={m.received} color="var(--blue)" hint={m.sanctioned > m.received ? t(`${fmtRupees(m.sanctioned - m.received)} आना बाकी`, `${fmtRupees(m.sanctioned - m.received)} still to come`) : undefined} />
        <Figure label={t('खर्च', 'Spent')} value={m.spent} color="var(--orange)" />
        <Figure label={t('शेष राशि', 'Balance')} value={m.balance} color={m.balance < 0 ? 'var(--red)' : 'var(--green)'} />
      </div>
      {m.received ? (
        <div>
          <div className="bar"><div style={{ width: `${used}%`, background: 'var(--orange)' }} /></div>
          <div className="tiny sub">{t(`प्राप्त राशि का ${used}% खर्च हुआ`, `${used}% of the money received has been spent`)}</div>
        </div>
      ) : null}
      {m.balance < 0 ? (
        <div className="small" style={{ color: 'var(--red)' }}>{t('खर्च, प्राप्त राशि से अधिक है।', 'More has been spent than received.')}</div>
      ) : null}
    </div>
  );
}

/** The approval levels in order: approved (with the date), the one it waits on, and those still ahead. */
export function ApprovalSteps({ y }: { y: Yojna }) {
  const { t, tl } = useT();
  const at = currentLevel(y);
  const waiting = y.status === 'processing' || y.status === 'onhold';
  return (
    <div className="card">
      <h3 style={{ marginBottom: 12 }}>{t('स्वीकृति के स्तर', 'Approval levels')}</h3>
      {y.levels.length === 0 ? <p className="sub small">{t('कोई स्तर तय नहीं किया गया।', 'No approval levels set.')}</p> : y.levels.map((lv, i) => {
        const done = !!lv.approvedAt;
        const here = waiting && i === at;
        const color = done ? 'var(--green)' : here ? YOJNA_STATUS[y.status].color : 'var(--faint)';
        return (
          <div className="tl" key={i}>
            <div className="tl-rail">
              <div className="tl-dot" style={done || here ? { background: color, borderColor: color, color: '#fff' } : undefined}>
                {done ? <Icon name="check" size={17} /> : here ? <Icon name={y.status === 'onhold' ? 'pause' : 'clock-outline'} size={16} /> : i + 1}
              </div>
              {i < y.levels.length - 1 ? <div className="tl-line" style={done ? { background: 'var(--green)' } : undefined} /> : null}
            </div>
            <div className="tl-body" style={done || here ? undefined : { color: 'var(--faint)' }}>
              <b>{tl(lv.name)}</b>
              <div className="small" style={{ color: done ? 'var(--green)' : here ? color : 'var(--faint)' }}>
                {done ? `${t('स्वीकृत', 'Approved')} • ${fmtDate(lv.approvedAt!)}` : here ? (y.status === 'onhold' ? t('यहाँ रुकी है', 'On hold here') : t('यहाँ स्वीकृति लंबित', 'Awaiting approval here')) : t('आगे', 'Ahead')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Each fund with its instalments. `actions` lets the admin page add its buttons to a fund. */
export function FundsList({ y, actions, instalmentAction }: {
  y: Yojna; actions?: (fundId: string) => ReactNode; instalmentAction?: (fundId: string, instalmentId: string) => ReactNode;
}) {
  const { t, tl } = useT();
  if (y.funds.length === 0) return <p className="sub small">{t('अभी कोई राशि स्वीकृत नहीं।', 'No funds sanctioned yet.')}</p>;
  return (
    <div className="stack">
      {y.funds.map((f) => {
        const received = fundReceived(f);
        const pct = f.sanctioned ? Math.round((received / f.sanctioned) * 100) : 0;
        return (
          <div key={f.id} className="stack" style={{ gap: 6, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <div className="row wrap" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <b>{tl(FUND_SOURCES[f.source] ?? FUND_SOURCES.other)}</b>
                {f.note ? <div className="small sub">{f.note}</div> : null}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="small sub">{t('स्वीकृत', 'Sanctioned')} <b style={{ color: 'var(--text)' }}>{fmtRupees(f.sanctioned)}</b></div>
                <div className="small sub">{t('प्राप्त', 'Received')} <b style={{ color: 'var(--blue)' }}>{fmtRupees(received)}</b> ({pct}%)</div>
              </div>
            </div>
            <div className="bar"><div style={{ width: `${Math.min(100, pct)}%`, background: 'var(--blue)' }} /></div>
            {f.instalments.length ? (
              <div className="stack" style={{ gap: 4 }}>
                {f.instalments.map((i, n) => (
                  <div key={i.id} className="row small" style={{ gap: 8 }}>
                    <Icon name="bank-transfer-in" size={17} color="var(--blue)" />
                    <span className="grow">{t(`किस्त ${n + 1}`, `Instalment ${n + 1}`)} • {fmtDate(i.date)}{i.note ? ` • ${i.note}` : ''}</span>
                    <b>{fmtRupees(i.amount)}</b>
                    {instalmentAction?.(f.id, i.id)}
                  </div>
                ))}
              </div>
            ) : <div className="tiny sub">{t('अभी कोई किस्त प्राप्त नहीं हुई', 'No instalment received yet')}</div>}
            {actions?.(f.id)}
          </div>
        );
      })}
    </div>
  );
}

/** Spending by category, largest first. */
function SpendByCategory({ y }: { y: Yojna }) {
  const { tl } = useT();
  const { spent } = yojnaTotals(y);
  const byCategory = Object.entries(
    y.expenses.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e.amount }), {}),
  ).sort((a, b) => b[1] - a[1]);
  if (!spent) return null;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="total-bar">
        {byCategory.map(([c, amount]) => <div key={c} style={{ flex: amount, background: (EXPENSE_CATEGORIES[c] ?? EXPENSE_CATEGORIES.other).color }} />)}
      </div>
      <div className="row wrap small" style={{ gap: 14 }}>
        {byCategory.map(([c, amount]) => {
          const cat = EXPENSE_CATEGORIES[c] ?? EXPENSE_CATEGORIES.other;
          return (
            <span key={c} className="row" style={{ gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color }} />
              {tl(cat.name)} <b>{fmtRupees(amount)}</b> <span className="sub">({Math.round((amount / spent) * 100)}%)</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Every expense, newest first, with its bill when there is one. `actions` adds the admin buttons to a row. */
export function ExpensesTable({ y, actions }: { y: Yojna; actions?: (expenseId: string) => ReactNode }) {
  const { t, tl } = useT();
  if (y.expenses.length === 0) return <p className="sub small">{t('अभी कोई खर्च दर्ज नहीं।', 'No expenses recorded yet.')}</p>;
  const sources = Object.fromEntries(y.funds.map((f) => [f.id, tl(FUND_SOURCES[f.source] ?? FUND_SOURCES.other)]));
  const list = [...y.expenses].sort((a, b) => b.date - a.date);
  return (
    <div className="stack">
      <SpendByCategory y={y} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('तारीख', 'Date')}</th><th>{t('किस पर खर्च', 'Spent on')}</th><th>{t('श्रेणी', 'Category')}</th>
              <th>{t('किस निधि से', 'Paid from')}</th><th style={{ textAlign: 'right' }}>{t('राशि', 'Amount')}</th><th>{t('बिल', 'Bill')}</th>
              {actions ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {list.map((e) => {
              const cat = EXPENSE_CATEGORIES[e.category] ?? EXPENSE_CATEGORIES.other;
              return (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                  <td>{e.purpose}</td>
                  <td><Badge label={tl(cat.name)} color={cat.color} soft={cat.soft} /></td>
                  <td className="small">{e.fundId ? sources[e.fundId] ?? '–' : '–'}</td>
                  <td className="num-cell" style={{ whiteSpace: 'nowrap' }}>{fmtRupees(e.amount)}</td>
                  <td>
                    {e.bill ? (
                      <a href={e.bill} target="_blank" rel="noreferrer" className="row small" style={{ gap: 4, color: 'var(--blue)', fontWeight: 600 }}>
                        <Icon name="receipt-text-outline" size={17} />{t('देखें', 'View')}
                      </a>
                    ) : <span className="sub">–</span>}
                  </td>
                  {actions ? <td style={{ whiteSpace: 'nowrap' }}>{actions(e.id)}</td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Name, status (with its note), department and description. */
export function YojnaHeader({ y }: { y: Yojna }) {
  const { t, tl } = useT();
  const st = YOJNA_STATUS[y.status];
  return (
    <div className="card stack" style={{ gap: 10 }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Bubble v={st} size={50} />
        <div className="grow">
          <h2 style={{ fontSize: 22 }}>{tl(y.name)}</h2>
          <div className="tiny sub">{tl(DEPARTMENTS[y.dept] ?? DEPARTMENTS.panchayat)} • {t('अपडेट', 'Updated')} {fmtDate(y.updatedAt)}</div>
        </div>
        <YojnaStatusBadge status={y.status} />
      </div>
      {y.desc.hi ? <p>{tl(y.desc)}</p> : null}
      <div className="small sub">{tl(st.hint)}</div>
      {y.statusNote ? <div className="tl-note" style={{ borderLeft: `3px solid ${st.color}` }}>{y.statusNote}</div> : null}
      <YojnaStage y={y} />
    </div>
  );
}

/** The full public view of one yojna (also shown on the admin page above its editors). */
export function YojnaDetails({ y }: { y: Yojna }) {
  const { t } = useT();
  return (
    <div className="stack" style={{ gap: 16 }}>
      <YojnaHeader y={y} />
      <MoneySummary y={y} />
      <div className="split">
        <div className="card stack"><h3>{t('राशि के स्रोत और किस्तें', 'Funds and instalments')}</h3><FundsList y={y} /></div>
        <ApprovalSteps y={y} />
      </div>
      <div className="card stack"><h3>{t('खर्च का ब्योरा', 'Expenses')}</h3><ExpensesTable y={y} /></div>
    </div>
  );
}

type Filter = 'all' | YojnaStatus;

/** All yojnas with a status filter; used by the public page and the Village Dashboard. */
export function YojnaList({ list, linkTo }: { list: Yojna[]; linkTo: (id: string) => string }) {
  const { t, tl } = useT();
  const [filter, setFilter] = useState<Filter>('all');
  if (list.length === 0) return <p className="sub">{t('अभी कोई योजना दर्ज नहीं', 'No yojnas yet')}</p>;
  const shown = filter === 'all' ? list : list.filter((y) => y.status === filter);
  const options: { id: Filter; label: string }[] = [
    { id: 'all', label: `${t('सभी', 'All')} (${list.length})` },
    ...YOJNA_STATUSES.map((s) => ({ id: s, label: `${tl(YOJNA_STATUS[s].name)} (${list.filter((y) => y.status === s).length})` })),
  ];
  return (
    <div className="stack">
      <Chips value={filter} options={options} onChange={setFilter} />
      {shown.length === 0 ? <p className="sub">{t('इस स्थिति में कोई योजना नहीं', 'No yojnas with this status')}</p> : (
        <div className="grid g2 collapse">{shown.map((y) => <YojnaCard key={y.id} y={y} to={linkTo(y.id)} />)}</div>
      )}
    </div>
  );
}

/** Money across all yojnas. */
export function YojnaTotals({ list }: { list: Yojna[] }) {
  const { t } = useT();
  const m = yojnaTotals({ funds: list.flatMap((y) => y.funds), expenses: list.flatMap((y) => y.expenses) });
  return (
    <div className="card grid g4">
      <div><div className="small sub">{t('कुल योजनाएँ', 'Yojnas')}</div><b style={{ fontSize: 22, color: 'var(--navy)' }}>{list.length}</b></div>
      <Figure label={t('कुल स्वीकृत', 'Total sanctioned')} value={m.sanctioned} color="var(--navy)" />
      <Figure label={t('कुल प्राप्त', 'Total received')} value={m.received} color="var(--blue)" />
      <Figure label={t('कुल खर्च', 'Total spent')} value={m.spent} color="var(--orange)" />
    </div>
  );
}

export function Yojnas() {
  const { t } = useT();
  const yojnas = useYojnas();
  return (
    <div className="container page">
      <PageHead
        icon="hammer-wrench" color="var(--orange)" title={t('ग्राम विकास योजनाएँ', 'Village Yojnas')}
        subtitle={t('गाँव के विकास कार्य: स्थिति, स्वीकृति, प्राप्त राशि और खर्च – सबके लिए खुला', 'Village development works: status, approvals, money received and spent – open to everyone')}
      />
      <Loaded q={yojnas}>
        {(list) => (
          <div className="stack" style={{ gap: 16 }}>
            {list.length ? <YojnaTotals list={list} /> : null}
            <YojnaList list={list} linkTo={(id) => `/yojnas/${id}`} />
          </div>
        )}
      </Loaded>
    </div>
  );
}

export function YojnaPage() {
  const { t } = useT();
  const { id = '' } = useParams();
  const yojna = useYojna(id);
  return (
    <div className="container page">
      <Link to="/yojnas" className="row small" style={{ gap: 4, color: 'var(--blue)', fontWeight: 600, marginBottom: 12 }}>
        <Icon name="arrow-left" size={18} />{t('सभी योजनाएँ', 'All yojnas')}
      </Link>
      <Loaded q={yojna} notFound={t('यह योजना नहीं मिली।', 'This yojna was not found.')}>{(y) => <YojnaDetails y={y} />}</Loaded>
    </div>
  );
}
