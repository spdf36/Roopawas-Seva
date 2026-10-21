import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { View } from 'react-native';
import { Card, Grid, Screen, Txt } from '../components/ui';
import { Icon, L, l } from '../data';
import { useT } from '../store';
import { C } from '../theme';

const CHANNELS: { icon: Icon; color: string; name: L; note: L }[] = [
  { icon: 'cellphone', color: C.navy, name: l('मोबाइल ऐप', 'Mobile App'), note: l('iOS / Android', 'iOS / Android') },
  { icon: 'web', color: C.navy, name: l('वेब पोर्टल', 'Web Portal'), note: l('किसी भी ब्राउज़र में', 'Any browser') },
  { icon: 'whatsapp', color: C.green, name: l('व्हाट्सऐप', 'WhatsApp'), note: l('त्वरित अपडेट के लिए', 'For quick updates') },
  { icon: 'face-agent', color: C.red, name: l('ग्राम हेल्प डेस्क', 'Village Help Desk'), note: l('बिना स्मार्टफोन वालों के लिए', 'For those without smartphones') },
];

const USERS: { icon: Icon; name: L }[] = [
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

const STEPS: { color: string; title: L; note: L }[] = [
  { color: C.green, title: l('डिजिटल सर्वे', 'Digital Survey'), note: l('पहले 100 दिन', 'First 100 days') },
  { color: '#F2A91C', title: l('योजनाओं की जानकारी', 'Scheme Information'), note: l('हर घर तक', 'To every home') },
  { color: C.red, title: l('समस्या समाधान', 'Problem Resolution'), note: l('समयबद्ध', 'Time-bound') },
  { color: C.orange, title: l('विकास कार्यों की निगरानी', 'Monitoring Development Works'), note: l('पारदर्शिता के साथ', 'With transparency') },
  { color: C.teal, title: l('रूपावास को स्मार्ट और आत्मनिर्भर बनाना', 'A smart, self-reliant Roopawas'), note: l('', '') },
];

export default function About() {
  const { t, tl } = useT();

  return (
    <Screen back icon="information-outline" title={t('रूपावास सेवा के बारे में', 'About Roopawas Seva')}>
      <Card style={{ gap: 10 }}>
        <Txt w="b" size={16} color={C.red}>{t('कई माध्यमों से पहुँच', 'Multi-Channel Access')}</Txt>
        <Grid cols={2}>
          {CHANNELS.map((c) => (
            <View key={c.name.en} style={{ alignItems: 'center', paddingVertical: 6 }}>
              <MCI name={c.icon} size={32} color={c.color} />
              <Txt w="b" size={15} center>{tl(c.name)}</Txt>
              <Txt size={12} color={C.sub} center>{tl(c.note)}</Txt>
            </View>
          ))}
        </Grid>
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt w="b" size={16} color={C.purple}>{t('कौन उपयोग कर सकता है?', 'Who Can Use?')}</Txt>
        <Grid cols={3}>
          {USERS.map((u) => (
            <View key={u.name.en} style={{ alignItems: 'center', paddingVertical: 6 }}>
              <MCI name={u.icon} size={30} color={C.purple} />
              <Txt w="m" size={13} center>{tl(u.name)}</Txt>
            </View>
          ))}
        </Grid>
      </Card>

      <Card style={{ gap: 6 }}>
        <Txt w="b" size={16} color={C.navy}>{t('रूपावास सेवा क्यों?', 'Why Roopawas Seva?')}</Txt>
        {WHY.map((w) => (
          <View key={w.en} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MCI name="check-circle" size={19} color={C.green} />
            <Txt style={{ flex: 1 }}>{tl(w)}</Txt>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 8, backgroundColor: '#F1F9F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MCI name="hand-heart" size={30} color={C.green} />
          <Txt w="b" size={18} color={C.navy} style={{ flex: 1 }}>{t('हमारा संकल्प – 5 साल, 5 बड़े कदम', 'Our Pledge – 5 Years, 5 Big Steps')}</Txt>
        </View>
        {STEPS.map((st, i) => (
          <View key={st.title.en} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: st.color, alignItems: 'center', justifyContent: 'center' }}>
              <Txt w="b" size={14} color="#FFFFFF">{i + 1}</Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt w="sb" size={15}>{tl(st.title)}</Txt>
              {st.note.en ? <Txt size={12} color={C.sub}>({tl(st.note)})</Txt> : null}
            </View>
          </View>
        ))}
        <Txt w="b" size={16} color={C.green} center style={{ marginTop: 4 }}>{t('मिलकर बनाएं बेहतर रूपावास', 'Together, let us build a better Roopawas')}</Txt>
      </Card>
    </Screen>
  );
}
