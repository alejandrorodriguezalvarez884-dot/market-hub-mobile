// My Hub's sections, one tab each, in the order of the site's own menu. What does not fit in the
// bar (the portfolio's editor, the account, the tools) is under "More".
import { Tabs } from "expo-router/tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/marks";
import { color, font } from "@/lib/theme";

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Overview", icon: "overview" },
  { name: "analysis", title: "Analysis", icon: "analysis" },
  { name: "watchlist", title: "Watchlist", icon: "watchlist" },
  { name: "community", title: "Community", icon: "community" },
  { name: "more", title: "More", icon: "more" },
];

export default function HubTabs() {
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
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color: tint }) => <Icon name={t.icon} tint={tint} /> }} />
      ))}
    </Tabs>
  );
}
