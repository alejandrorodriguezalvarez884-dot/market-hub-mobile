// The small drawings: the portal's mark, the tab bar's icons, a sparkline, a share of a whole.
// They say nothing a screen reader needs: the words and figures next to them do.
import { View, type ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { pct } from "@/lib/format";
import { color } from "@/lib/theme";

// The mark is the portal's own figure: a zero line and a move to its right.
export function Logo({ size = 20, tint = color.inkStrong }: { size?: number; tint?: string }) {
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Path d="M4 2v16M4 10h8" stroke={tint} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={14.5} cy={10} r={2.75} fill={tint} />
      </Svg>
    </View>
  );
}

const ICONS = {
  overview: "M3 17l5-5 4 3 9-9M15 6h6v6",
  portfolio: "M4 6h16M4 12h16M4 18h10",
  account: "M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20",
  close: "M6 6l12 12M18 6 6 18",
} as const;

// A few strokes in the manner of the site's own marks.
export function Icon({ name, size = 22, tint = color.muted }: { name: keyof typeof ICONS; size?: number; tint?: ColorValue }) {
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={ICONS[name]} stroke={tint} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// One thin line, coloured by whether the period ended up or down, with the last point marked. Its
// numbers are in the row next to it, so it carries no axis.
export function Sparkline({ values, width = 64, height = 26 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <View style={{ width, height }} />;
  const lo = Math.min(...values), hi = Math.max(...values);
  const x = (i: number) => 2 + (i / (values.length - 1)) * (width - 4);
  const y = (v: number) => 2 + (hi === lo ? (height - 4) / 2 : ((hi - v) / (hi - lo)) * (height - 4));
  const tint = values[values.length - 1] >= values[0] ? color.up : color.down;
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <View aria-hidden>
      <Svg width={width} height={height}>
        <Path d={d} fill="none" stroke={tint} strokeWidth={1.25} strokeLinejoin="round" />
        <Circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={2.25} fill={tint} />
      </Svg>
    </View>
  );
}

// A share of the whole: a line as long as the share.
export function ShareBar({ weight }: { weight: number | null | undefined }) {
  return (
    <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: color.raised, overflow: "hidden" }}>
      <View style={{ height: "100%", borderRadius: 3, backgroundColor: color.inkStrong, width: `${Math.max(1.5, Math.min(100, (weight ?? 0) * 100))}%` }} />
    </View>
  );
}

// The parts of a whole on one line, the largest first and the lightest last.
export function StackedBar({ parts }: { parts: { label: string; weight: number }[] }) {
  return (
    <View style={{ flexDirection: "row", height: 12, gap: 1, borderRadius: 2, overflow: "hidden" }}
      accessibilityRole="image" accessibilityLabel={parts.map((p) => `${p.label} ${pct(p.weight, 0)}`).join(", ")}>
      {parts.map((p, i) => (
        <View key={p.label} style={{ flexGrow: p.weight, flexBasis: 0, backgroundColor: color.inkStrong,
          opacity: Math.max(0.16, 1 - i * (0.84 / Math.max(1, parts.length - 1)) * 0.92) }} />
      ))}
    </View>
  );
}
