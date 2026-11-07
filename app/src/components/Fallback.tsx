import type { ErrorBoundaryProps } from 'expo-router';
import { ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { recheckConnection } from '../net';
import { useT } from '../store';
import { C } from '../theme';
import { Btn, Ico, IconName, Txt } from './ui';

/** A whole-screen message with an icon and one button, for when the app cannot show anything else. */
function FullPage({ icon, title, text, children }: { icon: IconName; title: string; text: string; children: ReactNode }) {
  return (
    <View style={[StyleSheet.absoluteFill, s.page]} accessibilityRole="alert">
      <View style={s.circle}>
        <Ico name={icon} size={56} color={C.red} />
      </View>
      <Txt w="xb" size={22} color={C.navy} center>{title}</Txt>
      <Txt color={C.sub} center style={{ maxWidth: 320 }}>{text}</Txt>
      {children}
    </View>
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
      <Btn icon="refresh" label={t('फिर से जाँचें', 'Check again')} onPress={retry} busy={checking} style={{ minWidth: 200 }} />
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
      <Btn icon="refresh" label={t('फिर से प्रयास करें', 'Try again')} onPress={retry} style={{ minWidth: 200 }} />
    </FullPage>
  );
}

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, zIndex: 100 },
  circle: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 6, backgroundColor: C.redSoft },
});
