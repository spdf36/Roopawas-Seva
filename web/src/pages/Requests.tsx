import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useConfirmResolution, useRequest, useRequests } from '../api/hooks';
import { Chips, Empty, Icon, Loaded, PageHead, RequestRow, RequestSummary, Timeline, tint, useErrorText } from '../components/ui';
import { RequestFilter, matchesFilter, useFilterOptions } from '../filters';
import { useT } from '../store';

export function Requests() {
  const { t } = useT();
  // The server only returns the logged-in citizen's own requests.
  const requests = useRequests();
  const [filter, setFilter] = useState<RequestFilter>('all');
  const options = useFilterOptions();

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
        <Loaded q={requests}>
          {(all) => {
            const list = all.filter((r) => matchesFilter(r, filter));
            return list.length === 0
              ? <Empty icon="clipboard-text-off-outline" text={t('यहाँ कोई आवेदन नहीं है', 'No applications here')} />
              : list.map((r) => <RequestRow key={r.id} r={r} to={`/requests/${r.id}`} />);
          }}
        </Loaded>
      </div>
    </div>
  );
}

export function RequestPage() {
  const { t } = useT();
  const { id = '' } = useParams();
  // The server answers 404 for someone else's request, so request numbers cannot be used to browse other citizens' details.
  const request = useRequest(id);
  const confirm = useConfirmResolution();
  const errorText = useErrorText();

  return (
    <div className="container page" style={{ maxWidth: 860 }}>
      <PageHead
        icon="clipboard-text-clock-outline"
        title={t('आवेदन की स्थिति', 'Request Status')}
        right={<Link to="/requests" className="btn sm outline"><Icon name="chevron-left" size={18} />{t('सभी आवेदन', 'All applications')}</Link>}
      />
      <Loaded q={request} notFound={t('यह आवेदन नहीं मिला', 'This request was not found')}>
        {(r) => (
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
                  <button className="btn" style={tint('var(--green)')} disabled={confirm.isPending} onClick={() => confirm.mutate(r.id)}>
                    <Icon name={confirm.isPending ? 'loading' : 'check'} spin={confirm.isPending} />{t('हाँ, समाधान की पुष्टि करें', 'Yes, confirm resolution')}
                  </button>
                  {confirm.isError ? <div className="error" style={{ flexBasis: '100%' }}>{errorText(confirm.error)}</div> : null}
                </div>
              )
            ) : null}
          </div>
        )}
      </Loaded>
    </div>
  );
}
