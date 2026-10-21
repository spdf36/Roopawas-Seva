import { Stack } from 'expo-router';
import { useUser } from '../../store';
import { C } from '../../theme';

// The root layout already limits this folder to staff; admin management is superadmin-only.
export default function AdminLayout() {
  const isSuper = useUser()?.role === 'superadmin';
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={isSuper}>
        <Stack.Screen name="admins" />
      </Stack.Protected>
    </Stack>
  );
}
