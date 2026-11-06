import { useRouter } from 'expo-router';
import { useYojnas } from '../../api/hooks';
import { YojnaList, YojnaTotals } from '../../components/Yojna';
import { Loaded, Screen } from '../../components/ui';
import { useT } from '../../store';
import { C } from '../../theme';

/** Village Yojnas, open to everyone (no login needed). */
export default function Yojnas() {
  const { t } = useT();
  const router = useRouter();
  const yojnas = useYojnas();
  return (
    <Screen
      back icon="hammer-wrench" iconColor={C.orange} title={t('ग्राम विकास योजनाएँ', 'Village Yojnas')}
      subtitle={t('स्थिति, स्वीकृति, प्राप्त राशि और खर्च – सबके लिए खुला', 'Status, approvals, money received and spent – open to all')}
    >
      <Loaded q={yojnas}>
        {(list) => (
          <>
            {list.length ? <YojnaTotals list={list} /> : null}
            <YojnaList list={list} onOpen={(id) => router.push(`/yojnas/${id}`)} />
          </>
        )}
      </Loaded>
    </Screen>
  );
}
