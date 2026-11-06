import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useYojnas } from '../../../api/hooks';
import { YojnaList, YojnaTotals } from '../../../components/Yojna';
import { YojnaForm } from '../../../components/YojnaForm';
import { Btn, Card, Loaded, Screen, Txt } from '../../../components/ui';
import { useT } from '../../../store';
import { C } from '../../../theme';

export default function AdminYojnas() {
  const { t } = useT();
  const router = useRouter();
  const yojnas = useYojnas();
  const [adding, setAdding] = useState(false);
  return (
    <Screen back icon="hammer-wrench" iconColor={C.orange} title={t('ग्राम विकास योजनाएँ', 'Village Yojnas')}>
      <Txt size={13} color={C.sub}>
        {t('स्थिति, स्वीकृति के स्तर, राशि और खर्च – “ग्राम विकास योजनाएँ” में सबको दिखते हैं।', 'Status, approval levels, funds and expenses – everyone sees them under Village Yojnas.')}
      </Txt>
      {/* A new yojna opens on its own screen, where its funds and expenses are added. */}
      {adding ? (
        <Card><YojnaForm onSaved={(y) => { setAdding(false); router.push(`/admin/yojnas/${y.id}`); }} onCancel={() => setAdding(false)} /></Card>
      ) : (
        <Btn color={C.orange} icon="plus" label={t('नई योजना', 'New yojna')} onPress={() => setAdding(true)} />
      )}
      <Loaded q={yojnas}>
        {(list) => (
          <>
            {list.length ? <YojnaTotals list={list} /> : null}
            <YojnaList list={list} onOpen={(id) => router.push(`/admin/yojnas/${id}`)} />
          </>
        )}
      </Loaded>
    </Screen>
  );
}
