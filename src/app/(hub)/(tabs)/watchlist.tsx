// Watchlist: the stocks the user follows, side by side. Each one's price, where it stands (against
// its average, its trend, against the index) and its sentence; all of them on one map; and any
// other stock, looked at the same way. Touching one opens its chart and its full reading.
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CompanySearch } from "@/components/company-search";
import { ListMap } from "@/components/list-map";
import { Sparkline } from "@/components/marks";
import { StateMarks } from "@/components/reading";
import { Button, Head, Notice, Panel, Screen, Section, Txt, Waiting, WordTabs } from "@/components/ui";
import { message } from "@/lib/api";
import { price, shortDate, signedPct, tidyName, toneOf } from "@/lib/format";
import { useLoad } from "@/lib/load";
import { color, space } from "@/lib/theme";
import type { Company } from "@/lib/types";
import { follow, getBoard, getStock, type Item } from "@/lib/watch";

const MAX_OTHERS = 20;
type View_ = "stocks" | "map";

export default function Watchlist() {
  const router = useRouter();
  const { data: board, error, refreshing, refresh } = useLoad(getBoard);
  const [view, setView] = useState<View_>("stocks");
  // What is held is shown once it is turned on; what was looked up, until it is taken off.
  const [held, setHeld] = useState(false);
  const [others, setOthers] = useState<Item[]>([]);
  const [said, setSaid] = useState<string | null>(null);
  const open = (item: Item) => router.push({ pathname: "/stock/[ticker]", params: { ticker: item.ticker } });

  async function look(c: Company) {
    setSaid(null);
    if (board?.items.some((i) => i.ticker === c.ticker)) {
      if (board.positions.includes(c.ticker)) setHeld(true);
      return setSaid(`${c.ticker} is already in your list.`);
    }
    if (others.some((i) => i.ticker === c.ticker)) return;
    if (others.length >= MAX_OTHERS) return setSaid(`Up to ${MAX_OTHERS} other stocks at a time.`);
    try {
      const item = await getStock(c.ticker, board?.benchmark.name);
      setOthers((now) => (now.some((i) => i.ticker === item.ticker) ? now : [...now, item]));
    } catch (e) {
      setSaid(message(e, `${c.ticker} could not be read.`));
    }
  }

  async function add(item: Item) {
    try {
      await follow(item.ticker);
      setOthers((now) => now.filter((i) => i.ticker !== item.ticker));
      refresh();
    } catch (e) {
      setSaid(message(e, `${item.ticker} could not be added.`));
    }
  }

  const followed = board ? board.items.filter((i) => board.watchlist.includes(i.ticker)) : [];
  const positions = board ? board.items.filter((i) => board.positions.includes(i.ticker)) : [];
  const shown = [...followed, ...(held ? positions : []), ...others];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Head title="Watchlist" note="The stocks you follow, side by side: how each one stands, and all of them on one map." sample={board?.sample} />
      {error ? <Notice text={error} /> : null}
      {!board ? (error ? null : <Waiting />) : (
        <>
          <View style={{ gap: space.md }}>
            <View style={styles.bar}>
              <WordTabs items={[{ key: "stocks", label: "Stocks" }, { key: "map", label: "Map" }]} value={view} onChange={setView} />
              <Txt size={12} tone="faint">Prices of {shortDate(board.as_of)}</Txt>
            </View>
            {positions.length ? (
              <Pressable onPress={() => setHeld(!held)} accessibilityRole="switch" accessibilityState={{ checked: held }} hitSlop={6} style={styles.toggle}>
                <View style={[styles.box, held && styles.boxOn]} />
                <Txt size={13}>Also the {positions.length} stock{positions.length > 1 ? "s" : ""} you hold</Txt>
              </Pressable>
            ) : null}
          </View>

          {!shown.length ? (
            <Panel style={{ gap: space.md }}>
              <Txt size={15}>You follow no stocks yet.</Txt>
              <Txt size={13} tone="muted" style={{ lineHeight: 19 }}>Add them in your portfolio, or look at any stock below and follow it from there.</Txt>
              <Button title="Add stocks to follow" onPress={() => router.push("/portfolio")} />
            </Panel>
          ) : view === "map" ? (
            <ListMap items={shown} index={board.benchmark.name} onPick={open} />
          ) : (
            <View>
              {shown.map((item, i) => (
                <StockLine key={item.ticker} item={item} first={i === 0} onOpen={() => open(item)}
                  onFollow={others.includes(item) ? () => add(item) : undefined}
                  onDrop={others.includes(item) ? () => setOthers(others.filter((o) => o !== item)) : undefined} />
              ))}
            </View>
          )}

          <Section title="Look at any other stock" note="Read the same way, without adding it to your list.">
            <CompanySearch label="Look at a stock: company or ticker" onPick={look} action="Look" />
            {said ? <Txt size={13} tone="muted" style={{ marginTop: space.sm }}>{said}</Txt> : null}
          </Section>
        </>
      )}
    </Screen>
  );
}

function StockLine({ item, first, onOpen, onFollow, onDrop }: { item: Item; first: boolean; onOpen: () => void; onFollow?: () => void; onDrop?: () => void }) {
  const r = item.reading;
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityHint={`Opens the chart and the reading of ${item.ticker}`}
      style={({ pressed }) => [styles.line, !first && styles.rule, pressed && { backgroundColor: color.raised }]}>
      <View style={styles.top}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={16} weight="semibold" tone="strong">{item.ticker}</Txt>
          <Txt size={11.5} tone="muted" numberOfLines={1}>{tidyName(item.name)}</Txt>
        </View>
        {r ? <Sparkline values={r.spark} width={72} height={28} /> : null}
        {r ? (
          <View style={{ alignItems: "flex-end", minWidth: 78 }}>
            <Txt num size={14} tone="strong">{price(r.price)}</Txt>
            <Txt num size={13} tone={toneOf(r.day_change_pct)}>{signedPct(r.day_change_pct, 2)}</Txt>
          </View>
        ) : null}
      </View>
      {r ? <StateMarks item={item} /> : <Txt size={13} tone="muted">No prices for {item.ticker} right now.</Txt>}
      {item.analysis.headline ? <Txt size={14} style={{ lineHeight: 20 }}>{item.analysis.headline}</Txt> : null}
      {onFollow ? (
        <View style={styles.actions}>
          <Txt size={13} tone="strong" onPress={onFollow} accessibilityRole="button" style={styles.action}>Follow</Txt>
          <Txt size={13} tone="muted" onPress={onDrop} accessibilityRole="button">Take off</Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md },
  toggle: { flexDirection: "row", alignItems: "center", gap: space.sm },
  box: { width: 16, height: 16, borderRadius: 2, borderWidth: 1, borderColor: color.lineStrong },
  boxOn: { backgroundColor: color.inkStrong, borderColor: color.inkStrong },
  line: { paddingVertical: space.md, gap: space.sm },
  rule: { borderTopWidth: 1, borderTopColor: color.line },
  top: { flexDirection: "row", alignItems: "center", gap: space.md },
  actions: { flexDirection: "row", gap: space.xl },
  action: { textDecorationLine: "underline" },
});
