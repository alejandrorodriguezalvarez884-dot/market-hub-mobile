// Every stock as a dot: across, how far its price is from its 50-day average, in daily ranges;
// up, how many points it is ahead of the index over three months. A ring marks a price that is
// extended by the stock's own standard.
import { useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";

import { Txt } from "@/components/ui";
import { points } from "@/lib/format";
import { color, font } from "@/lib/theme";
import { EXTENSION, type Item } from "@/lib/watch";

export function ListMap({ items, index, onPick }: { items: Item[]; index: string; onPick: (item: Item) => void }) {
  const [W, setW] = useState(0);
  const placed: { item: Item; x: number; y: number }[] = [], off: string[] = [];
  for (const item of items) {
    const x = item.reading?.extension?.ranges, y = item.reading?.strength?.gaps["3m"];
    if (x == null || y == null) off.push(item.ticker);
    else placed.push({ item, x, y });
  }
  if (!placed.length) return <Txt size={13} tone="muted" style={{ paddingVertical: 32, textAlign: "center" }}>Nothing to place on the map yet.</Txt>;
  const across = Math.min(8, Math.max(3, Math.ceil(Math.max(...placed.map((p) => Math.abs(p.x))))));
  const up = Math.min(0.6, Math.max(0.1, Math.ceil(Math.max(...placed.map((p) => Math.abs(p.y))) / 0.05) * 0.05));
  const H = Math.round(Math.min(460, Math.max(320, W * 0.95)));
  const m = { l: 34, r: 12, t: 26, b: 40 };
  const px = (v: number) => m.l + ((Math.max(-across, Math.min(across, v)) + across) / (2 * across)) * (W - m.l - m.r);
  const py = (v: number) => m.t + (1 - (Math.max(-up, Math.min(up, v)) + up) / (2 * up)) * (H - m.t - m.b);
  const columns = Array.from({ length: 2 * across + 1 }, (_, i) => i - across);
  const ringed = placed.some((p) => p.item.reading!.extension!.state.startsWith("extended"));
  const words = { fontFamily: font.mono, fontSize: 11, fill: color.faint };
  const dots = [...placed].sort((a, b) => Math.hypot(b.x / across, b.y / up) - Math.hypot(a.x / across, a.y / up)).map((p) => {
    const cx = px(p.x), cy = py(p.y);
    return { ...p, cx, cy, left: cx > W - 64, extended: p.item.reading!.extension!.state.startsWith("extended") };
  });

  return (
    <View>
      <View style={{ height: H }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
        {W > 0 ? (
          <Svg width={W} height={H}>
            {columns.map((i) => (
              <G key={`c${i}`}>
                {i ? <Line x1={px(i)} x2={px(i)} y1={m.t} y2={H - m.b} stroke={color.line} strokeDasharray="2 4" /> : null}
                {i % (across > 4 ? 2 : 1) === 0 ? <SvgText x={px(i)} y={H - m.b + 14} textAnchor="middle" {...words}>{i > 0 ? `+${i}` : String(i).replace("-", "−")}</SvgText> : null}
              </G>
            ))}
            {[-up, -up / 2, up / 2, up].map((v) => (
              <G key={`r${v}`}>
                <Line x1={m.l} x2={W - m.r} y1={py(v)} y2={py(v)} stroke={color.line} strokeDasharray="2 4" />
                <SvgText x={m.l - 6} y={py(v) + 4} textAnchor="end" {...words}>{`${v > 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(0)}`}</SvgText>
              </G>
            ))}
            <Line x1={px(0)} x2={px(0)} y1={m.t} y2={H - m.b} stroke={color.lineStrong} />
            <Line x1={m.l} x2={W - m.r} y1={py(0)} y2={py(0)} stroke={color.lineStrong} />
            <SvgText x={m.l} y={m.t - 12} fontFamily={font.regular} fontSize={11.5} fill={color.muted}>{`Points against the ${index}, 3 months`}</SvgText>
            <SvgText x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle" fontFamily={font.regular} fontSize={11.5} fill={color.muted}>Daily ranges from the 50-day average</SvgText>
            {/* Those nearest the middle are drawn last, so their names are not covered. */}
            {dots.map((p) => (
              <G key={p.item.ticker}>
                {p.extended ? <Circle cx={p.cx} cy={p.cy} r={10} fill="none" stroke={color.inkStrong} strokeWidth={1} /> : null}
                <Circle cx={p.cx} cy={p.cy} r={5} fill={color.inkStrong} />
                <SvgText x={p.cx + (p.left ? -13 : 13)} y={p.cy + 4} textAnchor={p.left ? "end" : "start"} fontFamily={font.mono} fontSize={12} fill={color.ink}>{p.item.ticker}</SvgText>
              </G>
            ))}
          </Svg>
        ) : null}
        {/* What is touched is a square over each dot, larger than the dot. */}
        {W > 0 ? dots.map((p) => (
          <Pressable key={p.item.ticker} onPress={() => onPick(p.item)} accessibilityRole="button"
            accessibilityLabel={`${p.item.ticker}: ${EXTENSION[p.item.reading!.extension!.state]}, ${points(p.y)} against the index`}
            style={{ position: "absolute", left: p.cx - 20, top: p.cy - 20, width: 40, height: 40 }} />
        )) : null}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 16, rowGap: 4, marginTop: 4 }}>
        {ringed ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: color.inkStrong }} />
            <Txt size={12} tone="muted">Extended from its 50-day average</Txt>
          </View>
        ) : null}
        {off.length ? <Txt size={12} tone="muted">Not on the map: {off.join(", ")}.</Txt> : null}
      </View>
      <Txt size={12} tone="faint" style={{ marginTop: 6 }}>Touch a dot to open that stock.</Txt>
    </View>
  );
}
