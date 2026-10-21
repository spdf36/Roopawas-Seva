import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Btn, Card, Field, Screen, Txt } from '../../components/ui';
import { ADMIN_PIN, ADMIN_USER, useStore, useT } from '../../store';
import { C } from '../../theme';

export default function AdminLogin() {
  const { t } = useT();
  const router = useRouter();
  const isAdmin = useStore((s) => s.isAdmin);
  const adminLogin = useStore((s) => s.adminLogin);
  const [user, setUser] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (isAdmin) return <Redirect href="/admin" />;

  const submit = () => {
    if (adminLogin(user, pin)) router.replace('/admin');
    else setError(true);
  };

  return (
    <Screen back title={t('प्रशासक लॉगिन', 'Admin Login')}>
      <Card style={{ gap: 12 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
            <MCI name="account-tie" size={42} color={C.navy} />
          </View>
          <Txt w="b" size={18} color={C.navy}>{t('मुखिया / प्रशासक लॉगिन', 'Sarpanch / Admin Login')}</Txt>
        </View>
        <Field label={t('यूज़र आईडी', 'User ID')} required icon="account" value={user} onChangeText={(v) => { setUser(v); setError(false); }} autoCapitalize="none" autoCorrect={false} placeholder={ADMIN_USER} />
        <Field label={t('पिन', 'PIN')} required icon="lock-outline" value={pin} onChangeText={(v) => { setPin(v.replace(/\D/g, '').slice(0, 4)); setError(false); }} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" onSubmitEditing={submit} />
        {error ? <Txt w="m" size={14} color={C.red}>{t('यूज़र आईडी या पिन गलत है।', 'Incorrect user ID or PIN.')}</Txt> : null}
        <Btn label={t('लॉगिन करें', 'Log in')} icon="login" color={C.navy} onPress={submit} />
        <View style={{ backgroundColor: C.amberSoft, borderRadius: 8, padding: 10 }}>
          <Txt size={13} color={C.amber} center>
            {t('डेमो लॉगिन', 'Demo login')}:  <Txt w="b" size={13} color={C.amber}>{ADMIN_USER}</Txt>  /  <Txt w="b" size={13} color={C.amber}>{ADMIN_PIN}</Txt>
          </Txt>
        </View>
      </Card>
    </Screen>
  );
}
