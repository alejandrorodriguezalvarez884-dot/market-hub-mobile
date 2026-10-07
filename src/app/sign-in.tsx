// The way in. The portal checks the password; the app never keeps it, only the token it gets back.
import { openBrowserAsync } from "expo-web-browser";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Logo } from "@/components/marks";
import { Button, Field, Label, Notice, Txt } from "@/components/ui";
import { SITE, message } from "@/lib/api";
import { useSession } from "@/lib/session";
import { color, space } from "@/lib/theme";

export default function SignIn() {
  const { signIn } = useSession();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const second = useRef<TextInput>(null);

  async function enter() {
    if (!email.trim() || !password) return setError("Enter your email and your password.");
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(message(e, "Signing in failed."));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Logo size={22} />
          <Txt size={17} weight="semibold" tone="strong">Market Hub</Txt>
        </View>

        <View style={{ gap: space.sm }}>
          <Txt size={28} weight="bold" tone="strong" accessibilityRole="header">Sign in to My Hub</Txt>
          <Txt size={15} tone="muted" style={{ lineHeight: 22 }}>Your portfolio and the stocks you follow, as you keep them on themarkethub.app.</Txt>
        </View>

        <View style={{ gap: space.md }}>
          <View style={{ gap: 6 }}>
            <Label>Email</Label>
            <Field accessibilityLabel="Email" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="username"
              autoComplete="email" returnKeyType="next" onSubmitEditing={() => second.current?.focus()} submitBehavior="submit" />
          </View>
          <View style={{ gap: 6 }}>
            <Label>Password</Label>
            <Field ref={second} accessibilityLabel="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password"
              autoComplete="current-password" returnKeyType="go" onSubmitEditing={enter} />
          </View>
          {error ? <Notice text={error} /> : null}
          <Button title="Sign in" onPress={enter} busy={busy} style={{ marginTop: space.xs }} />
        </View>

        <Txt size={13} tone="muted" style={{ lineHeight: 20 }}>
          No account yet?{" "}
          <Txt size={13} tone="strong" style={styles.link} accessibilityRole="link" onPress={() => openBrowserAsync(`${SITE}/signin/`)}>Make one on themarkethub.app</Txt>
          {" "}and come back to sign in with its email and password.
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.page },
  page: { flexGrow: 1, paddingHorizontal: space.xl, gap: space.xxl, width: "100%", maxWidth: 480, alignSelf: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  link: { textDecorationLine: "underline" },
});
