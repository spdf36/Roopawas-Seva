import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Art';
import { Field, Icon, tint } from '../components/ui';
import { DEMO_LOGINS, Icon as IconName, Role, ROLE_NAME } from '../data';
import { useStore, useT } from '../store';

const ROLE_ICON: Record<Role, IconName> = { citizen: 'account', admin: 'account-tie', superadmin: 'shield-crown' };

export function Login() {
  const { t, tl } = useT();
  const login = useStore((s) => s.login);
  const [loginId, setLoginId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const result = login(loginId, pin);
    if (result === 'invalid') return setError(t('मोबाइल नंबर / यूज़र आईडी या पिन गलत है।', 'Incorrect mobile number / user ID or PIN.'));
    if (result === 'inactive') setError(t('यह खाता निष्क्रिय है। पंचायत कार्यालय से संपर्क करें।', 'This account is deactivated. Please contact the Panchayat office.'));
    // On success the GuestOnly route wrapper redirects to the right page.
  };

  return (
    <div className="container page" style={{ maxWidth: 460 }}>
      <div className="center" style={{ marginBottom: 14 }}>
        <Logo size={76} />
        <h1 style={{ fontSize: 26 }}>{t('लॉगिन करें', 'Log in')}</h1>
        <p className="sub">{t('नागरिक, प्रशासक और सुपर एडमिन – सभी यहीं से लॉगिन करें', 'Citizens, admins and super admins all log in here')}</p>
      </div>
      <form className="card stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field
          label={t('मोबाइल नंबर / यूज़र आईडी', 'Mobile number / User ID')} required icon="account" value={loginId} autoCapitalize="none" autoComplete="username"
          placeholder={t('जैसे: 98765 43210', 'e.g. 98765 43210')} onChange={(e) => { setLoginId(e.target.value); setError(''); }}
        />
        <Field
          label={t('पिन', 'PIN')} required icon="lock-outline" type="password" inputMode="numeric" maxLength={4} value={pin} placeholder="••••" autoComplete="current-password"
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
        />
        {error ? <div className="error">{error}</div> : null}
        <button type="submit" className="btn block" style={tint('var(--navy)')} disabled={!loginId.trim() || pin.length !== 4}>
          <Icon name="login" />{t('लॉगिन करें', 'Log in')}
        </button>
        <p className="center small sub">
          {t('नए नागरिक हैं?', 'New citizen?')} <Link to="/register" style={{ color: 'var(--green)', fontWeight: 700 }}>{t('पंजीकरण करें', 'Register')}</Link>
        </p>
      </form>
      <div className="card stack" style={{ marginTop: 14, gap: 4, background: 'var(--amber-soft)', borderColor: '#f0d9a0', color: 'var(--amber)' }}>
        <b className="small">{t('डेमो लॉगिन (भरने के लिए क्लिक करें)', 'Demo logins (click to fill)')}</b>
        {DEMO_LOGINS.map((d) => (
          <button
            key={d.role} type="button" className="row small"
            style={{ background: 'none', border: 0, padding: '4px 0', color: 'inherit', textAlign: 'left' }}
            onClick={() => { setLoginId(d.loginId); setPin(d.pin); setError(''); }}
          >
            <Icon name={ROLE_ICON[d.role]} size={18} />
            <b style={{ width: 100 }}>{tl(ROLE_NAME[d.role])}</b>
            <span>{d.loginId}  /  {d.pin}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
