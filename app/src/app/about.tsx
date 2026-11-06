import { L, OVERDUE_DAYS, REOPEN_DAYS, l } from '@shared/data';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Card, Heading, Ico, IconName, Row, Screen, Txt } from '../components/ui';
import { useT, useUser } from '../store';
import { C } from '../theme';

// Help for citizens, as on the website's Help page. Every answer describes what the app actually does today;
// keep it in step when features change.

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
    q: l('गाँव के विकास कार्य का पैसा कहाँ खर्च हुआ, कैसे जानूँ?', 'How can I see where the money for a village work was spent?'),
    a: l(
      '“ग्राम विकास योजनाएँ” में हर योजना की स्थिति, वह किस स्तर पर स्वीकृति के लिए रुकी है, किस स्रोत (केंद्र, राज्य…) से कितनी राशि मिली और हर खर्च बिल की फोटो के साथ दिखता है। इसके लिए लॉगिन ज़रूरी नहीं।',
      '“Village Yojnas” shows every yojna’s status, which approval level it is waiting on, how much each source (central, state…) has given, and every expense with a photo of its bill. No login is needed.',
    ),
  },
  {
    q: l('मेरे पास स्मार्टफोन नहीं है।', 'I do not have a smartphone.'),
    a: l('वेबसाइट किसी भी ब्राउज़र में चलती है। आप ग्राम पंचायत कार्यालय जाकर भी शिकायत या आवेदन दर्ज करवा सकते हैं।', 'The website works in any browser. You can also visit the Gram Panchayat office to have a complaint or application registered.'),
  },
];

export default function About() {
  const { t, tl } = useT();
  const router = useRouter();
  const user = useUser();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Screen back icon="help-circle-outline" title={t('सहायता और जानकारी', 'Help & About')}>
      <Txt size={16} color={C.sub}>
        {t(
          'हर नागरिक के लिए योजना की जानकारी, समस्या की शिकायत और समाधान की निगरानी – एक ही जगह। पंचायत की सूचनाएँ और गाँव की प्रगति सबके लिए खुली हैं; शिकायत और आवेदन के लिए एक बार पंजीकरण ज़रूरी है।',
          'Scheme information, complaints and resolution tracking for every citizen – in one place. Notices and village progress are open to everyone; complaints and applications need a one-time registration.',
        )}
      </Txt>

      <Heading>{t('कैसे उपयोग करें', 'How to use it')}</Heading>
      {STEPS.map((s) => {
        // Registration is for visitors, the rest for citizens; anything else just explains.
        const usable = s.to === '/register' ? !user : user?.role === 'citizen' || s.to === '/schemes';
        return (
          <Card key={s.to} onPress={usable ? () => router.push(s.to) : undefined} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Ico name={s.icon} size={28} color={C.navy} />
            <View style={{ flex: 1 }}>
              <Txt w="b" size={16}>{tl(s.title)}</Txt>
              <Txt size={14} color={C.sub}>{tl(s.text)}</Txt>
            </View>
          </Card>
        );
      })}

      <Heading>{t('अक्सर पूछे जाने वाले सवाल', 'Frequently asked questions')}</Heading>
      {FAQ.map((f, i) => (
        <Card key={f.q.en} style={{ paddingVertical: 4 }}>
          <Pressable onPress={() => setOpen(open === i ? null : i)} accessibilityRole="button" style={{ paddingVertical: 8 }}>
            <Row style={{ alignItems: 'flex-start' }}>
              <Txt w="b" size={15} style={{ flex: 1 }}>{tl(f.q)}</Txt>
              <Ico name={open === i ? 'chevron-up' : 'chevron-down'} size={22} color={C.sub} />
            </Row>
          </Pressable>
          {open === i ? <Txt size={14} color={C.sub} style={{ paddingBottom: 8 }}>{tl(f.a)}</Txt> : null}
        </Card>
      ))}

      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.blueSoft, borderColor: '#BCD3F5' }}>
        <Ico name="account-question-outline" size={28} color={C.navy} />
        <Txt style={{ flex: 1 }}>{t('और सहायता चाहिए? ग्राम पंचायत कार्यालय, रूपावास में संपर्क करें।', 'Need more help? Contact the Gram Panchayat office in Roopawas.')}</Txt>
      </Card>
      <Txt w="b" size={16} color={C.green} center>{t('मिलकर बनाएं बेहतर रूपावास', 'Together, let us build a better Roopawas')}</Txt>
    </Screen>
  );
}
