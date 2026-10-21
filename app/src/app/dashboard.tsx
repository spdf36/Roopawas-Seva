import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { View } from 'react-native';
import { Card, Grid, Screen, Txt } from '../components/ui';
import { Icon } from '../data';
import { useVillageStats } from '../stats';
import { useT } from '../store';
import { C } from '../theme';

export default function Dashboard() {
  const { t } = useT();
  const st = useVillageStats();

  const tiles: { icon: Icon; color: string; label: string; value: string; unit: string }[] = [
    { icon: 'road-variant', color: C.green, label: t('सड़कें', 'Roads'), value: String(st.roads), unit: t('अनुरोध', 'requests') },
    { icon: 'water', color: C.blue, label: t('पेयजल', 'Drinking Water'), value: String(st.water), unit: t('अनुरोध', 'requests') },
    { icon: 'lightbulb-on-outline', color: C.green, label: t('स्ट्रीट लाइट', 'Street Lights'), value: String(st.lightsFixed), unit: t('हल', 'fixed') },
    { icon: 'trash-can-outline', color: C.green, label: t('स्वच्छता', 'Sanitation'), value: '✓', unit: t('नियमित', 'regular') },
    { icon: 'school-outline', color: C.green, label: t('स्कूल', 'School'), value: String(st.schoolWorks), unit: t('सुधार कार्य', 'repair works') },
    { icon: 'tree', color: C.green, label: t('पेड़ / पौधारोपण', 'Tree Plantation'), value: String(st.trees), unit: t('पेड़', 'trees') },
  ];

  const total = (label: string, value: number) => (
    <View style={{ flex: 1 }}>
      <Txt size={12} color={C.sub}>{label}</Txt>
      <Txt w="b" size={19} color={C.green}>{value}</Txt>
    </View>
  );

  return (
    <Screen back icon="home-city-outline" iconColor={C.green} title={t('गाँव की प्रगति', 'Village Dashboard')} subtitle={t('रूपावास – गाँव की प्रगति (सार्वजनिक)', 'Roopawas – village progress (public view)')}>
      <Grid cols={3} gap={8}>
        {tiles.map((x) => (
          <Card key={x.label} style={{ alignItems: 'center', paddingHorizontal: 4, minHeight: 112, justifyContent: 'center' }}>
            <MCI name={x.icon} size={28} color={x.color} />
            <Txt w="b" size={14} center numberOfLines={1}>{x.label}</Txt>
            <Txt size={13} color={C.sub} center>
              <Txt w="b" size={16} color={C.green}>{x.value}</Txt> {x.unit}
            </Txt>
          </Card>
        ))}
      </Grid>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <MCI name="account-group" size={32} color={C.green} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={16}>{t('सरकारी योजनाएँ', 'Government Schemes')}</Txt>
          <Txt size={14} color={C.sub}>
            <Txt w="b" size={17} color={C.green}>{st.schemeApplications}</Txt> {t('आवेदन सहायता', 'applications assisted')}
          </Txt>
        </View>
      </Card>

      <Card style={{ gap: 6 }}>
        <Txt w="b" size={15} color={C.navy}>{t('कुल अनुरोध', 'Total Requests')}</Txt>
        <Txt w="xb" size={30} color={C.navy}>{st.total}</Txt>
        <View style={{ height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', backgroundColor: C.border }}>
          <View style={{ flex: st.resolved, backgroundColor: C.green }} />
          <View style={{ flex: st.inProgress, backgroundColor: C.amber }} />
          <View style={{ flex: st.forwarded, backgroundColor: C.orange }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {total(t('निपटाए गए', 'Resolved'), st.resolved)}
          {total(t('प्रगति पर', 'In progress'), st.inProgress)}
          {total(t('विभाग को भेजे', 'Sent to dept'), st.forwarded)}
        </View>
      </Card>
    </Screen>
  );
}
