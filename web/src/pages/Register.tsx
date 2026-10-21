import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api';
import { useRegister, useSendOtp, useServerInfo } from '../api/hooks';
import { CitizenFields, CitizenForm, EMPTY_CITIZEN, useValidateCitizen } from '../components/CitizenFields';
import { Field, Icon, PageHead, tint, useErrorText } from '../components/ui';
import { useT } from '../store';

/** New citizen sign-up: details, then OTP, then choosing the login PIN. */
export function Register() {
  const { t } = useT();
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
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);
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

  const finish = () => {
    if (!/^\d{4}$/.test(pin)) return setError(t('कृपया 4 अंकों का पिन चुनें।', 'Please choose a 4-digit PIN.'));
    if (pin !== pin2) return setError(t('दोनों पिन एक जैसे नहीं हैं।', 'The two PINs do not match.'));
    setError('');
    // Success logs the citizen in; the GuestOnly route wrapper then redirects to Home.
    register.mutate({ details: { ...form, name: form.name.trim(), family: form.family.trim() }, otp, pin }, {
      onError: (e) => {
        if (e instanceof ApiError && e.code === 'exists') setStep('form');
        failure(e);
      },
    });
  };

  const pinStyle = { textAlign: 'center' as const, fontSize: 22, letterSpacing: 8 };

  if (step === 'otp') {
    return (
      <div className="container narrow page">
        <PageHead icon="cellphone-message" title={t('OTP सत्यापन', 'OTP Verification')} />
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); verifyOtp(); }}>
          <p className="center">{t(`+91 ${form.mobile} पर भेजा गया 4 अंकों का OTP डालें`, `Enter the 4-digit OTP sent to +91 ${form.mobile}`)}</p>
          <Field label="OTP" required value={otp} autoFocus inputMode="numeric" maxLength={4} placeholder="• • • •" onChange={(e) => { setOtp(digits(e.target.value)); setError(''); }} style={pinStyle} />
          {demo ? <div className="demo-hint">{t('डेमो: कोई भी 4 अंक डालें (असली SMS नहीं भेजा जाता)', 'Demo: enter any 4 digits (no real SMS is sent)')}</div> : null}
          {error ? <div className="error center">{error}</div> : null}
          <button type="submit" className="btn block" style={tint('var(--green)')}><Icon name="check" />{t('सत्यापित करें', 'Verify')}</button>
          <button type="button" className="btn outline block" onClick={() => { setStep('form'); setError(''); }}>{t('नंबर बदलें', 'Change number')}</button>
        </form>
      </div>
    );
  }

  if (step === 'pin') {
    return (
      <div className="container narrow page">
        <PageHead icon="lock-outline" title={t('अपना पिन चुनें', 'Choose your PIN')} subtitle={t('लॉगिन के लिए 4 अंकों का पिन', 'A 4-digit PIN for logging in')} />
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); finish(); }}>
          <p className="center sub">{t(`आप मोबाइल नंबर ${form.mobile} और इस पिन से लॉगिन करेंगे।`, `You will log in with mobile number ${form.mobile} and this PIN.`)}</p>
          <Field label={t('पिन', 'PIN')} required type="password" inputMode="numeric" maxLength={4} value={pin} placeholder="••••" autoFocus autoComplete="new-password" onChange={(e) => { setPin(digits(e.target.value)); setError(''); }} style={pinStyle} />
          <Field label={t('पिन दोबारा डालें', 'Confirm PIN')} required type="password" inputMode="numeric" maxLength={4} value={pin2} placeholder="••••" autoComplete="new-password" onChange={(e) => { setPin2(digits(e.target.value)); setError(''); }} style={pinStyle} />
          {error ? <div className="error center">{error}</div> : null}
          <button type="submit" className="btn block" style={tint('var(--green)')} disabled={register.isPending}>
            <Icon name={register.isPending ? 'loading' : 'check'} spin={register.isPending} />{t('पंजीकरण पूरा करें', 'Complete registration')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container narrow page">
      <PageHead icon="account-plus-outline" title={t('अपना पंजीकरण करें', 'Register Yourself')} subtitle={t('(एक बार की प्रक्रिया)', '(One-time process)')} />
      <form className="card stack" onSubmit={(e) => { e.preventDefault(); requestOtp(); }}>
        <CitizenFields form={form} onChange={(patch) => { setForm({ ...form, ...patch }); setError(''); }} mobileEditable />
        {error ? <div className="error">{error}</div> : null}
        <button type="submit" className="btn block" disabled={sendOtp.isPending}>
          {sendOtp.isPending ? <Icon name="loading" spin /> : null}{t('OTP भेजें', 'Send OTP')}
        </button>
        <p className="center small sub">
          {t('पहले से पंजीकृत हैं?', 'Already registered?')} <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 700 }}>{t('लॉगिन करें', 'Log in')}</Link>
        </p>
      </form>
      <p className="tiny sub center" style={{ marginTop: 12 }}>
        {t('आपकी जानकारी सुरक्षित है और केवल सरकारी योजनाओं के लिए उपयोग होगी।', 'Your information is safe and will only be used for government schemes.')}
      </p>
    </div>
  );
}
