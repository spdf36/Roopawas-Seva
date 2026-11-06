import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useVillageStats, useYojnas } from '../api/hooks';
import { YojnaCard, YojnaTotals } from '../components/Yojna';
import { Btn, Card, Grid, Heading, Ico, IconName, Loaded, Screen, StackedBar, Txt } from '../components/ui';
import { useT } from '../store';
import { C } from '../theme';

export default function Dashboard() {
  const { t } = useT();
  const router = useRouter();
  const stats = useVillageStats();
  const yojnas = useYojnas();

  const total = (label: string, value: number, color: string) => (
    <View key={label}><Txt size={12} color={C.sub}>{label}</Txt><Txt w="b" size={20} color={color}>{value}</Txt></View>
  );

  return (
    <Screen back icon="home-city-outline" iconColor={C.green} title={t('गाँव की प्रगति', 'Village Dashboard')} subtitle={t('रूपावास – गाँव की प्रगति (सार्वजनिक)', 'Roopawas – village progress (public view)')}>
      <Loaded q={stats}>
        {(st) => {
          const tiles: { icon: IconName; color: string; label: string; value: string; unit: string }[] = [
            { icon: 'road-variant', color: C.green, label: t('सड़कें', 'Roads'), value: String(st.roads), unit: t('अनुरोध', 'requests') },
            { icon: 'water', color: C.blue, label: t('पेयजल', 'Drinking Water'), value: String(st.water), unit: t('अनुरोध', 'requests') },
            { icon: 'lightbulb-on-outline', color: C.green, label: t('स्ट्रीट लाइट', 'Street Lights'), value: String(st.lightsFixed), unit: t('हल', 'fixed') },
            { icon: 'trash-can-outline', color: C.green, label: t('स्वच्छता', 'Sanitation'), value: '✓', unit: t('नियमित', 'regular') },
            { icon: 'school-outline', color: C.green, label: t('स्कूल', 'School'), value: String(st.schoolWorks), unit: t('सुधार कार्य', 'repair works') },
            { icon: 'tree', color: C.green, label: t('पेड़ / पौधारोपण', 'Tree Plantation'), value: String(st.trees), unit: t('पेड़', 'trees') },
          ];
          return (
            <>
              <Grid cols={3} gap={8}>
                {tiles.map((x) => (
                  <Card key={x.label} style={{ alignItems: 'center', gap: 2, paddingHorizontal: 4 }}>
                    <Ico name={x.icon} size={28} color={x.color} />
                    <Txt w="b" size={13} center>{x.label}</Txt>
                    <Txt size={12} color={C.sub} center><Txt w="b" size={14} color={C.text}>{x.value}</Txt> {x.unit}</Txt>
                  </Card>
                ))}
              </Grid>
              <Card style={{ gap: 8 }}>
                <Txt w="b" size={15} color={C.navy}>{t('कुल अनुरोध', 'Total Requests')}</Txt>
                <Txt w="xb" size={32} color={C.navy}>{st.total}</Txt>
                <StackedBar parts={[{ value: st.resolved, color: C.green }, { value: st.inProgress, color: C.amber }, { value: st.forwarded, color: C.orange }]} />
                <Grid cols={3}>
                  {[
                    total(t('निपटाए गए', 'Resolved'), st.resolved, C.green),
                    total(t('प्रगति पर', 'In progress'), st.inProgress, C.amber),
                    total(t('विभाग को भेजे', 'Sent to dept'), st.forwarded, C.orange),
                  ]}
                </Grid>
              </Card>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ico name="account-group" size={40} color={C.green} />
                <View style={{ flex: 1 }}>
                  <Txt w="b" size={16}>{t('सरकारी योजनाएँ', 'Government Schemes')}</Txt>
                  <Txt color={C.sub}><Txt w="b" size={20} color={C.green}>{st.schemeApplications}</Txt> {t('आवेदन सहायता', 'applications assisted')}</Txt>
                </View>
              </Card>
            </>
          );
        }}
      </Loaded>

      <Heading right={<Btn small outline label={t('सभी देखें', 'See all')} onPress={() => router.push('/yojnas')} />}>
        {t('ग्राम विकास योजनाएँ', 'Village Yojnas')}
      </Heading>
      <Loaded q={yojnas}>
        {(list) => list.length === 0 ? <Txt color={C.sub}>{t('अभी कोई योजना दर्ज नहीं', 'No yojnas yet')}</Txt> : (
          <>
            <YojnaTotals list={list} />
            {/* The most recently changed ones; the Yojnas screen has them all. */}
            {[...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4).map((y) => <YojnaCard key={y.id} y={y} onPress={() => router.push(`/yojnas/${y.id}`)} />)}
          </>
        )}
      </Loaded>
    </Screen>
  );
}
