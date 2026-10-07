// Analysis: the portfolio taken apart. What it is made of (by sector, country, volatility and
// size), how today's holdings did against each index, how much it moves and how its weight is
// spread, and every position's own figures. Descriptive: it says what is, not what to do.
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ShareBar, StackedBar } from "@/components/marks";
import { Button, Chip, Head, Notice, Panel, Screen, Section, Stat, Track, Txt, Waiting, WordTabs, statGrid } from "@/components/ui";
import { pct, points, shortDate, signedPct, tidyName, toneOf } from "@/lib/format";
import { getDashboard, openQuote } from "@/lib/hub";
import { useLoad } from "@/lib/load";
import { color, space } from "@/lib/theme";
import type { Dashboard, Group, Row } from "@/lib/types";

export default function Analysis() {
  const router = useRouter();
  const { data: d, error, refreshing, refresh } = useLoad(getDashboard);
  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Head title="Analysis" note="Your portfolio taken apart: what it is made of, how it moves and how it stands against the indices." sample={d?.sample} />
      {error ? <Notice text={error} /> : null}
      {!d ? (error ? null : <Waiting />) : !d.positions.length ? (
        <Panel style={{ gap: space.md }}>
          <Txt size={15}>There is nothing to take apart yet.</Txt>
          <Button title="Add your positions" onPress={() => router.push("/portfolio")} />
        </Panel>
      ) : (
        <>
          <Makeup d={d} />
          <Against d={d} />
          <Movement d={d} />
          <Today d={d} />
          <Positions d={d} />
        </>
      )}
    </Screen>
  );
}

// A small figure with its name over it, for a line of several.
function Fact({ label, value, move }: { label: string; value: string; move?: number | null }) {
  return (
    <View>
      <Txt size={11} tone="muted">{label}</Txt>
      <Txt num size={13} tone={move === undefined ? "ink" : toneOf(move)}>{value}</Txt>
    </View>
  );
}

// --- What it is made of ----------------------------------------------------------------------------

function Makeup({ d }: { d: Dashboard }) {
  const [key, setKey] = useState(d.groups[0]?.key ?? "");
  const g = d.groups.find((x) => x.key === key) ?? d.groups[0];
  if (!g) return null;
  return (
    <Section title="What it is made of" note="The same positions, gathered four ways">
      <WordTabs items={d.groups.map((x) => ({ key: x.key, label: `By ${x.label.toLowerCase()}` }))} value={g.key} onChange={setKey} />
      {g.note ? <Txt size={13} tone="muted" style={{ marginTop: space.md, lineHeight: 19 }}>{g.note}</Txt> : null}
      <View style={{ marginTop: space.md }}><StackedBar parts={g.items} /></View>
      <View style={{ marginTop: space.sm }}>
        {g.items.map((it, i) => <GroupRow key={it.label} it={it} first={i === 0} />)}
      </View>
    </Section>
  );
}

function GroupRow({ it, first }: { it: Group; first: boolean }) {
  return (
    <View style={[styles.row, !first && styles.rowRule]}>
      <View style={styles.rowTop}>
        <View style={{ width: 132 }}>
          <Txt size={14} weight="semibold" tone="strong" numberOfLines={1}>{it.label}</Txt>
          <Txt size={11} tone="muted">{it.count} position{it.count > 1 ? "s" : ""}</Txt>
        </View>
        <ShareBar weight={it.weight} />
        <Txt num size={13} tone="strong" style={styles.right}>{pct(it.weight)}</Txt>
      </View>
      <View style={styles.chips}>
        {it.tickers.slice(0, 8).map((t) => <Chip key={t} text={t} onPress={() => openQuote(t)} />)}
        {it.tickers.length > 8 ? <Txt size={12} tone="muted">+{it.tickers.length - 8}</Txt> : null}
      </View>
      <View style={styles.facts}>
        <Fact label="Today" value={signedPct(it.day_change_pct, 2)} move={it.day_change_pct} />
        <Fact label="1 month" value={signedPct(it.return_1m)} move={it.return_1m} />
        <Fact label="This year" value={signedPct(it.return_ytd)} move={it.return_ytd} />
        <Fact label="1 year" value={signedPct(it.return_1y)} move={it.return_1y} />
        <Fact label="Volatility" value={pct(it.volatility, 0)} />
      </View>
    </View>
  );
}

// --- Against the indices ---------------------------------------------------------------------------

function Against({ d }: { d: Dashboard }) {
  const indices = d.performance.indices;
  const first = indices[0];
  if (!first) return null;
  const gaps = d.performance.periods.map((p) => (p.portfolio != null && p.indices[first.ticker] != null ? p.portfolio - p.indices[first.ticker]! : null));
  // One scale for the five gaps, so a period's lead or lag reads against the others.
  const scale = Math.max(0.02, ...gaps.map((g) => Math.abs(g ?? 0)));
  return (
    <Section title="Against the indices" note="Today's holdings held through each period. Trades are not recorded, so this is not your actual past return.">
      {d.performance.periods.map((p, n) => {
        const digits = p.key === "1d" ? 2 : 1;
        return (
          <View key={p.key} style={[styles.row, n > 0 && styles.rowRule]}>
            <View style={styles.rowTop}>
              <Txt size={14} weight="semibold" tone="strong" style={{ width: 84 }}>{p.label}</Txt>
              <Txt num size={14} weight="medium" tone={toneOf(p.portfolio)} style={{ width: 66 }}>{signedPct(p.portfolio, digits)}</Txt>
              <Track move={gaps[n]} scale={scale} />
              <Txt num size={12.5} tone={toneOf(gaps[n])} style={{ width: 76, textAlign: "right" }}>{points(gaps[n], digits)}</Txt>
            </View>
            <View style={styles.facts}>
              {indices.map((i) => <Fact key={i.ticker} label={i.name} value={signedPct(p.indices[i.ticker], digits)} move={p.indices[i.ticker]} />)}
            </View>
          </View>
        );
      })}
      <Txt size={11.5} tone="faint" style={{ marginTop: space.sm }}>The mark and the points are your holdings against the {first.name}.</Txt>
    </Section>
  );
}

// --- How it moves, how it is spread ----------------------------------------------------------------

function Movement({ d }: { d: Dashboard }) {
  const r = d.risk, index = d.performance.indices[0]?.name ?? "index";
  const day = (x: Dashboard["risk"]["best_day"]) => (x ? shortDate(x.date) : undefined);
  return (
    <>
      <Section title="How it moves" note="Over the last year, for today's holdings">
        <View style={statGrid}>
          <Stat label="Volatility" value={pct(r.volatility, 0)} note={r.benchmark_volatility != null ? `${index} ${pct(r.benchmark_volatility, 0)} a year` : "a year"} />
          <Stat label="Beta" value={r.beta == null ? "—" : r.beta.toFixed(2)} note={`Its move for each 1% of the ${index}`} />
          <Stat label="Deepest fall" value={pct(r.max_drawdown, 1)} note="From a peak to the low after it" tone={r.max_drawdown ? "down" : "strong"} />
          <Stat label="Days up" value={pct(r.up_days, 0)} note="Of the sessions of the year" />
          <Stat label="Best day" value={signedPct(r.best_day?.return, 2)} note={day(r.best_day)} tone="up" />
          <Stat label="Worst day" value={signedPct(r.worst_day?.return, 2)} note={day(r.worst_day)} tone="down" />
        </View>
      </Section>
      <Section title="How its weight is spread" note="Share of the portfolio's value">
        <View style={statGrid}>
          <Stat label="Largest position" value={pct(r.top1)} note={r.top3_tickers[0]} />
          <Stat label="Three largest" value={pct(r.top3)} note={r.top3_tickers.join(", ")} />
          <Stat label="Behaves like" value={r.effective_positions == null ? "—" : `${r.effective_positions.toFixed(1)} positions`} note={`of equal size, out of ${d.totals.positions} held`} />
          <Stat label="Dividend yield" value={r.dividend_yield ? pct(r.dividend_yield) : "—"} note="A year, at the last dividends" />
        </View>
      </Section>
    </>
  );
}

// --- Today, position by position -------------------------------------------------------------------

function Today({ d }: { d: Dashboard }) {
  const rows = d.positions.filter((r) => r.day_contribution != null).sort((a, b) => b.day_contribution! - a.day_contribution!);
  if (!rows.length) return null;
  const scale = Math.max(0.002, ...rows.map((r) => Math.abs(r.day_contribution!)));
  const end = `${(scale * 100).toFixed(2)}`;
  return (
    <Section title="Today, position by position" note={`How many points of the portfolio's ${signedPct(d.totals.day_change_pct, 2)} each position accounts for`}>
      <View style={styles.axis}>
        <View style={{ width: 132 }} />
        <View style={styles.axisEnds}>
          <Txt num size={10.5} tone="faint">−{end}</Txt>
          <Txt num size={10.5} tone="faint">0</Txt>
          <Txt num size={10.5} tone="faint">+{end}</Txt>
        </View>
        <View style={{ width: 56 }} />
      </View>
      {rows.map((r) => (
        <Pressable key={r.ticker} onPress={() => openQuote(r.ticker)} accessibilityRole="link" accessibilityLabel={`${r.ticker}, ${signedPct(r.day_change_pct, 2)} today, ${points(r.day_contribution, 2)} of the portfolio's move`}
          style={({ pressed }) => [styles.ruler, pressed && { backgroundColor: color.raised }]}>
          <Txt size={14} weight="semibold" tone="strong" style={{ width: 62 }}>{r.ticker}</Txt>
          <Txt num size={12.5} tone={toneOf(r.day_change_pct)} style={{ width: 62, textAlign: "right" }}>{signedPct(r.day_change_pct, 2)}</Txt>
          <Track move={r.day_contribution} scale={scale} />
          <Txt num size={12.5} tone={toneOf(r.day_contribution)} style={{ width: 56, textAlign: "right" }}>{points(r.day_contribution, 2).replace(" pts", "")}</Txt>
        </Pressable>
      ))}
    </Section>
  );
}

// --- Every position --------------------------------------------------------------------------------

type Order = { key: string; label: string; value: (r: Row) => number | string | null; say: (r: Row) => string; move?: boolean; rising?: boolean };
const ORDERS: Order[] = [
  { key: "weight", label: "Weight", value: (r) => r.weight, say: (r) => pct(r.weight) },
  { key: "ticker", label: "Name", value: (r) => r.ticker, say: (r) => pct(r.weight), rising: true },
  { key: "volatility", label: "Volatility", value: (r) => r.volatility, say: (r) => pct(r.volatility, 0) },
  { key: "beta", label: "Beta", value: (r) => r.beta, say: (r) => (r.beta == null ? "—" : r.beta.toFixed(2)) },
  { key: "high", label: "From 52-week high", value: (r) => r.from_high_52w, say: (r) => signedPct(r.from_high_52w) },
  { key: "yield", label: "Dividend yield", value: (r) => r.dividend_yield, say: (r) => (r.dividend_yield ? pct(r.dividend_yield) : "—") },
  { key: "1m", label: "1 month", value: (r) => r.return_1m, say: (r) => signedPct(r.return_1m), move: true },
  { key: "3m", label: "3 months", value: (r) => r.return_3m, say: (r) => signedPct(r.return_3m), move: true },
  { key: "ytd", label: "This year", value: (r) => r.return_ytd, say: (r) => signedPct(r.return_ytd), move: true },
  { key: "1y", label: "1 year", value: (r) => r.return_1y, say: (r) => signedPct(r.return_1y), move: true },
];

function Positions({ d }: { d: Dashboard }) {
  const [by, setBy] = useState("weight");
  const order = ORDERS.find((o) => o.key === by) ?? ORDERS[0];
  const sorted = [...d.positions].sort((a, b) => {
    const [x, y] = [order.value(a), order.value(b)];
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1; // what is not known goes last
    const way = typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number);
    return order.rising ? way : -way;
  });
  return (
    <Section title="Every position" note="Ordered by the figure you choose">
      <WordTabs items={ORDERS} value={order.key} onChange={setBy} />
      <View style={{ marginTop: space.sm }}>
        {sorted.map((r, i) => (
          <Pressable key={r.ticker} onPress={() => openQuote(r.ticker)} accessibilityRole="link" accessibilityHint={`Opens ${r.ticker} on themarkethub.app`}
            style={({ pressed }) => [styles.row, i > 0 && styles.rowRule, pressed && { backgroundColor: color.raised }]}>
            <View style={styles.rowTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={15} weight="semibold" tone="strong">{r.ticker}</Txt>
                <Txt size={11.5} tone="muted" numberOfLines={1}>{tidyName(r.name)}</Txt>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Txt num size={15} weight="medium" tone={order.move ? toneOf(order.value(r) as number | null) : "strong"}>{order.say(r)}</Txt>
                <Txt size={11} tone="muted">{order.key === "ticker" ? "Weight" : order.label}</Txt>
              </View>
            </View>
            <Txt size={12} tone="muted" numberOfLines={1}>{[r.sector, r.country, r.size].filter(Boolean).join(" · ")}</Txt>
            <View style={styles.facts}>
              <Fact label="Weight" value={pct(r.weight)} />
              <Fact label="Volatility" value={`${pct(r.volatility, 0)} ${r.volatility_group.toLowerCase()}`} />
              <Fact label="Beta" value={r.beta == null ? "—" : r.beta.toFixed(2)} />
              <Fact label="From high" value={signedPct(r.from_high_52w)} />
              <Fact label="Yield" value={r.dividend_yield ? pct(r.dividend_yield) : "—"} />
            </View>
            <View style={styles.facts}>
              <Fact label="1 month" value={signedPct(r.return_1m)} move={r.return_1m} />
              <Fact label="3 months" value={signedPct(r.return_3m)} move={r.return_3m} />
              <Fact label="This year" value={signedPct(r.return_ytd)} move={r.return_ytd} />
              <Fact label="1 year" value={signedPct(r.return_1y)} move={r.return_1y} />
            </View>
          </Pressable>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: space.md, gap: space.sm },
  rowRule: { borderTopWidth: 1, borderTopColor: color.line },
  rowTop: { flexDirection: "row", alignItems: "center", gap: space.md },
  right: { width: 52, textAlign: "right" },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 },
  facts: { flexDirection: "row", flexWrap: "wrap", columnGap: space.lg, rowGap: 6 },
  axis: { flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: 2 },
  axisEnds: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  ruler: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 7 },
});
