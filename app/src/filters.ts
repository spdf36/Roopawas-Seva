import { Request } from './data';
import { useT } from './store';

export type RequestFilter = 'all' | 'active' | 'done' | 'rejected';

export const matchesFilter = (r: Request, f: RequestFilter) =>
  f === 'all' ||
  (f === 'done' && r.status === 'resolved') ||
  (f === 'rejected' && r.status === 'rejected') ||
  (f === 'active' && r.status !== 'resolved' && r.status !== 'rejected');

export const useFilterOptions = (): { id: RequestFilter; label: string }[] => {
  const { t } = useT();
  return [
    { id: 'all', label: t('सभी', 'All') },
    { id: 'active', label: t('चालू', 'Active') },
    { id: 'done', label: t('पूर्ण', 'Completed') },
    { id: 'rejected', label: t('अस्वीकृत', 'Rejected') },
  ];
};
