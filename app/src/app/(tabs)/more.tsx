import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { API_URL } from '../../api';
import { useLogout, useResetDemo, useServerInfo } from '../../api/hooks';
import { Btn, Card, ConfirmBtn, Ico, IconName, LangToggle, Screen, Txt } from '../../components/ui';
import { useT, useUser } from '../../store';
import { C } from '../../theme';

export default function More() {
  const { t } = useT();
  const router = useRouter();
  const user = useUser();
  const logout = useLogout();
  const resetDemo = useResetDemo();
  // Only a demo (the built-in data, or a server in demo mode) can be reset.
  const demo = useServerInfo().data?.demoMode;

  const row = (icon: IconName, label: string, href: string, color: string = C.navy) => (
    <Pressable
      key={href}
      onPress={() => router.navigate(href)}
      accessibilityRole="link"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, opacity: pressed ? 0.6 : 1 })}
    >
      <Ico name={icon} size={22} color={color} />
      <Txt w="m" size={16} style={{ flex: 1 }}>{label}</Txt>
      <Ico name="chevron-right" size={22} color={C.faint} />
    </Pressable>
  );

  return (
    <Screen tab icon="dots-horizontal" title={t('अन्य', 'More')}>
      {user ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ico name="account" size={28} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="b" size={17}>{user.name}</Txt>
            <Txt size={13} color={C.sub}>+91 {user.mobile}</Txt>
          </View>
        </Card>
      ) : (
        <Card style={{ gap: 10 }}>
          <Txt size={14} color={C.sub}>{t('नागरिक, प्रशासक और सुपर एडमिन – सभी यहीं से लॉगिन करें', 'Citizens, admins and super admins all log in here')}</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn small color={C.navy} icon="login" label={t('लॉगिन करें', 'Log in')} onPress={() => router.push('/login')} style={{ flex: 1 }} />
            <Btn small outline color={C.green} label={t('पंजीकरण करें', 'Register')} onPress={() => router.push('/register')} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ico name="translate" size={22} color={C.navy} />
        <Txt w="m" size={16} style={{ flex: 1 }}>{t('भाषा', 'Language')}</Txt>
        <LangToggle />
      </Card>

      <Card style={{ paddingVertical: 2 }}>
        {user ? row('account', t('मेरी जानकारी', 'My Profile'), '/profile', C.green) : null}
        {row('bell-ring', t('सूचनाएँ', 'Latest Updates'), '/updates', C.purple)}
        {row('home-city', t('गाँव की प्रगति', 'Village Dashboard'), '/dashboard', C.teal)}
        {row('hammer-wrench', t('ग्राम विकास योजनाएँ', 'Village Yojnas'), '/yojnas', C.orange)}
        {row('help-circle-outline', t('सहायता और जानकारी', 'Help & About'), '/about', C.blue)}
      </Card>

      {user ? <Btn outline color={C.red} icon="logout" label={t('लॉग आउट', 'Log out')} busy={logout.isPending} onPress={() => logout.mutate()} /> : null}

      {demo ? (
        <Card style={{ gap: 8 }}>
          <Txt w="b" size={15}>{t('डेमो डेटा', 'Demo data')}</Txt>
          <Txt size={13} color={C.sub}>
            {API_URL
              ? t('सर्वर डेमो मोड में है। रीसेट करने पर नए खाते और शिकायतें हट जाएँगी और सभी लॉग आउट हो जाएँगे।', 'The server is in demo mode. Resetting removes new accounts and complaints and logs everyone out.')
              : t('यह एक डेमो है। सारी जानकारी केवल इसी फ़ोन पर सेव होती है। रीसेट करने पर नए खाते और शिकायतें हट जाएँगी और आप लॉग आउट हो जाएँगे।', 'This is a demo. All data is stored only on this phone. Resetting removes new accounts and complaints and logs you out.')}
          </Txt>
          <ConfirmBtn
            icon="refresh" label={t('डेमो रीसेट करें', 'Reset demo')} question={t('डेमो डेटा रीसेट करें?', 'Reset the demo data?')}
            confirmLabel={t('हाँ, रीसेट करें', 'Yes, reset')} busy={resetDemo.isPending} onConfirm={() => resetDemo.mutate()}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
