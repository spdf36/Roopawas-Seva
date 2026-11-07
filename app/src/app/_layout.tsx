import { Mukta_400Regular } from '@expo-google-fonts/mukta/400Regular';
import { Mukta_500Medium } from '@expo-google-fonts/mukta/500Medium';
import { Mukta_600SemiBold } from '@expo-google-fonts/mukta/600SemiBold';
import { Mukta_700Bold } from '@expo-google-fonts/mukta/700Bold';
import { Mukta_800ExtraBold } from '@expo-google-fonts/mukta/800ExtraBold';
import { isStaff } from '@shared/data';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { API_URL } from '../api';
import { queryClient, useSessionCheck } from '../api/hooks';
import { loadMockDb } from '../api/mock';
import { NoInternet } from '../components/Fallback';
import { useOffline } from '../net';
import { useStore, useUser } from '../store';
import { C } from '../theme';

SplashScreen.preventAutoHideAsync();

// A screen that throws while rendering shows a Try again page instead of closing the app.
export { CrashScreen as ErrorBoundary } from '../components/Fallback';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold, Mukta_800ExtraBold,
  });
  const hydrated = useStore((s) => s.hydrated);
  // Without a server, the demo data saved on the phone is read once before anything renders.
  const [dbReady, setDbReady] = useState(!!API_URL);
  useEffect(() => {
    if (!API_URL) loadMockDb().then(() => setDbReady(true));
  }, []);
  const ready = (fontsLoaded || !!fontError) && hydrated && dbReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Routes />
      <OfflineCover />
    </QueryClientProvider>
  );
}

/** With the server, nothing works offline: cover the app with the No-internet page (the demo data on the phone needs no internet). */
function OfflineCover() {
  const offline = useOffline();
  return API_URL && offline ? <NoInternet /> : null;
}

/**
 * Which screens exist depends on who is logged in, as on the website: village information is public, complaints
 * and applications need a citizen login, and staff get the admin area. When the guards change (login/logout) the
 * router moves to the first screen available to the new role, so group order matters: visitors and citizens land
 * on the tabs, staff on the admin dashboard.
 */
function Routes() {
  const user = useUser();
  // Re-checks the saved session with the API at start-up (it may have ended or been deactivated).
  useSessionCheck();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Protected guard={!isStaff(user)}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={isStaff(user)}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
      <Stack.Protected guard={user?.role === 'citizen'}>
        <Stack.Screen name="profile" />
        <Stack.Screen name="complaint" />
        <Stack.Screen name="request/[id]" />
      </Stack.Protected>
      <Stack.Screen name="updates" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="yojnas/index" />
      <Stack.Screen name="yojnas/[id]" />
      <Stack.Screen name="about" />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
