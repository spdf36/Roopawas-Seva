import { Redirect, Stack, useSegments } from 'expo-router';
import { useStore } from '../../store';
import { C } from '../../theme';

export default function AdminLayout() {
  const isAdmin = useStore((s) => s.isAdmin);
  const segments: string[] = useSegments();
  if (!isAdmin && segments[1] !== 'login') return <Redirect href="/admin/login" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />;
}
