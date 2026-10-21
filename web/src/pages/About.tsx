import { Icon as IconName, L, OVERDUE_DAYS, REOPEN_DAYS, l } from '@shared/data';
import { Link } from 'react-router-dom';
import { Icon, PageHead, tint } from '../components/ui';
import { useT } from '../store';

// Help for citizens. Every answer here describes what the portal actually does today; keep it in step
// when features change.

const STEPS: { icon: IconName; title: L; text: L; to: string }[] = [
  {
    icon: 'account-plus-outline', to: '/register',
    title: l('1. पंजीकरण करें', '1. Register'),
    text: l('अपना नाम, मोबाइल नंबर, वार्ड और पेशा भरें, OTP डालें और लॉगिन के लिए 4 अंकों का पिन चुनें।', 'Enter your name, mobile number, ward and occupation, enter the OTP and choose a 4-digit PIN for logging in.'),
  },
  {
    icon: 'bullhorn-outline', to: '/complaint',
    title: l('2. शिकायत दर्ज करें', '2. Raise a complaint'),
    text: l('श्रेणी चुनें, समस्या लिखें, चाहें तो फोटो और GPS स्थान जोड़ें। आपको RP-2026-00128 जैसा आवेदन नंबर मिलेगा।', 'Choose a category, describe the problem, and add a photo and your GPS location if you like. You get a request number such as RP-2026-00128.'),
  },
  {
    icon: 'bank-outline', to: '/schemes',
    title: l('3. योजनाओं में आवेदन करें', '3. Apply for schemes'),
    text: l('आपके पेशे से जुड़ी योजनाएँ सबसे ऊपर दिखती हैं। “आवेदन करें” दबाते ही आवेदन पंचायत तक पहुँच जाता है।', 'Schemes for your occupation are shown first. Pressing “Apply” sends your application to the Panchayat.'),
  },
  {
    icon: 'clipboard-text-clock-outline', to: '/requests',
    title: l('4. स्थिति देखें', '4. Track the status'),
    text: l('“मेरी आवेदनें” में हर आवेदन के छह चरण दिखते हैं, साथ में पंचायत की टिप्पणी और तारीख।', 'Under “My Applications” each request shows its six steps, with the Panchayat’s notes and dates.'),
  },
];

const FAQ: { q: L; a: L }[] = [
  {
    q: l('मेरी शिकायत कौन देख सकता है?', 'Who can see my complaint?'),
    a: l('केवल आप और ग्राम पंचायत के अधिकृत कर्मचारी। दूसरे नागरिक आपकी शिकायत या आपका मोबाइल नंबर नहीं देख सकते।', 'Only you and authorised Gram Panchayat staff. Other citizens cannot see your complaint or your mobile number.'),
  },
  {
    q: l('शिकायत के बाद क्या होता है?', 'What happens after I raise a complaint?'),
    a: l('पंचायत उसे प्राप्त कर जांचती है, समीक्षा करती है और ज़रूरत हो तो संबंधित विभाग को भेजती है। हर बदलाव आपकी आवेदन की स्थिति में दिखता है।', 'The Panchayat receives and checks it, reviews it and, if needed, forwards it to the concerned department. Every change shows up in your request’s status.'),
  },
  {
    q: l('“हल” लिखा है पर समस्या ठीक नहीं हुई, क्या करूँ?', 'It says “Resolved” but the problem is not fixed. What can I do?'),
    a: l(
      `आवेदन खोलें और “नहीं, समस्या अभी भी है” दबाकर कारण लिखें। आवेदन फिर से पंचायत की समीक्षा में चला जाएगा। यह हल होने के ${REOPEN_DAYS} दिन के भीतर और पुष्टि करने से पहले ही हो सकता है।`,
      `Open the request, press “No, the problem is still there” and write what is wrong. It goes back to the Panchayat for review. You can do this within ${REOPEN_DAYS} days of it being resolved, and before you confirm it.`,
    ),
  },
  {
    q: l('मेरी शिकायत पर बहुत समय लग रहा है।', 'My complaint is taking a long time.'),
    a: l(
      `पंचायत को हर खुले आवेदन के दिन दिखते हैं, और ${OVERDUE_DAYS} दिन से अधिक पुराने आवेदन अलग से चिह्नित होते हैं। आप अपने आवेदन नंबर के साथ पंचायत कार्यालय में भी पूछ सकते हैं।`,
      `The Panchayat sees how many days every open request has been waiting, and requests older than ${OVERDUE_DAYS} days are flagged. You can also ask at the Panchayat office, quoting your request number.`,
    ),
  },
  {
    q: l('GPS स्थान क्यों माँगा जाता है?', 'Why is my GPS location asked for?'),
    a: l('इससे टीम को सही जगह ढूँढने में मदद मिलती है। यह वैकल्पिक है: आप केवल पता लिखकर भी शिकायत भेज सकते हैं।', 'It helps the team find the exact spot. It is optional: you can send a complaint with just the address.'),
  },
  {
    q: l('मेरे पास स्मार्टफोन नहीं है।', 'I do not have a smartphone.'),
    a: l('वेबसाइट किसी भी ब्राउज़र में चलती है। आप ग्राम पंचायत कार्यालय जाकर भी शिकायत या आवेदन दर्ज करवा सकते हैं।', 'The website works in any browser. You can also visit the Gram Panchayat office to have a complaint or application registered.'),
  },
];

export function About() {
  const { t, tl } = useT();
  return (
    <div className="container page" style={{ maxWidth: 900 }}>
      <PageHead
        icon="help-circle-outline" title={t('सहायता और जानकारी', 'Help & About')}
        subtitle={t('रूपावास सेवा – ग्राम पंचायत रूपावास की डिजिटल सेवा', 'Roopawas Seva – the digital service of Gram Panchayat Roopawas')}
      />
      <div className="stack" style={{ gap: 22 }}>
        <p className="sub" style={{ fontSize: 18 }}>
          {t(
            'हर नागरिक के लिए योजना की जानकारी, समस्या की शिकायत और समाधान की निगरानी – एक ही जगह। पंचायत की सूचनाएँ और गाँव की प्रगति सबके लिए खुली हैं; शिकायत और आवेदन के लिए एक बार पंजीकरण ज़रूरी है।',
            'Scheme information, complaints and resolution tracking for every citizen – in one place. Notices and village progress are open to everyone; complaints and applications need a one-time registration.',
          )}
        </p>

        <section>
          <h2 className="section-title">{t('कैसे उपयोग करें', 'How to use it')}</h2>
          <div className="grid g2 collapse">
            {STEPS.map((s) => (
              <Link key={s.to} to={s.to} className="card row" style={{ alignItems: 'flex-start' }}>
                <Icon name={s.icon} size={30} color="var(--navy)" />
                <div>
                  <b>{tl(s.title)}</b>
                  <p className="small sub">{tl(s.text)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">{t('अक्सर पूछे जाने वाले सवाल', 'Frequently asked questions')}</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q.en} className="card">
                <summary><b>{tl(f.q)}</b></summary>
                <p className="sub">{tl(f.a)}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="card row wrap" style={{ background: 'var(--blue-soft)', borderColor: '#bcd3f5' }}>
          <Icon name="account-question-outline" size={30} color="var(--navy)" />
          <p className="grow">{t('और सहायता चाहिए? ग्राम पंचायत कार्यालय, रूपावास में संपर्क करें।', 'Need more help? Contact the Gram Panchayat office in Roopawas.')}</p>
          <Link to="/" className="btn sm outline" style={tint('var(--navy)')}><Icon name="home" size={17} />{t('होम', 'Home')}</Link>
        </div>
      </div>
    </div>
  );
}
