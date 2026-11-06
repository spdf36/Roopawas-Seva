import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ApiError } from '../api';
import { useRegister, useSendOtp, useServerInfo } from '../api/hooks';
import { CitizenFields, CitizenForm, EMPTY_CITIZEN, useValidateCitizen } from '../components/CitizenFields';
import { Btn, Card, Field, Screen, Txt, useErrorText } from '../components/ui';
import { useT } from '../store';
import { C } from '../theme';

/** New citizen sign-up: details, then OTP, then choosing the login PIN. */
export default function Register() {
  const { t } = useT();
  const router = useRouter();
  const sendOtp = useSendOtp();
  const demo = useServerInfo().data?.demoMode;
  const register = useRegister();
  const validate = useValidateCitizen();
  const errorText = useErrorText();

  const [form, setForm] = useState<CitizenForm>(EMPTY_CITIZEN);
  const [step, setStep] = useState<'form' | 'otp' | 'pin'>('form');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');

  const taken = t('यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।', 'This mobile number is already registered. Please log in.');
  const failure = (e: unknown) => setError(e instanceof ApiError && e.code === 'exists' ? taken : errorText(e));

  const requestOtp = () => {
    const problem = validate(form, true);
    if (problem) return setError(problem);
    setError('');
    sendOtp.mutate(form.mobile, {
      onSuccess: () => { setOtp(''); setStep('otp'); },
      onError: failure,
    });
  };

  const verifyOtp = () => {
    if (!/^\d{4}$/.test(otp)) return setError(t('कृपया 4 अंकों का OTP डालें।', 'Please enter the 4-digit OTP.'));
    setError('');
    setStep('pin');
  };

  // Success logs the citizen in; the root layout then switches to the citizen screens.
  const finish = () => {
    if (!/^\d{4}$/.test(pin)) return setError(t('कृपया 4 अंकों का पिन चुनें।', 'Please choose a 4-digit PIN.'));
    if (pin !== pin2) return setError(t('दोनों पिन एक जैसे नहीं हैं।', 'The two PINs do not match.'));
    setError('');
    register.mutate({ details: { ...form, name: form.name.trim(), family: form.family.trim() }, otp, pin }, {
      onError: (e) => {
        if (e instanceof ApiError && e.code === 'exists') setStep('form');
        failure(e);
      },
    });
  };

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);
  const err = error ? <Txt w="m" size={14} color={C.red} center={step !== 'form'}>{error}</Txt> : null;

  if (step === 'otp') {
    return (
      <Screen back icon="cellphone-message" title={t('OTP सत्यापन', 'OTP Verification')}>
        <Card style={{ gap: 12 }}>
          <Txt center>{t(`+91 ${form.mobile} पर भेजा गया 4 अंकों का OTP डालें`, `Enter the 4-digit OTP sent to +91 ${form.mobile}`)}</Txt>
          <Field label="OTP" required value={otp} onChangeText={(v) => { setOtp(digits(v)); setError(''); }} keyboardType="number-pad" maxLength={4} placeholder="• • • •" autoFocus style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }} />
          {demo ? <Txt size={13} color={C.amber} center>{t('डेमो: कोई भी 4 अंक डालें (असली SMS नहीं भेजा जाता)', 'Demo: enter any 4 digits (no real SMS is sent)')}</Txt> : null}
          {err}
          <Btn label={t('सत्यापित करें', 'Verify')} icon="check" color={C.green} onPress={verifyOtp} />
          <Btn outline label={t('नंबर बदलें', 'Change number')} onPress={() => { setStep('form'); setError(''); }} />
        </Card>
      </Screen>
    );
  }

  if (step === 'pin') {
    return (
      <Screen back icon="lock-outline" title={t('अपना पिन चुनें', 'Choose your PIN')} subtitle={t('लॉगिन के लिए 4 अंकों का पिन', 'A 4-digit PIN for logging in')}>
        <Card style={{ gap: 12 }}>
          <Txt center color={C.sub}>{t(`आप मोबाइल नंबर ${form.mobile} और इस पिन से लॉगिन करेंगे।`, `You will log in with mobile number ${form.mobile} and this PIN.`)}</Txt>
          <Field label={t('पिन', 'PIN')} required value={pin} onChangeText={(v) => { setPin(digits(v)); setError(''); }} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" autoFocus style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8 }} />
          <Field label={t('पिन दोबारा डालें', 'Confirm PIN')} required value={pin2} onChangeText={(v) => { setPin2(digits(v)); setError(''); }} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8 }} />
          {err}
          <Btn label={t('पंजीकरण पूरा करें', 'Complete registration')} icon="check" color={C.green} busy={register.isPending} onPress={finish} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen back title={t('अपना पंजीकरण करें', 'Register Yourself')} subtitle={t('(एक बार की प्रक्रिया)', '(One-time process)')}>
      <Card style={{ gap: 12 }}>
        <CitizenFields form={form} onChange={(patch) => { setForm({ ...form, ...patch }); setError(''); }} mobileEditable />
        {err}
        <Btn label={t('OTP भेजें', 'Send OTP')} busy={sendOtp.isPending} onPress={requestOtp} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          <Txt size={14} color={C.sub}>{t('पहले से पंजीकृत हैं?', 'Already registered?')}</Txt>
          <Pressable onPress={() => router.replace('/login')} accessibilityRole="link" hitSlop={8}>
            <Txt w="b" size={14} color={C.navy}>{t('लॉगिन करें', 'Log in')}</Txt>
          </Pressable>
        </View>
      </Card>
      <Txt size={13} color={C.sub} center>
        {t('आपकी जानकारी सुरक्षित है\nऔर केवल सरकारी योजनाओं के लिए उपयोग होगी।', 'Your information is safe\nand will only be used for government schemes.')}
      </Txt>
    </Screen>
  );
}
