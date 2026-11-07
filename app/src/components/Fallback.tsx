import type { ErrorBoundaryProps } from 'expo-router';
import { ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { recheckConnection } from '../net';
import { useT } from '../store';
import { C } from '../theme';
import { Ico, IconName, Txt } from './ui';

/**
 * A whole-screen message with an icon and one button, for when the app cannot show anything else.
 * Every text here takes the full width rather than its own measured width: when this page is the very first
 * thing drawn, Android measures Devanagari narrower than it draws and the last word wraps out of sight.
 */
function FullPage({ icon, title, text, children }: { icon: IconName; title: string; text: string; children: ReactNode }) {
  return (
    <View style={[StyleSheet.absoluteFill, s.page]} accessibilityRole="alert">
      <View style={s.circle}>
        <Ico name={icon} size={56} color={C.red} />
      </View>
      <Txt w="xb" size={22} color={C.navy} center style={s.wide}>{title}</Txt>
      <Txt color={C.sub} center style={s.wide}>{text}</Txt>
      {children}
    </View>
  );
}

/** The page's button; its label fills the button (see FullPage) instead of using Btn's content-sized label. */
function PageBtn({ label, onPress, busy }: { label: string; onPress: () => void; busy?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={busy} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [s.btn, (busy || pressed) && { opacity: 0.7 }]}>
      {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ico name="refresh" size={19} color="#FFFFFF" />}
      <Txt w="b" size={16} color="#FFFFFF" center style={{ flexGrow: 1, flexShrink: 1 }}>{label}</Txt>
    </Pressable>
  );
}

/**
 * Covers the app while the phone has no internet. It sits on top of the screens instead of replacing them, so
 * whatever the person was doing (a half-written complaint, the screen they were on) is still there afterwards.
 */
export function NoInternet() {
  const { t } = useT();
  const [checking, setChecking] = useState(false);
  const retry = () => {
    setChecking(true);
    recheckConnection().finally(() => setChecking(false));
  };
  return (
    <FullPage
      icon="wifi-off"
      title={t('इंटरनेट कनेक्शन नहीं है', 'No internet connection')}
      text={t(
        'कृपया मोबाइल डेटा या वाई-फ़ाई चालू करें। कनेक्शन मिलते ही ऐप अपने आप फिर से चलने लगेगा।',
        'Please turn on mobile data or Wi-Fi. The app will continue on its own as soon as the connection is back.',
      )}
    >
      <PageBtn label={t('फिर से जाँचें', 'Check again')} onPress={retry} busy={checking} />
    </FullPage>
  );
}

/** Shown instead of a crash if a screen throws while rendering (expo-router's ErrorBoundary). */
export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const { t } = useT();
  if (__DEV__) console.error(error);
  return (
    <FullPage
      icon="alert-circle-outline"
      title={t('कुछ गलत हो गया', 'Something went wrong')}
      text={t('यह स्क्रीन खुल नहीं सकी। कृपया फिर से प्रयास करें।', 'This screen could not be opened. Please try again.')}
    >
      <PageBtn label={t('फिर से प्रयास करें', 'Try again')} onPress={retry} />
    </FullPage>
  );
}

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, zIndex: 100 },
  wide: { alignSelf: 'stretch', maxWidth: 360, width: '100%' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 240, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 8, backgroundColor: C.blue },
  circle: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 6, backgroundColor: C.redSoft },
});
