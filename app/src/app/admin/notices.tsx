import { useState } from 'react';
import { View } from 'react-native';
import { Badge, Btn, Card, Field, Screen, Select, Txt } from '../../components/ui';
import { NOTICE_TAGS, NoticeTag } from '../../data';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

export default function AdminNotices() {
  const { t, tl } = useT();
  const notices = useStore((s) => s.notices);
  const addNotice = useStore((s) => s.addNotice);
  const [tag, setTag] = useState<NoticeTag>('panchayat');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [sent, setSent] = useState(false);

  // The English text is optional; English readers see the Hindi text when it is left blank.
  const publish = () => {
    addNotice({
      tag,
      title: { hi: title.trim(), en: titleEn.trim() || title.trim() },
      body: { hi: body.trim(), en: bodyEn.trim() || body.trim() },
    });
    setTitle('');
    setBody('');
    setTitleEn('');
    setBodyEn('');
    setSent(true);
  };

  return (
    <Screen back icon="bell-outline" title={t('सूचनाएँ / नोटिफिकेशन', 'Notices / Notifications')} subtitle={t('गाँव के लिए नई सूचना जारी करें', 'Publish a new notice for the village')}>
      <Card style={{ gap: 12 }}>
        <Select
          label={t('श्रेणी', 'Category')} required value={tag} placeholder={t('चुनें', 'Select')}
          options={NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))}
          onChange={(v) => setTag(v as NoticeTag)}
        />
        <Field label={t('शीर्षक (हिंदी)', 'Title (Hindi)')} required value={title} onChangeText={(v) => { setTitle(v); setSent(false); }} placeholder="जैसे: ग्राम सभा बैठक" />
        <Field label={t('विवरण (हिंदी)', 'Details (Hindi)')} required multiline value={body} onChangeText={(v) => { setBody(v); setSent(false); }} placeholder="तारीख, समय और स्थान लिखें" style={{ minHeight: 70 }} />
        <Field label={t('शीर्षक (अंग्रेज़ी, वैकल्पिक)', 'Title (English, optional)')} value={titleEn} onChangeText={(v) => { setTitleEn(v); setSent(false); }} placeholder="e.g. Gram Sabha meeting" />
        <Field label={t('विवरण (अंग्रेज़ी, वैकल्पिक)', 'Details (English, optional)')} multiline value={bodyEn} onChangeText={(v) => { setBodyEn(v); setSent(false); }} placeholder="Add the date, time and place" style={{ minHeight: 60 }} />
        <Txt size={12} color={C.sub}>{t('अंग्रेज़ी खाली छोड़ने पर अंग्रेज़ी में भी हिंदी पाठ दिखेगा।', 'If English is left blank, the Hindi text is shown in English too.')}</Txt>
        <Btn label={t('सूचना जारी करें', 'Publish notice')} icon="bullhorn" color={C.purple} disabled={!title.trim() || !body.trim()} onPress={publish} />
        {sent ? <Txt w="sb" size={14} color={C.green}>{t('सूचना जारी हो गई। यह नागरिकों को “सूचनाएँ” में दिखेगी।', 'Notice published. Citizens will see it under “Latest Updates”.')}</Txt> : null}
      </Card>

      <Txt w="b" size={16} color={C.navy}>{t('जारी सूचनाएँ', 'Published notices')} ({notices.length})</Txt>
      {notices.map((n) => (
        <Card key={n.id} style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt w="b" size={15} style={{ flex: 1 }}>{tl(n.title)}</Txt>
            <Badge label={tl(NOTICE_TAGS.find((x) => x.id === n.tag)!.name)} color={n.color} soft={n.soft} />
          </View>
          <Txt size={14} color={C.sub}>{tl(n.body)}</Txt>
        </Card>
      ))}
    </Screen>
  );
}
