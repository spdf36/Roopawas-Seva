import { Mukta_400Regular } from '@expo-google-fonts/mukta/400Regular';
import { Mukta_500Medium } from '@expo-google-fonts/mukta/500Medium';
import { Mukta_600SemiBold } from '@expo-google-fonts/mukta/600SemiBold';
import { Mukta_700Bold } from '@expo-google-fonts/mukta/700Bold';
import { Mukta_800ExtraBold } from '@expo-google-fonts/mukta/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { isStaff } from '../data';
import { useStore, useUser } from '../store';
import { C } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold, Mukta_800ExtraBold,
  });
  const hydrated = useStore((s) => s.hydrated);
  const user = useUser();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // Which screens exist depends on who is logged in. When the guards change (login/logout)
  // the router moves to the first screen available to the new role, so group order matters:
  // citizens land on the tabs, staff on the admin dashboard, guests on the login screen.
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Protected guard={user?.role === 'citizen'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="complaint" />
          <Stack.Screen name="request/[id]" />
          <Stack.Screen name="scheme/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={isStaff(user)}>
          <Stack.Screen name="admin" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="updates" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="about" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
