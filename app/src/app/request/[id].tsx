import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { RequestDetail } from '../../components/RequestDetail';
import { Btn, Card, Empty, Screen, Txt } from '../../components/ui';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

export default function RequestScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useStore((s) => s.requests.find((x) => x.id === id));
  const confirmResolution = useStore((s) => s.confirmResolution);

  return (
    <Screen back icon="clipboard-text-clock-outline" title={t('आवेदन की स्थिति', 'Request Status')}>
      {!r ? (
        <Empty icon="file-question-outline" text={t('यह आवेदन नहीं मिला', 'This request was not found')} />
      ) : (
        <>
          <RequestDetail r={r} />
          {r.status === 'resolved' && r.kind === 'complaint' ? (
            r.confirmed ? (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.greenSoft, borderColor: C.green }}>
                <MCI name="check-decagram" size={24} color={C.green} />
                <Txt w="sb" color={C.green} style={{ flex: 1 }}>{t('आपने समाधान की पुष्टि कर दी है। धन्यवाद!', 'You confirmed the resolution. Thank you!')}</Txt>
              </Card>
            ) : (
              <Card style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MCI name="help-circle-outline" size={22} color={C.navy} />
                  <Txt w="b" size={16} style={{ flex: 1 }}>{t('क्या आपकी समस्या हल हो गई है?', 'Has your problem been resolved?')}</Txt>
                </View>
                <Btn color={C.green} icon="check" label={t('हाँ, समाधान की पुष्टि करें', 'Yes, confirm resolution')} onPress={() => confirmResolution(r.id)} />
              </Card>
            )
          ) : null}
        </>
      )}
    </Screen>
  );
}
