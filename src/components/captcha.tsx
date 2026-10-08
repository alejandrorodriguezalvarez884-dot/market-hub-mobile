// The check that whoever makes an account is a person (Cloudflare Turnstile), as the portal's own
// sign-in page asks for it. Its widget only runs on a page of the portal's domain, so the portal
// serves one with nothing else on it (/api/app/captcha) and the app shows it inside the form. The
// page hands over a token, good once and for a few minutes, which goes with the new account.
import { openBrowserAsync } from "expo-web-browser";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";

import { Notice } from "@/components/ui";
import { API } from "@/lib/api";
import { color } from "@/lib/theme";

const PAGE = `${API}/api/app/captcha`;
// The widget's own frames. Anything else the page is sent to is a link somebody touched.
const own = (address: string) => address.startsWith(`${API}/`) || address.startsWith("https://challenges.cloudflare.com/") || address.startsWith("about:");

type Said = { token?: unknown; error?: unknown };

// `onToken("")` says the token given before no longer counts; `onError` that the check did not load.
export function Captcha({ onToken, onError }: { onToken: (token: string) => void; onError: () => void }) {
  // The browser view is only for looking at the app on a developer's machine, where no check is asked for.
  if (Platform.OS === "web") return <Notice tone="warn" text="Making an account here takes a check that is in the phone app, not in this browser view." />;
  return (
    <View style={{ height: 68 }}>
      <WebView
        source={{ uri: PAGE }}
        style={{ backgroundColor: color.page }}
        containerStyle={{ backgroundColor: color.page }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        accessibilityLabel="Check that you are a person"
        onMessage={(e) => {
          let said: Said = {};
          try {
            said = JSON.parse(e.nativeEvent.data);
          } catch {
            return;
          }
          onToken(typeof said.token === "string" ? said.token : "");
          if (said.error) onError();
        }}
        onError={onError}
        onHttpError={onError}
        onShouldStartLoadWithRequest={(asked) => {
          // iOS asks for every frame, and the widget's own are not for us to stop.
          if (own(asked.url) || (Platform.OS === "ios" && asked.isTopFrame === false)) return true;
          void openBrowserAsync(asked.url);
          return false;
        }}
      />
    </View>
  );
}
