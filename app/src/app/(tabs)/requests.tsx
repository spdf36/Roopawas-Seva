import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Btn, Chips, Empty, RequestRow, Screen } from '../../components/ui';
import { RequestFilter, matchesFilter, useFilterOptions } from '../../filters';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

export default function Requests() {
  const { t } = useT();
  const router = useRouter();
  const requests = useStore((s) => s.requests);
  const [filter, setFilter] = useState<RequestFilter>('all');
  const options = useFilterOptions();
  const list = useMemo(() => requests.filter((r) => r.mine && matchesFilter(r, filter)), [requests, filter]);

  return (
    <Screen tab icon="clipboard-text-clock-outline" title={t('मेरी आवेदनें', 'My Applications')} subtitle={t('अपने अनुरोधों की स्थिति देखें', 'Track the status of your requests')}>
      <Chips value={filter} options={options} onChange={setFilter} />
      {list.length === 0 ? <Empty icon="clipboard-text-off-outline" text={t('यहाँ कोई आवेदन नहीं है', 'No applications here')} /> : null}
      {list.map((r) => (
        <RequestRow key={r.id} r={r} onPress={() => router.navigate(`/request/${r.id}`)} />
      ))}
      <Btn label={t('नई शिकायत दर्ज करें', 'Raise a new complaint')} icon="plus" color={C.orange} onPress={() => router.navigate('/complaint')} />
    </Screen>
  );
}
