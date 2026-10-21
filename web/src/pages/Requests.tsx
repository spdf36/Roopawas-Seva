import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Chips, Empty, Icon, PageHead, RequestRow, RequestSummary, Timeline, tint } from '../components/ui';
import { RequestFilter, matchesFilter, useFilterOptions } from '../filters';
import { useStore, useT, useUser } from '../store';

export function Requests() {
  const { t } = useT();
  const requests = useStore((s) => s.requests);
  const mobile = useUser()?.mobile;
  const [filter, setFilter] = useState<RequestFilter>('all');
  const options = useFilterOptions();
  const list = useMemo(() => requests.filter((r) => r.citizen.mobile === mobile && matchesFilter(r, filter)), [requests, filter, mobile]);

  return (
    <div className="container page" style={{ maxWidth: 860 }}>
      <PageHead
        icon="clipboard-text-clock-outline"
        title={t('मेरी आवेदनें', 'My Applications')}
        subtitle={t('अपने अनुरोधों की स्थिति देखें', 'Track the status of your requests')}
        right={<Link to="/complaint" className="btn" style={tint('var(--orange)')}><Icon name="plus" />{t('नई शिकायत दर्ज करें', 'Raise a new complaint')}</Link>}
      />
      <div className="stack">
        <Chips value={filter} options={options} onChange={setFilter} />
        {list.length === 0 ? <Empty icon="clipboard-text-off-outline" text={t('यहाँ कोई आवेदन नहीं है', 'No applications here')} /> : null}
        {list.map((r) => <RequestRow key={r.id} r={r} to={`/requests/${r.id}`} />)}
      </div>
    </div>
  );
}

export function RequestPage() {
  const { t } = useT();
  const { id } = useParams();
  const mobile = useUser()?.mobile;
  // Someone else's request is treated as not found, so request numbers cannot be used to browse other citizens' details.
  const r = useStore((s) => s.requests.find((x) => x.id === id && x.citizen.mobile === mobile));
  const confirmResolution = useStore((s) => s.confirmResolution);

  return (
    <div className="container page" style={{ maxWidth: 860 }}>
      <PageHead
        icon="clipboard-text-clock-outline"
        title={t('आवेदन की स्थिति', 'Request Status')}
        right={<Link to="/requests" className="btn sm outline"><Icon name="chevron-left" size={18} />{t('सभी आवेदन', 'All applications')}</Link>}
      />
      {!r ? <Empty icon="file-question-outline" text={t('यह आवेदन नहीं मिला', 'This request was not found')} /> : (
        <div className="stack">
          <RequestSummary r={r} />
          <Timeline r={r} />
          {r.status === 'resolved' && r.kind === 'complaint' ? (
            r.confirmed ? (
              <div className="card ok row" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
                <Icon name="check-decagram" size={24} />{t('आपने समाधान की पुष्टि कर दी है। धन्यवाद!', 'You confirmed the resolution. Thank you!')}
              </div>
            ) : (
              <div className="card row wrap">
                <b className="grow">{t('क्या आपकी समस्या हल हो गई है?', 'Has your problem been resolved?')}</b>
                <button className="btn" style={tint('var(--green)')} onClick={() => confirmResolution(r.id)}><Icon name="check" />{t('हाँ, समाधान की पुष्टि करें', 'Yes, confirm resolution')}</button>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
