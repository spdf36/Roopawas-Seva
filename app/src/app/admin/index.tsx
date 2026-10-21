import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Badge, Btn, Card, Grid, LangToggle, Screen, Txt } from '../../components/ui';
import { DESIGNATIONS, Icon, ROLE_NAME } from '../../data';
import { useStore, useT, useUser } from '../../store';
import { C } from '../../theme';

export default function AdminHome() {
  const { t, tl } = useT();
  const router = useRouter();
  const requests = useStore((s) => s.requests);
  const logout = useStore((s) => s.logout);
  const user = useUser();
  const isSuper = user?.role === 'superadmin';
  const designation = DESIGNATIONS.find((d) => d.id === user?.designation);

  const pending = requests.filter((r) => r.status !== 'resolved' && r.status !== 'rejected').length;
  const fresh = requests.filter((r) => r.status === 'submitted').length;
  const resolved = requests.filter((r) => r.status === 'resolved').length;

  const menu: { icon: Icon; label: string; href: string; count?: number }[] = [
    { icon: 'file-document-multiple-outline', label: t('सभी आवेदन देखें', 'View all applications'), href: '/admin/requests', count: fresh },
    { icon: 'file-chart-outline', label: t('विभागवार रिपोर्ट', 'Department-wise report'), href: '/admin/reports?view=dept' },
    { icon: 'target', label: t('ग्राम विकास योजना', 'Village development plan'), href: '/admin/plan' },
    { icon: 'account-outline', label: t('उपयोगकर्ता प्रबंधन', 'User management'), href: '/admin/users' },
    { icon: 'bell-outline', label: t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications'), href: '/admin/notices' },
    { icon: 'chart-box-outline', label: t('रिपोर्ट & Analytics', 'Reports & Analytics'), href: '/admin/reports?view=analytics' },
    { icon: 'home-city-outline', label: t('गाँव की प्रगति (सार्वजनिक)', 'Village dashboard (public)'), href: '/dashboard' },
  ];
  if (isSuper) menu.unshift({ icon: 'shield-account', label: t('एडमिन प्रबंधन', 'Admin management'), href: '/admin/admins' });

  const stat = (label: string, value: number, color: string) => (
    <Card style={{ alignItems: 'center', paddingHorizontal: 4 }}>
      <Txt w="xb" size={26} color={color}>{value}</Txt>
      <Txt size={13} color={C.sub} center>{label}</Txt>
    </Card>
  );

  return (
    <Screen title={t('प्रशासक डैशबोर्ड', 'Admin Dashboard')} subtitle="Admin / Sarpanch Dashboard">
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          <MCI name={isSuper ? 'shield-crown' : 'account-tie'} size={32} color={C.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt w="b" size={17} color={C.navy}>{user?.name}</Txt>
          <Txt size={13} color={C.sub}>{designation ? `${tl(designation.name)} • ` : ''}{t('ग्राम पंचायत रूपावास', 'Gram Panchayat Roopawas')}</Txt>
          {user ? <View style={{ flexDirection: 'row', marginTop: 2 }}><Badge label={tl(ROLE_NAME[user.role])} color={isSuper ? C.purple : C.blue} soft={isSuper ? C.purpleSoft : C.blueSoft} /></View> : null}
        </View>
        <LangToggle />
      </Card>

      <Grid cols={3} gap={8}>
        {stat(t('नए आवेदन', 'New'), fresh, C.blue)}
        {stat(t('लंबित', 'Pending'), pending, C.amber)}
        {stat(t('निपटाए गए', 'Resolved'), resolved, C.green)}
      </Grid>

      <View style={{ gap: 8 }}>
        {menu.map((m) => (
          <Pressable key={m.href} onPress={() => router.navigate(m.href)} accessibilityRole="link">
            {({ pressed }) => (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.7 : 1 }}>
                <MCI name={m.icon} size={24} color={C.navy} />
                <Txt w="m" size={16} style={{ flex: 1 }}>{m.label}</Txt>
                {m.count ? (
                  <View style={{ backgroundColor: C.red, borderRadius: 10, minWidth: 20, paddingHorizontal: 6, alignItems: 'center' }}>
                    <Txt w="b" size={12} color="#FFFFFF">{m.count}</Txt>
                  </View>
                ) : null}
                <MCI name="chevron-right" size={22} color={C.faint} />
              </Card>
            )}
          </Pressable>
        ))}
      </View>

      <Btn outline color={C.red} icon="logout" label={t('लॉग आउट', 'Log out')} onPress={logout} />
    </Screen>
  );
}
