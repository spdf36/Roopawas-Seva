import { Api } from '@shared/api';
import { useStore } from '../store';
import { createHttpApi } from './http';
import { createMockApi } from './mock';

export * from '@shared/api';

/** The backend's address from web/.env (e.g. http://localhost:4000); without it the website runs on its mock. */
const API_URL = import.meta.env.VITE_API_URL?.trim();
const getToken = () => useStore.getState().token;

// Pages never call `api` directly; they go through the hooks in ./hooks.
export const api: Api = API_URL ? createHttpApi(API_URL, getToken) : createMockApi(getToken);
