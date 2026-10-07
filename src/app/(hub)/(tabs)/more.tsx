// What does not have a tab of its own: the portfolio's editor, the account, the analysis tools
// and the public sections of the portal. The tools and the public sections open in the browser.
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/components/marks";
import { Head, Screen, Section, Txt } from "@/components/ui";
import { SITE, api } from "@/lib/api";
import { openPage } from "@/lib/hub";
import { color, space } from "@/lib/theme";

type Tools = { earnings_radar: string | null; fundamentals_lab: string | null };

function Line({ icon, title, note, onPress, leaves = false, first = false }: { icon: IconName; title: string; note?: string; onPress: () => void; leaves?: boolean; first?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={leaves ? "link" : "button"} accessibilityHint={leaves ? "Opens in the browser" : undefined}
      style={({ pressed }) => [styles.line, !first && styles.rule, pressed && { backgroundColor: color.raised }]}>
      <Icon name={icon} size={20} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={15} weight="medium" tone="strong">{title}</Txt>
        {note ? <Txt size={12.5} tone="muted" style={{ lineHeight: 18 }}>{note}</Txt> : null}
      </View>
      <Icon name={leaves ? "out" : "chevron"} size={16} tint={color.faint} />
    </Pressable>
  );
}

export default function More() {
  const router = useRouter();
  const [tools, setTools] = useState<Tools | null>(null);
  useEffect(() => {
    let alive = true;
    api<{ tools: Tools }>("/api/config").then((c) => alive && setTools(c.tools)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Screen>
      <Head title="More" />
      <Section title="Yours">
        <Line first icon="portfolio" title="Portfolio" note="Your positions and the stocks you follow" onPress={() => router.push("/portfolio")} />
        <Line icon="account" title="Account and data" note="Who is signed in, what is kept, and the way out" onPress={() => router.push("/account")} />
      </Section>

      {tools?.fundamentals_lab || tools?.earnings_radar ? (
        <Section title="Analysis tools" note="They open in the browser, and ask you to sign in there the first time.">
          {tools.fundamentals_lab ? <Line first leaves icon="tools" title="Fundamentals Lab" note="Every number of a company: statements, valuation history, forward multiples, technicals and comparison"
            onPress={() => openPage(`${tools.fundamentals_lab}/`)} /> : null}
          {tools.earnings_radar ? <Line leaves first={!tools.fundamentals_lab} icon="earnings" title="Earnings Radar" note="What a company's latest results release says: guidance, demand, margins and themes"
            onPress={() => openPage(`${tools.earnings_radar}/`)} /> : null}
        </Section>
      ) : null}

      <Section title="Explore" note="The public pages of themarkethub.app">
        <Line first leaves icon="markets" title="Markets" onPress={() => openPage(`${SITE}/markets/`)} />
        <Line leaves icon="news" title="News" onPress={() => openPage(`${SITE}/news/`)} />
        <Line leaves icon="opinion" title="Opinion" onPress={() => openPage(`${SITE}/opinion/`)} />
        <Line leaves icon="media" title="Media" onPress={() => openPage(`${SITE}/media/`)} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md, minHeight: 52 },
  rule: { borderTopWidth: 1, borderTopColor: color.line },
});
