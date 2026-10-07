// One stock: its chart, with its 20, 50 and 200-day averages, and its reading, aspect by aspect.
import { Stack } from "expo-router/stack";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PriceChart } from "@/components/price-chart";
import { ReadingCard, StateMarks } from "@/components/reading";
import { Button, Notice, Screen, Section, Txt, Waiting, WordTabs } from "@/components/ui";
import { message } from "@/lib/api";
import { price, signedPct, tidyName, toneOf } from "@/lib/format";
import { openQuote } from "@/lib/hub";
import { color, space } from "@/lib/theme";
import { RANGES, getBars, getStock, remembered, type Bars, type Item, type Range } from "@/lib/watch";

export default function Stock() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const known = remembered(ticker);
  const [item, setItem] = useState<Item | null>(known?.item ?? null);
  const [bars, setBars] = useState<Bars | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("6M");
  const [candles, setCandles] = useState(true);
  const index = known?.index ?? "S&P 500";

  useEffect(() => {
    let alive = true;
    if (!known) getStock(ticker).then((found) => alive && setItem(found)).catch((e) => alive && setError(message(e, "This stock could not be read.")));
    getBars(ticker).then((found) => alive && setBars(found)).catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const r = item?.reading;
  return (
    <Screen headed>
      <Stack.Screen options={{ title: ticker }} />
      {error ? <Notice text={error} /> : null}
      {!item ? (error ? null : <Waiting />) : (
        <>
          <View style={{ gap: space.sm }}>
            <View style={styles.head}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={22} weight="bold" tone="strong">{item.ticker}</Txt>
                <Txt size={13} tone="muted" numberOfLines={1}>{tidyName(item.name)}</Txt>
              </View>
              {r ? (
                <View style={{ alignItems: "flex-end" }}>
                  <Txt num size={20} weight="medium" tone="strong">{price(r.price)}</Txt>
                  <Txt num size={14} tone={toneOf(r.day_change_pct)}>{signedPct(r.day_change_pct, 2)}</Txt>
                </View>
              ) : null}
            </View>
            <StateMarks item={item} />
          </View>

          <View>
            <View style={styles.controls}>
              <WordTabs items={(Object.keys(RANGES) as Range[]).map((k) => ({ key: k, label: k }))} value={range} onChange={setRange} />
              <Pressable onPress={() => setCandles(!candles)} hitSlop={8} accessibilityRole="button" accessibilityLabel={candles ? "Draw a line" : "Draw candles"}>
                <Txt size={13} tone="muted">{candles ? "Line" : "Candles"}</Txt>
              </Pressable>
            </View>
            {bars ? <PriceChart bars={bars} range={range} candles={candles} averages /> : <View style={styles.waiting} />}
          </View>

          <Section title="How it stands">
            <ReadingCard item={item} index={index} />
          </Section>

          <Button title={`Open ${item.ticker} on themarkethub.app`} kind="ghost" onPress={() => openQuote(item.ticker)} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "flex-end", gap: space.md },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, marginBottom: space.md },
  waiting: { height: 240, borderRadius: 2, backgroundColor: color.raised },
});
