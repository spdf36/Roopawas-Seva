import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../data';
import { useT } from '../../store';
import { C, F } from '../../theme';

const TABS: { name: string; icon: Icon; hi: string; en: string }[] = [
  { name: 'index', icon: 'home', hi: 'होम', en: 'Home' },
  { name: 'schemes', icon: 'bank-outline', hi: 'योजनाएँ', en: 'Schemes' },
  { name: 'requests', icon: 'clipboard-text-outline', hi: 'आवेदन', en: 'Requests' },
  { name: 'more', icon: 'dots-horizontal', hi: 'अन्य', en: 'More' },
];

export default function TabLayout() {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.navy,
        tabBarInactiveTintColor: C.sub,
        tabBarLabelStyle: { fontFamily: F.m, fontSize: 12, lineHeight: 18 },
        // The explicit height gives Devanagari labels room; the default bar clips them.
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.border, height: 60 + insets.bottom, paddingTop: 4 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.hi, tab.en),
            tabBarIcon: ({ color }) => <MCI name={tab.icon} size={24} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
