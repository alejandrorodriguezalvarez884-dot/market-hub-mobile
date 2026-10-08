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

// Google's own mark, in its own colours, as its sign-in button asks for.
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </Svg>
    </View>
  );
}

// How a news item reads, drawn with the portal's own mark (the site's lib/news.ts): right of the
// line is bullish, left of it is bearish, on it is neutral.
export function ToneMark({ sentiment }: { sentiment: "bullish" | "bearish" | "neutral" }) {
  const side = sentiment === "bullish" ? 1 : sentiment === "bearish" ? -1 : 0;
  const tint = side > 0 ? color.up : side < 0 ? color.down : color.muted;
  return (
    <View aria-hidden>
      <Svg width={22} height={12} viewBox="0 0 22 12" fill="none">
        <Path d={`M11 1v10${side ? `M11 6h${side * 6}` : ""}`} stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={11 + side * 7.5} cy={6} r={2.6} fill={tint} />
      </Svg>
    </View>
  );
}

// The marks of the site's own menu (market-hub-landing/site/src/components/App.astro), and a few more.
const ICONS = {
  overview: "M3 13h6V3H3v10Zm0 8h6v-6H3v6Zm8 0h10V11H11v10Zm0-18v6h10V3H11Z",
  portfolio: "M4 7h16v12H4zM9 7V5h6v2",
  analysis: "M12 3a9 9 0 1 0 9 9h-9V3Zm3 .5A9 9 0 0 1 20.5 9H15V3.5Z",
  watchlist: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  community: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0m1.5-5.5A6 6 0 0 1 22 20",
  tools: "M4 19V9m6 10V5m6 14v-7m4 7H2",
  earnings: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  markets: "M3 17l6-6 4 4 8-8M15 7h6v6",
  news: "M4 5h13v14H6a2 2 0 0 1-2-2V5Zm13 4h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5",
  opinion: "M4 5h16v11H9l-5 4V5Zm4 4h8M8 12h5",
  media: "M3 6h18v12H3zM10 9.5v5l4.5-2.5-4.5-2.5Z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  chevron: "M9 5l7 7-7 7",
  out: "M14 5h5v5M19 5l-8 8M11 7H6v11h11v-5",
  contrast: "M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20",
  close: "M6 6l12 12M18 6 6 18",
} as const;

// A few strokes in the manner of the site's own marks.
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, tint = color.muted }: { name: IconName; size?: number; tint?: ColorValue }) {
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={ICONS[name]} stroke={tint} strokeWidth={name === "more" ? 2.6 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
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
