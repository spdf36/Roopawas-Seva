import { DAY, L, OCCUPATIONS, WARDS } from '@shared/data';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useAccounts, useRequests, useSetAccountActive } from '../../api/hooks';
import { Badge, Btn, Card, ErrorText, Loaded, Row, Screen, Txt, useErrorText } from '../../components/ui';
import { useT } from '../../store';
import { C } from '../../theme';

/** Citizens who registered in the last 7 days get a "New" badge. */
const isNew = (createdAt: number) => Date.now() - createdAt < 7 * DAY;

export default function AdminUsers() {
  const { t, tl } = useT();
  const router = useRouter();
  const accounts = useAccounts('citizen');
  const requests = useRequests();
  const setActive = useSetAccountActive();
  const errorText = useErrorText();
  const label = (list: { id: string; name: L }[], id?: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };
  const citizens = accounts.data ? [...accounts.data].sort((a, b) => b.createdAt - a.createdAt) : undefined;

  return (
    <Screen back icon="account-multiple-outline" title={t('उपयोगकर्ता प्रबंधन', 'User Management')} subtitle={citizens ? t(`${citizens.length} पंजीकृत नागरिक`, `${citizens.length} registered citizens`) : undefined}>
      <ErrorText text={setActive.isError ? errorText(setActive.error) : undefined} />
      <Loaded q={accounts}>
        {() => citizens?.map((u) => {
          const count = requests.data?.filter((r) => r.citizen.mobile === u.mobile).length;
          return (
            <Card key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: u.active ? 1 : 0.6 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6} wrap>
                  <Txt w="b" size={16}>{u.name}</Txt>
                  {isNew(u.createdAt) ? <Badge label={t('नया', 'New')} color={C.green} soft={C.greenSoft} /> : null}
                  {u.active ? null : <Badge label={t('निष्क्रिय', 'Inactive')} color={C.red} soft={C.redSoft} />}
                </Row>
                <Txt size={13} color={C.sub}>+91 {u.mobile}</Txt>
                <Txt size={12} color={C.sub}>{label(OCCUPATIONS, u.occupation)}  •  {label(WARDS, u.ward)}</Txt>
              </View>
              <View style={{ alignItems: 'center', gap: 6 }}>
                {/* Opens this citizen's requests. */}
                <Pressable onPress={() => router.push(`/admin/requests?q=${u.mobile}`)} accessibilityRole="link" style={{ alignItems: 'center' }}>
                  <Txt w="xb" size={20} color={C.blue}>{count ?? '…'}</Txt>
                  <Txt size={11} color={C.blue}>{t('आवेदन', 'requests')}</Txt>
                </Pressable>
                <Btn
                  small outline color={u.active ? C.red : C.green} disabled={setActive.isPending}
                  label={u.active ? t('निष्क्रिय करें', 'Deactivate') : t('सक्रिय करें', 'Activate')}
                  onPress={() => setActive.mutate({ id: u.id, active: !u.active })}
                />
              </View>
            </Card>
          );
        })}
      </Loaded>
    </Screen>
  );
}
