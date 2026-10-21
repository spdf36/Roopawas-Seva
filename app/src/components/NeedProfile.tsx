import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useT } from '../store';
import { C } from '../theme';
import { Btn, Card, Txt } from './ui';

/** Shown in place of a form when the citizen has not registered yet. */
export function NeedProfile() {
  const { t } = useT();
  const router = useRouter();
  return (
    <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
      <MCI name="account-alert-outline" size={44} color={C.orange} />
      <Txt w="b" size={17} center>{t('पहले पंजीकरण करें', 'Please register first')}</Txt>
      <Txt color={C.sub} center>
        {t('आवेदन या शिकायत भेजने के लिए एक बार पंजीकरण ज़रूरी है।', 'A one-time registration is needed before you can apply or raise a complaint.')}
      </Txt>
      <Btn label={t('पंजीकरण करें', 'Register now')} icon="account-plus" color={C.green} onPress={() => router.navigate('/register')} style={{ alignSelf: 'stretch' }} />
    </Card>
  );
}
