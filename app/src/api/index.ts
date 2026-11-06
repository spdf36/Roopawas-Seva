import { Api } from '@shared/api';
import { useStore } from '../store';
import { createHttpApi } from './http';
import { createMockApi } from './mock';

export * from '@shared/api';

/**
 * The backend's address, from EXPO_PUBLIC_API_URL when the app is started or built (e.g. http://192.168.1.20:4000 –
 * a phone cannot reach "localhost" on the computer). Without it the app runs on its built-in demo data.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
const getToken = () => useStore.getState().token;

// Screens never call `api` directly; they go through the hooks in ./hooks.
export const api: Api = API_URL ? createHttpApi(API_URL, getToken) : createMockApi(getToken);
