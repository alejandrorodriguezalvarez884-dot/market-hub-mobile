// One stock's daily bars, as candles or as a line, with its 20, 50 and 200-day averages.
import { useState } from "react";
import { View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { Txt } from "@/components/ui";
import { price, shortDate } from "@/lib/format";
import { color } from "@/lib/theme";
import { AVERAGES, RANGES, average, type Bars, type Range } from "@/lib/watch";

const HEIGHT = 240;
const SCALE = 58; // room for the prices, to the right of the bars

export function PriceChart({ bars, range, candles, averages }: { bars: Bars; range: Range; candles: boolean; averages: boolean }) {
  const [width, setWidth] = useState(0);
  const from = Math.max(0, bars.time.length - RANGES[range]);
  const count = bars.time.length - from;
  // A provider that only has closes gives bars with no range: they are drawn as a line.
  const flat = bars.open.every((o, i) => o === bars.close[i] && bars.high[i] === bars.low[i]);
  const asCandles = candles && !flat;
  const lines = averages ? AVERAGES.map((a) => ({ ...a, values: average(bars.close, a.sessions) })).filter((l) => l.values[bars.close.length - 1] != null) : [];

  let lo = Infinity, hi = -Infinity;
  for (let i = from; i < bars.time.length; i++) {
    lo = Math.min(lo, asCandles ? bars.low[i] : bars.close[i]);
    hi = Math.max(hi, asCandles ? bars.high[i] : bars.close[i]);
    for (const l of lines) {
      const v = l.values[i];
      if (v != null) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
  }
  if (!(count > 1) || !Number.isFinite(lo)) return <Txt size={13} tone="muted">No prices to draw yet.</Txt>;
  const pad = (hi - lo || hi * 0.01) * 0.06;
  const plot = Math.max(0, width - SCALE);
  const step = plot / count;
  const x = (i: number) => (i - from + 0.5) * step;
  const y = (v: number) => 4 + ((hi + pad - v) / (hi - lo + 2 * pad)) * (HEIGHT - 8);
  const f = (v: number) => v.toFixed(1);

  const rising = bars.close[bars.close.length - 1] >= bars.close[from];
  const paths: { d: string; tint: string; fill?: boolean; wide: number }[] = [];
  if (asCandles) {
    const body = Math.max(1, Math.min(9, step * 0.7));
    let up = "", down = "";
    for (let i = from; i < bars.time.length; i++) {
      const [o, c] = [bars.open[i], bars.close[i]];
      const top = y(Math.max(o, c)), bottom = Math.max(top + 1, y(Math.min(o, c)));
      const d = `M${f(x(i))},${f(y(bars.high[i]))}V${f(y(bars.low[i]))}M${f(x(i) - body / 2)},${f(top)}h${f(body)}V${f(bottom)}h${f(-body)}Z`;
      if (c >= o) up += d;
      else down += d;
    }
    paths.push({ d: up, tint: color.up, fill: true, wide: 1 }, { d: down, tint: color.down, fill: true, wide: 1 });
  } else {
    let d = "";
    for (let i = from; i < bars.time.length; i++) d += `${i === from ? "M" : "L"}${f(x(i))},${f(y(bars.close[i]))}`;
    paths.push({ d, tint: rising ? color.up : color.down, wide: 1.75 });
  }
  for (const l of lines) {
    let d = "", pen = false;
    for (let i = from; i < bars.time.length; i++) {
      const v = l.values[i];
      if (v == null) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${f(x(i))},${f(y(v))}`;
      pen = true;
    }
    paths.push({ d, tint: l.color, wide: 1 });
  }
  const last = bars.close[bars.close.length - 1];
  const marks = [hi, (hi + lo) / 2, lo];

  return (
    <View>
      <View style={{ height: HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="image"
        accessibilityLabel={`${bars.ticker}, daily prices over ${range}: from ${price(bars.close[from])} to ${price(last)}.`}>
        {width > 0 ? (
          <>
            <Svg width={width} height={HEIGHT}>
              {marks.map((v) => <Line key={v} x1={0} x2={plot} y1={y(v)} y2={y(v)} stroke={color.line} strokeWidth={1} strokeDasharray="2 4" />)}
              {paths.filter((p) => p.d).map((p, i) => (
                <Path key={i} d={p.d} stroke={p.tint} strokeWidth={p.wide} fill={p.fill ? p.tint : "none"} strokeLinejoin="round" />
              ))}
            </Svg>
            {marks.map((v) => (
              <Txt key={v} num size={10.5} tone="muted" style={{ position: "absolute", right: 0, width: SCALE - 6, textAlign: "right", top: Math.max(0, Math.min(HEIGHT - 14, y(v) - 7)) }}>
                {price(v).replace("$", "")}
              </Txt>
            ))}
          </>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, marginRight: SCALE }}>
        <Txt num size={10.5} tone="muted">{shortDate(bars.time[from])}</Txt>
        <Txt num size={10.5} tone="muted">{shortDate(bars.time[bars.time.length - 1])}</Txt>
      </View>
      {lines.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8 }}>
          {lines.map((l) => (
            <View key={l.sessions} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 14, height: 2, backgroundColor: l.color }} />
              <Txt size={12} tone="muted">{l.name}</Txt>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
