import { NOTICE_TAGS, NoticeTag, fmtDate } from '@shared/data';
import { useState } from 'react';
import { View } from 'react-native';
import { useNotices } from '../api/hooks';
import { Card, Chips, Empty, Ico, Loaded, Screen, Txt } from '../components/ui';
import { useT } from '../store';
import { C } from '../theme';

export default function Updates() {
  const { t, tl } = useT();
  const notices = useNotices();
  const [tag, setTag] = useState<NoticeTag | 'all'>('all');

  return (
    <Screen back icon="bell-outline" title={t('सूचनाएँ', 'Latest Information')} subtitle={t('सरकार और पंचायत की ताज़ा सूचनाएँ', 'Latest notices from the government and the Panchayat')}>
      <Chips value={tag} onChange={setTag} options={[{ id: 'all' as const, label: t('सभी', 'All') }, ...NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))]} />
      <Loaded q={notices}>
        {(all) => {
          const list = all.filter((n) => tag === 'all' || n.tag === tag);
          return list.length === 0 ? <Empty icon="bell-off-outline" text={t('कोई सूचना नहीं', 'No notices')} /> : list.map((n) => (
            <Card key={n.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: n.color, alignItems: 'center', justifyContent: 'center' }}>
                <Ico name={n.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt w="b" size={16}>{tl(n.title)}</Txt>
                <Txt size={14} color={C.sub}>{tl(n.body)}</Txt>
                <Txt size={12} color={C.faint}>({tl(n.source)})  •  {fmtDate(n.publishedAt)}{n.updatedAt ? `  •  ${t('अपडेट', 'updated')} ${fmtDate(n.updatedAt)}` : ''}</Txt>
              </View>
            </Card>
          ));
        }}
      </Loaded>
    </Screen>
  );
}
