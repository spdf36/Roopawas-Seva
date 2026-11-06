import { useLocalSearchParams } from 'expo-router';
import { useYojna } from '../../api/hooks';
import { YojnaDetails } from '../../components/Yojna';
import { Loaded, Screen } from '../../components/ui';
import { useT } from '../../store';
import { C } from '../../theme';

export default function YojnaScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const yojna = useYojna(id ?? '');
  return (
    <Screen back icon="hammer-wrench" iconColor={C.orange} title={t('योजना का ब्योरा', 'Yojna details')}>
      <Loaded q={yojna} notFound={t('यह योजना नहीं मिली।', 'This yojna was not found.')}>{(y) => <YojnaDetails y={y} />}</Loaded>
    </Screen>
  );
}
