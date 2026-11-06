import { CATEGORIES, DEPARTMENTS, FLOW, Request, STATUS, Status, isClosed } from '@shared/data';
import { View } from 'react-native';
import { useRequests, useVillageStats } from '../../api/hooks';
import { Card, Heading, Loaded, ProgressBar, Row, Screen, Txt } from '../../components/ui';
import { useT } from '../../store';
import { C } from '../../theme';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Row><Txt size={14} style={{ flex: 1 }}>{label}</Txt><Txt w="b" size={14}>{value}</Txt></Row>
      <ProgressBar pct={max ? (value / max) * 100 : 0} color={color} />
    </View>
  );
}

export default function AdminReports() {
  const { t } = useT();
  const requests = useRequests();
  const stats = useVillageStats();
  return (
    <Screen back icon="chart-box-outline" title={t('रिपोर्ट & Analytics', 'Reports & Analytics')}>
      <Loaded q={requests}>
        {(list) => <Loaded q={stats}>{(village) => <Reports requests={list} resolved={village.resolved} total={village.total} />}</Loaded>}
      </Loaded>
    </Screen>
  );
}

function Reports({ requests, resolved, total }: { requests: Request[]; resolved: number; total: number }) {
  const { t, tl } = useT();
  const byDept = Object.entries(DEPARTMENTS)
    .map(([id, name]) => {
      const rows = requests.filter((r) => r.department === id);
      return { id, name, total: rows.length, pending: rows.filter((r) => !isClosed(r)).length, resolved: rows.filter((r) => r.status === 'resolved').length };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);
  const statuses: Status[] = [...FLOW, 'rejected'];
  const byStatus = statuses.map((st) => ({ st, n: requests.filter((r) => r.status === st).length }));
  const byCategory = CATEGORIES.map((c) => ({ c, n: requests.filter((r) => r.categoryId === c.id).length })).filter((x) => x.n > 0);
  const applications = requests.filter((r) => r.kind === 'application').length;
  const maxStatus = Math.max(1, ...byStatus.map((x) => x.n));
  const maxCat = Math.max(1, applications, ...byCategory.map((x) => x.n));
  const rate = total ? Math.round((resolved / total) * 100) : 0;
  const cell = { width: 56, textAlign: 'right' as const };

  return (
    <>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Txt w="xb" size={34} color={C.green}>{rate}%</Txt>
        <View style={{ flex: 1 }}>
          <Txt w="b" size={16}>{t('समाधान दर', 'Resolution rate')}</Txt>
          <Txt size={13} color={C.sub}>{t(`गाँव के कुल ${total} अनुरोधों में से ${resolved} निपटाए गए`, `${resolved} of ${total} village requests resolved`)}</Txt>
        </View>
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading>{t('विभागवार रिपोर्ट', 'Department-wise Report')}</Heading>
        <Row style={{ paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Txt w="b" size={13} color={C.navy} style={{ flex: 1 }}>{t('विभाग', 'Department')}</Txt>
          <Txt w="b" size={13} color={C.navy} style={cell}>{t('कुल', 'Total')}</Txt>
          <Txt w="b" size={13} color={C.amber} style={cell}>{t('लंबित', 'Pending')}</Txt>
          <Txt w="b" size={13} color={C.green} style={cell}>{t('हल', 'Resolved')}</Txt>
        </Row>
        {byDept.map((d) => (
          <Row key={d.id} style={{ paddingVertical: 4 }}>
            <Txt size={14} style={{ flex: 1 }}>{tl(d.name)}</Txt>
            <Txt w="b" size={14} style={cell}>{d.total}</Txt>
            <Txt w="b" size={14} color={C.amber} style={cell}>{d.pending}</Txt>
            <Txt w="b" size={14} color={C.green} style={cell}>{d.resolved}</Txt>
          </Row>
        ))}
      </Card>

      <Card style={{ gap: 10 }}>
        <Heading>{t('स्थिति के अनुसार', 'By status')}</Heading>
        {byStatus.map(({ st, n }) => <Bar key={st} label={tl(STATUS[st].name)} value={n} max={maxStatus} color={STATUS[st].color} />)}
      </Card>

      <Card style={{ gap: 10 }}>
        <Heading>{t('श्रेणी के अनुसार', 'By category')}</Heading>
        {byCategory.map(({ c, n }) => <Bar key={c.id} label={tl(c.name)} value={n} max={maxCat} color={c.color} />)}
        <Bar label={t('योजना आवेदन', 'Scheme applications')} value={applications} max={maxCat} color={C.navy} />
      </Card>
    </>
  );
}
