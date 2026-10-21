import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CitizenFields, CitizenForm, useValidateCitizen } from '../components/CitizenFields';
import { Btn, Card, Screen, Txt } from '../components/ui';
import { AGE_GROUPS, Icon, L, OCCUPATIONS, WARDS } from '../data';
import { useStore, useT, useUser } from '../store';
import { C } from '../theme';

export default function Profile() {
  const { t, tl } = useT();
  const router = useRouter();
  const user = useUser();
  const updateProfile = useStore((s) => s.updateProfile);
  const logout = useStore((s) => s.logout);
  const validate = useValidateCitizen();
  const [form, setForm] = useState<CitizenForm | null>(null);
  const [error, setError] = useState('');

  if (!user) return null;

  if (form) {
    const save = () => {
      const problem = validate(form, false);
      if (problem) return setError(problem);
      updateProfile({ name: form.name.trim(), ageGroup: form.ageGroup, ward: form.ward, occupation: form.occupation, family: form.family.trim() });
      setForm(null);
    };
    return (
      <Screen back title={t('जानकारी बदलें', 'Edit Details')}>
        <Card style={{ gap: 12 }}>
          <CitizenFields form={form} onChange={(patch) => { setForm({ ...form, ...patch }); setError(''); }} mobileEditable={false} />
          {error ? <Txt w="m" size={14} color={C.red}>{error}</Txt> : null}
          <Btn label={t('सेव करें', 'Save')} icon="content-save-outline" color={C.green} onPress={save} />
          <Btn outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={() => { setForm(null); setError(''); }} />
        </Card>
      </Screen>
    );
  }

  const nameOf = (list: { id: string; name: L }[], id?: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };
  const line = (icon: Icon, label: string, value: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 }}>
      <MCI name={icon} size={20} color={C.navy} />
      <View style={{ flex: 1 }}>
        <Txt size={12} color={C.sub}>{label}</Txt>
        <Txt w="sb" size={16}>{value}</Txt>
      </View>
    </View>
  );

  return (
    <Screen back icon="account-outline" title={t('मेरी जानकारी', 'My Profile')}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <MCI name="check-decagram" size={20} color={C.green} />
          <Txt w="b" size={14} color={C.green}>{t('मोबाइल सत्यापित', 'Mobile verified')}</Txt>
        </View>
        {line('account', t('नाम', 'Name'), user.name)}
        {line('cellphone', t('मोबाइल नंबर (लॉगिन)', 'Mobile Number (login)'), `+91 ${user.mobile}`)}
        {line('calendar-account', t('आयु वर्ग', 'Age Group'), nameOf(AGE_GROUPS, user.ageGroup))}
        {line('map-marker', t('गाँव / वार्ड', 'Village / Ward'), nameOf(WARDS, user.ward))}
        {line('briefcase-outline', t('पेशा / श्रेणी', 'Occupation / Category'), nameOf(OCCUPATIONS, user.occupation))}
        {line('account-group', t('परिवार के सदस्य', 'Family Members'), user.family || '—')}
      </Card>
      <Btn
        label={t('जानकारी बदलें', 'Edit details')} icon="pencil"
        onPress={() => setForm({ name: user.name, mobile: user.mobile, ageGroup: user.ageGroup ?? '', ward: user.ward ?? '', occupation: user.occupation ?? '', family: user.family ?? '' })}
      />
      <Btn outline color={C.orange} label={t('मेरे लिए योजनाएँ देखें', 'See schemes for me')} icon="bank-outline" onPress={() => router.navigate('/schemes')} />
      <Btn outline color={C.red} label={t('लॉग आउट', 'Log out')} icon="logout" onPress={logout} />
    </Screen>
  );
}
