import {
  DEPARTMENTS, EXPENSE_CATEGORIES, FUND_SOURCES, YOJNA_STATUS, YOJNA_STATUSES, Yojna, YojnaStatus, currentLevel, fmtDate, fmtRupees,
  fundReceived, yojnaTotals,
} from '@shared/data';
import { ReactNode, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useT } from '../store';
import { C } from '../theme';
import { PhotoViewer } from './RequestDetail';
import { Badge, Bubble, Card, Chips, Grid, Ico, ProgressBar, Row, StackedBar, Txt } from './ui';

// Village Yojnas, public: what each yojna is, where it stands in its approvals, the money received from each
// source and what it was spent on. The same pieces as the website's pages/Yojnas.tsx; the admin screens add
// their buttons through the `actions` props.

export function YojnaStatusBadge({ status }: { status: YojnaStatus }) {
  const { tl } = useT();
  const st = YOJNA_STATUS[status];
  return <Badge label={tl(st.name)} color={st.color} soft={st.soft} />;
}

const progressColor = (p: number) => (p >= 80 ? C.green : C.amber);

/** Where a yojna stands: the level it waits on while Processing / On hold, or its progress once work has started. */
export function YojnaStage({ y }: { y: Yojna }) {
  const { t, tl } = useT();
  const at = currentLevel(y);
  if ((y.status === 'processing' || y.status === 'onhold') && at >= 0) {
    return (
      <Row gap={6} style={{ alignItems: 'flex-start' }}>
        <Ico name="map-marker-radius-outline" size={17} color={YOJNA_STATUS[y.status].color} />
        <Txt w="sb" size={14} color={YOJNA_STATUS[y.status].color} style={{ flex: 1 }}>
          {t('अभी यहाँ', 'Now at')}: {tl(y.levels[at].name)} ({t(`स्तर ${at + 1} / ${y.levels.length}`, `level ${at + 1} of ${y.levels.length}`)})
        </Txt>
      </Row>
    );
  }
  if (y.status === 'active' || y.status === 'completed') {
    return (
      <View style={{ gap: 4 }}>
        <Row><Txt size={13} color={C.sub} style={{ flex: 1 }}>{t('कार्य प्रगति', 'Work done')}</Txt><Txt w="b" size={14} color={progressColor(y.progress)}>{y.progress}%</Txt></Row>
        <ProgressBar pct={y.progress} color={progressColor(y.progress)} />
      </View>
    );
  }
  return null;
}

function Money({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View>
      <Txt size={12} color={C.sub}>{label}</Txt>
      <Txt w="b" size={14} color={color}>{fmtRupees(value)}</Txt>
    </View>
  );
}

/** A yojna in a list. */
export function YojnaCard({ y, onPress }: { y: Yojna; onPress: () => void }) {
  const { t, tl } = useT();
  const st = YOJNA_STATUS[y.status];
  const money = yojnaTotals(y);
  return (
    <Card onPress={onPress} style={{ gap: 8 }}>
      <Row style={{ alignItems: 'flex-start' }} gap={10}>
        <Bubble v={st} size={42} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={16}>{tl(y.name)}</Txt>
          <Txt size={12} color={C.sub}>{tl(DEPARTMENTS[y.dept] ?? DEPARTMENTS.panchayat)}</Txt>
        </View>
        <YojnaStatusBadge status={y.status} />
      </Row>
      <YojnaStage y={y} />
      <Row gap={16} wrap>
        <Money label={t('स्वीकृत', 'Sanctioned')} value={money.sanctioned} color={C.text} />
        <Money label={t('प्राप्त', 'Received')} value={money.received} color={C.blue} />
        <Money label={t('खर्च', 'Spent')} value={money.spent} color={C.orange} />
      </Row>
    </Card>
  );
}

function Figure({ label, value, color, hint }: { label: string; value: number; color: string; hint?: string }) {
  return (
    <View>
      <Txt size={13} color={C.sub}>{label}</Txt>
      <Txt w="b" size={18} color={color}>{fmtRupees(value)}</Txt>
      {hint ? <Txt size={12} color={C.sub}>{hint}</Txt> : null}
    </View>
  );
}

/** Sanctioned → received → spent → balance, with a bar of how much of the money received has been spent. */
export function MoneySummary({ y }: { y: Pick<Yojna, 'funds' | 'expenses'> }) {
  const { t } = useT();
  const m = yojnaTotals(y);
  const used = m.received ? Math.min(100, Math.round((m.spent / m.received) * 100)) : 0;
  return (
    <Card style={{ gap: 10 }}>
      <Txt w="b" size={16} color={C.navy}>{t('पैसों का हिसाब', 'Money')}</Txt>
      <Grid cols={2}>
        {[
          <Figure key="s" label={t('कुल स्वीकृत राशि', 'Total sanctioned')} value={m.sanctioned} color={C.navy} />,
          <Figure
            key="r" label={t('अब तक प्राप्त', 'Received so far')} value={m.received} color={C.blue}
            hint={m.sanctioned > m.received ? t(`${fmtRupees(m.sanctioned - m.received)} आना बाकी`, `${fmtRupees(m.sanctioned - m.received)} still to come`) : undefined}
          />,
          <Figure key="e" label={t('खर्च', 'Spent')} value={m.spent} color={C.orange} />,
          <Figure key="b" label={t('शेष राशि', 'Balance')} value={m.balance} color={m.balance < 0 ? C.red : C.green} />,
        ]}
      </Grid>
      {m.received ? (
        <View style={{ gap: 4 }}>
          <ProgressBar pct={used} color={C.orange} />
          <Txt size={12} color={C.sub}>{t(`प्राप्त राशि का ${used}% खर्च हुआ`, `${used}% of the money received has been spent`)}</Txt>
        </View>
      ) : null}
      {m.balance < 0 ? <Txt size={13} color={C.red}>{t('खर्च, प्राप्त राशि से अधिक है।', 'More has been spent than received.')}</Txt> : null}
    </Card>
  );
}

/** The approval levels in order: approved (with the date), the one it waits on, and those still ahead. */
export function ApprovalSteps({ y }: { y: Yojna }) {
  const { t, tl } = useT();
  const at = currentLevel(y);
  const waiting = y.status === 'processing' || y.status === 'onhold';
  return (
    <Card>
      <Txt w="b" size={16} color={C.navy} style={{ marginBottom: 8 }}>{t('स्वीकृति के स्तर', 'Approval levels')}</Txt>
      {y.levels.length === 0 ? <Txt size={14} color={C.sub}>{t('कोई स्तर तय नहीं किया गया।', 'No approval levels set.')}</Txt> : y.levels.map((lv, i) => {
        const done = !!lv.approvedAt;
        const here = waiting && i === at;
        const color = done ? C.green : here ? YOJNA_STATUS[y.status].color : C.faint;
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 26 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: done || here ? color : C.card, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Ico name="check" size={16} color="#FFFFFF" /> : here ? <Ico name={y.status === 'onhold' ? 'pause' : 'clock-outline'} size={15} color="#FFFFFF" /> : <Txt w="b" size={12} color={C.faint}>{i + 1}</Txt>}
              </View>
              {i < y.levels.length - 1 ? <View style={{ flex: 1, width: 2, minHeight: 16, backgroundColor: done ? C.green : C.border }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 12 }}>
              <Txt w="sb" size={15} color={done || here ? C.text : C.faint}>{tl(lv.name)}</Txt>
              <Txt size={13} color={done ? C.green : here ? color : C.faint}>
                {done ? `${t('स्वीकृत', 'Approved')} • ${fmtDate(lv.approvedAt!)}` : here ? (y.status === 'onhold' ? t('यहाँ रुकी है', 'On hold here') : t('यहाँ स्वीकृति लंबित', 'Awaiting approval here')) : t('आगे', 'Ahead')}
              </Txt>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

/** Each fund with its instalments. `actions` lets the admin screen add its buttons to a fund. */
export function FundsList({ y, actions, instalmentAction }: {
  y: Yojna; actions?: (fundId: string) => ReactNode; instalmentAction?: (fundId: string, instalmentId: string) => ReactNode;
}) {
  const { t, tl } = useT();
  if (y.funds.length === 0) return <Txt size={14} color={C.sub}>{t('अभी कोई राशि स्वीकृत नहीं।', 'No funds sanctioned yet.')}</Txt>;
  return (
    <View style={{ gap: 12 }}>
      {y.funds.map((f, n) => {
        const received = fundReceived(f);
        const pct = f.sanctioned ? Math.round((received / f.sanctioned) * 100) : 0;
        return (
          <View key={f.id} style={{ gap: 6, paddingBottom: 12, borderBottomWidth: n < y.funds.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
            <Txt w="b" size={15}>{tl(FUND_SOURCES[f.source] ?? FUND_SOURCES.other)}</Txt>
            {f.note ? <Txt size={13} color={C.sub}>{f.note}</Txt> : null}
            <Row gap={16} wrap>
              <Money label={t('स्वीकृत', 'Sanctioned')} value={f.sanctioned} color={C.text} />
              <View>
                <Txt size={12} color={C.sub}>{t('प्राप्त', 'Received')}</Txt>
                <Txt w="b" size={14} color={C.blue}>{fmtRupees(received)} <Txt size={12} color={C.sub}>({pct}%)</Txt></Txt>
              </View>
            </Row>
            <ProgressBar pct={pct} color={C.blue} />
            {f.instalments.length ? (
              <View style={{ gap: 4 }}>
                {f.instalments.map((i, k) => (
                  <Row key={i.id} gap={8}>
                    <Ico name="bank-transfer-in" size={17} color={C.blue} />
                    <Txt size={13} style={{ flex: 1 }}>{t(`किस्त ${k + 1}`, `Instalment ${k + 1}`)} • {fmtDate(i.date)}{i.note ? ` • ${i.note}` : ''}</Txt>
                    <Txt w="b" size={13}>{fmtRupees(i.amount)}</Txt>
                    {instalmentAction?.(f.id, i.id)}
                  </Row>
                ))}
              </View>
            ) : <Txt size={12} color={C.sub}>{t('अभी कोई किस्त प्राप्त नहीं हुई', 'No instalment received yet')}</Txt>}
            {actions?.(f.id)}
          </View>
        );
      })}
    </View>
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
    <View style={{ gap: 8 }}>
      <StackedBar parts={byCategory.map(([c, value]) => ({ value, color: (EXPENSE_CATEGORIES[c] ?? EXPENSE_CATEGORIES.other).color }))} />
      <View style={{ gap: 4 }}>
        {byCategory.map(([c, amount]) => {
          const cat = EXPENSE_CATEGORIES[c] ?? EXPENSE_CATEGORIES.other;
          return (
            <Row key={c} gap={6}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: cat.color }} />
              <Txt size={13} style={{ flex: 1 }}>{tl(cat.name)}</Txt>
              <Txt w="b" size={13}>{fmtRupees(amount)}</Txt>
              <Txt size={12} color={C.sub}>({Math.round((amount / spent) * 100)}%)</Txt>
            </Row>
          );
        })}
      </View>
    </View>
  );
}

/** Every expense, newest first, with its bill when there is one. `actions` adds the admin buttons to an expense. */
export function ExpensesList({ y, actions }: { y: Yojna; actions?: (expenseId: string) => ReactNode }) {
  const { t, tl } = useT();
  const [bill, setBill] = useState<string>();
  if (y.expenses.length === 0) return <Txt size={14} color={C.sub}>{t('अभी कोई खर्च दर्ज नहीं।', 'No expenses recorded yet.')}</Txt>;
  const sources = Object.fromEntries(y.funds.map((f) => [f.id, tl(FUND_SOURCES[f.source] ?? FUND_SOURCES.other)]));
  const list = [...y.expenses].sort((a, b) => b.date - a.date);
  return (
    <View style={{ gap: 12 }}>
      <SpendByCategory y={y} />
      {list.map((e) => {
        const cat = EXPENSE_CATEGORIES[e.category] ?? EXPENSE_CATEGORIES.other;
        return (
          <View key={e.id} style={{ flexDirection: 'row', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
            <Bubble v={cat} size={36} />
            <View style={{ flex: 1, gap: 3 }}>
              <Row style={{ alignItems: 'flex-start' }}>
                <Txt w="sb" size={14} style={{ flex: 1 }}>{e.purpose}</Txt>
                <Txt w="b" size={14} color={C.orange}>{fmtRupees(e.amount)}</Txt>
              </Row>
              <Txt size={12} color={C.sub}>
                {fmtDate(e.date)} • {tl(cat.name)}{e.fundId && sources[e.fundId] ? ` • ${t('निधि', 'Fund')}: ${sources[e.fundId]}` : ''}
              </Txt>
              {e.bill ? (
                <Pressable onPress={() => setBill(e.bill)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Image source={{ uri: e.bill }} style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: C.bg }} />
                  <Ico name="receipt-text-outline" size={17} color={C.blue} />
                  <Txt w="sb" size={13} color={C.blue}>{t('बिल देखें', 'View bill')}</Txt>
                </Pressable>
              ) : null}
              {actions?.(e.id)}
            </View>
          </View>
        );
      })}
      {bill ? <PhotoViewer uri={bill} visible onClose={() => setBill(undefined)} /> : null}
    </View>
  );
}

/** Name, status (with its note), department and description. */
export function YojnaHeader({ y }: { y: Yojna }) {
  const { t, tl } = useT();
  const st = YOJNA_STATUS[y.status];
  return (
    <Card style={{ gap: 10 }}>
      <Row style={{ alignItems: 'flex-start' }} gap={10}>
        <Bubble v={st} size={48} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={18}>{tl(y.name)}</Txt>
          <Txt size={12} color={C.sub}>{tl(DEPARTMENTS[y.dept] ?? DEPARTMENTS.panchayat)} • {t('अपडेट', 'Updated')} {fmtDate(y.updatedAt)}</Txt>
        </View>
        <YojnaStatusBadge status={y.status} />
      </Row>
      {y.desc.hi ? <Txt>{tl(y.desc)}</Txt> : null}
      <Txt size={13} color={C.sub}>{tl(st.hint)}</Txt>
      {y.statusNote ? (
        <View style={{ backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: st.color, borderRadius: 6, padding: 8 }}>
          <Txt size={14}>{y.statusNote}</Txt>
        </View>
      ) : null}
      <YojnaStage y={y} />
    </Card>
  );
}

/** The full public view of one yojna. */
export function YojnaDetails({ y }: { y: Yojna }) {
  const { t } = useT();
  return (
    <>
      <YojnaHeader y={y} />
      <MoneySummary y={y} />
      <ApprovalSteps y={y} />
      <Card style={{ gap: 10 }}><Txt w="b" size={16} color={C.navy}>{t('राशि के स्रोत और किस्तें', 'Funds and instalments')}</Txt><FundsList y={y} /></Card>
      <Card style={{ gap: 10 }}><Txt w="b" size={16} color={C.navy}>{t('खर्च का ब्योरा', 'Expenses')}</Txt><ExpensesList y={y} /></Card>
    </>
  );
}

type Filter = 'all' | YojnaStatus;

/** All yojnas with a status filter. */
export function YojnaList({ list, onOpen }: { list: Yojna[]; onOpen: (id: string) => void }) {
  const { t, tl } = useT();
  const [filter, setFilter] = useState<Filter>('all');
  if (list.length === 0) return <Txt color={C.sub}>{t('अभी कोई योजना दर्ज नहीं', 'No yojnas yet')}</Txt>;
  const shown = filter === 'all' ? list : list.filter((y) => y.status === filter);
  const options: { id: Filter; label: string }[] = [
    { id: 'all', label: `${t('सभी', 'All')} (${list.length})` },
    ...YOJNA_STATUSES.map((s) => ({ id: s, label: `${tl(YOJNA_STATUS[s].name)} (${list.filter((y) => y.status === s).length})` })),
  ];
  return (
    <>
      <Chips value={filter} options={options} onChange={setFilter} />
      {shown.length === 0 ? <Txt color={C.sub}>{t('इस स्थिति में कोई योजना नहीं', 'No yojnas with this status')}</Txt> : shown.map((y) => <YojnaCard key={y.id} y={y} onPress={() => onOpen(y.id)} />)}
    </>
  );
}

/** Money across all yojnas. */
export function YojnaTotals({ list }: { list: Yojna[] }) {
  const { t } = useT();
  const m = yojnaTotals({ funds: list.flatMap((y) => y.funds), expenses: list.flatMap((y) => y.expenses) });
  return (
    <Card>
      <Grid cols={2}>
        {[
          <View key="n"><Txt size={13} color={C.sub}>{t('कुल योजनाएँ', 'Yojnas')}</Txt><Txt w="b" size={18} color={C.navy}>{list.length}</Txt></View>,
          <Figure key="s" label={t('कुल स्वीकृत', 'Total sanctioned')} value={m.sanctioned} color={C.navy} />,
          <Figure key="r" label={t('कुल प्राप्त', 'Total received')} value={m.received} color={C.blue} />,
          <Figure key="e" label={t('कुल खर्च', 'Total spent')} value={m.spent} color={C.orange} />,
        ]}
      </Grid>
    </Card>
  );
}
