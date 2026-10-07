import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans";
import { useFonts } from "expo-font";
import { DarkTheme, SplashScreen, ThemeProvider, type Theme } from "expo-router";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { SessionProvider, useSession } from "@/lib/session";
import { color } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

// The app is dark whatever the phone is set to, as the portal is.
const theme: Theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: color.page, card: color.page, border: color.line,
  text: color.inkStrong, primary: color.inkStrong, notification: color.down } };

export default function Root() {
  const [fonts, failed] = useFonts({ IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium });
  return (
    <SessionProvider>
      {/* Without its faces the app still opens, in the phone's own. */}
      <Navigator ready={fonts || !!failed} />
    </SessionProvider>
  );
}

// Signed in, the app is My Hub; signed out, it is the sign-in screen. Neither is reachable from the other.
function Navigator({ ready }: { ready: boolean }) {
  const { user, loading } = useSession();
  const up = ready && !loading;
  useEffect(() => {
    if (up) SplashScreen.hide();
  }, [up]);
  if (!up) return null;
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.page } }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(hub)" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
