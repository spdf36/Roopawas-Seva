import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { View } from 'react-native';
import { Badge, Card, Screen, Txt } from '../../components/ui';
import { OCCUPATIONS, SEED_USERS, WARDS } from '../../data';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

export default function AdminUsers() {
  const { t, tl } = useT();
  const profile = useStore((s) => s.profile);
  const requests = useStore((s) => s.requests);

  const users = [
    ...(profile ? [{ name: profile.name, mobile: profile.mobile, occupation: profile.occupation, ward: profile.ward, fresh: true }] : []),
    ...SEED_USERS.filter((u) => u.mobile !== profile?.mobile).map((u) => ({ ...u, fresh: false })),
  ];
  const label = (list: typeof OCCUPATIONS, id: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };

  return (
    <Screen back icon="account-multiple-outline" title={t('उपयोगकर्ता प्रबंधन', 'User Management')} subtitle={t(`${users.length} पंजीकृत नागरिक`, `${users.length} registered citizens`)}>
      {users.map((u) => {
        const count = requests.filter((r) => r.citizen.mobile === u.mobile).length;
        return (
          <Card key={u.mobile} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
              <MCI name="account" size={24} color={C.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt w="b" size={16}>{u.name}</Txt>
                {u.fresh ? <Badge label={t('नया', 'New')} color={C.green} soft={C.greenSoft} /> : null}
              </View>
              <Txt size={13} color={C.sub}>+91 {u.mobile}  •  {label(OCCUPATIONS, u.occupation)}</Txt>
              <Txt size={13} color={C.sub}>{label(WARDS, u.ward)}</Txt>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Txt w="b" size={18} color={C.navy}>{count}</Txt>
              <Txt size={11} color={C.sub}>{t('आवेदन', 'requests')}</Txt>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
