import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Card, Chips, Empty, Screen, Txt } from '../components/ui';
import { NOTICE_TAGS, NoticeTag } from '../data';
import { useStore, useT } from '../store';
import { C } from '../theme';

export default function Updates() {
  const { t, tl } = useT();
  const notices = useStore((s) => s.notices);
  const [tag, setTag] = useState<NoticeTag | 'all'>('all');
  const list = useMemo(() => notices.filter((n) => tag === 'all' || n.tag === tag), [notices, tag]);

  return (
    <Screen back icon="bell-outline" title={t('सूचनाएँ', 'Latest Information')}>
      <Chips
        value={tag}
        onChange={setTag}
        options={[{ id: 'all' as const, label: t('सभी', 'All') }, ...NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))]}
      />
      {list.length === 0 ? <Empty icon="bell-off-outline" text={t('कोई सूचना नहीं', 'No notices')} /> : null}
      {list.map((n) => (
        <Card key={n.id} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: n.color, alignItems: 'center', justifyContent: 'center' }}>
            <MCI name={n.icon} size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="b" size={16}>{tl(n.title)}</Txt>
            <Txt size={14} color={C.sub}>{tl(n.body)}</Txt>
            <Txt size={13} color={C.faint}>({tl(n.source)})</Txt>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
