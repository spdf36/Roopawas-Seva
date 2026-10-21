import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Btn, Card, LangToggle, Screen, Txt } from '../../components/ui';
import { Icon } from '../../data';
import { useStore, useT, useUser } from '../../store';
import { C } from '../../theme';

export default function More() {
  const { t } = useT();
  const router = useRouter();
  const user = useUser();
  const logout = useStore((s) => s.logout);
  const resetDemo = useStore((s) => s.resetDemo);
  const [confirmReset, setConfirmReset] = useState(false);

  const row = (icon: Icon, label: string, href: string, color: string = C.navy) => (
    <Pressable
      key={href}
      onPress={() => router.navigate(href)}
      accessibilityRole="link"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, opacity: pressed ? 0.6 : 1 })}
    >
      <MCI name={icon} size={22} color={color} />
      <Txt w="m" size={16} style={{ flex: 1 }}>{label}</Txt>
      <MCI name="chevron-right" size={22} color={C.faint} />
    </Pressable>
  );

  return (
    <Screen tab icon="dots-horizontal" title={t('अन्य', 'More')}>
      {user ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <MCI name="account" size={28} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="b" size={17}>{user.name}</Txt>
            <Txt size={13} color={C.sub}>+91 {user.mobile}</Txt>
          </View>
        </Card>
      ) : null}

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <MCI name="translate" size={22} color={C.navy} />
        <Txt w="m" size={16} style={{ flex: 1 }}>{t('भाषा', 'Language')}</Txt>
        <LangToggle />
      </Card>

      <Card style={{ paddingVertical: 2 }}>
        {row('account', t('मेरी जानकारी', 'My Profile'), '/profile', C.green)}
        {row('bell-ring', t('सूचनाएँ', 'Latest Updates'), '/updates', C.purple)}
        {row('home-city', t('गाँव की प्रगति', 'Village Dashboard'), '/dashboard', C.teal)}
        {row('information-outline', t('रूपावास सेवा के बारे में', 'About Roopawas Seva'), '/about', C.blue)}
      </Card>

      <Btn outline color={C.red} icon="logout" label={t('लॉग आउट', 'Log out')} onPress={logout} />

      <Card style={{ gap: 8 }}>
        <Txt w="b" size={15}>{t('डेमो डेटा', 'Demo data')}</Txt>
        <Txt size={13} color={C.sub}>
          {t(
            'यह एक डेमो है। सारी जानकारी केवल इसी डिवाइस पर सेव होती है। रीसेट करने पर नए खाते और शिकायतें हट जाएँगी और आप लॉग आउट हो जाएँगे।',
            'This is a demo. All data is stored only on this device. Resetting removes new accounts and complaints and logs you out.',
          )}
        </Txt>
        {confirmReset ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn small outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
            <Btn small color={C.red} label={t('हाँ, रीसेट करें', 'Yes, reset')} onPress={resetDemo} style={{ flex: 1 }} />
          </View>
        ) : (
          <Btn small outline color={C.red} icon="refresh" label={t('डेमो रीसेट करें', 'Reset demo')} onPress={() => setConfirmReset(true)} />
        )}
      </Card>
    </Screen>
  );
}
