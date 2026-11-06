import { RequestFilter, matchesFilter } from '@shared/data';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useRequests } from '../../api/hooks';
import { Btn, Chips, Empty, Loaded, NeedLogin, RequestRow, Screen } from '../../components/ui';
import { useFilterOptions } from '../../filters';
import { useT, useUser } from '../../store';
import { C } from '../../theme';

export default function Requests() {
  const { t } = useT();
  const router = useRouter();
  const user = useUser();
  // The API only returns the logged-in citizen's own requests.
  const requests = useRequests({}, !!user);
  const [filter, setFilter] = useState<RequestFilter>('all');
  const options = useFilterOptions();

  return (
    <Screen tab icon="clipboard-text-clock-outline" title={t('मेरी आवेदनें', 'My Applications')} subtitle={t('अपने अनुरोधों की स्थिति देखें', 'Track the status of your requests')}>
      {!user ? <NeedLogin text={t('अपनी शिकायतें और आवेदन देखने के लिए लॉगिन करें।', 'Log in to see your complaints and applications.')} /> : (
        <>
          <Chips value={filter} options={options} onChange={setFilter} />
          <Loaded q={requests}>
            {(all) => {
              const list = all.filter((r) => matchesFilter(r, filter));
              return list.length === 0
                ? <Empty icon="clipboard-text-off-outline" text={t('यहाँ कोई आवेदन नहीं है', 'No applications here')} />
                : list.map((r) => <RequestRow key={r.id} r={r} onPress={() => router.push(`/request/${r.id}`)} />);
            }}
          </Loaded>
          <Btn label={t('नई शिकायत दर्ज करें', 'Raise a new complaint')} icon="plus" color={C.orange} onPress={() => router.push('/complaint')} />
        </>
      )}
    </Screen>
  );
}
