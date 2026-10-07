// Where the user says what they own, or what they follow. Nothing is saved until "Save" is pressed;
// the portal checks every ticker and keeps the list in the user's own document.
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompanySearch } from "@/components/company-search";
import { Icon } from "@/components/marks";
import { Button, Field, Label, Notice, Screen, Section, Txt, Waiting } from "@/components/ui";
import { api, message } from "@/lib/api";
import { useLoad } from "@/lib/load";
import { color, font, radius, space } from "@/lib/theme";
import type { Company, Portfolio } from "@/lib/types";

const MAX = 50;
// A row being edited: its fields hold what was typed, which is not always a number yet.
type Draft = { ticker: string; name?: string; shares: string; cost: string };
type Said = { text: string; error?: boolean };

const getPortfolio = () => api<Portfolio>("/api/portfolio");
// Phones set to a comma for decimals type "12,5".
const number = (text: string) => (text.trim() === "" ? null : Number(text.replace(",", ".")));
const asText = (v: number | null) => (v == null || v === 0 ? "" : String(v));

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, refreshing, refresh } = useLoad(getPortfolio);
  const [positions, setPositions] = useState<Draft[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [said, setSaid] = useState<Said | null>(null);

  // What the portal has replaces what is on the screen, unless there are changes not yet saved.
  const [shown, setShown] = useState<Portfolio | null>(null);
  if (data && data !== shown && !dirty) {
    setShown(data);
    setPositions(data.positions.map((p) => ({ ticker: p.ticker, shares: asText(p.shares), cost: asText(p.avg_cost) })));
    setWatchlist(data.watchlist);
  }

  const changed = () => (setDirty(true), setSaid({ text: "Unsaved changes." }));

  const addPosition = (c: Company) => {
    if (positions.some((p) => p.ticker === c.ticker)) return setSaid({ text: `${c.ticker} is already in your positions.` });
    if (positions.length >= MAX) return setSaid({ text: `Up to ${MAX} positions.`, error: true });
    setPositions([...positions, { ticker: c.ticker, name: c.name, shares: "", cost: "" }]);
    setWatchlist(watchlist.filter((t) => t !== c.ticker));
    changed();
  };

  const follow = (c: Company) => {
    if (positions.some((p) => p.ticker === c.ticker)) return setSaid({ text: `${c.ticker} is in your positions, so it is tracked already.` });
    if (watchlist.includes(c.ticker)) return;
    if (watchlist.length >= MAX) return setSaid({ text: `Up to ${MAX} stocks in the watchlist.`, error: true });
    setWatchlist([...watchlist, c.ticker]);
    changed();
  };

  const edit = (ticker: string, change: Partial<Draft>) => (setPositions(positions.map((p) => (p.ticker === ticker ? { ...p, ...change } : p))), changed());

  async function save() {
    const rows = positions.map((p) => ({ ticker: p.ticker, shares: number(p.shares), avg_cost: number(p.cost) }));
    const missing = rows.find((p) => !(p.shares != null && p.shares > 0));
    if (missing) return setSaid({ text: `Enter the number of shares of ${missing.ticker}.`, error: true });
    const odd = rows.find((p) => p.avg_cost != null && !(p.avg_cost >= 0));
    if (odd) return setSaid({ text: `The average cost of ${odd.ticker} is not a number.`, error: true });
    if (!rows.length && !watchlist.length) return setSaid({ text: "Add at least one position or one stock to follow.", error: true });
    setSaving(true);
    setSaid({ text: "Saving…" });
    try {
      await api<Portfolio>("/api/portfolio", { method: "PUT", body: { positions: rows, watchlist } });
      setDirty(false);
      setSaid(null);
      // Back to where the editor was opened from; the overview asks for its figures again.
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (e) {
      setSaid({ text: message(e, "Saving failed."), error: true });
    } finally {
      setSaving(false);
    }
  }

  const footer = data ? (
    <View style={[styles.footer, { paddingBottom: space.md + insets.bottom }]}>
      <Button title="Save and open the overview" onPress={save} busy={saving} disabled={!dirty} />
      {said ? <Txt size={13} tone={said.error ? "down" : "muted"} accessibilityLiveRegion="polite">{said.text}</Txt> : null}
    </View>
  ) : null;

  return (
    <Screen headed refreshing={refreshing} onRefresh={dirty ? undefined : refresh} footer={footer}>
      <Txt size={13} tone="muted">Positions you hold and stocks you follow. Saved to your private account.</Txt>
      {error ? <Notice text={error} /> : null}
      {!data ? (error ? null : <Waiting />) : (
        <>
          <Section title="Positions" note="Shares you hold and the average price you paid, to see your gain or loss. The average cost is optional.">
            <CompanySearch label="Add a position: company or ticker" onPick={addPosition} />
            {positions.length ? (
              <View style={{ marginTop: space.lg }}>
                <View style={styles.columns}>
                  <Label style={{ flex: 1 }}>Stock</Label>
                  <Label style={styles.column}>Shares</Label>
                  <Label style={styles.column}>Avg cost ($)</Label>
                  <View style={{ width: 36 }} />
                </View>
                {positions.map((p) => (
                  <View key={p.ticker} style={styles.row}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt size={15} weight="semibold" tone="strong">{p.ticker}</Txt>
                      {p.name ? <Txt size={11.5} tone="muted" numberOfLines={1}>{p.name}</Txt> : null}
                    </View>
                    <Field accessibilityLabel={`Shares of ${p.ticker}`} value={p.shares} onChangeText={(shares) => edit(p.ticker, { shares })}
                      keyboardType="decimal-pad" placeholder="0" style={styles.number} />
                    <Field accessibilityLabel={`Average cost of ${p.ticker}, optional`} value={p.cost} onChangeText={(cost) => edit(p.ticker, { cost })}
                      keyboardType="decimal-pad" placeholder="optional" style={styles.number} />
                    <Pressable onPress={() => (setPositions(positions.filter((x) => x.ticker !== p.ticker)), changed())} hitSlop={8}
                      accessibilityRole="button" accessibilityLabel={`Remove ${p.ticker}`} style={styles.remove}>
                      <Icon name="close" size={18} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : <Txt size={13} tone="muted" style={{ marginTop: space.lg }}>No positions yet. Search a ticker or a company name to add one.</Txt>}
          </Section>

          <Section title="Watchlist" note="Stocks you follow without owning them. Positions you hold are tracked already.">
            <CompanySearch label="Follow a stock: company or ticker" onPick={follow} />
            {watchlist.length ? (
              <View style={styles.chips}>
                {watchlist.map((t) => (
                  <View key={t} style={styles.chip}>
                    <Txt size={13} weight="semibold" tone="strong">{t}</Txt>
                    <Pressable onPress={() => (setWatchlist(watchlist.filter((u) => u !== t)), changed())} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${t}`}>
                      <Icon name="close" size={15} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : <Txt size={13} tone="muted" style={{ marginTop: space.lg }}>Nothing in your watchlist yet.</Txt>}
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: color.line },
  column: { width: 92, textAlign: "right" },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: color.line },
  number: { width: 92, textAlign: "right", fontFamily: font.mono, fontSize: 15, paddingHorizontal: 8 },
  remove: { width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.lg },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 34, borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius,
    backgroundColor: color.raised, paddingLeft: 10, paddingRight: 8 },
  footer: { gap: 6, padding: space.md, paddingHorizontal: space.lg, borderTopWidth: 1, borderTopColor: color.lineStrong, backgroundColor: color.panel,
    width: "100%", maxWidth: 640, alignSelf: "center" },
});
