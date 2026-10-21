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
  const [sent, setSent] = useState(false);

  const publish = () => {
    addNotice({ tag, title: title.trim(), body: body.trim() });
    setTitle('');
    setBody('');
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
        <Field label={t('शीर्षक', 'Title')} required value={title} onChangeText={(v) => { setTitle(v); setSent(false); }} placeholder={t('जैसे: ग्राम सभा बैठक', 'e.g. Gram Sabha meeting')} />
        <Field label={t('विवरण', 'Details')} required multiline value={body} onChangeText={(v) => { setBody(v); setSent(false); }} placeholder={t('तारीख, समय और स्थान लिखें', 'Add the date, time and place')} style={{ minHeight: 70 }} />
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
