// Returns over the sessions of a month: one line per portfolio, all from zero.
import { useState } from "react";
import { View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { Txt } from "@/components/ui";
import { signedPct } from "@/lib/format";
import { color } from "@/lib/theme";

export type Series = { name: string; values: number[]; tint: string; dashed?: boolean; wide?: number };
const HEIGHT = 220;
const SCALE = 50;

export function ReturnsChart({ series, first, last }: { series: Series[]; first: string; last: string }) {
  const [width, setWidth] = useState(0);
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(0, ...all), hi = Math.max(0, ...all);
  const pad = (hi - lo || 0.01) * 0.1;
  const count = Math.max(2, ...series.map((s) => s.values.length));
  const plot = Math.max(0, width - SCALE);
  const x = (i: number) => (i / (count - 1)) * plot;
  const y = (v: number) => 6 + ((hi + pad - v) / (hi - lo + 2 * pad)) * (HEIGHT - 12);
  const marks = [hi, 0, lo].filter((v, i, a) => a.findIndex((w) => Math.abs(y(w) - y(v)) < 14) === i);
  return (
    <View>
      <View style={{ height: HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="image"
        accessibilityLabel={series.map((s) => `${s.name} ${signedPct(s.values[s.values.length - 1], 1)}`).join(", ")}>
        {width > 0 ? (
          <>
            <Svg width={width} height={HEIGHT}>
              <Line x1={0} x2={plot} y1={y(0)} y2={y(0)} stroke={color.lineStrong} strokeWidth={1} />
              {series.map((s) => (
                <Path key={s.name} d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke={s.tint}
                  strokeWidth={s.wide ?? 1.5} strokeDasharray={s.dashed ? "4 3" : undefined} strokeLinejoin="round" />
              ))}
            </Svg>
            {marks.map((v) => (
              <Txt key={v} num size={10.5} tone="muted" style={{ position: "absolute", right: 0, width: SCALE - 6, textAlign: "right", top: y(v) - 7 }}>{signedPct(v, 1)}</Txt>
            ))}
          </>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, marginRight: SCALE }}>
        <Txt num size={10.5} tone="muted">{first}</Txt>
        <Txt num size={10.5} tone="muted">{last}</Txt>
      </View>
    </View>
  );
}
