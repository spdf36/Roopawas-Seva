import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { NeedProfile } from '../../components/NeedProfile';
import { Bubble, Btn, Card, Screen, Txt } from '../../components/ui';
import { DEPARTMENTS, SCHEME_GROUPS } from '../../data';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

export default function SchemeGroupScreen() {
  const { t, tl } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useStore((s) => s.profile);
  const requests = useStore((s) => s.requests);
  const applyScheme = useStore((s) => s.applyScheme);

  const group = SCHEME_GROUPS.find((g) => g.id === id);
  const groups = group ? [group] : SCHEME_GROUPS;
  const applied = (schemeId: string) => requests.find((r) => r.mine && r.schemeId === schemeId);

  return (
    <Screen
      back
      icon={group?.icon ?? 'bank-outline'}
      iconColor={group?.color}
      title={group ? tl(group.name) : t('सभी योजनाएँ', 'All Schemes')}
      subtitle={t('योजना चुनें और आवेदन करें', 'Choose a scheme and apply')}
    >
      {profile ? null : <NeedProfile />}
      {groups.map((g) => (
        <View key={g.id} style={{ gap: 12 }}>
          {group ? null : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <Bubble v={g} size={34} />
              <Txt w="b" size={17} color={C.navy}>{tl(g.name)}</Txt>
            </View>
          )}
          {g.schemes.map((sc) => {
            const existing = applied(sc.id);
            return (
              <Card key={sc.id} style={{ gap: 6 }}>
                <Txt w="b" size={17}>{tl(sc.name)}</Txt>
                <Txt color={C.sub}>{tl(sc.desc)}</Txt>
                <Txt size={13} color={g.color} w="sb">{tl(DEPARTMENTS[sc.dept])}</Txt>
                {existing ? (
                  <Btn small outline color={C.green} icon="check-circle-outline" label={`${t('आवेदन किया गया', 'Applied')}  •  ${existing.id}`} onPress={() => router.navigate(`/request/${existing.id}`)} />
                ) : (
                  <Btn small color={g.color} icon="send" label={t('आवेदन करें', 'Apply')} disabled={!profile} onPress={() => applyScheme(sc.id)} />
                )}
              </Card>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}
