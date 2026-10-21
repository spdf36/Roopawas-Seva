import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps,
  TextProps, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Request, STATUS, Visual, fmtDate, requestVisual, statusLabel } from '../data';
import { useStore, useT } from '../store';
import { C, F } from '../theme';

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
  icon?: Icon;
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
                <MCI name="chevron-left" size={30} color={C.navy} />
              </Pressable>
            ) : null}
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {icon ? <MCI name={icon} size={22} color={iconColor} /> : null}
              <Txt w="b" size={20} color={C.navy} numberOfLines={1}>{title}</Txt>
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
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.75 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function Bubble({ v, size = 44 }: { v: Visual; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: v.soft, alignItems: 'center', justifyContent: 'center' }}>
      <MCI name={v.icon} size={size * 0.52} color={v.color} />
    </View>
  );
}

type BtnProps = { label: string; onPress: () => void; color?: string; icon?: Icon; outline?: boolean; disabled?: boolean; small?: boolean; style?: ViewStyle };

export function Btn({ label, onPress, color = C.blue, icon, outline, disabled, small, style }: BtnProps) {
  const fg = outline ? color : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        small && { paddingVertical: 7, paddingHorizontal: 12 },
        outline ? { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: color } : { backgroundColor: color },
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon ? <MCI name={icon} size={small ? 16 : 19} color={fg} /> : null}
      <Txt w="b" size={small ? 14 : 16} color={fg}>{label}</Txt>
    </Pressable>
  );
}

function Label({ label, required }: { label: string; required?: boolean }) {
  return (
    <Txt w="m" size={14} color={C.sub}>
      {label}
      {required ? <Txt w="b" size={14} color={C.red}> *</Txt> : null}
    </Txt>
  );
}

type FieldProps = TextInputProps & { label: string; required?: boolean; icon?: Icon };

export function Field({ label, required, icon, style, ...p }: FieldProps) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <MCI name={icon} size={17} color={C.navy} /> : null}
        <Label label={label} required={required} />
      </View>
      <TextInput
        placeholderTextColor={C.faint}
        {...p}
        style={[s.input, p.multiline && { minHeight: 96, textAlignVertical: 'top' }, style]}
      />
    </View>
  );
}

type SelectProps = {
  label: string;
  required?: boolean;
  icon?: Icon;
  value?: string;
  placeholder: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
};

export function Select({ label, required, icon, value, placeholder, options, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <MCI name={icon} size={17} color={C.navy} /> : null}
        <Label label={label} required={required} />
      </View>
      <Pressable onPress={() => setOpen(true)} style={[s.input, { flexDirection: 'row', alignItems: 'center' }]} accessibilityRole="button">
        <Txt size={16} color={current ? C.text : C.faint} style={{ flex: 1 }} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Txt>
        <MCI name="chevron-down" size={22} color={C.sub} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Txt w="b" size={17} color={C.navy} style={{ padding: 14 }}>{label}</Txt>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => { onChange(o.id); setOpen(false); }}
                  style={({ pressed }) => [s.option, (pressed || o.id === value) && { backgroundColor: C.blueSoft }]}
                >
                  <Txt size={16} w={o.id === value ? 'b' : 'r'} style={{ flex: 1 }}>{o.label}</Txt>
                  {o.id === value ? <MCI name="check" size={20} color={C.blue} /> : null}
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

export function Badge({ label, color, soft }: { label: string; color: string; soft: string }) {
  return (
    <View style={{ backgroundColor: soft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Txt w="b" size={12} color={color}>{label}</Txt>
    </View>
  );
}

export function RequestRow({ r, onPress, showCitizen }: { r: Request; onPress: () => void; showCitizen?: boolean }) {
  const { tl } = useT();
  const st = STATUS[r.status];
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Bubble v={requestVisual(r)} />
      <View style={{ flex: 1 }}>
        <Txt w="b" size={16} numberOfLines={1}>{tl(r.title)}</Txt>
        <Txt size={12} color={C.sub}>{r.id}</Txt>
        <Txt size={12} color={C.sub} numberOfLines={1}>
          {fmtDate(r.createdAt)}{showCitizen && r.citizen.name ? `  •  ${r.citizen.name}` : ''}
        </Txt>
      </View>
      <Badge label={tl(statusLabel(r))} color={st.color} soft={st.soft} />
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

export function Empty({ icon, text }: { icon: Icon; text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
      <MCI name={icon} size={44} color={C.faint} />
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
  chip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8 },
  lang: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: C.navy, overflow: 'hidden', alignSelf: 'flex-start' },
  langOpt: { paddingHorizontal: 10, paddingVertical: 3 },
});
