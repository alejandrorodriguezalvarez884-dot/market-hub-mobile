// My Hub: the tabs, and over them the screens reached from one (the portfolio's editor, the account).
import { Stack } from "expo-router/stack";

import { color, font } from "@/lib/theme";

export default function Hub() {
  return (
    <Stack screenOptions={{
      contentStyle: { backgroundColor: color.page },
      headerStyle: { backgroundColor: color.page },
      headerTintColor: color.inkStrong,
      headerTitleStyle: { fontFamily: font.semibold, fontSize: 16 },
      headerShadowVisible: false,
      headerBackButtonDisplayMode: "minimal",
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="portfolio" options={{ title: "Portfolio" }} />
      <Stack.Screen name="account" options={{ title: "Account and data" }} />
      <Stack.Screen name="stock/[ticker]" options={{ title: "" }} />
    </Stack>
  );
}
