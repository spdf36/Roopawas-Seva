import { ROLE_NAME, Role } from '@shared/data';
import { DEMO_LOGINS } from '@shared/seed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLogin, useServerInfo } from '../api/hooks';
import { Logo } from '../components/Art';
import { Btn, Card, ErrorText, Field, Ico, IconName, LangToggle, Screen, Txt, useErrorText } from '../components/ui';
import { useT } from '../store';
import { C } from '../theme';

const ROLE_ICON: Record<Role, IconName> = { citizen: 'account', admin: 'account-tie', superadmin: 'shield-crown' };

export default function Login() {
  const { t, tl } = useT();
  const router = useRouter();
  const login = useLogin();
  const info = useServerInfo();
  const errorText = useErrorText();
  const [loginId, setLoginId] = useState('');
  const [pin, setPin] = useState('');

  // On success the root layout's guards switch to the role's screens and navigate there.
  const submit = () => login.mutate({ loginId, pin });
  const edit = () => { if (login.isError) login.reset(); };

  return (
    <Screen back title={t('लॉगिन करें', 'Log in')}>
      <View style={{ alignItems: 'flex-end' }}><LangToggle /></View>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Logo size={84} />
        <Txt w="xb" size={26} color={C.navy}>Roopawas Seva</Txt>
        <Txt size={14} color={C.sub} center>{t('नागरिक, प्रशासक और सुपर एडमिन – सभी यहीं से लॉगिन करें', 'Citizens, admins and super admins all log in here')}</Txt>
      </View>

      <Card style={{ gap: 12 }}>
        <Field
          label={t('मोबाइल नंबर / यूज़र आईडी', 'Mobile number / User ID')} required icon="account"
          value={loginId} onChangeText={(v) => { setLoginId(v); edit(); }}
          autoCapitalize="none" autoCorrect={false} placeholder={t('जैसे: 98765 43210', 'e.g. 98765 43210')}
        />
        <Field
          label={t('पिन', 'PIN')} required icon="lock-outline" value={pin}
          onChangeText={(v) => { setPin(v.replace(/\D/g, '').slice(0, 4)); edit(); }}
          keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" onSubmitEditing={submit}
        />
        <ErrorText text={login.isError ? errorText(login.error) : undefined} />
        <Btn label={t('लॉगिन करें', 'Log in')} icon="login" color={C.navy} onPress={submit} busy={login.isPending} disabled={!loginId.trim() || pin.length !== 4} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          <Txt size={14} color={C.sub}>{t('नए नागरिक हैं?', 'New citizen?')}</Txt>
          <Pressable onPress={() => router.replace('/register')} accessibilityRole="link" hitSlop={8}>
            <Txt w="b" size={14} color={C.green}>{t('पंजीकरण करें', 'Register')}</Txt>
          </Pressable>
        </View>
      </Card>

      {/* Only a demo has these accounts. */}
      {info.data?.demoMode ? (
        <Card style={{ gap: 6, backgroundColor: C.amberSoft, borderColor: '#F0D9A0' }}>
          <Txt w="b" size={14} color={C.amber}>{t('डेमो लॉगिन (भरने के लिए छुएँ)', 'Demo logins (tap to fill)')}</Txt>
          {DEMO_LOGINS.map((d) => (
            <Pressable
              key={d.role}
              onPress={() => { setLoginId(d.loginId); setPin(d.pin); edit(); }}
              accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, opacity: pressed ? 0.6 : 1 })}
            >
              <Ico name={ROLE_ICON[d.role]} size={18} color={C.amber} />
              <Txt w="sb" size={14} color={C.amber} style={{ width: 96 }}>{tl(ROLE_NAME[d.role])}</Txt>
              <Txt size={14} color={C.amber} style={{ flex: 1 }}>{d.loginId}  /  {d.pin}</Txt>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
