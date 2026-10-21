import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Btn, Card, Field, Screen, Select, Txt } from '../components/ui';
import { AGE_GROUPS, Icon, OCCUPATIONS, WARDS } from '../data';
import { Profile, useStore, useT } from '../store';
import { C } from '../theme';

const EMPTY: Profile = { name: '', mobile: '', ageGroup: '', ward: '', occupation: '', family: '' };

export default function Register() {
  const { t, tl } = useT();
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const saveProfile = useStore((s) => s.saveProfile);
  const clearProfile = useStore((s) => s.clearProfile);

  const [editing, setEditing] = useState(!profile);
  const [form, setForm] = useState<Profile>(profile ?? EMPTY);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const set = (patch: Partial<Profile>) => { setForm({ ...form, ...patch }); setError(''); };
  const opts = (list: { id: string; name: { hi: string; en: string } }[]) => list.map((o) => ({ id: o.id, label: tl(o.name) }));
  const nameOf = (list: { id: string; name: { hi: string; en: string } }[], id: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };

  const sendOtp = () => {
    if (!form.name.trim() || !form.ageGroup || !form.ward || !form.occupation) {
      return setError(t('कृपया सभी ज़रूरी (*) जानकारी भरें।', 'Please fill in all required (*) fields.'));
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      return setError(t('कृपया 10 अंकों का सही मोबाइल नंबर डालें।', 'Please enter a valid 10-digit mobile number.'));
    }
    setError('');
    setOtp('');
    setStep('otp');
  };

  const verify = () => {
    if (!/^\d{4}$/.test(otp)) return setError(t('कृपया 4 अंकों का OTP डालें।', 'Please enter the 4-digit OTP.'));
    saveProfile({ ...form, name: form.name.trim(), family: form.family.trim() });
    setError('');
    setStep('form');
    setEditing(false);
  };

  if (profile && !editing) {
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
      <Screen back icon="account-outline" title={t('मेरी जानकारी', 'My Profile')} subtitle={t('आपका पंजीकरण पूरा है', 'Your registration is complete')}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MCI name="check-decagram" size={20} color={C.green} />
            <Txt w="b" size={14} color={C.green}>{t('मोबाइल सत्यापित', 'Mobile verified')}</Txt>
          </View>
          {line('account', t('नाम', 'Name'), profile.name)}
          {line('cellphone', t('मोबाइल नंबर', 'Mobile Number'), `+91 ${profile.mobile}`)}
          {line('calendar-account', t('आयु वर्ग', 'Age Group'), nameOf(AGE_GROUPS, profile.ageGroup))}
          {line('map-marker', t('गाँव / वार्ड', 'Village / Ward'), nameOf(WARDS, profile.ward))}
          {line('briefcase-outline', t('पेशा / श्रेणी', 'Occupation / Category'), nameOf(OCCUPATIONS, profile.occupation))}
          {line('account-group', t('परिवार के सदस्य', 'Family Members'), profile.family || '—')}
        </Card>
        <Btn label={t('जानकारी बदलें', 'Edit details')} icon="pencil" onPress={() => { setForm(profile); setEditing(true); }} />
        <Btn outline color={C.orange} label={t('मेरे लिए योजनाएँ देखें', 'See schemes for me')} icon="bank-outline" onPress={() => router.navigate('/schemes')} />
        <Btn outline color={C.red} label={t('लॉग आउट', 'Log out')} icon="logout" onPress={() => { clearProfile(); setForm(EMPTY); setEditing(true); }} />
      </Screen>
    );
  }

  if (step === 'otp') {
    return (
      <Screen back icon="cellphone-message" title={t('OTP सत्यापन', 'OTP Verification')}>
        <Card style={{ gap: 12 }}>
          <Txt center>
            {t(`+91 ${form.mobile} पर भेजा गया 4 अंकों का OTP डालें`, `Enter the 4-digit OTP sent to +91 ${form.mobile}`)}
          </Txt>
          <Field
            label="OTP"
            required
            value={otp}
            onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="• • • •"
            autoFocus
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
          />
          <Txt size={13} color={C.amber} center>
            {t('डेमो: कोई भी 4 अंक डालें (असली SMS नहीं भेजा जाता)', 'Demo: enter any 4 digits (no real SMS is sent)')}
          </Txt>
          {error ? <Txt w="m" size={14} color={C.red} center>{error}</Txt> : null}
          <Btn label={t('सत्यापित करें', 'Verify')} icon="check" color={C.green} onPress={verify} />
          <Btn outline label={t('नंबर बदलें', 'Change number')} onPress={() => { setStep('form'); setError(''); }} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      back
      title={profile ? t('जानकारी बदलें', 'Edit Details') : t('अपना पंजीकरण करें', 'Register Yourself')}
      subtitle={t('(एक बार की प्रक्रिया)', '(One-time process)')}
    >
      <Card style={{ gap: 12 }}>
        <Field label={t('नाम', 'Name')} required icon="account" value={form.name} onChangeText={(name) => set({ name })} placeholder={t('जैसे: रामलाल शर्मा', 'e.g. Ramlal Sharma')} />
        <Field
          label={t('मोबाइल नंबर', 'Mobile Number')} required icon="cellphone" value={form.mobile}
          onChangeText={(v) => set({ mobile: v.replace(/\D/g, '').slice(0, 10) })}
          keyboardType="phone-pad" maxLength={10} placeholder="98765 43210"
        />
        <Select label={t('आयु वर्ग', 'Age Group')} required icon="calendar-account" value={form.ageGroup} placeholder={t('चुनें', 'Select')} options={opts(AGE_GROUPS)} onChange={(ageGroup) => set({ ageGroup })} />
        <Select label={t('गाँव / वार्ड', 'Village / Ward')} required icon="map-marker" value={form.ward} placeholder={t('चुनें', 'Select')} options={opts(WARDS)} onChange={(ward) => set({ ward })} />
        <Select label={t('पेशा / श्रेणी', 'Occupation / Category')} required icon="briefcase-outline" value={form.occupation} placeholder={t('चुनें (किसान, छात्र, नौकरीपेशा आदि)', 'Select (farmer, student, employed…)')} options={opts(OCCUPATIONS)} onChange={(occupation) => set({ occupation })} />
        <Field label={t('परिवार के सदस्य (वैकल्पिक)', 'Family Members (optional)')} icon="account-group" value={form.family} onChangeText={(v) => set({ family: v.replace(/\D/g, '').slice(0, 2) })} keyboardType="number-pad" placeholder={t('जोड़ें', 'Add')} />
        {error ? <Txt w="m" size={14} color={C.red}>{error}</Txt> : null}
        <Btn label={t('OTP भेजें', 'Send OTP')} onPress={sendOtp} />
        {profile ? <Btn outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={() => { setEditing(false); setError(''); }} /> : null}
      </Card>
      <Txt size={13} color={C.sub} center>
        {t('आपकी जानकारी सुरक्षित है\nऔर केवल सरकारी योजनाओं के लिए उपयोग होगी।', 'Your information is safe\nand will only be used for government schemes.')}
      </Txt>
    </Screen>
  );
}
