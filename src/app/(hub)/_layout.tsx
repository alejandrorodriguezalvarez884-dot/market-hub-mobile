// My Hub: the private area, one tab per section. More sections of the site's My Hub come later.
import { Tabs } from "expo-router/tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/marks";
import { color, font } from "@/lib/theme";

export default function Hub() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      sceneStyle: { backgroundColor: color.page },
      // Tall enough for the mark and its word, above the phone's home bar.
      tabBarStyle: { backgroundColor: color.page, borderTopColor: color.line, height: 58 + insets.bottom, paddingTop: 6 },
      tabBarActiveTintColor: color.inkStrong,
      tabBarInactiveTintColor: color.muted,
      tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
    }}>
      <Tabs.Screen name="index" options={{ title: "Overview", tabBarIcon: ({ color: tint }) => <Icon name="overview" tint={tint} /> }} />
      <Tabs.Screen name="portfolio" options={{ title: "Portfolio", tabBarIcon: ({ color: tint }) => <Icon name="portfolio" tint={tint} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color: tint }) => <Icon name="account" tint={tint} /> }} />
    </Tabs>
  );
}
