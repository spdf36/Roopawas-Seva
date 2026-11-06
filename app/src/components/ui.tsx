import { MaterialCommunityIcons } from '@expo/vector-icons';
import { L, Request, STATUS, Visual, fmtDate, requestVisual, statusLabel } from '@shared/data';
import { UseQueryResult } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator, ColorValue, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps,
  TextProps, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL, ApiError } from '../api';
import { useStore, useT } from '../store';
import { C, F } from '../theme';

/** Icon names are plain strings in the shared catalogue; they are Material Design Icons names. */
export type IconName = string;

export function Ico({ name, size = 20, color = C.text }: { name: IconName; size?: number; color?: ColorValue }) {
  return <MaterialCommunityIcons name={name as keyof typeof MaterialCommunityIcons.glyphMap} size={size} color={color} />;
}

type TxtProps = TextProps & { w?: keyof typeof F; size?: number; color?: string; center?: boolean };

export function Txt({ w = 'r', size = 15, color = C.text, center, style, ...p }: TxtProps) {
  return (
    <Text
      // Android's default break strategy can measure Devanagari narrower than it draws,
      // wrapping the last word onto a line that is never shown.
      textBreakStrategy="simple"
      {...p}
      style={[
        { fontFamily: F[w], fontSize: size, lineHeight: Math.round(size * 1.45), color },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}

type ScreenProps = {
  title?: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  back?: boolean;
  right?: ReactNode;
  /** Tab screens sit above the tab bar, which already clears the bottom inset. */
  tab?: boolean;
  maxWidth?: number;
  children: ReactNode;
};

export function Screen({ title, subtitle, icon, iconColor = C.navy, back, right, tab, maxWidth = 720, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      {title ? (
        <View style={s.header}>
          <View style={s.headerSide}>
            {back ? (
              <Pressable onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
                <Ico name="chevron-left" size={30} color={C.navy} />
              </Pressable>
            ) : null}
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {icon ? <Ico name={icon} size={22} color={iconColor} /> : null}
              <Txt w="b" size={20} color={C.navy} numberOfLines={1} style={{ flexShrink: 1 }}>{title}</Txt>
            </View>
            {subtitle ? <Txt size={13} color={C.sub} center>{subtitle}</Txt> : null}
          </View>
          <View style={[s.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 28 + (tab ? 0 : insets.bottom),
            width: '100%',
            maxWidth,
            alignSelf: 'center',
            gap: 12,
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.card, style, pressed && { opacity: 0.75 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

/** A row of children with a gap; wraps when `wrap` is set. */
export function Row({ children, gap = 8, wrap, style }: { children: ReactNode; gap?: number; wrap?: boolean; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Bubble({ v, size = 44 }: { v: Visual; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: v.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Ico name={v.icon} size={size * 0.52} color={v.color} />
    </View>
  );
}

type BtnProps = {
  label: string; onPress: () => void; color?: string; icon?: IconName; outline?: boolean; disabled?: boolean; small?: boolean;
  /** Shows a spinner instead of the icon and blocks presses. */
  busy?: boolean; style?: ViewStyle;
};

export function Btn({ label, onPress, color = C.blue, icon, outline, disabled, small, busy, style }: BtnProps) {
  const fg = outline ? color : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label || icon}
      style={({ pressed }) => [
        s.btn,
        small && { paddingVertical: 7, paddingHorizontal: 12 },
        outline ? { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: color } : { backgroundColor: color },
        (disabled || busy) && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator size="small" color={fg} /> : icon ? <Ico name={icon} size={small ? 16 : 19} color={fg} /> : null}
      {label ? <Txt w="b" size={small ? 14 : 16} color={fg} style={{ flexShrink: 1 }}>{label}</Txt> : null}
    </Pressable>
  );
}

/**
 * A delete/remove button that asks first, inline: the first press shows "Yes / Cancel".
 * (Used instead of an alert dialog, which the app's browser build cannot show.)
 */
export function ConfirmBtn({ label, question, confirmLabel, onConfirm, icon = 'delete-outline', color = C.red, busy }: {
  label: string; question: string; confirmLabel?: string; onConfirm: () => void; icon?: IconName; color?: string; busy?: boolean;
}) {
  const { t } = useT();
  const [asking, setAsking] = useState(false);
  if (!asking) return <Btn small outline color={color} icon={icon} label={label} busy={busy} onPress={() => setAsking(true)} />;
  return (
    <View style={{ gap: 6, flexBasis: '100%' }}>
      <Txt w="sb" size={14} color={color}>{question}</Txt>
      <Row>
        <Btn small color={color} icon={icon} label={confirmLabel ?? t('हाँ, हटाएँ', 'Yes, remove')} onPress={() => { setAsking(false); onConfirm(); }} />
        <Btn small outline color={C.sub} label={t('रद्द करें', 'Cancel')} onPress={() => setAsking(false)} />
      </Row>
    </View>
  );
}

function Label({ label, required }: { label: string; required?: boolean }) {
  return (
    <Txt w="m" size={14} color={C.sub} style={{ flexShrink: 1 }}>
      {label}
      {required ? <Txt w="b" size={14} color={C.red}> *</Txt> : null}
    </Txt>
  );
}

function FieldLabel({ label, required, icon }: { label: string; required?: boolean; icon?: IconName }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {icon ? <Ico name={icon} size={17} color={C.navy} /> : null}
      <Label label={label} required={required} />
    </View>
  );
}

type FieldProps = TextInputProps & { label: string; required?: boolean; icon?: IconName };

export function Field({ label, required, icon, style, ...p }: FieldProps) {
  return (
    <View style={{ gap: 4 }}>
      <FieldLabel label={label} required={required} icon={icon} />
      <TextInput
        placeholderTextColor={C.faint}
        {...p}
        style={[s.input, p.multiline && { minHeight: 96, textAlignVertical: 'top' }, style]}
      />
    </View>
  );
}

/** One piece of bilingual text: Hindi is required, English optional (the API falls back to Hindi). */
export function BiField({ label, value, onChange, required, multiline, placeholder }: {
  label: string; value: L; onChange: (v: L) => void; required?: boolean; multiline?: boolean; placeholder?: L;
}) {
  const { t } = useT();
  const extra = multiline ? { multiline: true, style: { minHeight: 70 } } : {};
  return (
    <>
      <Field label={`${label} (${t('हिंदी', 'Hindi')})`} required={required} value={value.hi} placeholder={placeholder?.hi} onChangeText={(hi) => onChange({ ...value, hi })} {...extra} />
      <Field label={`${label} (${t('अंग्रेज़ी, वैकल्पिक', 'English, optional')})`} value={value.en} placeholder={placeholder?.en} onChangeText={(en) => onChange({ ...value, en })} {...extra} />
    </>
  );
}

type SelectProps = {
  label: string;
  required?: boolean;
  icon?: IconName;
  value?: string;
  placeholder?: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
};

export function Select({ label, required, icon, value, placeholder, options, onChange }: SelectProps) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  return (
    <View style={{ gap: 4 }}>
      <FieldLabel label={label} required={required} icon={icon} />
      <Pressable onPress={() => setOpen(true)} style={[s.input, { flexDirection: 'row', alignItems: 'center' }]} accessibilityRole="button">
        <Txt size={16} color={current ? C.text : C.faint} style={{ flex: 1 }} numberOfLines={1}>
          {current?.label ?? placeholder ?? t('चुनें', 'Select')}
        </Txt>
        <Ico name="chevron-down" size={22} color={C.sub} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Txt w="b" size={17} color={C.navy} style={{ padding: 14 }}>{label}</Txt>
            <ScrollView style={{ maxHeight: 380 }}>
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => { onChange(o.id); setOpen(false); }}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.option, (pressed || o.id === value) && { backgroundColor: C.blueSoft }]}
                >
                  <Txt size={16} w={o.id === value ? 'b' : 'r'} style={{ flex: 1 }}>{o.label}</Txt>
                  {o.id === value ? <Ico name="check" size={20} color={C.blue} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function Chips<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (id: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ flexGrow: 0 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} style={[s.chip, on && { backgroundColor: C.blue }]} accessibilityRole="button">
            <Txt w={on ? 'b' : 'm'} size={14} color={on ? '#FFFFFF' : C.sub}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Coloured choice buttons, e.g. the next status of a request or a yojna. */
export function Picks<T extends string>({ value, options, onChange }: { value?: T; options: { id: T; label: string; color: string }[]; onChange: (id: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5, borderColor: o.color, backgroundColor: on ? o.color : C.card }}
          >
            <Txt w="b" size={14} color={on ? '#FFFFFF' : o.color}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Badge({ label, color, soft }: { label: string; color: string; soft: string }) {
  return (
    <View style={{ backgroundColor: soft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Txt w="b" size={12} color={color}>{label}</Txt>
    </View>
  );
}

export function StatusBadge({ r }: { r: Request }) {
  const { tl } = useT();
  const st = STATUS[r.status];
  return <Badge label={tl(statusLabel(r))} color={st.color} soft={st.soft} />;
}

/** Marks a complaint the citizen reopened because it was not actually fixed. */
export function ReopenedBadge({ r }: { r: Request }) {
  const { t } = useT();
  if (!r.reopened) return null;
  const label = r.reopened > 1 ? t(`${r.reopened} बार दोबारा खोला`, `Reopened ${r.reopened}×`) : t('दोबारा खोला गया', 'Reopened');
  return <Badge label={label} color={C.red} soft={C.redSoft} />;
}

export function RequestRow({ r, onPress, showCitizen, right }: { r: Request; onPress: () => void; showCitizen?: boolean; right?: ReactNode }) {
  const { tl } = useT();
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Bubble v={requestVisual(r)} />
      <View style={{ flex: 1 }}>
        <Txt w="b" size={16} numberOfLines={1}>{tl(r.title)}</Txt>
        <Txt size={12} color={C.sub}>{r.id}</Txt>
        <Txt size={12} color={C.sub} numberOfLines={1}>
          {fmtDate(r.createdAt)}{showCitizen && r.citizen.name ? `  •  ${r.citizen.name}` : ''}
        </Txt>
        {right}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <StatusBadge r={r} />
        <ReopenedBadge r={r} />
      </View>
    </Card>
  );
}

export function LangToggle() {
  const lang = useStore((x) => x.lang);
  const setLang = useStore((x) => x.setLang);
  return (
    <View style={s.lang} accessibilityRole="radiogroup">
      {(['hi', 'en'] as const).map((code) => {
        const on = lang === code;
        return (
          <Pressable
            key={code}
            onPress={() => setLang(code)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[s.langOpt, on && { backgroundColor: C.navy }]}
          >
            <Txt w="b" size={13} color={on ? '#FFFFFF' : C.navy}>{code === 'hi' ? 'हिंदी' : 'English'}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
      <Ico name={icon} size={44} color={C.faint} />
      <Txt color={C.sub} center>{text}</Txt>
    </View>
  );
}

/** Lays children out in equal-width columns, padding the last row so cells keep their size. */
export function Grid({ cols, gap = 10, children }: { cols: number; gap?: number; children: ReactNode[] }) {
  const rows: ReactNode[][] = [];
  for (let i = 0; i < children.length; i += cols) rows.push(children.slice(i, i + cols));
  return (
    <View style={{ gap }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap }}>
          {row.map((cell, j) => <View key={j} style={{ flex: 1 }}>{cell}</View>)}
          {Array.from({ length: cols - row.length }, (_, j) => <View key={`pad${j}`} style={{ flex: 1 }} />)}
        </View>
      ))}
    </View>
  );
}

/** A thin horizontal bar filled to `pct` per cent. */
export function ProgressBar({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: '#E8EEF6', overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

/** Segments in proportion to their values (e.g. resolved / in progress / forwarded). */
export function StackedBar({ parts, height = 12 }: { parts: { value: number; color: string }[]; height?: number }) {
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: '#E8EEF6' }}>
      {parts.filter((p) => p.value > 0).map((p, i) => <View key={i} style={{ flex: p.value, backgroundColor: p.color }} />)}
    </View>
  );
}

export function ErrorText({ text }: { text?: string }) {
  return text ? <Txt w="sb" size={14} color={C.red}>{text}</Txt> : null;
}

export function OkText({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <Row gap={6} style={{ alignItems: 'flex-start' }}>
      <Ico name="check-circle" size={18} color={C.green} />
      <Txt w="sb" size={14} color={C.green} style={{ flex: 1 }}>{text}</Txt>
    </Row>
  );
}

/** A user-facing message for any error thrown by the API (or anything else). */
export function useErrorText() {
  const { t } = useT();
  return (error: unknown): string => {
    const code = error instanceof ApiError ? error.code : 'network';
    switch (code) {
      case 'invalid_login': return t('मोबाइल नंबर / यूज़र आईडी या पिन गलत है।', 'Incorrect mobile number / user ID or PIN.');
      case 'inactive': return t('यह खाता निष्क्रिय है। पंचायत कार्यालय से संपर्क करें।', 'This account is deactivated. Please contact the Panchayat office.');
      case 'unauthorized': return t('आपका सत्र समाप्त हो गया। कृपया फिर से लॉगिन करें।', 'Your session has ended. Please log in again.');
      case 'forbidden': return t('आपको यह करने की अनुमति नहीं है।', 'You are not allowed to do this.');
      case 'not_found': return t('यह जानकारी नहीं मिली।', 'This could not be found.');
      case 'exists': return t('यह पहले से मौजूद है।', 'This already exists.');
      case 'in_use': return t('इसे हटाया नहीं जा सकता क्योंकि इससे जुड़े रिकॉर्ड (जैसे आवेदन) मौजूद हैं।', 'This cannot be deleted because other records (such as applications) refer to it.');
      case 'invalid': return t('जानकारी सही नहीं है। कृपया जाँचकर फिर से भेजें।', 'Some details are not valid. Please check and try again.');
      case 'too_large': return t('फोटो बहुत बड़ी है या जगह भर गई है। कृपया छोटी फोटो चुनें या फोटो हटाकर भेजें।', 'The photo is too large, or storage is full. Choose a smaller photo or send without one.');
      case 'rate_limited': return t('बहुत अधिक प्रयास हुए। कृपया 15 मिनट बाद फिर से प्रयास करें।', 'Too many attempts. Please try again in 15 minutes.');
      case 'unavailable': return t('यह सुविधा सर्वर से जुड़ने पर ही उपलब्ध है। ऐप अभी डेमो डेटा पर चल रहा है।', 'This feature needs the server. The app is running on demo data.');
      case 'server_error': return t('सर्वर पर कुछ गलत हो गया। कृपया थोड़ी देर बाद फिर से प्रयास करें।', 'Something went wrong on the server. Please try again in a little while.');
      default: return API_URL
        ? t('सर्वर से संपर्क नहीं हो सका। इंटरनेट जाँचकर फिर से प्रयास करें।', 'Could not reach the server. Check the internet connection and try again.')
        : t('कुछ गलत हो गया। कृपया फिर से प्रयास करें।', 'Something went wrong. Please try again.');
    }
  };
}

export function Loading() {
  const { t } = useT();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={C.navy} />
      <Txt color={C.sub}>{t('लोड हो रहा है…', 'Loading…')}</Txt>
    </View>
  );
}

/** Shows why something failed to load, with a retry button. `notFound` replaces the text for a 404. */
export function ErrorBox({ error, retry, notFound }: { error: unknown; retry?: () => void; notFound?: string }) {
  const { t } = useT();
  const errorText = useErrorText();
  const missing = error instanceof ApiError && error.code === 'not_found';
  // Trying again cannot help when the feature does not exist offline.
  const offline = error instanceof ApiError && error.code === 'unavailable';
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 10 }}>
      <Ico name={missing ? 'file-question-outline' : offline ? 'cloud-off-outline' : 'alert-circle-outline'} size={44} color={missing || offline ? C.faint : C.red} />
      <Txt color={C.sub} center>{missing && notFound ? notFound : errorText(error)}</Txt>
      {retry && !missing && !offline ? <Btn small outline icon="refresh" label={t('फिर से प्रयास करें', 'Try again')} onPress={retry} /> : null}
    </Card>
  );
}

/** Renders a query's data once it has loaded, and its loading or error state until then. */
export function Loaded<T>({ q, notFound, children }: { q: UseQueryResult<T>; notFound?: string; children: (data: T) => ReactNode }) {
  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorBox error={q.error} retry={() => q.refetch()} notFound={notFound} />;
  return <>{children(q.data)}</>;
}

/** Prompts a visitor to log in (or register) before applying, raising a complaint or tracking requests. */
export function NeedLogin({ text }: { text?: string }) {
  const { t } = useT();
  const router = useRouter();
  return (
    <Card style={{ backgroundColor: C.blueSoft, borderColor: '#BCD3F5', gap: 10 }}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Ico name="account-lock-outline" size={28} color={C.navy} />
        <Txt style={{ flex: 1 }}>{text ?? t('आवेदन करने के लिए नागरिक के रूप में लॉगिन करें।', 'Log in as a citizen to apply.')}</Txt>
      </Row>
      <Row>
        <Btn small color={C.navy} icon="login" label={t('लॉगिन करें', 'Log in')} onPress={() => router.push('/login')} style={{ flex: 1 }} />
        <Btn small outline color={C.green} label={t('पंजीकरण करें', 'Register')} onPress={() => router.push('/register')} style={{ flex: 1 }} />
      </Row>
    </Card>
  );
}

/** A section heading inside a screen. */
export function Heading({ children, color = C.navy, right }: { children: ReactNode; color?: string; right?: ReactNode }) {
  return (
    <Row style={{ marginTop: 4 }}>
      <Txt w="b" size={17} color={color} style={{ flex: 1 }}>{children}</Txt>
      {right}
    </Row>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerSide: { width: 44, justifyContent: 'center' },
  card: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 16 },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 9, minHeight: 46, fontFamily: F.r, fontSize: 16, color: C.text,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(11,30,60,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', width: '100%', maxWidth: 420, alignSelf: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  chip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8, backgroundColor: '#E8EEF6' },
  lang: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: C.navy, overflow: 'hidden', alignSelf: 'flex-start' },
  langOpt: { paddingHorizontal: 10, paddingVertical: 3 },
});
