import { Api } from '@shared/api';
import { useStore } from '../store';
import { createMockApi } from './mock';

export * from '@shared/api';

// Until the backend exists, a mock server in the browser stands in for it. Pages never call
// `api` directly; they go through the hooks in ./hooks.
export const api: Api = createMockApi(() => useStore.getState().token);
