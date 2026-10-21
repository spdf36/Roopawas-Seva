import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Badge, Bubble, Card, Screen, Txt } from '../../components/ui';
import { SCHEME_GROUPS } from '../../data';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

export default function Schemes() {
  const { t, tl } = useT();
  const router = useRouter();
  const occupation = useStore((s) => s.profile?.occupation);
  // The group matching the citizen's registered occupation is listed first.
  const groups = [...SCHEME_GROUPS].sort((a, b) => Number(b.occupation === occupation) - Number(a.occupation === occupation));

  return (
    <Screen
      tab
      icon="bank-outline"
      title={t('सरकारी योजनाएँ', 'Government Schemes')}
      subtitle={t('आपके लिए उपलब्ध संभावित योजनाएं', 'Schemes you may be eligible for')}
    >
      {groups.map((g) => (
        <Card key={g.id} onPress={() => router.navigate(`/scheme/${g.id}`)} style={{ flexDirection: 'row', gap: 12 }}>
          <Bubble v={g} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt w="b" size={17}>{tl(g.name)}</Txt>
              {g.occupation === occupation ? <Badge label={t('आपके लिए', 'For you')} color={C.green} soft={C.greenSoft} /> : null}
            </View>
            {g.schemes.map((sc) => (
              <Txt key={sc.id} size={14} color={C.sub}>•  {tl(sc.name)}</Txt>
            ))}
          </View>
          <MCI name="chevron-right" size={22} color={C.faint} style={{ alignSelf: 'center' }} />
        </Card>
      ))}
      <Pressable onPress={() => router.navigate('/scheme/all')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 }} accessibilityRole="link">
        <Txt w="b" size={16} color={C.blue}>{t('सभी योजनाएँ देखें', 'View all schemes')}</Txt>
        <MCI name="arrow-right" size={18} color={C.blue} />
      </Pressable>
    </Screen>
  );
}
