import { RequestFilter } from './data';
import { useT } from './store';

export const useFilterOptions = (): { id: RequestFilter; label: string }[] => {
  const { t } = useT();
  return [
    { id: 'all', label: t('सभी', 'All') },
    { id: 'active', label: t('चालू', 'Active') },
    { id: 'done', label: t('पूर्ण', 'Completed') },
    { id: 'rejected', label: t('अस्वीकृत', 'Rejected') },
  ];
};
