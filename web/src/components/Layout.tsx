import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore, useT } from '../store';
import { Logo } from './Art';
import { Icon, LangToggle, tint } from './ui';

const LINKS: { to: string; hi: string; en: string }[] = [
  { to: '/', hi: 'होम', en: 'Home' },
  { to: '/schemes', hi: 'योजनाएँ', en: 'Schemes' },
  { to: '/complaint', hi: 'शिकायत दर्ज करें', en: 'Raise Complaint' },
  { to: '/requests', hi: 'मेरी आवेदनें', en: 'My Applications' },
  { to: '/updates', hi: 'सूचनाएँ', en: 'Updates' },
  { to: '/dashboard', hi: 'गाँव की प्रगति', en: 'Village Dashboard' },
];

export function Layout() {
  const { t } = useT();
  const { pathname } = useLocation();
  const profile = useStore((s) => s.profile);
  const isAdmin = useStore((s) => s.isAdmin);
  const [open, setOpen] = useState(false);
  const resetDemo = useStore((s) => s.resetDemo);

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
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}>{t(l.hi, l.en)}</NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <LangToggle />
            <Link to="/register" className="btn sm" style={tint('var(--green)')}>
              <Icon name="account" size={17} />
              {profile ? profile.name : t('पंजीकरण', 'Register')}
            </Link>
            <Link to={isAdmin ? '/admin' : '/admin/login'} className="btn sm outline" style={tint('var(--navy)')}>
              <Icon name="shield-account" size={17} />
              {t('प्रशासक', 'Admin')}
            </Link>
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
          <button
            className="btn sm outline"
            style={{ background: 'transparent', color: '#fff', borderColor: '#7f9bd0' }}
            title={t('पंजीकरण और नई शिकायतें हटाकर नमूना डेटा वापस लाएँ', 'Remove the registration and new complaints and restore the sample data')}
            onClick={() => { if (window.confirm(t('डेमो डेटा रीसेट करें?', 'Reset the demo data?'))) resetDemo(); }}
          >
            <Icon name="refresh" size={16} />{t('डेमो रीसेट करें', 'Reset demo')}
          </button>
        </div>
      </footer>
    </>
  );
}
