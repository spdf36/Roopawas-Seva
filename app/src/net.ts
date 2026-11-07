import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { API_URL } from './api';

/**
 * Offline only when the phone says so for certain: `isInternetReachable` is null while it is still being
 * checked, and a brief "unknown" must not flash the No-internet screen at start-up.
 */
const isOffline = (s: NetInfoState) => s.isConnected === false || s.isInternetReachable === false;

// With the server, TanStack Query pauses requests while offline and refetches when the connection returns, instead
// of failing them one by one (its default listener only knows about browsers). The on-phone demo data needs no
// internet, so without a server the queries must keep running.
if (API_URL) onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((s) => setOnline(!isOffline(s))));

/** Whether the phone has no internet connection right now. */
export function useOffline() {
  const [offline, setOffline] = useState(false);
  useEffect(() => NetInfo.addEventListener((s) => setOffline(isOffline(s))), []);
  return offline;
}

/** Asks the phone to check the connection again now (the Try again button); listeners hear the result. */
export const recheckConnection = () => NetInfo.refresh();
