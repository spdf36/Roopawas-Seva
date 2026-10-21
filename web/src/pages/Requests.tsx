import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useConfirmResolution, useReopenRequest, useRequest, useRequests } from '../api/hooks';
import { Chips, Empty, Icon, Loaded, PageHead, RequestRow, RequestSummary, TextArea, Timeline, tint, useErrorText } from '../components/ui';
import { REOPEN_DAYS, Request, RequestFilter, canReopen, matchesFilter } from '../data';
import { useFilterOptions } from '../filters';
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
            {r.status === 'resolved' && r.kind === 'complaint' ? <ResolutionCheck key={r.id} r={r} /> : null}
          </div>
        )}
      </Loaded>
    </div>
  );
}

/** For a resolved complaint: the citizen confirms it, or reopens it with a reason if it is not actually fixed. */
function ResolutionCheck({ r }: { r: Request }) {
  const { t } = useT();
  const confirm = useConfirmResolution();
  const reopen = useReopenRequest();
  const errorText = useErrorText();
  const [reopening, setReopening] = useState(false);
  const [reason, setReason] = useState('');
  const failed = confirm.error ?? reopen.error;

  if (r.confirmed) {
    return (
      <div className="card ok row" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
        <Icon name="check-decagram" size={24} />{t('आपने समाधान की पुष्टि कर दी है। धन्यवाद!', 'You confirmed the resolution. Thank you!')}
      </div>
    );
  }

  return (
    <div className="card stack">
      <b>{t('क्या आपकी समस्या हल हो गई है?', 'Has your problem been resolved?')}</b>
      {reopening ? (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); reopen.mutate({ id: r.id, reason }); }}>
          <TextArea
            label={t('क्या अभी भी ठीक नहीं है?', 'What is still not fixed?')} required value={reason} autoFocus style={{ minHeight: 80 }}
            placeholder={t('जैसे: नल अभी भी नहीं चल रहा है।', 'e.g. The tap is still not working.')}
            onChange={(e) => { setReason(e.target.value); reopen.reset(); }}
          />
          <p className="tiny sub">{t('आवेदन फिर से पंचायत की समीक्षा में जाएगा।', 'The request goes back to the Panchayat for review.')}</p>
          <div className="row wrap">
            <button type="submit" className="btn" style={tint('var(--red)')} disabled={reason.trim().length < 5 || reopen.isPending}>
              <Icon name={reopen.isPending ? 'loading' : 'restore'} spin={reopen.isPending} />{t('दोबारा खोलें', 'Reopen request')}
            </button>
            <button type="button" className="btn outline" style={tint('var(--sub)')} onClick={() => { setReopening(false); reopen.reset(); }}>{t('रद्द करें', 'Cancel')}</button>
          </div>
        </form>
      ) : (
        <div className="row wrap">
          <button className="btn" style={tint('var(--green)')} disabled={confirm.isPending} onClick={() => confirm.mutate(r.id)}>
            <Icon name={confirm.isPending ? 'loading' : 'check'} spin={confirm.isPending} />{t('हाँ, समाधान की पुष्टि करें', 'Yes, confirm resolution')}
          </button>
          {canReopen(r) ? (
            <button className="btn outline" style={tint('var(--red)')} onClick={() => { setReopening(true); confirm.reset(); }}>
              <Icon name="close-circle-outline" />{t('नहीं, समस्या अभी भी है', 'No, the problem is still there')}
            </button>
          ) : null}
        </div>
      )}
      {!canReopen(r) ? (
        <p className="tiny sub">{t(`हल होने के ${REOPEN_DAYS} दिन बाद आवेदन दोबारा नहीं खोला जा सकता। समस्या फिर हो तो नई शिकायत दर्ज करें।`, `A request cannot be reopened more than ${REOPEN_DAYS} days after it was resolved. If the problem is back, raise a new complaint.`)}</p>
      ) : null}
      {failed ? <div className="error">{errorText(failed)}</div> : null}
    </div>
  );
}
