import { useMemo, useState } from 'react';
import { Chips, Empty, Icon, PageHead } from '../components/ui';
import { NOTICE_TAGS, NoticeTag } from '../data';
import { useStore, useT } from '../store';

export function Updates() {
  const { t, tl } = useT();
  const notices = useStore((s) => s.notices);
  const [tag, setTag] = useState<NoticeTag | 'all'>('all');
  const list = useMemo(() => notices.filter((n) => tag === 'all' || n.tag === tag), [notices, tag]);

  return (
    <div className="container page" style={{ maxWidth: 860 }}>
      <PageHead icon="bell-outline" title={t('सूचनाएँ', 'Latest Information')} subtitle={t('सरकार और पंचायत की ताज़ा सूचनाएँ', 'Latest notices from the government and the Panchayat')} />
      <div className="stack">
        <Chips value={tag} onChange={setTag} options={[{ id: 'all' as const, label: t('सभी', 'All') }, ...NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))]} />
        {list.length === 0 ? <Empty icon="bell-off-outline" text={t('कोई सूचना नहीं', 'No notices')} /> : null}
        {list.map((n) => (
          <div className="card row" key={n.id} style={{ alignItems: 'flex-start' }}>
            <span className="bubble" style={{ width: 44, height: 44, background: n.color }}><Icon name={n.icon} size={24} color="#fff" /></span>
            <div className="grow">
              <b style={{ fontSize: 17 }}>{tl(n.title)}</b>
              <div className="sub">{tl(n.body)}</div>
              <div className="tiny" style={{ color: 'var(--faint)' }}>({tl(n.source)})</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
