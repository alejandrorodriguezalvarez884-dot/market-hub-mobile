// Where the session is kept between launches: the phone's keychain (iOS) or keystore (Android).
// The web build is only for looking at the app on a developer's machine; there it is the
// browser's own storage, which is no place for a token of a real account.
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const web = Platform.OS === "web";

export async function read(key: string): Promise<string | null> {
  try {
    return web ? globalThis.localStorage?.getItem(key) ?? null : await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function write(key: string, value: string | null): Promise<void> {
  try {
    if (web && value === null) globalThis.localStorage?.removeItem(key);
    else if (web) globalThis.localStorage?.setItem(key, value!);
    else if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Nothing kept: the session lasts until the app is closed.
  }
}
