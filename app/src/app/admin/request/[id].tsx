import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { RequestDetail } from '../../../components/RequestDetail';
import { Btn, Card, Empty, Field, Screen, Select, Txt } from '../../../components/ui';
import { DEPARTMENTS, FLOW, STATUS, Status } from '../../../data';
import { useStore, useT } from '../../../store';
import { C } from '../../../theme';

const CHOICES: Status[] = [...FLOW.slice(1), 'rejected'];

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

  return (
    <Screen back icon="file-document-edit-outline" title={r.id} subtitle={t('स्थिति अपडेट करें और नागरिक को सूचित करें', 'Update status and notify the citizen')}>
      <RequestDetail r={r} showCitizen />

      <Card style={{ gap: 12 }}>
        <Txt w="b" size={16} color={C.navy}>{t('स्थिति अपडेट करें', 'Update Status')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CHOICES.map((s) => {
            const on = next === s;
            const st = STATUS[s];
            return (
              <Pressable
                key={s}
                disabled={s === r.status}
                onPress={() => { setNext(s); setSaved(false); }}
                accessibilityRole="button"
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5,
                  borderColor: st.color, backgroundColor: on ? st.color : C.card, opacity: s === r.status ? 0.35 : 1,
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
        {saved ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MCI name="check-circle" size={20} color={C.green} />
            <Txt w="sb" size={14} color={C.green} style={{ flex: 1 }}>
              {t('स्थिति अपडेट हो गई। नागरिक को उनके ऐप में यह दिखेगी।', 'Status updated. The citizen will see it in their app.')}
            </Txt>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
