import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { RequestDetail } from '../../../components/RequestDetail';
import { Btn, Card, Empty, Field, Screen, Select, Txt } from '../../../components/ui';
import { DEPARTMENTS, STATUS, Status, nextStatuses } from '../../../data';
import { useStore, useT } from '../../../store';
import { C } from '../../../theme';

export default function AdminRequest() {
  const { t, tl } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useStore((s) => s.requests.find((x) => x.id === id));
  const setStatus = useStore((s) => s.setStatus);

  const [next, setNext] = useState<Status>();
  const [department, setDepartment] = useState<string>();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  if (!r) {
    return (
      <Screen back title={t('आवेदन', 'Application')}>
        <Empty icon="file-question-outline" text={t('यह आवेदन नहीं मिला', 'This request was not found')} />
      </Screen>
    );
  }

  const update = () => {
    if (!next) return;
    setStatus(r.id, next, note, department);
    setNext(undefined);
    setNote('');
    setSaved(true);
  };

  const choices = nextStatuses(r.status);
  const savedNote = saved ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <MCI name="check-circle" size={20} color={C.green} />
      <Txt w="sb" size={14} color={C.green} style={{ flex: 1 }}>
        {t('स्थिति अपडेट हो गई। नागरिक को उनके ऐप में यह दिखेगी।', 'Status updated. The citizen will see it in their app.')}
      </Txt>
    </View>
  ) : null;

  return (
    <Screen back icon="file-document-edit-outline" title={r.id} subtitle={t('स्थिति अपडेट करें और नागरिक को सूचित करें', 'Update status and notify the citizen')}>
      <RequestDetail r={r} showCitizen />

      {choices.length === 0 ? (
        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MCI name="lock-outline" size={20} color={C.sub} />
            <Txt w="sb" size={14} color={C.sub} style={{ flex: 1 }}>
              {t(`यह आवेदन बंद है (${tl(STATUS[r.status].name)})। इसकी स्थिति अब नहीं बदली जा सकती।`, `This request is closed (${tl(STATUS[r.status].name)}). Its status can no longer be changed.`)}
            </Txt>
          </View>
          {savedNote}
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <Txt w="b" size={16} color={C.navy}>{t('स्थिति अपडेट करें', 'Update Status')}</Txt>
          <Txt size={13} color={C.sub}>{t('स्थिति केवल आगे बढ़ाई जा सकती है।', 'Status can only move forward.')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {choices.map((s) => {
              const on = next === s;
              const st = STATUS[s];
              return (
                <Pressable
                  key={s}
                  onPress={() => { setNext(s); setSaved(false); }}
                  accessibilityRole="button"
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5,
                    borderColor: st.color, backgroundColor: on ? st.color : C.card,
                  }}
                >
                  <Txt w="b" size={14} color={on ? '#FFFFFF' : st.color}>{tl(st.name)}</Txt>
                </Pressable>
              );
            })}
          </View>
          <Select
            label={t('संबंधित विभाग', 'Concerned department')} icon="office-building-outline"
            value={department ?? r.department} placeholder={t('चुनें', 'Select')}
            options={Object.entries(DEPARTMENTS).map(([key, name]) => ({ id: key, label: tl(name) }))}
            onChange={setDepartment}
          />
          <Field label={t('नागरिक के लिए टिप्पणी (वैकल्पिक)', 'Note for the citizen (optional)')} multiline value={note} onChangeText={setNote} placeholder={t('जैसे: टीम कल सुबह मौके पर पहुँचेगी।', 'e.g. The team will visit the site tomorrow morning.')} style={{ minHeight: 70 }} />
          <Btn label={t('अपडेट करें और सूचित करें', 'Update & notify')} icon="send" color={C.navy} disabled={!next} onPress={update} />
          {savedNote}
        </Card>
      )}
    </Screen>
  );
}
