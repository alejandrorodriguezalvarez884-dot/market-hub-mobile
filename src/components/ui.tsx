// The pieces every screen is built from, drawn as the site draws them: a page with no boxes,
// sections under a hairline rule, figures in the monospaced face.
import { type PropsWithChildren, type ReactNode, type Ref } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { color, font, radius, space } from "@/lib/theme";

export type Tone = "ink" | "strong" | "muted" | "faint" | "up" | "down" | "warn" | "page";
const TONES: Record<Tone, string> = { ink: color.ink, strong: color.inkStrong, muted: color.muted, faint: color.faint,
  up: color.up, down: color.down, warn: color.warn, page: color.page };
type Weight = "regular" | "medium" | "semibold" | "bold";

type TxtProps = TextProps & { size?: number; weight?: Weight; tone?: Tone; num?: boolean };

// Text in the portal's faces. `num` sets a figure: monospaced, so columns of them line up.
export function Txt({ size = 15, weight = "regular", tone = "ink", num = false, style, ...rest }: TxtProps) {
  const family = num ? (weight === "regular" ? font.mono : font.monoMedium) : font[weight];
  const base: TextStyle = { fontFamily: family, fontSize: size, color: TONES[tone] };
  if (num) Object.assign(base, { letterSpacing: -0.02 * size, fontVariant: ["tabular-nums"] });
  return <Text {...rest} style={[base, style]} />;
}

export const Label = (props: TxtProps) => <Txt size={12.5} tone="muted" {...props} />;

type ScreenProps = PropsWithChildren<{ refreshing?: boolean; onRefresh?: () => void; footer?: ReactNode }>;

// A screen that scrolls, clear of the notch, with what is pinned to its bottom under it.
export function Screen({ children, refreshing = false, onRefresh, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.fill}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.screen, { paddingTop: insets.top + space.lg }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.muted} /> : undefined}>
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

// The head of a screen: where you are, its title, a line under it.
export function Head({ title, note, sample = false }: { title: string; note?: string; sample?: boolean }) {
  return (
    <View>
      <View style={styles.row}>
        <Label>My Hub</Label>
        {sample && <SampleNote />}
      </View>
      <Txt size={24} weight="bold" tone="strong" style={{ marginTop: 2 }}>{title}</Txt>
      {note ? <Txt size={13} tone="muted" style={{ marginTop: 2 }}>{note}</Txt> : null}
    </View>
  );
}

// The provider did not answer: what is shown is sample data, and the screen says so by its title.
export function SampleNote() {
  return (
    <View style={styles.sample} accessibilityLabel="Sample figures: the market data provider is not answering, so prices and returns are placeholders.">
      <Txt size={12} tone="warn">sample figures</Txt>
    </View>
  );
}

// A section of a screen: a rule, a title, the content. No box around it.
export function Section({ title, note, action, children }: PropsWithChildren<{ title: string; note?: string; action?: ReactNode }>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Txt size={14} weight="semibold" tone="strong" accessibilityRole="header">{title}</Txt>
        {action}
      </View>
      {note ? <Txt size={13} tone="muted" style={{ marginBottom: space.md, lineHeight: 19 }}>{note}</Txt> : <View style={{ height: space.md }} />}
      {children}
    </View>
  );
}

export function Panel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

type ButtonProps = { title: string; onPress: () => void; kind?: "primary" | "ghost" | "danger"; busy?: boolean; disabled?: boolean;
  // A mark drawn before the words (Google's, on its button).
  mark?: ReactNode; style?: StyleProp<ViewStyle> };

export function Button({ title, onPress, kind = "primary", busy = false, disabled = false, mark, style }: ButtonProps) {
  const off = busy || disabled;
  const ink = kind === "ghost" ? "ink" : "page";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [styles.button, kind === "primary" && styles.primary, kind === "ghost" && styles.ghost,
        kind === "danger" && styles.danger, (pressed || off) && { opacity: 0.6 }, style]}>
      {busy ? <ActivityIndicator size="small" color={TONES[ink]} /> : (
        <>
          {mark}
          <Txt size={15} weight="medium" tone={ink}>{title}</Txt>
        </>
      )}
    </Pressable>
  );
}

export function Field({ style, ...rest }: TextInputProps & { ref?: Ref<TextInput> }) {
  return <TextInput placeholderTextColor={color.faint} selectionColor={color.inkStrong} autoCapitalize="none" autoCorrect={false}
    {...rest} style={[styles.field, style]} />;
}

// A line of words that says something went wrong, or that something needs doing.
export function Notice({ text, tone = "down" }: { text: string; tone?: "down" | "warn" | "muted" }) {
  if (tone === "muted") return <Txt size={13} tone="muted">{text}</Txt>;
  return (
    <View style={[styles.notice, tone === "down" ? styles.noticeDown : styles.noticeWarn]} accessibilityRole="alert">
      <Txt size={13} tone={tone} style={{ lineHeight: 19 }}>{text}</Txt>
    </View>
  );
}

// What stands for a screen's figures while they are on their way.
export function Waiting() {
  return (
    <View style={{ gap: space.lg }} accessibilityLabel="Loading">
      <View style={[styles.skeleton, { height: 56, width: "70%" }]} />
      <View style={[styles.skeleton, { height: 120 }]} />
      <View style={[styles.skeleton, { height: 260 }]} />
    </View>
  );
}

export const Rule = () => <View style={styles.rule} />;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.page },
  screen: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.xl, width: "100%", maxWidth: 640, alignSelf: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  sample: { borderWidth: 1, borderColor: "rgba(224, 179, 65, 0.4)", backgroundColor: color.warnSoft, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 1 },
  section: { borderTopWidth: 1, borderTopColor: color.lineStrong, paddingTop: 14 },
  sectionHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.lg },
  panel: { borderWidth: 1, borderColor: color.line, borderRadius: radius, padding: space.lg },
  button: { minHeight: 44, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", borderRadius: radius, paddingHorizontal: space.lg, paddingVertical: 10 },
  primary: { backgroundColor: color.inkStrong },
  ghost: { borderWidth: 1, borderColor: color.lineStrong },
  danger: { backgroundColor: color.down },
  field: { minHeight: 44, borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: font.regular, fontSize: 16, color: color.inkStrong },
  notice: { borderWidth: 1, borderRadius: radius, padding: space.md },
  noticeDown: { borderColor: "rgba(255, 107, 87, 0.4)", backgroundColor: color.downSoft },
  noticeWarn: { borderColor: "rgba(224, 179, 65, 0.4)", backgroundColor: color.warnSoft },
  skeleton: { borderRadius: 2, backgroundColor: color.raised },
  rule: { height: 1, backgroundColor: color.line },
});
