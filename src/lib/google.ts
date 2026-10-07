// Signing in with Google, through the phone's own browser: Google does not sign anybody in inside
// an app's embedded page. The app opens the browser at the portal, the portal sends it to Google
// and checks what comes back, and the browser returns here with a code that lasts two minutes.
// The code is worth nothing without the secret made below, which never leaves the app until it
// is traded, with the code, for the session (market-hub-landing/src/markethub/appsignin.py).
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { API } from "./api";

const urlSafe = (base64: string) => base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// 43 random characters of the 64 a URL takes as they are: 258 bits nobody else has.
function secret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  return Array.from(Crypto.getRandomBytes(43), (b) => alphabet[b % 64]).join("");
}

export class GoogleRefused extends Error {}

// The code and the secret to trade for a session, or null when the user closed the browser.
export async function askGoogle(): Promise<{ code: string; verifier: string } | null> {
  if (Platform.OS === "web") throw new GoogleRefused("Signing in with Google is in the phone app, not in this browser view.");
  const verifier = secret();
  const challenge = urlSafe(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 }));
  // The app's own address: markethub://auth once installed, Expo Go's while it is run from a computer.
  const redirect = Linking.createURL("auth");
  const start = `${API}/api/app/auth/google/start?redirect=${encodeURIComponent(redirect)}&challenge=${challenge}`;
  const result = await WebBrowser.openAuthSessionAsync(start, redirect);
  if (result.type !== "success") return null;
  const said = Linking.parse(result.url).queryParams ?? {};
  const code = typeof said.code === "string" ? said.code : null;
  if (said.error === "cancelled") return null;
  if (!code) throw new GoogleRefused("Google sign-in could not be verified. Try again.");
  return { code, verifier };
}
