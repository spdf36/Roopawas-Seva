import { Role, isStaff } from '@shared/data';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLogout, useResetDemo, useServerInfo, useSessionCheck } from '../api/hooks';
import { useT, useUser } from '../store';
import { Logo } from './Art';
import { Icon, LangToggle, tint } from './ui';

// `roles` limits a link to logged-in users with those roles; links without it are public.
const LINKS: { to: string; hi: string; en: string; roles?: Role[] }[] = [
  { to: '/', hi: 'होम', en: 'Home' },
  { to: '/schemes', hi: 'योजनाएँ', en: 'Schemes' },
  { to: '/complaint', hi: 'शिकायत दर्ज करें', en: 'Raise Complaint', roles: ['citizen'] },
  { to: '/requests', hi: 'मेरी आवेदनें', en: 'My Applications', roles: ['citizen'] },
  { to: '/updates', hi: 'सूचनाएँ', en: 'Updates' },
  { to: '/dashboard', hi: 'गाँव की प्रगति', en: 'Village Dashboard' },
  { to: '/yojnas', hi: 'विकास योजनाएँ', en: 'Village Yojnas' },
  { to: '/about', hi: 'सहायता', en: 'Help' },
  { to: '/admin', hi: 'प्रशासक डैशबोर्ड', en: 'Admin Dashboard', roles: ['admin', 'superadmin'] },
];

export function Layout() {
  const { t, lang } = useT();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useUser();
  const logout = useLogout();
  const resetDemo = useResetDemo();
  const demo = useServerInfo().data?.demoMode;
  const [open, setOpen] = useState(false);
  useSessionCheck();

  // Keep the page's declared language in step with the language toggle.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Each navigation starts at the top with the mobile menu closed.
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <header className={`nav${open ? ' open' : ''}`}>
        <div className="container nav-in">
          <Link to="/" className="brand">
            <Logo />
            <div>
              <b>Roopawas Seva</b>
              <span>रूपावास की डिजिटल सेवा</span>
            </div>
          </Link>
          <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <Icon name={open ? 'close' : 'menu'} size={28} />
          </button>
          <nav className="nav-links">
            {LINKS.filter((l) => !l.roles || (user && l.roles.includes(user.role))).map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}>{t(l.hi, l.en)}</NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <LangToggle />
            {user ? (
              <>
                <Link to={isStaff(user) ? '/admin' : '/profile'} className="btn sm" style={tint(isStaff(user) ? 'var(--navy)' : 'var(--green)')}>
                  <Icon name={user.role === 'citizen' ? 'account' : user.role === 'admin' ? 'account-tie' : 'shield-crown'} size={17} />
                  {user.name}
                </Link>
                <button className="btn sm outline" style={tint('var(--red)')} title={t('लॉग आउट', 'Log out')} disabled={logout.isPending} onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/') })}>
                  <Icon name="logout" size={17} />{t('लॉग आउट', 'Log out')}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn sm" style={tint('var(--navy)')}>
                <Icon name="login" size={17} />{t('लॉगिन', 'Log in')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="footer">
        <div className="container row wrap">
          <div className="grow">
            <b>Roopawas Seva</b>
            <div>{t('ग्राम पंचायत रूपावास की डिजिटल सेवा', 'The digital service of Gram Panchayat Roopawas')}</div>
          </div>
          <div>{t('मिलकर बनाएं बेहतर रूपावास', 'Together, let us build a better Roopawas')}</div>
          {/* Only a demo server can be reset. */}
          {demo ? (
            <button
              className="btn sm outline"
              style={{ background: 'transparent', color: '#fff', borderColor: '#7f9bd0' }}
              title={t('नए खाते और शिकायतें हटाकर नमूना डेटा वापस लाएँ (लॉग आउट हो जाएँगे)', 'Remove new accounts and complaints and restore the sample data (logs you out)')}
              disabled={resetDemo.isPending}
              onClick={() => { if (window.confirm(t('डेमो डेटा रीसेट करें?', 'Reset the demo data?'))) resetDemo.mutate(undefined, { onSuccess: () => navigate('/') }); }}
            >
              <Icon name="refresh" size={16} />{t('डेमो रीसेट करें', 'Reset demo')}
            </button>
          ) : null}
        </div>
      </footer>
    </>
  );
}
