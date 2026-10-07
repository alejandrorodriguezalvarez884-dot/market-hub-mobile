// My Hub's chart: today's holdings against the indices, all from 100, over the range the reader
// picks. Lines only; the figures of each period are in the strip under it.
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { Label, Txt } from "@/components/ui";
import { points, shortDate, signedPct, toneOf } from "@/lib/format";
import { INDEX_COLORS, color, space } from "@/lib/theme";
import type { Dashboard } from "@/lib/types";

const RANGES = ["1M", "3M", "YTD", "1Y"] as const;
type Range = (typeof RANGES)[number];
const DAYS: Record<string, number> = { "1M": 30, "3M": 91, "1Y": 365 };
const HEIGHT = 200;
const SCALE = 44; // room for the scale's figures, to the right of the lines

// Where a range starts in the series: the last close on or before its first day.
function start(dates: string[], range: Range): number {
  const last = dates[dates.length - 1];
  const cutoff = range === "YTD" ? `${+last.slice(0, 4) - 1}-12-31`
    : new Date(Date.parse(`${last}T00:00:00Z`) - DAYS[range] * 86400000).toISOString().slice(0, 10);
  let from = 0;
  for (let i = 0; i < dates.length && dates[i] <= cutoff; i++) from = i;
  return from;
}

export function CompareChart({ d }: { d: Dashboard }) {
  const [range, setRange] = useState<Range>("1Y");
  const [shown, setShown] = useState<string[]>(["SPY"]);
  const [width, setWidth] = useState(0);
  const hst = d.history;
  if (!hst.dates.length) return <Txt size={14} tone="muted">No common price history yet.</Txt>;

  const from = start(hst.dates, range);
  const rebased = (values: number[]) => {
    const part = values.slice(from);
    return part.map((v) => (v / part[0]) * 100);
  };
  const indices = d.performance.indices.filter((i) => hst.indices[i.ticker]);
  const series = [
    ...indices.filter((i) => shown.includes(i.ticker)).map((i) => ({ name: i.name, values: rebased(hst.indices[i.ticker]), tint: INDEX_COLORS[i.ticker] ?? color.muted, wide: 1.25 })),
    // Drawn last, so the holdings' line is in front.
    { name: "Your holdings", values: rebased(hst.portfolio_rebased), tint: color.inkStrong, wide: 1.75 },
  ];
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(...all, 100), hi = Math.max(...all, 100);
  const pad = (hi - lo || 1) * 0.08;
  const plot = Math.max(0, width - SCALE);
  const count = series[0].values.length;
  const x = (i: number) => (count > 1 ? (i / (count - 1)) * plot : 0);
  const y = (v: number) => 6 + ((hi + pad - v) / (hi - lo + 2 * pad)) * (HEIGHT - 12);
  const dates = hst.dates.slice(from);

  return (
    <View>
      <View style={styles.controls}>
        <View style={styles.ranges} accessibilityRole="tablist">
          {RANGES.map((r) => (
            <Pressable key={r} onPress={() => setRange(r)} hitSlop={10} accessibilityRole="tab" accessibilityState={{ selected: r === range }}
              style={[styles.range, r === range && styles.rangeOn]}>
              <Txt size={13} tone={r === range ? "strong" : "muted"}>{r}</Txt>
            </Pressable>
          ))}
        </View>
        <View style={styles.toggles}>
          {indices.map((i) => {
            const on = shown.includes(i.ticker);
            return (
              <Pressable key={i.ticker} hitSlop={6} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={i.name}
                onPress={() => setShown(on ? shown.filter((t) => t !== i.ticker) : [...shown, i.ticker])} style={[styles.toggle, !on && { opacity: 0.5 }]}>
                <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: INDEX_COLORS[i.ticker] ?? color.muted }} />
                <Txt size={11.5}>{i.name}</Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ height: HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="image" accessibilityLabel={`Your holdings against ${series.slice(0, -1).map((s) => s.name).join(", ") || "no index"}, ${range}, from 100.`}>
        {width > 0 && (
          <>
            <Svg width={width} height={HEIGHT}>
              <Line x1={0} x2={plot} y1={y(100)} y2={y(100)} stroke={color.lineStrong} strokeWidth={1} strokeDasharray="2 4" />
              {series.map((s) => (
                <Path key={s.name} d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
                  fill="none" stroke={s.tint} strokeWidth={s.wide} strokeLinejoin="round" />
              ))}
            </Svg>
            {[hi, 100, lo].filter((v, i, a) => a.findIndex((w) => Math.abs(y(w) - y(v)) < 14) === i).map((v) => (
              <Txt key={v} num size={11} tone="muted" style={[styles.scale, { top: y(v) - 8 }]}>{v.toFixed(0)}</Txt>
            ))}
          </>
        )}
      </View>
      <View style={styles.dates}>
        <Txt num size={11} tone="muted">{shortDate(dates[0])}</Txt>
        <Txt num size={11} tone="muted" style={{ marginRight: SCALE }}>{shortDate(dates[dates.length - 1])}</Txt>
      </View>

      <PeriodStrip d={d} />
    </View>
  );
}

// Each period in a cell: the holdings' return, the index's, and the gap between them in points.
function PeriodStrip({ d }: { d: Dashboard }) {
  const index = d.performance.indices[0];
  return (
    <View style={styles.strip}>
      {d.performance.periods.map((p) => {
        const digits = p.key === "1d" ? 2 : 1;
        const theirs = index ? p.indices[index.ticker] : null;
        const gap = p.portfolio != null && theirs != null ? p.portfolio - theirs : null;
        return (
          <View key={p.key} style={styles.cell}>
            <Label>{p.label}</Label>
            <Txt num size={17} weight="medium" tone={toneOf(p.portfolio)} style={{ marginTop: 2 }}>{signedPct(p.portfolio, digits)}</Txt>
            {index && <Txt size={12} tone="muted" style={{ marginTop: 2 }}>{index.name} <Txt num size={12} tone="muted">{signedPct(theirs, digits)}</Txt></Txt>}
            <Txt num size={12} tone={toneOf(gap)} style={{ marginTop: 2 }}>{gap == null ? "—" : `${points(gap, digits)} ${gap >= 0 ? "ahead" : "behind"}`}</Txt>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { gap: space.md, marginBottom: space.md },
  ranges: { flexDirection: "row", gap: 18 },
  range: { paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "transparent" },
  rangeOn: { borderBottomColor: color.inkStrong },
  toggles: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: color.lineStrong, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 3 },
  scale: { position: "absolute", right: 0, width: SCALE - 6, textAlign: "right" },
  dates: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  strip: { flexDirection: "row", flexWrap: "wrap", marginTop: space.lg, borderTopWidth: 1, borderLeftWidth: 1, borderColor: color.line },
  cell: { width: "50%", flexGrow: 1, padding: space.md, borderRightWidth: 1, borderBottomWidth: 1, borderColor: color.line },
});
