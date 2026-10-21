import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Logo } from '../../components/Art';
import { Grid, LangToggle, Txt } from '../../components/ui';
import { Icon } from '../../data';
import { useStore, useT } from '../../store';
import { C } from '../../theme';

const TILES: { href: string; icon: Icon; color: string; hi: string; en: string }[] = [
  { href: '/register', icon: 'account', color: C.green, hi: 'मेरी जानकारी', en: 'My Profile' },
  { href: '/schemes', icon: 'bank', color: C.orange, hi: 'योजनाएँ', en: 'Government Schemes' },
  { href: '/complaint', icon: 'bullhorn', color: C.red, hi: 'मेरी समस्या', en: 'Complaint / Request' },
  { href: '/updates', icon: 'bell-ring', color: C.purple, hi: 'सूचनाएँ', en: 'Latest Updates' },
  { href: '/requests', icon: 'file-document-outline', color: C.blue, hi: 'मेरी आवेदनें', en: 'My Applications' },
  { href: '/dashboard', icon: 'home-city', color: C.teal, hi: 'गाँव की प्रगति', en: 'Village Dashboard' },
];

export default function Home() {
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.card }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 24 }}>
      <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        <View>
          <Banner height={170} />
          <View style={{ position: 'absolute', top: 10, right: 12 }}>
            <LangToggle />
          </View>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Logo size={40} />
              <Txt w="xb" size={24} color={C.navy}>Roopawas Seva</Txt>
            </View>
            <Txt w="sb" size={15} color={C.navy}>रूपावास की डिजिटल सेवा</Txt>
          </View>
        </View>

        <View style={{ padding: 16, gap: 14 }}>
          {profile ? (
            <Txt w="sb" size={16} color={C.navy}>
              {t(`नमस्ते, ${profile.name}`, `Namaste, ${profile.name}`)}
            </Txt>
          ) : null}

          <Grid cols={2}>
            {TILES.map((tile) => (
              <Pressable
                key={tile.href}
                onPress={() => router.navigate(tile.href)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: tile.color, borderRadius: 10, minHeight: 104, paddingVertical: 12, paddingHorizontal: 6,
                  alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1,
                })}
              >
                <MCI name={tile.icon} size={32} color="#FFFFFF" />
                {/* Full-width label: a shrink-wrapped Devanagari label can lose its last word on Android. */}
                <Txt w="b" size={18} color="#FFFFFF" center style={{ alignSelf: 'stretch', marginTop: 4 }}>{lang === 'hi' ? tile.hi : tile.en}</Txt>
              </Pressable>
            ))}
          </Grid>

          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <View style={{ borderBottomWidth: 2, borderBottomColor: C.orange, paddingBottom: 2 }}>
              <Txt w="b" size={17} color={C.orange} center>
                {t('“साथ मिलकर, बेहतर रूपावास”', '“Together, a better Roopawas”')}
              </Txt>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
