import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Chips, Empty, RequestRow, Screen } from '../../components/ui';
import { RequestFilter, matchesFilter, useFilterOptions } from '../../filters';
import { useStore, useT } from '../../store';

export default function AdminRequests() {
  const { t } = useT();
  const router = useRouter();
  const requests = useStore((s) => s.requests);
  const [filter, setFilter] = useState<RequestFilter>('all');
  const options = useFilterOptions();
  const list = useMemo(
    () => requests.filter((r) => matchesFilter(r, filter)).sort((a, b) => b.createdAt - a.createdAt),
    [requests, filter],
  );

  return (
    <Screen back icon="file-document-multiple-outline" title={t('सभी आवेदन', 'All Applications')} subtitle={t(`कुल ${list.length}`, `${list.length} total`)}>
      <Chips value={filter} options={options} onChange={setFilter} />
      {list.length === 0 ? <Empty icon="clipboard-text-off-outline" text={t('यहाँ कोई आवेदन नहीं है', 'No applications here')} /> : null}
      {list.map((r) => (
        <RequestRow key={r.id} r={r} showCitizen onPress={() => router.navigate(`/admin/request/${r.id}`)} />
      ))}
    </Screen>
  );
}
