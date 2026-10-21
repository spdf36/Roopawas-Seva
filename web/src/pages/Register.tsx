import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field, Icon, PageHead, Select, tint } from '../components/ui';
import { AGE_GROUPS, Icon as IconName, L, OCCUPATIONS, WARDS } from '../data';
import { Profile, useStore, useT } from '../store';

const EMPTY: Profile = { name: '', mobile: '', ageGroup: '', ward: '', occupation: '', family: '' };

export function Register() {
  const { t, tl } = useT();
  const profile = useStore((s) => s.profile);
  const saveProfile = useStore((s) => s.saveProfile);
  const clearProfile = useStore((s) => s.clearProfile);

  const [editing, setEditing] = useState(!profile);
  const [form, setForm] = useState<Profile>(profile ?? EMPTY);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const set = (patch: Partial<Profile>) => { setForm({ ...form, ...patch }); setError(''); };
  const opts = (list: { id: string; name: L }[]) => list.map((o) => ({ id: o.id, label: tl(o.name) }));
  const nameOf = (list: { id: string; name: L }[], id: string) => {
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
    const line = (icon: IconName, label: string, value: string) => (
      <div className="row">
        <Icon name={icon} color="var(--navy)" />
        <div><div className="tiny sub">{label}</div><b>{value}</b></div>
      </div>
    );
    return (
      <div className="container narrow page">
        <PageHead icon="account-outline" title={t('मेरी जानकारी', 'My Profile')} subtitle={t('आपका पंजीकरण पूरा है', 'Your registration is complete')} />
        <div className="card stack">
          <div className="ok row" style={{ gap: 6 }}><Icon name="check-decagram" />{t('मोबाइल सत्यापित', 'Mobile verified')}</div>
          {line('account', t('नाम', 'Name'), profile.name)}
          {line('cellphone', t('मोबाइल नंबर', 'Mobile Number'), `+91 ${profile.mobile}`)}
          {line('calendar-account', t('आयु वर्ग', 'Age Group'), nameOf(AGE_GROUPS, profile.ageGroup))}
          {line('map-marker', t('गाँव / वार्ड', 'Village / Ward'), nameOf(WARDS, profile.ward))}
          {line('briefcase-outline', t('पेशा / श्रेणी', 'Occupation / Category'), nameOf(OCCUPATIONS, profile.occupation))}
          {line('account-group', t('परिवार के सदस्य', 'Family Members'), profile.family || '—')}
          <div className="row wrap" style={{ marginTop: 6 }}>
            <button className="btn" onClick={() => { setForm(profile); setEditing(true); }}><Icon name="pencil" />{t('जानकारी बदलें', 'Edit details')}</button>
            <Link to="/schemes" className="btn outline" style={tint('var(--orange)')}><Icon name="bank-outline" />{t('मेरे लिए योजनाएँ देखें', 'See schemes for me')}</Link>
            <button className="btn outline" style={tint('var(--red)')} onClick={() => { clearProfile(); setForm(EMPTY); setEditing(true); }}><Icon name="logout" />{t('लॉग आउट', 'Log out')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="container narrow page">
        <PageHead icon="cellphone-message" title={t('OTP सत्यापन', 'OTP Verification')} />
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); verify(); }}>
          <p className="center">{t(`+91 ${form.mobile} पर भेजा गया 4 अंकों का OTP डालें`, `Enter the 4-digit OTP sent to +91 ${form.mobile}`)}</p>
          <Field
            label="OTP" required value={otp} autoFocus inputMode="numeric" maxLength={4} placeholder="• • • •"
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
          />
          <div className="demo-hint">{t('डेमो: कोई भी 4 अंक डालें (असली SMS नहीं भेजा जाता)', 'Demo: enter any 4 digits (no real SMS is sent)')}</div>
          {error ? <div className="error center">{error}</div> : null}
          <button type="submit" className="btn block" style={tint('var(--green)')}><Icon name="check" />{t('सत्यापित करें', 'Verify')}</button>
          <button type="button" className="btn outline block" onClick={() => { setStep('form'); setError(''); }}>{t('नंबर बदलें', 'Change number')}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container narrow page">
      <PageHead
        icon="account-plus-outline"
        title={profile ? t('जानकारी बदलें', 'Edit Details') : t('अपना पंजीकरण करें', 'Register Yourself')}
        subtitle={t('(एक बार की प्रक्रिया)', '(One-time process)')}
      />
      <form className="card stack" onSubmit={(e) => { e.preventDefault(); sendOtp(); }}>
        <Field label={t('नाम', 'Name')} required icon="account" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={t('जैसे: रामलाल शर्मा', 'e.g. Ramlal Sharma')} />
        <Field label={t('मोबाइल नंबर', 'Mobile Number')} required icon="cellphone" value={form.mobile} inputMode="numeric" maxLength={10} placeholder="98765 43210" onChange={(e) => set({ mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
        <div className="grid g2 collapse">
          <Select label={t('आयु वर्ग', 'Age Group')} required icon="calendar-account" value={form.ageGroup} placeholder={t('चुनें', 'Select')} options={opts(AGE_GROUPS)} onChange={(ageGroup) => set({ ageGroup })} />
          <Select label={t('गाँव / वार्ड', 'Village / Ward')} required icon="map-marker" value={form.ward} placeholder={t('चुनें', 'Select')} options={opts(WARDS)} onChange={(ward) => set({ ward })} />
        </div>
        <Select label={t('पेशा / श्रेणी', 'Occupation / Category')} required icon="briefcase-outline" value={form.occupation} placeholder={t('चुनें (किसान, छात्र, नौकरीपेशा आदि)', 'Select (farmer, student, employed…)')} options={opts(OCCUPATIONS)} onChange={(occupation) => set({ occupation })} />
        <Field label={t('परिवार के सदस्य (वैकल्पिक)', 'Family Members (optional)')} icon="account-group" value={form.family} inputMode="numeric" placeholder={t('जोड़ें', 'Add')} onChange={(e) => set({ family: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
        {error ? <div className="error">{error}</div> : null}
        <button type="submit" className="btn block">{t('OTP भेजें', 'Send OTP')}</button>
        {profile ? <button type="button" className="btn outline block" style={tint('var(--sub)')} onClick={() => { setEditing(false); setError(''); }}>{t('रद्द करें', 'Cancel')}</button> : null}
      </form>
      <p className="tiny sub center" style={{ marginTop: 12 }}>
        {t('आपकी जानकारी सुरक्षित है और केवल सरकारी योजनाओं के लिए उपयोग होगी।', 'Your information is safe and will only be used for government schemes.')}
      </p>
    </div>
  );
}
