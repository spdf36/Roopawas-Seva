import { DESIGNATIONS, ROLE_NAME, fmtDate, isClosed } from '@shared/data';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useLogout, useRequests } from '../../api/hooks';
import { Badge, Btn, Card, Grid, Heading, Ico, IconName, LangToggle, Loaded, Row, Screen, StatusBadge, Txt } from '../../components/ui';
import { useT, useUser } from '../../store';
import { C } from '../../theme';

export default function AdminHome() {
  const { t, tl } = useT();
  const router = useRouter();
  const requests = useRequests();
  const logout = useLogout();
  const user = useUser();
  const isSuper = user?.role === 'superadmin';
  const designation = DESIGNATIONS.find((d) => d.id === user?.designation);
  const fresh = requests.data?.filter((r) => r.status === 'submitted').length;

  // The same sections as the website's admin menu.
  const menu: { icon: IconName; label: string; href: string; count?: number }[] = [
    ...(isSuper ? [{ icon: 'shield-account', label: t('एडमिन प्रबंधन', 'Admin management'), href: '/admin/admins' }] : []),
    { icon: 'file-document-multiple-outline', label: t('सभी आवेदन देखें', 'View all applications'), href: '/admin/requests', count: fresh },
    { icon: 'file-chart-outline', label: t('विभागवार रिपोर्ट & Analytics', 'Reports & Analytics'), href: '/admin/reports' },
    { icon: 'account-outline', label: t('उपयोगकर्ता प्रबंधन', 'User management'), href: '/admin/users' },
    { icon: 'bell-outline', label: t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications'), href: '/admin/notices' },
    { icon: 'bank-outline', label: t('योजना प्रबंधन', 'Scheme management'), href: '/admin/schemes' },
    { icon: 'hammer-wrench', label: t('ग्राम विकास योजनाएँ', 'Village Yojnas'), href: '/admin/yojnas' },
    { icon: 'counter', label: t('गाँव के आँकड़े', 'Village figures'), href: '/admin/figures' },
    { icon: 'home-city-outline', label: t('गाँव की प्रगति (सार्वजनिक)', 'Village dashboard (public)'), href: '/dashboard' },
  ];

  const stat = (label: string, value: number, color: string) => (
    <Card key={label} style={{ alignItems: 'center', paddingHorizontal: 2 }}>
      <Txt w="xb" size={24} color={color}>{value}</Txt>
      <Txt size={12} color={C.sub} center>{label}</Txt>
    </Card>
  );

  return (
    <Screen title={t('प्रशासक डैशबोर्ड', 'Admin Dashboard')} subtitle="Admin / Sarpanch Dashboard">
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: isSuper ? C.purpleSoft : C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ico name={isSuper ? 'shield-crown' : 'account-tie'} size={32} color={isSuper ? C.purple : C.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt w="b" size={17} color={C.navy}>{user?.name}</Txt>
          <Txt size={13} color={C.sub}>{designation ? `${tl(designation.name)} • ` : ''}{t('ग्राम पंचायत रूपावास', 'Gram Panchayat Roopawas')}</Txt>
          {user ? <Badge label={tl(ROLE_NAME[user.role])} color={isSuper ? C.purple : C.blue} soft={isSuper ? C.purpleSoft : C.blueSoft} /> : null}
        </View>
      </Card>
      <View style={{ alignItems: 'flex-end' }}><LangToggle /></View>

      <Loaded q={requests}>
        {(list) => (
          <>
            <Grid cols={4} gap={6}>
              {[
                stat(t('कुल', 'Total'), list.length, C.navy),
                stat(t('नए', 'New'), list.filter((r) => r.status === 'submitted').length, C.blue),
                stat(t('लंबित', 'Pending'), list.filter((r) => !isClosed(r)).length, C.amber),
                stat(t('निपटाए', 'Resolved'), list.filter((r) => r.status === 'resolved').length, C.green),
              ]}
            </Grid>
            <Card style={{ gap: 4 }}>
              <Heading>{t('हाल के आवेदन', 'Recent applications')}</Heading>
              {/* The API returns requests newest first. */}
              {list.slice(0, 5).map((r) => (
                <Pressable key={r.id} onPress={() => router.push(`/admin/request/${r.id}`)} accessibilityRole="button" style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border }}>
                  <Row style={{ alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Txt w="b" size={14} numberOfLines={1}>{tl(r.title)}</Txt>
                      <Txt size={12} color={C.sub}>{r.id}  •  {r.citizen.name}  •  {fmtDate(r.createdAt)}</Txt>
                    </View>
                    <StatusBadge r={r} />
                  </Row>
                </Pressable>
              ))}
            </Card>
          </>
        )}
      </Loaded>

      <View style={{ gap: 8 }}>
        {menu.map((m) => (
          <Card key={m.href} onPress={() => router.navigate(m.href)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ico name={m.icon} size={24} color={C.navy} />
            <Txt w="m" size={16} style={{ flex: 1 }}>{m.label}</Txt>
            {m.count ? (
              <View style={{ backgroundColor: C.red, borderRadius: 10, minWidth: 20, paddingHorizontal: 6, alignItems: 'center' }}>
                <Txt w="b" size={12} color="#FFFFFF">{m.count}</Txt>
              </View>
            ) : null}
            <Ico name="chevron-right" size={22} color={C.faint} />
          </Card>
        ))}
      </View>

      <Btn outline color={C.red} icon="logout" label={t('लॉग आउट', 'Log out')} busy={logout.isPending} onPress={() => logout.mutate()} />
    </Screen>
  );
}
