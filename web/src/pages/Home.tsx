import { Link } from 'react-router-dom';
import { useNotices, useVillageStats } from '../api/hooks';
import { Banner } from '../components/Art';
import { Icon, Loaded, tint } from '../components/ui';
import { FLOW, Icon as IconName, L, STATUS, isStaff, l } from '../data';
import { useT, useUser } from '../store';
import { C } from '../theme';

const TILES: { to: string; icon: IconName; color: string; hi: string; en: string }[] = [
  { to: '/profile', icon: 'account', color: C.green, hi: 'मेरी जानकारी', en: 'My Profile' },
  { to: '/schemes', icon: 'bank', color: C.orange, hi: 'योजनाएँ', en: 'Government Schemes' },
  { to: '/complaint', icon: 'bullhorn', color: C.red, hi: 'मेरी समस्या', en: 'Complaint / Request' },
  { to: '/updates', icon: 'bell-ring', color: C.purple, hi: 'सूचनाएँ', en: 'Latest Updates' },
  { to: '/requests', icon: 'file-document-outline', color: C.blue, hi: 'मेरी आवेदनें', en: 'My Applications' },
  { to: '/dashboard', icon: 'home-city', color: C.teal, hi: 'गाँव की प्रगति', en: 'Village Dashboard' },
];

const FLOW_STEPS: { icon: IconName; text: L }[] = [
  { icon: 'account-outline', text: l('नागरिक अनुरोध भेजता है', 'Citizen submits request') },
  { icon: 'file-document-outline', text: l('पंचायत प्राप्त कर जांचती है', 'Panchayat receives & verifies') },
  { icon: 'account-group-outline', text: l('पंचायत समिति / विभाग को भेजा', 'Forward to Panchayat Samiti / Department') },
  { icon: 'cog-outline', text: l('विभाग कार्रवाई करता है', 'Action taken by department') },
  { icon: 'check-circle-outline', text: l('स्थिति अपडेट, नागरिक को सूचना', 'Update status & notify citizen') },
  { icon: 'account-check-outline', text: l('नागरिक समाधान की पुष्टि करता है', 'Citizen confirms resolution') },
];

const CHANNELS: { icon: IconName; color: string; name: L; note: L }[] = [
  { icon: 'cellphone', color: C.navy, name: l('मोबाइल ऐप', 'Mobile App'), note: l('iOS / Android', 'iOS / Android') },
  { icon: 'web', color: C.navy, name: l('वेब पोर्टल', 'Web Portal'), note: l('किसी भी ब्राउज़र में', 'Any browser') },
  { icon: 'whatsapp', color: C.green, name: l('व्हाट्सऐप', 'WhatsApp'), note: l('त्वरित अपडेट के लिए', 'For quick updates') },
  { icon: 'face-agent', color: C.red, name: l('ग्राम हेल्प डेस्क', 'Village Help Desk'), note: l('बिना स्मार्टफोन वालों के लिए', 'For those without smartphones') },
];

const USERS: { icon: IconName; name: L }[] = [
  { icon: 'school', name: l('छात्र (युवा वर्ग)', 'Students (Youth)') },
  { icon: 'sprout', name: l('किसान', 'Farmers') },
  { icon: 'face-woman', name: l('महिला', 'Women') },
  { icon: 'human-cane', name: l('वरिष्ठ नागरिक', 'Senior Citizens') },
  { icon: 'account-group', name: l('सभी ग्रामीण नागरिक', 'All Villagers') },
];

const WHY: L[] = [
  l('सरकारी योजनाओं तक आसान पहुँच', 'Easy access to government schemes'),
  l('समस्या की ऑनलाइन शिकायत और ट्रैकिंग', 'Online complaints with tracking'),
  l('पारदर्शिता और जवाबदेही', 'Transparency and accountability'),
  l('समय पर सूचना और अलर्ट', 'Timely information and alerts'),
  l('हर नागरिक के लिए समान अवसर', 'Equal opportunity for every citizen'),
];

const PLEDGE: { color: string; title: L; note: L }[] = [
  { color: C.green, title: l('डिजिटल सर्वे', 'Digital Survey'), note: l('पहले 100 दिन', 'First 100 days') },
  { color: '#F2A91C', title: l('योजनाओं की जानकारी', 'Scheme Information'), note: l('हर घर तक', 'To every home') },
  { color: C.red, title: l('समस्या समाधान', 'Problem Resolution'), note: l('समयबद्ध', 'Time-bound') },
  { color: C.orange, title: l('विकास कार्यों की निगरानी', 'Monitoring Development Works'), note: l('पारदर्शिता के साथ', 'With transparency') },
  { color: C.teal, title: l('रूपावास को स्मार्ट और आत्मनिर्भर बनाना', 'A smart, self-reliant Roopawas'), note: l('', '') },
];

export function Home() {
  const { t, tl, lang } = useT();
  const profile = useUser();
  const staff = isStaff(profile);
  const notices = useNotices();
  const stats = useVillageStats();

  return (
    <>
      <section className="hero">
        <div className="container hero-in">
          <div>
            {profile ? <p className="sub" style={{ fontWeight: 600 }}>{t(`नमस्ते, ${profile.name}`, `Namaste, ${profile.name}`)}</p> : null}
            <h1>{t('रूपावास की डिजिटल सेवा', 'The digital service of Roopawas')}</h1>
            <p className="lead">
              {t(
                'हर नागरिक के लिए योजना की जानकारी, समस्या की शिकायत और समाधान की निगरानी – एक ही जगह',
                'Scheme information, complaints and resolution tracking for every citizen – in one place',
              )}
            </p>
            <div className="row wrap">
              {staff ? (
                <Link to="/admin" className="btn" style={tint('var(--navy)')}><Icon name="view-dashboard-outline" />{t('प्रशासक डैशबोर्ड', 'Admin dashboard')}</Link>
              ) : (
                <>
                  <Link to="/complaint" className="btn" style={tint('var(--orange)')}><Icon name="bullhorn" />{t('शिकायत दर्ज करें', 'Raise a complaint')}</Link>
                  <Link to={profile ? '/schemes' : '/login'} className="btn outline" style={tint('var(--green)')}>
                    <Icon name={profile ? 'bank' : 'login'} />
                    {profile ? t('मेरे लिए योजनाएँ', 'Schemes for me') : t('लॉगिन / पंजीकरण', 'Log in / Register')}
                  </Link>
                </>
              )}
            </div>
            <p style={{ marginTop: 22 }}><span className="motto">{t('“साथ मिलकर, बेहतर रूपावास”', '“Together, a better Roopawas”')}</span></p>
          </div>
          <div className="hero-art"><Banner /></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">{t('सेवाएँ', 'Services')}</h2>
          <div className="grid g3">
            {TILES.map((tile) => (
              <Link key={tile.to} to={tile.to} className="tile" style={{ background: tile.color }}>
                <Icon name={tile.icon} size={38} />
                <b>{lang === 'hi' ? tile.hi : tile.en}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">{t('शिकायत / अनुरोध की प्रक्रिया', 'Complaint / Request Flow')}</h2>
            <div className="flow">
              {FLOW_STEPS.map((s, i) => (
                <div className="flow-step" key={s.text.en}>
                  <span className="num">{i + 1}</span>
                  <div className="ico"><Icon name={s.icon} size={30} /></div>
                  <div className="small">{tl(s.text)}</div>
                </div>
              ))}
            </div>
            <h4 style={{ margin: '20px 0 8px' }}>{t('स्थिति ट्रैकिंग', 'Status Tracking')}</h4>
            <div className="pills">
              {FLOW.map((s) => <span key={s} className="pill" style={{ background: STATUS[s].color }}>{tl(STATUS[s].name)}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="card">
            <div className="row" style={{ marginBottom: 6 }}>
              <h2 className="section-title grow" style={{ margin: 0 }}>{t('रूपावास – गाँव की प्रगति', 'Roopawas – Village Progress')}</h2>
              <Link to="/dashboard" className="btn sm outline">{t('पूरा देखें', 'View all')}</Link>
            </div>
            <Loaded q={stats}>
              {(st) => (
                <>
                  <div className="big">{st.total}</div>
                  <div className="sub small">{t('कुल अनुरोध', 'Total requests')}</div>
                  <div className="total-bar">
                    <div style={{ flex: st.resolved, background: 'var(--green)' }} />
                    <div style={{ flex: st.inProgress, background: 'var(--amber)' }} />
                    <div style={{ flex: st.forwarded, background: 'var(--orange)' }} />
                  </div>
                  <div className="grid g3">
                    <div><div className="tiny sub">{t('निपटाए गए', 'Resolved')}</div><b style={{ color: 'var(--green)', fontSize: 20 }}>{st.resolved}</b></div>
                    <div><div className="tiny sub">{t('प्रगति पर', 'In progress')}</div><b style={{ color: 'var(--amber)', fontSize: 20 }}>{st.inProgress}</b></div>
                    <div><div className="tiny sub">{t('विभाग को भेजे', 'Sent to dept')}</div><b style={{ color: 'var(--orange)', fontSize: 20 }}>{st.forwarded}</b></div>
                  </div>
                </>
              )}
            </Loaded>
          </div>
          <div className="card stack">
            <div className="row">
              <h2 className="section-title grow" style={{ margin: 0 }}>{t('ताज़ा सूचनाएँ', 'Latest Information')}</h2>
              <Link to="/updates" className="btn sm outline">{t('सभी', 'All')}</Link>
            </div>
            <Loaded q={notices}>
              {(list) => list.slice(0, 3).map((n) => (
                <div className="row" key={n.id} style={{ alignItems: 'flex-start' }}>
                  <span className="bubble" style={{ width: 38, height: 38, background: n.color }}><Icon name={n.icon} color="#fff" /></span>
                  <div className="grow">
                    <b>{tl(n.title)}</b>
                    <div className="small sub">{tl(n.body)}</div>
                  </div>
                </div>
              ))}
            </Loaded>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid g3">
          <div className="card">
            <h3 style={{ color: 'var(--red)', marginBottom: 12 }}>{t('कई माध्यमों से पहुँच', 'Multi-Channel Access')}</h3>
            <div className="grid g2">
              {CHANNELS.map((c) => (
                <div className="center" key={c.name.en}>
                  <Icon name={c.icon} size={34} color={c.color} />
                  <div><b>{tl(c.name)}</b></div>
                  <div className="tiny sub">{tl(c.note)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ color: 'var(--purple)', marginBottom: 12 }}>{t('कौन उपयोग कर सकता है?', 'Who Can Use?')}</h3>
            <div className="grid g3" style={{ gap: 10 }}>
              {USERS.map((u) => (
                <div className="center" key={u.name.en}>
                  <Icon name={u.icon} size={32} color="var(--purple)" />
                  <div className="small">{tl(u.name)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>{t('रूपावास सेवा क्यों?', 'Why Roopawas Seva?')}</h3>
            <div className="check-list">
              {WHY.map((w) => <div key={w.en}><Icon name="check-circle" color="var(--green)" />{tl(w)}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="pledge">
            <div className="row wrap">
              <Icon name="hand-heart" size={36} color="var(--green)" />
              <h2 className="grow">{t('हमारा संकल्प – 5 साल, 5 बड़े कदम', 'Our Pledge – 5 Years, 5 Big Steps')}</h2>
              <b style={{ color: 'var(--green)', fontSize: 18 }}>{t('मिलकर बनाएं बेहतर रूपावास', 'Together, a better Roopawas')}</b>
            </div>
            <div className="pledge-steps">
              {PLEDGE.map((p, i) => (
                <div className="row" key={p.title.en} style={{ alignItems: 'flex-start', gap: 10 }}>
                  <span className="n" style={{ background: p.color }}>{i + 1}</span>
                  <div>
                    <b>{tl(p.title)}</b>
                    {p.note.en ? <div className="tiny sub">({tl(p.note)})</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
