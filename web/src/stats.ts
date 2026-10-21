import { useMemo } from 'react';
import { DASHBOARD_BASE as B, Request } from './data';
import { useStore } from './store';

const isOpen = (r: Request) => r.status !== 'resolved' && r.status !== 'rejected';

/** Village-wide figures: the recorded baseline plus whatever is in this device's request list. */
export function useVillageStats() {
  const requests = useStore((s) => s.requests);
  return useMemo(() => {
    const count = (fn: (r: Request) => boolean) => requests.filter(fn).length;
    return {
      total: B.total + requests.length,
      resolved: B.resolved + count((r) => r.status === 'resolved'),
      inProgress: B.inProgress + count((r) => isOpen(r) && r.status !== 'forwarded'),
      forwarded: B.forwarded + count((r) => r.status === 'forwarded'),
      roads: B.roads + count((r) => r.categoryId === 'road' && isOpen(r)),
      water: B.water + count((r) => r.categoryId === 'water' && isOpen(r)),
      lightsFixed: B.lightsFixed + count((r) => r.categoryId === 'light' && r.status === 'resolved'),
      schemeApplications: B.schemeApplications + count((r) => r.kind === 'application'),
      schoolWorks: B.schoolWorks,
      trees: B.trees,
    };
  }, [requests]);
}
