import { REOPEN_DAYS, Request, canReopen } from '@shared/data';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useConfirmResolution, useReopenRequest, useRequest } from '../../api/hooks';
import { RequestSummary, Timeline } from '../../components/RequestDetail';
import { Btn, Card, ErrorText, Field, Ico, Loaded, Row, Screen, Txt, useErrorText } from '../../components/ui';
import { useT } from '../../store';
import { C } from '../../theme';

export default function RequestScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  // The API answers 404 for someone else's request, so request numbers cannot be used to browse other citizens' details.
  const request = useRequest(id ?? '');

  return (
    <Screen back icon="clipboard-text-clock-outline" title={t('आवेदन की स्थिति', 'Request Status')}>
      <Loaded q={request} notFound={t('यह आवेदन नहीं मिला', 'This request was not found')}>
        {(r) => (
          <>
            <RequestSummary r={r} />
            {r.status === 'resolved' && r.kind === 'complaint' ? <ResolutionCheck key={r.id} r={r} /> : null}
            <Timeline r={r} />
          </>
        )}
      </Loaded>
    </Screen>
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
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.greenSoft, borderColor: C.green }}>
        <Ico name="check-decagram" size={24} color={C.green} />
        <Txt w="sb" color={C.green} style={{ flex: 1 }}>{t('आपने समाधान की पुष्टि कर दी है। धन्यवाद!', 'You confirmed the resolution. Thank you!')}</Txt>
      </Card>
    );
  }

  return (
    <Card style={{ gap: 10, borderColor: C.green }}>
      <Row>
        <Ico name="help-circle-outline" size={22} color={C.green} />
        <Txt w="b" size={16} style={{ flex: 1 }}>{t('क्या आपकी समस्या हल हो गई है?', 'Has your problem been resolved?')}</Txt>
      </Row>
      {reopening ? (
        <>
          <Field
            label={t('क्या अभी भी ठीक नहीं है?', 'What is still not fixed?')} required multiline value={reason} autoFocus style={{ minHeight: 80 }}
            placeholder={t('जैसे: नल अभी भी नहीं चल रहा है।', 'e.g. The tap is still not working.')}
            onChangeText={(v) => { setReason(v); reopen.reset(); }}
          />
          <Txt size={12} color={C.sub}>{t('आवेदन फिर से पंचायत की समीक्षा में जाएगा।', 'The request goes back to the Panchayat for review.')}</Txt>
          <Btn color={C.red} icon="restore" label={t('दोबारा खोलें', 'Reopen request')} busy={reopen.isPending} disabled={reason.trim().length < 5} onPress={() => reopen.mutate({ id: r.id, reason })} />
          <Btn outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={() => { setReopening(false); reopen.reset(); }} />
        </>
      ) : (
        <>
          <Btn color={C.green} icon="check" label={t('हाँ, समाधान की पुष्टि करें', 'Yes, confirm resolution')} busy={confirm.isPending} onPress={() => confirm.mutate(r.id)} />
          {canReopen(r) ? (
            <Btn outline color={C.red} icon="close-circle-outline" label={t('नहीं, समस्या अभी भी है', 'No, the problem is still there')} onPress={() => { setReopening(true); confirm.reset(); }} />
          ) : null}
        </>
      )}
      {!canReopen(r) ? (
        <Txt size={12} color={C.sub}>{t(`हल होने के ${REOPEN_DAYS} दिन बाद आवेदन दोबारा नहीं खोला जा सकता। समस्या फिर हो तो नई शिकायत दर्ज करें।`, `A request cannot be reopened more than ${REOPEN_DAYS} days after it was resolved. If the problem is back, raise a new complaint.`)}</Txt>
      ) : null}
      <ErrorText text={failed ? errorText(failed) : undefined} />
    </Card>
  );
}
