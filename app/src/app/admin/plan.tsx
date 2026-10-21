import { View } from 'react-native';
import { Card, Screen, Txt } from '../../components/ui';
import { DEVELOPMENT_WORKS } from '../../data';
import { useT } from '../../store';
import { C } from '../../theme';

export default function AdminPlan() {
  const { t, tl } = useT();
  return (
    <Screen back icon="target" title={t('ग्राम विकास योजना', 'Village Development Plan')} subtitle={t('चालू विकास कार्य और उनकी प्रगति', 'Ongoing works and their progress')}>
      {DEVELOPMENT_WORKS.map((w) => (
        <Card key={w.id} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt w="b" size={16} style={{ flex: 1 }}>{tl(w.name)}</Txt>
            <Txt w="b" size={16} color={w.progress >= 80 ? C.green : C.amber}>{w.progress}%</Txt>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' }}>
            <View style={{ width: `${w.progress}%`, height: 8, borderRadius: 4, backgroundColor: w.progress >= 80 ? C.green : C.amber }} />
          </View>
          <Txt size={13} color={C.sub}>{t('बजट', 'Budget')}: {w.budget}</Txt>
        </Card>
      ))}
    </Screen>
  );
}
