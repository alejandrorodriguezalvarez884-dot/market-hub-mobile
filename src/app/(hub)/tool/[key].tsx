// One of the tools of My Hub, inside the app. The tool is its own site: it is shown here in a page
// of the app's, signed in as whoever is signed in to the app, with the site's own My Hub menu put
// away (the app has its tabs for that). A link that leaves the tool opens in the phone's browser.
import { Stack } from "expo-router/stack";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Platform, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { Icon } from "@/components/marks";
import { Button, Notice } from "@/components/ui";
import { SITE, currentToken } from "@/lib/api";
import { openPage } from "@/lib/hub";
import { color, space } from "@/lib/theme";
import { ENTER, TOOLS, entering, getTools, origin } from "@/lib/tools";

// Put away in every page of a tool: the portal's own menu, which each tool carries at its top on a
// phone and at its side on a wide screen. Run before the page draws, so it never shows.
const WITHOUT_THE_MENU = `(function () {
  var s = document.createElement("style");
  s.textContent = 'header:has(nav[aria-label="My Hub"]), aside:has(nav[aria-label="My Hub"]) { display: none !important }';
  (document.head || document.documentElement).appendChild(s);
})(); true;`;

type State = "opening" | "shown" | "failed";

export default function Tool() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const tool = TOOLS.find((t) => t.key === key);
  const [home, setHome] = useState<string | null>(null);
  const [state, setState] = useState<State>("opening");
  // A new try is a new page: the token is only sent with the first request of one.
  const [turn, setTurn] = useState(0);
  const web = useRef<WebView>(null);
  const within = useRef(false); // whether the page has somewhere of its own to go back to
  const at = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    getTools().then((t) => alive && (tool && t[tool.key] ? setHome(t[tool.key]!) : setState("failed"))).catch(() => alive && setState("failed"));
    return () => {
      alive = false;
    };
  }, [tool]);

  // Android's back button goes back inside the tool before it leaves it.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!within.current) return false;
      web.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  const token = currentToken();
  const source = useMemo(() => (home && token ? { uri: entering(home), headers: { Authorization: `Bearer ${token}` } } : null), [home, token]);
  const own = home ? origin(home) : "";
  const title = tool?.title ?? "Tool";

  if (Platform.OS === "web") {
    return (
      <View style={styles.told}>
        <Stack.Screen options={{ title }} />
        <Notice tone="warn" text="The tools open inside the phone app. In this browser view they open in a tab of their own." />
        {home ? <Button title={`Open ${title}`} kind="ghost" onPress={() => openPage(`${home}/`)} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <Stack.Screen options={{
        title,
        headerRight: () => (home ? (
          <Pressable onPress={() => openPage(at.current ?? `${home}/`)} hitSlop={10} accessibilityRole="link" accessibilityLabel={`Open ${title} in the browser`}>
            <Icon name="out" size={20} tint={color.muted} />
          </Pressable>
        ) : null),
      }} />
      {state === "failed" || !tool ? (
        <View style={styles.told}>
          <Notice text={tool ? `${title} could not be opened. Check your connection and try again.` : "There is no such tool."} />
          {tool ? <Button title="Try again" kind="ghost" onPress={() => (setState("opening"), setTurn((n) => n + 1))} /> : null}
        </View>
      ) : source ? (
        <WebView
          key={turn}
          ref={web}
          source={source}
          style={styles.page}
          containerStyle={styles.page}
          // The session cookie lives as long as this page: nothing of it is kept on the phone.
          incognito
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScriptBeforeContentLoaded={WITHOUT_THE_MENU}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          decelerationRate="normal"
          accessibilityLabel={title}
          onNavigationStateChange={(n) => {
            // The first page is the portal's, on its way here: there is nothing to go back to before it.
            within.current = n.canGoBack && !n.url.startsWith(ENTER);
            if (n.url.startsWith(own)) at.current = n.url;
          }}
          onLoadEnd={(e) => {
            if (e.nativeEvent.url.startsWith(own)) setState("shown");
          }}
          onError={() => setState("failed")}
          onHttpError={(e) => {
            // The portal did not take the token, or the tool is not answering.
            if (e.nativeEvent.url.startsWith(ENTER) || e.nativeEvent.statusCode >= 500) setState("failed");
          }}
          onShouldStartLoadWithRequest={(asked) => {
            if (asked.url.startsWith(ENTER) || asked.url.startsWith(`${own}/`) || asked.url === own || asked.url.startsWith("about:")) return true;
            // iOS asks for every frame, and a chart's own are not for us to stop.
            if (Platform.OS === "ios" && asked.isTopFrame === false) return true;
            // Sent to sign in: the cookie was not taken. Signing in there would be a second session to keep.
            if (asked.url.startsWith(`${SITE}/signin`)) setState("failed");
            else openPage(asked.url);
            return false;
          }}
        />
      ) : null}
      {state === "opening" && tool ? <View style={styles.opening} pointerEvents="none"><ActivityIndicator color={color.muted} /></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.page },
  page: { flex: 1, backgroundColor: color.page },
  told: { flex: 1, backgroundColor: color.page, padding: space.lg, gap: space.md },
  opening: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: color.page, alignItems: "center", justifyContent: "center" },
});
