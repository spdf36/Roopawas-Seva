import { DEPARTMENTS, SCHEME_GROUPS } from '@shared/data';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useApplyScheme, useRequests, useSchemes } from '../../api/hooks';
import { Badge, Btn, Bubble, Card, Empty, ErrorText, Loaded, NeedLogin, Row, Screen, Txt, useErrorText } from '../../components/ui';
import { useT, useUser } from '../../store';
import { C } from '../../theme';

export default function Schemes() {
  const { t, tl } = useT();
  const router = useRouter();
  const user = useUser();
  const isCitizen = user?.role === 'citizen';
  // Visitors and citizens get open schemes only.
  const schemes = useSchemes();
  // Only a citizen has applications of their own to mark as "Applied".
  const requests = useRequests({}, isCitizen);
  const apply = useApplyScheme();
  const errorText = useErrorText();
  const occupation = user?.occupation;
  // The group matching the citizen's registered occupation is listed first.
  const groups = [...SCHEME_GROUPS].sort((a, b) => Number(b.occupation === occupation) - Number(a.occupation === occupation));
  const applied = (schemeId: string) => requests.data?.find((r) => r.schemeId === schemeId);

  return (
    <Screen tab icon="bank-outline" title={t('सरकारी योजनाएँ', 'Government Schemes')} subtitle={t('आपके लिए उपलब्ध संभावित योजनाएं', 'Schemes you may be eligible for')}>
      {user ? null : <NeedLogin />}
      <ErrorText text={apply.isError ? errorText(apply.error) : undefined} />
      <Loaded q={schemes}>
        {(list) => list.length === 0 ? <Empty icon="bank-off-outline" text={t('अभी कोई योजना उपलब्ध नहीं है', 'No schemes are available right now')} /> : groups.map((g) => {
          const inGroup = list.filter((s) => s.groupId === g.id);
          if (inGroup.length === 0) return null;
          return (
            <View key={g.id} style={{ gap: 8, marginTop: 4 }}>
              <Row>
                <Bubble v={g} size={36} />
                <Txt w="b" size={18} style={{ flex: 1 }}>{tl(g.name)}</Txt>
                {g.occupation === occupation ? <Badge label={t('आपके लिए', 'For you')} color={C.green} soft={C.greenSoft} /> : null}
              </Row>
              {inGroup.map((sc) => {
                const existing = applied(sc.id);
                const applying = apply.isPending && apply.variables === sc.id;
                return (
                  <Card key={sc.id} style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: g.color }}>
                    <Txt w="b" size={16}>{tl(sc.name)}</Txt>
                    <Txt size={14} color={C.sub}>{tl(sc.desc)}</Txt>
                    <Txt w="sb" size={12} color={g.color}>{tl(DEPARTMENTS[sc.dept] ?? DEPARTMENTS.panchayat)}</Txt>
                    {existing ? (
                      <Btn small outline color={C.green} icon="check-circle-outline" label={`${t('आवेदन किया गया', 'Applied')}  •  ${existing.id}`} onPress={() => router.push(`/request/${existing.id}`)} />
                    ) : isCitizen ? (
                      <Btn small color={g.color} icon="send" label={t('आवेदन करें', 'Apply')} busy={applying} disabled={requests.isPending || apply.isPending} onPress={() => apply.mutate(sc.id)} />
                    ) : null}
                  </Card>
                );
              })}
            </View>
          );
        })}
      </Loaded>
    </Screen>
  );
}
