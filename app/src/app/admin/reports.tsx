import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Card, Screen, Txt } from '../../components/ui';
import { CATEGORIES, DEPARTMENTS, FLOW, STATUS, Status } from '../../data';
import { useVillageStats } from '../../stats';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row' }}>
        <Txt size={14} style={{ flex: 1 }}>{label}</Txt>
        <Txt w="b" size={14}>{value}</Txt>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' }}>
        <View style={{ width: `${max ? (value / max) * 100 : 0}%`, height: 8, borderRadius: 4, backgroundColor: color }} />
      </View>
    </View>
  );
}

export default function AdminReports() {
  const { t, tl } = useT();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const requests = useStore((s) => s.requests);
  const village = useVillageStats();
  const analytics = view === 'analytics';

  const open = (st: Status) => st !== 'resolved' && st !== 'rejected';
  const byDept = Object.entries(DEPARTMENTS)
    .map(([id, name]) => {
      const rows = requests.filter((r) => r.department === id);
      return { id, name, total: rows.length, pending: rows.filter((r) => open(r.status)).length, resolved: rows.filter((r) => r.status === 'resolved').length };
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

  if (!analytics) {
    return (
      <Screen back icon="file-chart-outline" title={t('विभागवार रिपोर्ट', 'Department-wise Report')} subtitle={t('इस ऐप में दर्ज आवेदन', 'Requests recorded in this app')}>
        <Card style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', backgroundColor: C.blueSoft, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Txt w="b" size={13} color={C.navy} style={{ flex: 1 }}>{t('विभाग', 'Department')}</Txt>
            {[t('कुल', 'Total'), t('लंबित', 'Pending'), t('हल', 'Resolved')].map((h) => (
              <Txt key={h} w="b" size={13} color={C.navy} style={{ width: 62, textAlign: 'right' }}>{h}</Txt>
            ))}
          </View>
          {byDept.map((d) => (
            <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border }}>
              <Txt w="m" size={14} style={{ flex: 1 }}>{tl(d.name)}</Txt>
              <Txt w="b" size={15} style={{ width: 62, textAlign: 'right' }}>{d.total}</Txt>
              <Txt w="b" size={15} color={C.amber} style={{ width: 62, textAlign: 'right' }}>{d.pending}</Txt>
              <Txt w="b" size={15} color={C.green} style={{ width: 62, textAlign: 'right' }}>{d.resolved}</Txt>
            </View>
          ))}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen back icon="chart-box-outline" title={t('रिपोर्ट & Analytics', 'Reports & Analytics')}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Txt w="xb" size={34} color={C.green}>{rate}%</Txt>
        <View style={{ flex: 1 }}>
          <Txt w="b" size={16}>{t('समाधान दर', 'Resolution rate')}</Txt>
          <Txt size={13} color={C.sub}>{t(`गाँव के कुल ${village.total} अनुरोधों में से ${village.resolved} निपटाए गए`, `${village.resolved} of ${village.total} village requests resolved`)}</Txt>
        </View>
      </Card>
      <Card style={{ gap: 10 }}>
        <Txt w="b" size={16} color={C.navy}>{t('स्थिति के अनुसार (इस ऐप में)', 'By status (in this app)')}</Txt>
        {byStatus.map(({ st, n }) => <Bar key={st} label={tl(STATUS[st].name)} value={n} max={maxStatus} color={STATUS[st].color} />)}
      </Card>
      <Card style={{ gap: 10 }}>
        <Txt w="b" size={16} color={C.navy}>{t('श्रेणी के अनुसार (इस ऐप में)', 'By category (in this app)')}</Txt>
        {byCategory.map(({ c, n }) => <Bar key={c.id} label={tl(c.name)} value={n} max={maxCat} color={c.color} />)}
        <Bar label={t('योजना आवेदन', 'Scheme applications')} value={applications} max={maxCat} color={C.navy} />
      </Card>
    </Screen>
  );
}
