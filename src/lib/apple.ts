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
