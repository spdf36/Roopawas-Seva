import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CitizenFields, CitizenForm, useValidateCitizen } from '../components/CitizenFields';
import { Icon, PageHead, tint } from '../components/ui';
import { AGE_GROUPS, Icon as IconName, L, OCCUPATIONS, WARDS } from '../data';
import { useStore, useT, useUser } from '../store';

export function Profile() {
  const { t, tl } = useT();
  const navigate = useNavigate();
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
      <div className="container narrow page">
        <PageHead icon="account-edit-outline" title={t('जानकारी बदलें', 'Edit Details')} />
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <CitizenFields form={form} onChange={(patch) => { setForm({ ...form, ...patch }); setError(''); }} mobileEditable={false} />
          {error ? <div className="error">{error}</div> : null}
          <div className="row wrap">
            <button type="submit" className="btn" style={tint('var(--green)')}><Icon name="content-save-outline" />{t('सेव करें', 'Save')}</button>
            <button type="button" className="btn outline" style={tint('var(--sub)')} onClick={() => { setForm(null); setError(''); }}>{t('रद्द करें', 'Cancel')}</button>
          </div>
        </form>
      </div>
    );
  }

  const nameOf = (list: { id: string; name: L }[], id?: string) => {
    const hit = list.find((o) => o.id === id);
    return hit ? tl(hit.name) : '—';
  };
  const line = (icon: IconName, label: string, value: string) => (
    <div className="row">
      <Icon name={icon} color="var(--navy)" />
      <div><div className="tiny sub">{label}</div><b>{value}</b></div>
    </div>
  );

  return (
    <div className="container narrow page">
      <PageHead icon="account-outline" title={t('मेरी जानकारी', 'My Profile')} />
      <div className="card stack">
        <div className="ok row" style={{ gap: 6 }}><Icon name="check-decagram" />{t('मोबाइल सत्यापित', 'Mobile verified')}</div>
        {line('account', t('नाम', 'Name'), user.name)}
        {line('cellphone', t('मोबाइल नंबर (लॉगिन)', 'Mobile Number (login)'), `+91 ${user.mobile}`)}
        {line('calendar-account', t('आयु वर्ग', 'Age Group'), nameOf(AGE_GROUPS, user.ageGroup))}
        {line('map-marker', t('गाँव / वार्ड', 'Village / Ward'), nameOf(WARDS, user.ward))}
        {line('briefcase-outline', t('पेशा / श्रेणी', 'Occupation / Category'), nameOf(OCCUPATIONS, user.occupation))}
        {line('account-group', t('परिवार के सदस्य', 'Family Members'), user.family || '—')}
        <div className="row wrap" style={{ marginTop: 6 }}>
          <button className="btn" onClick={() => setForm({ name: user.name, mobile: user.mobile, ageGroup: user.ageGroup ?? '', ward: user.ward ?? '', occupation: user.occupation ?? '', family: user.family ?? '' })}>
            <Icon name="pencil" />{t('जानकारी बदलें', 'Edit details')}
          </button>
          <Link to="/schemes" className="btn outline" style={tint('var(--orange)')}><Icon name="bank-outline" />{t('मेरे लिए योजनाएँ देखें', 'See schemes for me')}</Link>
          <button className="btn outline" style={tint('var(--red)')} onClick={() => { logout(); navigate('/'); }}><Icon name="logout" />{t('लॉग आउट', 'Log out')}</button>
        </div>
      </div>
    </div>
  );
}
