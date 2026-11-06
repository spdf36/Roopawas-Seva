import { DEPARTMENTS, Request, STATUS, Status, nextStatuses } from '@shared/data';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useRequest, useUpdateStatus } from '../../../api/hooks';
import { RequestSummary, Timeline } from '../../../components/RequestDetail';
import { Btn, Card, ErrorText, Field, Ico, Loaded, OkText, Picks, Row, Screen, Select, Txt, useErrorText } from '../../../components/ui';
import { useT } from '../../../store';
import { C } from '../../../theme';

export default function AdminRequest() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useRequest(id ?? '');
  return (
    <Screen back icon="file-document-edit-outline" title={id ?? ''} subtitle={t('स्थिति अपडेट करें और नागरिक को सूचित करें', 'Update status and notify the citizen')}>
      <Loaded q={request} notFound={t('यह आवेदन नहीं मिला', 'This request was not found')}>
        {(r) => <RequestEditor r={r} />}
      </Loaded>
    </Screen>
  );
}

function RequestEditor({ r }: { r: Request }) {
  const { t, tl } = useT();
  const updateStatus = useUpdateStatus();
  const errorText = useErrorText();
  const [next, setNext] = useState<Status>();
  const [department, setDepartment] = useState<string>();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const update = () => {
    if (!next) return;
    updateStatus.mutate({ id: r.id, update: { status: next, note, department } }, {
      onSuccess: () => {
        setNext(undefined);
        setNote('');
        setSaved(true);
      },
    });
  };

  // Only later steps of the flow, or rejection; closed requests cannot change.
  const choices = nextStatuses(r.status);
  const savedNote = saved ? <OkText text={t('स्थिति अपडेट हो गई। नागरिक को उनके खाते में यह दिखेगी।', 'Status updated. The citizen will see it in their account.')} /> : null;

  return (
    <>
      <RequestSummary r={r} showCitizen />
      {choices.length === 0 ? (
        <Card style={{ gap: 8 }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Ico name="lock-outline" size={20} color={C.sub} />
            <Txt w="sb" size={14} color={C.sub} style={{ flex: 1 }}>
              {t(`यह आवेदन बंद है (${tl(STATUS[r.status].name)})। इसकी स्थिति अब नहीं बदली जा सकती।`, `This request is closed (${tl(STATUS[r.status].name)}). Its status can no longer be changed.`)}
            </Txt>
          </Row>
          {savedNote}
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <Txt w="b" size={16} color={C.navy}>{t('स्थिति अपडेट करें', 'Update Status')}</Txt>
          <Txt size={13} color={C.sub}>{t('स्थिति केवल आगे बढ़ाई जा सकती है।', 'Status can only move forward.')}</Txt>
          <Picks
            value={next} options={choices.map((s) => ({ id: s, label: tl(STATUS[s].name), color: STATUS[s].color }))}
            onChange={(s) => { setNext(s); setSaved(false); updateStatus.reset(); }}
          />
          <Select
            label={t('संबंधित विभाग', 'Concerned department')} icon="office-building-outline" value={department ?? r.department}
            options={Object.entries(DEPARTMENTS).map(([key, name]) => ({ id: key, label: tl(name) }))} onChange={setDepartment}
          />
          <Field label={t('नागरिक के लिए टिप्पणी (वैकल्पिक)', 'Note for the citizen (optional)')} multiline value={note} onChangeText={setNote} placeholder={t('जैसे: टीम कल सुबह मौके पर पहुँचेगी।', 'e.g. The team will visit the site tomorrow morning.')} style={{ minHeight: 70 }} />
          <ErrorText text={updateStatus.isError ? errorText(updateStatus.error) : undefined} />
          <Btn label={t('अपडेट करें और सूचित करें', 'Update & notify')} icon="send" color={C.navy} busy={updateStatus.isPending} disabled={!next} onPress={update} />
          {savedNote}
        </Card>
      )}
      <Timeline r={r} />
    </>
  );
}
