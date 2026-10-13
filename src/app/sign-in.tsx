// The way in: with Apple (on an iPhone), with Google, or with an email and a password, to sign in
// or to make an account. The portal checks each; the app never keeps a password, only the token
// it gets back.
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Captcha } from "@/components/captcha";
import { GoogleMark, Logo } from "@/components/marks";
import { Button, Field, Label, Notice, Txt } from "@/components/ui";
import { SITE, api, message } from "@/lib/api";
import { appleOnThisPhone } from "@/lib/apple";
import { openPage } from "@/lib/hub";
import { useSession } from "@/lib/session";
import { color, radius, space } from "@/lib/theme";

// Whether an account can be made on this portal, and whether it takes the captcha (/api/config).
type Registration = "open" | "captcha" | "closed";

export default function SignIn() {
  const { signIn, register, signInWithGoogle, signInWithApple } = useSession();
  const insets = useSafeAreaInsets();
  const [registration, setRegistration] = useState<Registration>("closed");
  const [making, setMaking] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // The captcha's token is good once: after a refusal the widget is drawn again (`turn`) for another.
  const [check, setCheck] = useState("");
  const [turn, setTurn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [google, setGoogle] = useState(false);
  // Apple's button is shown on a phone that signs in with Apple, to a portal that takes its token.
  const [appleHere, setAppleHere] = useState(false);
  const [apple, setApple] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<TextInput>(null);
  const second = useRef<TextInput>(null);
  const checked = registration === "captcha";

  useEffect(() => {
    let alive = true;
    api<{ password_login: boolean; registration?: Registration; apple_sign_in?: boolean }>("/api/config")
      .then(async (c) => {
        if (!alive) return;
        setRegistration(c.password_login ? c.registration ?? "open" : "closed");
        const here = !!c.apple_sign_in && (await appleOnThisPhone());
        if (alive) setAppleHere(here);
      }).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function turnTo(make: boolean) {
    setMaking(make);
    setError(null);
    setCheck("");
  }

  async function enter() {
    if (!email.trim() || !password || (making && !name.trim())) return setError(making ? "Your name, your email and a password, please." : "Enter your email and your password.");
    if (making && checked && !check) return setError("One moment: checking that you are a person.");
    setBusy(true);
    setError(null);
    try {
      // Signed in, this screen gives way to My Hub.
      if (making) await register(name, email, password, check);
      else await signIn(email, password);
    } catch (e) {
      setError(message(e, making ? "The account could not be made." : "Signing in failed."));
      setBusy(false);
      if (making && checked) {
        setCheck("");
        setTurn((n) => n + 1);
      }
    }
  }

  async function enterWithGoogle() {
    setGoogle(true);
    setError(null);
    try {
      // Signed in, this screen gives way to My Hub; closed without choosing, it stays as it was.
      if (!(await signInWithGoogle())) setGoogle(false);
    } catch (e) {
      setError(message(e, "Signing in with Google failed."));
      setGoogle(false);
    }
  }

  async function enterWithApple() {
    if (busy || google || apple) return;
    setApple(true);
    setError(null);
    try {
      // Signed in, this screen gives way to My Hub; the sheet closed, it stays as it was.
      if (!(await signInWithApple())) setApple(false);
    } catch (e) {
      setError(message(e, "Signing in with Apple failed."));
      setApple(false);
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
          <Txt size={28} weight="bold" tone="strong" accessibilityRole="header">{making ? "Create your account" : "Sign in to My Hub"}</Txt>
          <Txt size={15} tone="muted" style={{ lineHeight: 22 }}>
            {making ? "A private page for your own stocks, here and on themarkethub.app. Only you see what you add." : "Your portfolio and the stocks you follow, as you keep them on themarkethub.app."}
          </Txt>
        </View>

        <View style={{ gap: space.md }}>
          {appleHere ? (
            // Apple's own button, as its guidelines ask: the white one, on this dark page.
            <AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE} cornerRadius={radius} onPress={enterWithApple}
              style={[styles.apple, (apple || busy || google) && { opacity: 0.6 }]} />
          ) : null}
          <Button title="Continue with Google" kind="ghost" mark={<GoogleMark />} onPress={enterWithGoogle} busy={google} disabled={busy || apple} />
          <View style={styles.or}>
            <View style={styles.rule} />
            <Label>or with your email</Label>
            <View style={styles.rule} />
          </View>
          {making ? (
            <View style={{ gap: 6 }}>
              <Label>Your name</Label>
              <Field accessibilityLabel="Your name" value={name} onChangeText={setName} maxLength={60} autoCapitalize="words" textContentType="name"
                autoComplete="name" returnKeyType="next" onSubmitEditing={() => first.current?.focus()} submitBehavior="submit" />
            </View>
          ) : null}
          <View style={{ gap: 6 }}>
            <Label>Email</Label>
            <Field ref={first} accessibilityLabel="Email" value={email} onChangeText={setEmail} maxLength={254} keyboardType="email-address" textContentType="username"
              autoComplete="email" returnKeyType="next" onSubmitEditing={() => second.current?.focus()} submitBehavior="submit" />
          </View>
          <View style={{ gap: 6 }}>
            <Label>Password</Label>
            <Field ref={second} accessibilityLabel="Password" value={password} onChangeText={setPassword} maxLength={200} secureTextEntry
              textContentType={making ? "newPassword" : "password"} autoComplete={making ? "new-password" : "current-password"}
              returnKeyType={making ? "done" : "go"} onSubmitEditing={making ? undefined : enter} />
            {making ? <Label style={{ lineHeight: 18 }}>At least 10 characters. We cannot send you a new one if you forget it: keep it somewhere safe.</Label> : null}
          </View>
          {making && checked ? <Captcha key={turn} onToken={setCheck} onError={() => setError("The check that you are a person could not load. Check your connection and try again.")} /> : null}
          {error ? <Notice text={error} /> : null}
          <Button title={making ? "Create my account" : "Sign in"} onPress={enter} busy={busy} disabled={google || apple} style={{ marginTop: space.xs }} />
        </View>

        <View style={{ gap: space.md }}>
          {registration !== "closed" ? (
            <Txt size={13} tone="muted" style={{ lineHeight: 20 }}>
              {making ? "Have an account? " : `New here? Continue with ${appleHere ? "Apple or Google" : "Google"}, or `}
              <Txt size={13} tone="strong" style={styles.link} accessibilityRole="button" onPress={() => turnTo(!making)}>{making ? "Sign in" : "create an account with your email"}</Txt>
              .
            </Txt>
          ) : null}
          {making ? (
            <Txt size={13} tone="muted" style={{ lineHeight: 20 }}>
              We keep your name, your email and the stocks you add. Never your password itself. You can delete it all at any time.{" "}
              <Txt size={13} tone="strong" style={styles.link} accessibilityRole="link" onPress={() => openPage(`${SITE}/privacy/`)}>Privacy</Txt>
              {" · "}
              <Txt size={13} tone="strong" style={styles.link} accessibilityRole="link" onPress={() => openPage(`${SITE}/terms/`)}>Terms</Txt>
            </Txt>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.page },
  page: { flexGrow: 1, paddingHorizontal: space.xl, gap: space.xxl, width: "100%", maxWidth: 480, alignSelf: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  apple: { height: 44, width: "100%" },
  link: { textDecorationLine: "underline" },
  or: { flexDirection: "row", alignItems: "center", gap: space.md, marginVertical: space.xs },
  rule: { flex: 1, height: 1, backgroundColor: color.line },
});
