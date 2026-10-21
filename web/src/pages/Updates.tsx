import { useState } from 'react';
import { useNotices } from '../api/hooks';
import { Chips, Empty, Icon, Loaded, PageHead } from '../components/ui';
import { NOTICE_TAGS, NoticeTag, fmtDate } from '../data';
import { useT } from '../store';

export function Updates() {
  const { t, tl } = useT();
  const notices = useNotices();
  const [tag, setTag] = useState<NoticeTag | 'all'>('all');

  return (
    <div className="container page" style={{ maxWidth: 860 }}>
      <PageHead icon="bell-outline" title={t('सूचनाएँ', 'Latest Information')} subtitle={t('सरकार और पंचायत की ताज़ा सूचनाएँ', 'Latest notices from the government and the Panchayat')} />
      <div className="stack">
        <Chips value={tag} onChange={setTag} options={[{ id: 'all' as const, label: t('सभी', 'All') }, ...NOTICE_TAGS.map((x) => ({ id: x.id, label: tl(x.name) }))]} />
        <Loaded q={notices}>
          {(all) => {
            const list = all.filter((n) => tag === 'all' || n.tag === tag);
            return list.length === 0 ? <Empty icon="bell-off-outline" text={t('कोई सूचना नहीं', 'No notices')} /> : list.map((n) => (
              <div className="card row" key={n.id} style={{ alignItems: 'flex-start' }}>
                <span className="bubble" style={{ width: 44, height: 44, background: n.color }}><Icon name={n.icon} size={24} color="#fff" /></span>
                <div className="grow">
                  <b style={{ fontSize: 17 }}>{tl(n.title)}</b>
                  <div className="sub">{tl(n.body)}</div>
                  <div className="tiny" style={{ color: 'var(--faint)' }}>({tl(n.source)})  •  {fmtDate(n.publishedAt)}{n.updatedAt ? `  •  ${t('अपडेट', 'updated')} ${fmtDate(n.updatedAt)}` : ''}</div>
                </div>
              </div>
            ));
          }}
        </Loaded>
      </div>
    </div>
  );
}
