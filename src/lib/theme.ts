// The portal's look: warm white on near-black, no brand colour, and green and red for a move and
// nothing else. The values are those of the site's tokens (market-hub-landing/site/src/styles/
// global.css); a change there is made here too.
export const color = {
  page: "#0b0c0d",
  deep: "#070808",
  panel: "#101213",
  raised: "#191b1d",
  line: "#222528",
  lineStrong: "#3a3e42",
  ink: "#c9c7c1",
  inkStrong: "#f2f0ea",
  muted: "#8c8b86",
  faint: "#5f5f5b",
  up: "#35c98f",
  upSoft: "rgba(53, 201, 143, 0.14)",
  down: "#ff6b57",
  downSoft: "rgba(255, 107, 87, 0.14)",
  warn: "#e0b341",
  warnSoft: "rgba(224, 179, 65, 0.12)",
} as const;

// A font file per weight: on a phone the weight is chosen by the family's name.
export const font = {
  regular: "IBMPlexSans_400Regular",
  medium: "IBMPlexSans_500Medium",
  semibold: "IBMPlexSans_600SemiBold",
  bold: "IBMPlexSans_700Bold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = 3;

// A colour per index on the chart, quiet enough to leave the holdings' line in front.
export const INDEX_COLORS: Record<string, string> = { SPY: "#8c8b86", QQQ: "#6f93c4", DIA: "#c9a45a", IWM: "#a388c9" };
