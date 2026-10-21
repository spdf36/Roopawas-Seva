import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Logo } from '../components/Art';
import { Btn, Card, Field, LangToggle, Screen, Txt } from '../components/ui';
import { DEMO_LOGINS, ROLE_NAME } from '../data';
import { useStore, useT } from '../store';
import { C } from '../theme';

export default function Login() {
  const { t, tl } = useT();
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [loginId, setLoginId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // On success the root layout's guards switch to the role's screens and navigate there.
  const submit = () => {
    const result = login(loginId, pin);
    if (result === 'invalid') setError(t('मोबाइल नंबर / यूज़र आईडी या पिन गलत है।', 'Incorrect mobile number / user ID or PIN.'));
    if (result === 'inactive') setError(t('यह खाता निष्क्रिय है। पंचायत कार्यालय से संपर्क करें।', 'This account is deactivated. Please contact the Panchayat office.'));
  };

  return (
    <Screen>
      <View style={{ alignItems: 'flex-end' }}><LangToggle /></View>
      <View style={{ alignItems: 'center', gap: 2, marginVertical: 8 }}>
        <Logo size={84} />
        <Txt w="xb" size={26} color={C.navy}>Roopawas Seva</Txt>
        <Txt w="sb" size={15} color={C.navy}>रूपावास की डिजिटल सेवा</Txt>
      </View>

      <Card style={{ gap: 12 }}>
        <Txt w="b" size={19} color={C.navy} center>{t('लॉगिन करें', 'Log in')}</Txt>
        <Field
          label={t('मोबाइल नंबर / यूज़र आईडी', 'Mobile number / User ID')} required icon="account"
          value={loginId} onChangeText={(v) => { setLoginId(v); setError(''); }}
          autoCapitalize="none" autoCorrect={false} placeholder={t('जैसे: 98765 43210', 'e.g. 98765 43210')}
        />
        <Field
          label={t('पिन', 'PIN')} required icon="lock-outline" value={pin}
          onChangeText={(v) => { setPin(v.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" onSubmitEditing={submit}
        />
        {error ? <Txt w="m" size={14} color={C.red}>{error}</Txt> : null}
        <Btn label={t('लॉगिन करें', 'Log in')} icon="login" color={C.navy} onPress={submit} disabled={!loginId.trim() || pin.length !== 4} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          <Txt size={14} color={C.sub}>{t('नए नागरिक हैं?', 'New citizen?')}</Txt>
          <Pressable onPress={() => router.push('/register')} accessibilityRole="link" hitSlop={8}>
            <Txt w="b" size={14} color={C.green}>{t('पंजीकरण करें', 'Register')}</Txt>
          </Pressable>
        </View>
      </Card>

      <Card style={{ gap: 6, backgroundColor: C.amberSoft, borderColor: '#F0D9A0' }}>
        <Txt w="b" size={14} color={C.amber}>{t('डेमो लॉगिन (भरने के लिए छुएँ)', 'Demo logins (tap to fill)')}</Txt>
        {DEMO_LOGINS.map((d) => (
          <Pressable
            key={d.role}
            onPress={() => { setLoginId(d.loginId); setPin(d.pin); setError(''); }}
            accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, opacity: pressed ? 0.6 : 1 })}
          >
            <MCI name={d.role === 'citizen' ? 'account' : d.role === 'admin' ? 'account-tie' : 'shield-crown'} size={18} color={C.amber} />
            <Txt w="sb" size={14} color={C.amber} style={{ width: 96 }}>{tl(ROLE_NAME[d.role])}</Txt>
            <Txt size={14} color={C.amber} style={{ flex: 1 }}>{d.loginId}  /  {d.pin}</Txt>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
