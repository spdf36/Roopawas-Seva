import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { View } from 'react-native';
import { Badge, Btn, Card, Screen, Txt } from '../../components/ui';
import { L, OCCUPATIONS, SEED_ACCOUNTS, WARDS } from '../../data';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

const SEEDED = new Set(SEED_ACCOUNTS.map((a) => a.id));

export default function AdminUsers() {
  const { t, tl } = useT();
  const accounts = useStore((s) => s.accounts);
  const requests = useStore((s) => s.requests);
  const setAccountActive = useStore((s) => s.setAccountActive);
  const citizens = accounts.filter((a) => a.role === 'citizen').sort((a, b) => b.createdAt - a.createdAt);

  const label = (list: { id: string; name: L }[], id?: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };

  return (
    <Screen back icon="account-multiple-outline" title={t('उपयोगकर्ता प्रबंधन', 'User Management')} subtitle={t(`${citizens.length} पंजीकृत नागरिक`, `${citizens.length} registered citizens`)}>
      {citizens.map((u) => {
        const count = requests.filter((r) => r.citizen.mobile === u.mobile).length;
        return (
          <Card key={u.id} style={{ gap: 8, opacity: u.active ? 1 : 0.7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                <MCI name="account" size={24} color={C.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Txt w="b" size={16}>{u.name}</Txt>
                  {SEEDED.has(u.id) ? null : <Badge label={t('नया', 'New')} color={C.green} soft={C.greenSoft} />}
                  {u.active ? null : <Badge label={t('निष्क्रिय', 'Inactive')} color={C.red} soft={C.redSoft} />}
                </View>
                <Txt size={13} color={C.sub}>+91 {u.mobile}  •  {label(OCCUPATIONS, u.occupation)}</Txt>
                <Txt size={13} color={C.sub}>{label(WARDS, u.ward)}</Txt>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Txt w="b" size={18} color={C.navy}>{count}</Txt>
                <Txt size={11} color={C.sub}>{t('आवेदन', 'requests')}</Txt>
              </View>
            </View>
            <Btn
              small outline color={u.active ? C.red : C.green} icon={u.active ? 'account-off-outline' : 'account-check-outline'}
              label={u.active ? t('निष्क्रिय करें', 'Deactivate') : t('सक्रिय करें', 'Activate')}
              onPress={() => setAccountActive(u.id, !u.active)}
            />
          </Card>
        );
      })}
    </Screen>
  );
}
