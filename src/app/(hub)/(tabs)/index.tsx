// Overview: the portfolio today. What it is worth, how it reads, how it stands against the
// indices, what it is made of. It describes; it never says what to do with a stock.
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CompareChart } from "@/components/compare-chart";
import { ShareBar, Sparkline, StackedBar, ToneMark } from "@/components/marks";
import { Button, Head, Label, Notice, Panel, Rule, Screen, Section, Stat, Txt, Waiting, statGrid, strong } from "@/components/ui";
import { api } from "@/lib/api";
import { money, pct, price, signedMoney, signedPct, tidyName, timeAgo, toneOf } from "@/lib/format";
import { getDashboard, newsAddress, openPage, openQuote, watchMyNews } from "@/lib/hub";
import { useLoad } from "@/lib/load";
import { useSession } from "@/lib/session";
import { color, space } from "@/lib/theme";
import type { Dashboard, Group, Insights, NewsItem, Row, Watch } from "@/lib/types";


function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 19 ? "Good afternoon" : "Good evening";
  return `${part}, ${name.split(" ")[0]}`;
}

export default function Overview() {
  const { user } = useSession();
  const router = useRouter();
  const { data: d, error, refreshing, refresh } = useLoad(getDashboard);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const edit = () => router.push("/portfolio");

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Head title={greeting(user?.name ?? "")} note={today} sample={d?.sample} />
      {error ? <Notice text={error} /> : null}
      {!d ? (error ? null : <Waiting />) : !d.positions.length && !d.watchlist.length ? (
        <Panel style={{ gap: space.md }}>
          <Txt size={20} weight="bold" tone="strong">Do you have a portfolio?</Txt>
          <Txt size={14} tone="muted" style={{ lineHeight: 21 }}>Add what you own to see its value and your gains, or just the stocks you follow. You can have both and change them any time.</Txt>
          <Button title="Add your stocks" onPress={edit} />
        </Panel>
      ) : (
        <>
          {d.positions.length ? <Tiles d={d} /> : null}
          {d.positions.length ? <ReadBack first={d.insights} /> : null}
          <Movers d={d} />
          {d.positions.length ? (
            <>
              <Section title="Today's holdings against the indices"
                note="The positions you hold now, held through the period, next to the indices, all from 100. Trades are not recorded, so this is not your actual past return.">
                <CompareChart d={d} />
              </Section>
              <Section title="Positions" note={d.totals.cost_covers < d.totals.positions ? "Gain and loss only where you entered an average cost." : undefined}
                action={<Txt size={13} tone="muted" onPress={edit} accessibilityRole="link">Edit</Txt>}>
                {d.positions.map((r, i) => <Holding key={r.ticker} r={r} first={i === 0} />)}
              </Section>
              <Makeup d={d} />
            </>
          ) : null}
          {d.watchlist.length ? (
            <Section title="Watchlist" note="Stocks you follow">
              {d.watchlist.map((w, i) => <Followed key={w.ticker} w={w} first={i === 0} />)}
            </Section>
          ) : null}
          <OwnNews of={d} />
          {d.notes.map((n) => <Txt key={n} size={12} tone="warn">{n}</Txt>)}
        </>
      )}
    </Screen>
  );
}


function Tiles({ d }: { d: Dashboard }) {
  const t = d.totals;
  const year = d.performance.periods.find((x) => x.key === "1y");
  const index = d.performance.indices[0];
  const theirs = index ? year?.indices[index.ticker] : null;
  const gap = year?.portfolio != null && theirs != null ? year.portfolio - theirs : null;
  return (
    <Panel style={statGrid}>
      <Stat label="Portfolio value" value={money(t.value)} note={t.positions ? `${t.positions} position${t.positions > 1 ? "s" : ""}` : "No positions"} />
      <Stat label="Today" value={signedMoney(t.day_change)} tone={strong(t.day_change)}
        note={`${signedPct(t.day_change_pct, 2)} · ${index?.name ?? "Index"} ${signedPct(d.benchmark.day_change_pct, 2)}`} />
      <Stat label="Gain / loss" value={signedMoney(t.pnl)} tone={strong(t.pnl)}
        note={t.pnl_pct != null ? `${signedPct(t.pnl_pct)} on your cost` : "Add average costs to see it"} />
      <Stat label="Holdings over 1 year" value={signedPct(year?.portfolio)} tone={strong(year?.portfolio)}
        note={gap == null || !index ? undefined : `${(Math.abs(gap) * 100).toFixed(1)} points ${gap >= 0 ? "ahead of" : "behind"} the ${index.name}`} />
    </Panel>
  );
}

const KINDS: Record<string, string> = { performance: "Against the index", concentration: "Concentration", sector: "Sectors", risk: "How it moves",
  geography: "Where", today: "Today", income: "Dividends" };

// The sentences are there at once (the portal writes them from the figures); the fuller reading
// is asked for then, and takes their place when it comes.
function ReadBack({ first }: { first: Insights }) {
  // The fuller reading is of the figures the headline was written from: it stays while they do.
  const of = first.headline;
  const [fuller, setFuller] = useState<{ of: string; said: Insights } | null>(null);
  useEffect(() => {
    let alive = true;
    api<Insights>("/api/insights").then((said) => alive && said.written && said.items.length && setFuller({ of, said })).catch(() => {});
    return () => {
      alive = false;
    };
  }, [of]);
  const said = fuller?.of === of ? fuller.said : first;
  return (
    <Panel>
      <Label>Your portfolio, read back</Label>
      <Txt size={20} weight="medium" tone="strong" style={{ marginTop: space.md, lineHeight: 27, letterSpacing: -0.2 }}>{said.headline}</Txt>
      <View style={{ marginTop: space.lg, gap: space.md }}>
        {said.items.map((item) => (
          <View key={`${item.kind}:${item.text}`} style={styles.insight}>
            <Label>{KINDS[item.kind] ?? ""}</Label>
            <Txt size={15} style={{ marginTop: 4, lineHeight: 23 }}>{item.text}</Txt>
          </View>
        ))}
      </View>
    </Panel>
  );
}

function Movers({ d }: { d: Dashboard }) {
  const all = [...d.positions, ...d.watchlist];
  const moves = [...d.movers.up, ...d.movers.down].map((t) => all.find((r) => r.ticker === t)).filter((r) => r != null);
  if (!moves.length) return null;
  return (
    <View style={styles.movers}>
      <Txt size={13} tone="muted">Moving most today:</Txt>
      {moves.map((r) => <Txt key={r.ticker} num size={13} tone={toneOf(r.day_change_pct)}>{r.ticker} {signedPct(r.day_change_pct)}</Txt>)}
    </View>
  );
}

function Name({ ticker, name }: { ticker: string; name: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Txt size={15} weight="semibold" tone="strong">{ticker}</Txt>
      <Txt size={11.5} tone="muted" numberOfLines={1}>{tidyName(name)}</Txt>
    </View>
  );
}

// One position: what it is worth and how it moved today, and under it what is held and the gain on its cost.
function Holding({ r, first }: { r: Row; first: boolean }) {
  const shares = r.shares.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return (
    <Pressable onPress={() => openQuote(r.ticker)} accessibilityRole="link" accessibilityHint={`Opens ${r.ticker} on themarkethub.app`}
      style={({ pressed }) => [styles.line, !first && styles.lineRule, pressed && { backgroundColor: color.raised }]}>
      <View style={styles.lineTop}>
        <Name ticker={r.ticker} name={r.name} />
        <Sparkline values={r.spark} />
        <View style={styles.figures}>
          <Txt num size={14} tone="strong">{money(r.value)}</Txt>
          <Txt num size={13} tone={toneOf(r.day_change_pct)}>{signedPct(r.day_change_pct)}</Txt>
        </View>
      </View>
      <View style={styles.lineSub}>
        <Txt num size={12} tone="muted">{shares} × {price(r.price)}</Txt>
        <Txt num size={12} tone="muted">{pct(r.weight)} of it</Txt>
        {r.pnl != null ? <Txt num size={12} tone={toneOf(r.pnl)}>{signedMoney(r.pnl)} ({signedPct(r.pnl_pct)})</Txt> : <Txt num size={12} tone="faint">no cost entered</Txt>}
      </View>
    </Pressable>
  );
}

function Followed({ w, first }: { w: Watch; first: boolean }) {
  return (
    <Pressable onPress={() => openQuote(w.ticker)} accessibilityRole="link" accessibilityHint={`Opens ${w.ticker} on themarkethub.app`}
      style={({ pressed }) => [styles.line, !first && styles.lineRule, pressed && { backgroundColor: color.raised }]}>
      <View style={styles.lineTop}>
        <Name ticker={w.ticker} name={w.name} />
        <Sparkline values={w.spark} />
        <View style={styles.figures}>
          <Txt num size={14} tone="strong">{price(w.price)}</Txt>
          <Txt num size={13} tone={toneOf(w.day_change_pct)}>{signedPct(w.day_change_pct)}</Txt>
        </View>
      </View>
      <View style={styles.lineSub}>
        <Txt num size={12} tone="muted">1 month <Txt num size={12} tone={toneOf(w.return_1m)}>{signedPct(w.return_1m)}</Txt></Txt>
        <Txt num size={12} tone="muted">1 year <Txt num size={12} tone={toneOf(w.return_1y)}>{signedPct(w.return_1y)}</Txt></Txt>
        <Txt num size={12} tone="muted">{signedPct(w.from_high_52w)} from high</Txt>
      </View>
    </Pressable>
  );
}

const READS = { bullish: "Bullish", bearish: "Bearish", neutral: "Neutral" } as const;

// What the user's companies filed lately. The section stays out of the screen until there is something.
function OwnNews({ of }: { of: Dashboard }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  // Asked for again with the figures: when the screen comes to the front, or is pulled down.
  useEffect(() => {
    let alive = true;
    watchMyNews((n) => alive && setItems(n.sample ? [] : n.items.slice(0, 8))).catch(() => {});
    return () => {
      alive = false;
    };
  }, [of]);
  if (!items.length) return null;
  return (
    <Section title="News on your stocks" note="From the filings of the companies you hold or follow">
      {items.map((n, i) => {
        const address = newsAddress(n);
        return (
          <Pressable key={n.id} disabled={!address} onPress={() => address && openPage(address)} accessibilityRole="link" accessibilityHint="Opens in the browser"
            style={({ pressed }) => [styles.line, i > 0 && styles.lineRule, pressed && { backgroundColor: color.raised }]}>
            <View style={styles.byline}>
              <Txt num size={12} tone="muted">{timeAgo(n.published_utc)}</Txt>
              <Txt size={12.5} tone="muted">{n.source}</Txt>
              {n.sentiment && READS[n.sentiment] ? (
                <View style={styles.reads}>
                  <ToneMark sentiment={n.sentiment} />
                  <Txt size={12.5} weight="medium" tone={n.sentiment === "bullish" ? "up" : n.sentiment === "bearish" ? "down" : "muted"}>{READS[n.sentiment]}</Txt>
                </View>
              ) : null}
              {n.tickers.slice(0, 3).map((t) => <Txt key={t} num size={11.5} tone="muted">{t}</Txt>)}
            </View>
            <Txt size={14.5} tone="strong" style={{ lineHeight: 20 }}>{n.title}</Txt>
          </Pressable>
        );
      })}
    </Section>
  );
}

function GroupLine({ title, items }: { title: string; items: Group[] }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.makeupHead}>
        <Label>{title}</Label>
        <Txt size={12.5} tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>{items.slice(0, 3).map((g) => `${g.label} ${pct(g.weight, 0)}`).join(" · ")}</Txt>
      </View>
      <StackedBar parts={items} />
    </View>
  );
}

// What it is made of, at a glance: one line per way of looking at it, and the largest positions.
function Makeup({ d }: { d: Dashboard }) {
  const largest = d.positions.filter((x) => x.weight != null).slice(0, 6);
  return (
    <Section title="What it is made of" note="Share of the portfolio's value">
      <View style={{ gap: space.lg }}>
        {d.groups.map((g) => <GroupLine key={g.key} title={`By ${g.label.toLowerCase()}`} items={g.items} />)}
        <Rule />
        <Label>Largest positions</Label>
        {largest.map((x) => (
          <View key={x.ticker} style={styles.share}>
            <Txt size={13} weight="semibold" tone="strong" style={{ width: 62 }}>{x.ticker}</Txt>
            <ShareBar weight={x.weight} />
            <Txt num size={13} tone="strong" style={{ width: 52, textAlign: "right" }}>{pct(x.weight)}</Txt>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  insight: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: space.md },
  movers: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.md, rowGap: 4 },
  line: { paddingVertical: space.md, gap: 6 },
  lineRule: { borderTopWidth: 1, borderTopColor: color.line },
  lineTop: { flexDirection: "row", alignItems: "center", gap: space.md },
  lineSub: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", columnGap: space.md, rowGap: 2 },
  figures: { alignItems: "flex-end", minWidth: 78 },
  byline: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 2 },
  reads: { flexDirection: "row", alignItems: "center", gap: 5 },
  makeupHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.md },
  share: { flexDirection: "row", alignItems: "center", gap: space.md },
});
