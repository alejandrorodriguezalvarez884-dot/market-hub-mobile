// Signing in with Apple, on an iPhone: the phone itself asks (Face ID, or the Apple account's
// password) and hands the app a token signed by Apple. The app does not read it: the portal
// checks it, with the nonce it gave for this one sign-in inside
// (market-hub-landing/src/markethub/applesignin.py). Apple gives the name to the app only the
// first time, so it is sent along; the portal keeps it with the account.
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

import { api } from "./api";

export class AppleRefused extends Error {}

// Whether this phone signs in with Apple at all. Android's and the browser view's do not, and
// neither does Expo Go, which does not carry the module: there the button is not shown.
export async function appleOnThisPhone(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

// Before an account that signs in with Apple is deleted, Apple is told to forget the app for it:
// the phone asks its owner once more, and what Apple hands over goes to the portal, which checks
// that it is this very account's and has Apple revoke it
// (market-hub-landing/src/markethub/applerevoke.py). Nothing of it is kept, here or there.
// "told": Apple was told. "skipped": it could not be, and the account is deleted all the same.
// "cancelled": the user closed Apple's sheet, and nothing is deleted.
export async function tellAppleBeforeDeleting(): Promise<"told" | "skipped" | "cancelled"> {
  if (!(await appleOnThisPhone())) return "skipped";
  try {
    const config = await api<{ apple_revocation?: boolean }>("/api/config");
    if (!config.apple_revocation) return "skipped";
    const { nonce } = await api<{ nonce: string }>("/api/app/auth/apple/begin", { method: "POST" });
    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({ nonce });
    } catch (e) {
      return (e as { code?: string })?.code === "ERR_REQUEST_CANCELED" ? "cancelled" : "skipped";
    }
    if (!credential.identityToken || !credential.authorizationCode) return "skipped";
    // A refusal here is about what was sent, not about the app's own session: it stays signed in.
    await api("/api/app/auth/apple/revoke", { method: "POST", stays: true,
      body: { identity_token: credential.identityToken, authorization_code: credential.authorizationCode } });
    return "told";
  } catch {
    return "skipped";
  }
}

// What to trade for a session, or null when the user closed Apple's sheet without signing in.
export async function askApple(): Promise<{ identity_token: string; name: string } | null> {
  const { nonce } = await api<{ nonce: string }>("/api/app/auth/apple/begin", { method: "POST" });
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce,
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "ERR_REQUEST_CANCELED") return null;
    throw new AppleRefused("Sign in with Apple did not complete. Try again.");
  }
  if (!credential.identityToken) throw new AppleRefused("Sign in with Apple did not complete. Try again.");
  const name = credential.fullName ? AppleAuthentication.formatFullName(credential.fullName).trim() : "";
  return { identity_token: credential.identityToken, name };
}
