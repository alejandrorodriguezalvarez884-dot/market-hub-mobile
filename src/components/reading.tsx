// The reading of one stock: its sentence, and a gauge per aspect with what it shows under it.
// The figures are drawn at once; what analysts estimate and the fuller reading are asked for
// then, and put in when they come. The gauges are the site's own (lib/watch.ts), redrawn.
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Icon, Sparkline } from "@/components/marks";
import { Label, Track, Txt, type Tone } from "@/components/ui";
import { pct, points, price, signedPct, toneOf } from "@/lib/format";
import { color, space } from "@/lib/theme";
import { AVERAGES, EXTENSION, SPANS, STRENGTH, TREND, getRead, type Analysis, type Aspect, type Growth, type Item, type Read, type Reading } from "@/lib/watch";

type N = number | null | undefined;
const TINTS = { up: color.up, down: color.down, ink: color.inkStrong } as const;
const inPoints = (v: N) => points(v).replace(" pts", "");
const clamp = (x: number) => Math.max(0, Math.min(1, x));

// --- Marks on a scale ------------------------------------------------------------------------------

// A horizontal scale: marks placed at fractions of its width.
function Scale({ children }: { children: ReactNode }) {
  return (
    <View style={styles.scale} aria-hidden>
      <View style={styles.scaleLine} />
      {children}
    </View>
  );
}
const Dot = ({ x, tint = color.inkStrong, hollow = false }: { x: number; tint?: string; hollow?: boolean }) => (
  <View style={[styles.dot, { left: `${clamp(x) * 100}%`, borderColor: tint, backgroundColor: hollow ? color.page : tint }]} />
);
const Tick = ({ x, tint = color.muted }: { x: number; tint?: string }) => <View style={[styles.tick, { left: `${clamp(x) * 100}%`, backgroundColor: tint }]} />;
const Band = ({ from, to }: { from: number; to: number }) => (
  <View style={[styles.band, { left: `${clamp(from) * 100}%`, width: `${Math.max(0, clamp(to) - clamp(from)) * 100}%` }]} />
);

// Labels along a scale. Two that would sit on each other are moved apart.
function Labels({ items }: { items: { x: number; text: string; tint?: string }[] }) {
  const placed: { x: number; text: string; tint?: string }[] = [];
  for (const item of [...items].sort((a, b) => a.x - b.x)) {
    const before = placed.length ? placed[placed.length - 1].x : -1;
    placed.push({ ...item, x: Math.min(0.93, Math.max(item.x, before + 0.14, 0.07)) });
  }
  return (
    <View style={styles.labels} aria-hidden>
      {placed.map((item) => (
        <View key={`${item.text}:${item.x}`} style={[styles.labelAt, { left: `${item.x * 100}%` }]}>
          <Txt num size={11} style={[styles.labelText, { color: item.tint ?? color.muted }]}>{item.text}</Txt>
        </View>
      ))}
    </View>
  );
}

// A figure with what it is under it.
function Fig({ value, label, tone = "strong" }: { value: string; label: string; tone?: Tone }) {
  return (
    <View style={{ flexShrink: 1, minWidth: 0 }}>
      <Txt num size={15} tone={tone}>{value}</Txt>
      <Txt size={11.5} tone="muted" style={{ marginTop: 1, lineHeight: 15 }}>{label}</Txt>
    </View>
  );
}
const Figs = ({ children }: { children: ReactNode }) => <View style={styles.figs}>{children}</View>;
const Ends = ({ left, right, middle }: { left: string; right: string; middle?: ReactNode }) => (
  <View style={styles.ends}>
    <Txt num size={11} tone="faint">{left}</Txt>
    {middle}
    <Txt num size={11} tone="faint">{right}</Txt>
  </View>
);
const Key = ({ swatch, text }: { swatch: ReactNode; text: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
    {swatch}
    <Txt size={11} tone="faint">{text}</Txt>
  </View>
);
const strongTone = (v: N): Tone => (toneOf(v) === "ink" ? "strong" : toneOf(v));

// Rows of moves on one ruler: zero in the middle, the same scale for every cell.
function Ruler({ rows, heads, say }: { rows: { label: string; cells: N[] }[]; heads?: string[]; say: (v: N) => string }) {
  const shown = rows.filter((r) => r.cells.some((c) => c != null));
  if (!shown.length) return null;
  const width = Math.max(0.05, ...shown.flatMap((r) => r.cells.map((c) => Math.abs(c ?? 0))));
  const narrow = shown[0].cells.length > 1;
  return (
    <View style={{ gap: 3 }}>
      {heads ? (
        <View style={styles.rulerRow}>
          <View style={styles.rulerLabel} />
          {heads.map((t) => <Txt key={t} size={11} tone="muted" style={{ flex: 1 }} numberOfLines={1}>{t}</Txt>)}
        </View>
      ) : null}
      {shown.map((r) => (
        <View key={r.label} style={styles.rulerRow}>
          <Txt size={12.5} tone="muted" style={styles.rulerLabel}>{r.label}</Txt>
          {r.cells.map((c, i) => (
            <View key={i} style={styles.rulerCell}>
              <Track move={c} scale={width} />
              <Txt num size={12} tone={toneOf(c)} style={{ width: narrow ? 46 : 62, textAlign: "right" }}>{say(c)}</Txt>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// --- The gauges, one per aspect --------------------------------------------------------------------

// The gap to the 50-day average, on the scale of this stock's own gaps: the band is where it
// usually stands, so a dot outside it is a price that is extended.
function ExtensionGauge({ r }: { r: Reading }) {
  const e = r.extension!;
  const lo = Math.min(e.low, 0), hi = Math.max(e.high, 0), pad = (hi - lo) * 0.04 || 0.01;
  const x = (v: number) => (v - lo + pad) / (hi - lo + 2 * pad);
  return (
    <View>
      <Figs>
        <Fig value={signedPct(e.pct)} label="from its 50-day average" tone={strongTone(e.pct)} />
        {e.ranges != null ? <Fig value={`${Math.abs(e.ranges).toFixed(1)}×`} label="its daily range" /> : null}
        {e.percentile != null ? <Fig value={pct(e.percentile, 0)} label={`of ${e.sessions} sessions stood lower against it`} /> : null}
      </Figs>
      <View style={{ marginTop: space.md }}>
        <Scale>
          {e.band ? <Band from={x(e.band[0])} to={x(e.band[1])} /> : null}
          <Tick x={x(0)} tint={AVERAGES[1].color} />
          <Dot x={x(e.pct)} tint={TINTS[toneOf(e.pct)]} hollow={e.state.startsWith("extended")} />
        </Scale>
      </View>
      <Ends left={signedPct(e.low, 0)} right={signedPct(e.high, 0)} middle={
        <View style={{ flexDirection: "row", gap: 10 }}>
          {e.band ? <Key swatch={<View style={styles.keyBand} />} text="usual range" /> : null}
          <Key swatch={<View style={[styles.keyTick, { backgroundColor: AVERAGES[1].color }]} />} text="50-day average" />
        </View>} />
    </View>
  );
}

// The price and its three averages on one line of prices: their order is the trend.
function TrendLadder({ r }: { r: Reading }) {
  const t = r.trend!;
  type Mark = { v: number; a: (typeof AVERAGES)[number] };
  const every: { v: N; a: (typeof AVERAGES)[number] }[] = [{ v: t.sma200, a: AVERAGES[2] }, { v: t.sma50, a: AVERAGES[1] }, { v: t.sma20, a: AVERAGES[0] }];
  const marks = every.filter((m): m is Mark => m.v != null);
  const all = [...marks.map((m) => m.v), r.price];
  const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.14 || hi * 0.01;
  const x = (v: number) => (v - lo + pad) / (hi - lo + 2 * pad);
  const slope = (name: string, v: N) => (v == null ? null : (
    <Txt size={12} tone="muted">{name} <Txt num size={12} tone={toneOf(v)}>{v > 0.001 ? "↗" : v < -0.001 ? "↘" : "→"} {signedPct(v)}</Txt></Txt>
  ));
  return (
    <View>
      <Labels items={marks.map((m) => ({ x: x(m.v), text: String(m.a.sessions), tint: m.a.color }))} />
      <Scale>
        {marks.map((m) => <Tick key={m.a.sessions} x={x(m.v)} tint={m.a.color} />)}
        <Dot x={x(r.price)} />
      </Scale>
      <Labels items={[{ x: x(r.price), text: price(r.price), tint: color.inkStrong }]} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.lg, rowGap: 2, marginTop: space.sm }}>
        {slope("50-day, in a month", t.slope_50)}
        {slope("200-day", t.slope_200)}
      </View>
    </View>
  );
}

function StrengthGauge({ r, index }: { r: Reading; index: string }) {
  const s = r.strength!;
  const extreme = s.high_sessions ? `highest in ${s.high_sessions} sessions` : s.low_sessions ? `lowest in ${s.low_sessions} sessions` : null;
  return (
    <View>
      <Ruler rows={SPANS.map(([k, label]) => ({ label, cells: [s.gaps[k]] }))} say={inPoints} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.md }}>
        <Sparkline values={s.line} width={104} height={26} />
        <View style={{ flex: 1 }}>
          <Txt size={12} tone="muted">Its price over the {index}&apos;s, six months</Txt>
          {extreme ? <Txt size={12}>At its {extreme}</Txt> : null}
        </View>
      </View>
    </View>
  );
}

function MomentumGauge({ r }: { r: Reading }) {
  const m = r.momentum;
  const back: [keyof typeof m.returns, string][] = [["1w", "1W"], ["1m", "1M"], ["3m", "3M"], ["6m", "6M"], ["12m", "12M"]];
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
        <Txt num size={15} tone="strong">{m.rsi!.toFixed(0)}</Txt>
        <Txt size={11.5} tone="muted">RSI, 14 sessions</Txt>
      </View>
      <View style={{ marginTop: space.sm }}>
        <Scale>
          <Band from={0.3} to={0.7} />
          <Dot x={m.rsi! / 100} />
        </Scale>
      </View>
      <Ends left="0" right="100" middle={<Txt num size={11} tone="faint">30 – 70</Txt>} />
      <View style={styles.returns}>
        {back.map(([k, label]) => (
          <View key={k} style={styles.returnCell}>
            <Txt size={11} tone="muted">{label}</Txt>
            <Txt num size={12} tone={toneOf(m.returns[k])}>{signedPct(m.returns[k], 0)}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

function RangeGauge({ r }: { r: Reading }) {
  const g = r.range;
  return (
    <View>
      <Figs>
        <Fig value={signedPct(g.from_high)} label="from its 52-week high" />
        <Fig value={String(g.sessions_since_high)} label="sessions since that high" />
        <Fig value={signedPct(g.from_low, 0)} label="from its low" />
      </Figs>
      <View style={{ marginTop: space.md }}><Scale><Dot x={g.position!} /></Scale></View>
      <Ends left={price(g.low)} right={price(g.high)} />
    </View>
  );
}

function VolumeGauge({ r }: { r: Reading }) {
  const v = r.volume!;
  const share = v.up_down == null ? null : v.up_down / (1 + v.up_down);
  return (
    <View>
      <Figs>
        <Fig value={`${v.week_ratio.toFixed(2)}×`} label="last 5 sessions, against the 50-day average" />
        {v.up_down != null ? <Fig value={`${v.up_down.toFixed(2)}×`} label="traded on up days per share on down days" /> : null}
      </Figs>
      <View style={{ marginTop: space.md }}>
        <Scale>
          <Tick x={0.5} />
          <Dot x={Math.min(v.week_ratio, 2) / 2} />
        </Scale>
      </View>
      <Ends left="0" right="2×" middle={<Txt size={11} tone="faint">average</Txt>} />
      {share != null ? (
        <View style={styles.split} aria-hidden>
          <View style={{ width: `${share * 100}%`, backgroundColor: color.up }} />
          <View style={{ flex: 1, backgroundColor: color.down }} />
        </View>
      ) : null}
    </View>
  );
}

const growthGauge = (g: Growth) => (
  <Ruler heads={["This fiscal year", "Next fiscal year"]} say={(v) => signedPct(v)}
    rows={[{ label: "Earnings", cells: [g.eps?.year, g.eps?.next_year] }, { label: "Revenue", cells: [g.revenue?.year, g.revenue?.next_year] }]} />
);

// --- A stock's reading -----------------------------------------------------------------------------

function Block({ title, state, say, children }: { title: string; state?: string | null | false; say?: string; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Label style={{ flexShrink: 1 }}>{title}</Label>
        {state ? <StateMark text={state} /> : null}
      </View>
      {children}
      {say ? <Txt size={14} style={styles.say}>{say}</Txt> : null}
    </View>
  );
}

function StateMark({ text, figure, tone }: { text: string; figure?: string; tone?: Tone }) {
  return (
    <View style={styles.state}>
      <Txt size={11.5}>{text}{figure ? <Txt num size={11.5} tone={tone}> {figure}</Txt> : null}</Txt>
    </View>
  );
}

// What a stock is doing at a glance: a few words per aspect.
export function StateMarks({ item }: { item: Item }) {
  const r = item.reading;
  if (!r) return null;
  const gap = r.strength?.gaps["3m"];
  return (
    <View style={styles.states}>
      {r.extension ? <StateMark text={EXTENSION[r.extension.state].replace(" its average", " 50-day")} figure={signedPct(r.extension.pct, 0)} tone={toneOf(r.extension.pct)} /> : null}
      {r.trend ? <StateMark text={TREND[r.trend.state]} /> : null}
      {gap != null ? <StateMark text="vs S&P 500, 3M" figure={inPoints(gap)} tone={toneOf(gap)} /> : null}
    </View>
  );
}

export function ReadingCard({ item, index }: { item: Item; index: string }) {
  const [read, setRead] = useState<Read | null>(null);
  useEffect(() => {
    let alive = true;
    getRead(item.ticker).then((found) => alive && setRead(found)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [item.ticker]);

  const r = item.reading;
  if (!r) return <Txt size={13} tone="muted">No prices for {item.ticker} right now.</Txt>;
  // The model's sentence for an aspect where it wrote one; the code's otherwise.
  const first: Analysis | null = read?.analysis ?? null, second: Analysis = read?.captions ?? item.analysis;
  const of = (a: Analysis | null, aspect: Aspect) => a?.points.find((x) => x.aspect === aspect)?.text;
  const say = (aspect: Aspect) => of(first, aspect) ?? of(second, aspect);
  const s = item.sector_strength, v = item.valuation, g = read?.growth ?? null;
  const growth = g ? growthGauge(g) : null;
  const valued = v && (v.pe != null || v.forward_pe != null || v.days_to_results != null);

  return (
    <View>
      <Txt size={19} weight="medium" tone="strong" style={{ lineHeight: 26, letterSpacing: -0.2 }}>{first?.headline || second.headline}</Txt>
      {first?.contrast ? (
        <View style={styles.contrast}>
          <Icon name="contrast" size={16} />
          <Txt size={14} style={{ flex: 1, lineHeight: 21 }}>{first.contrast}</Txt>
        </View>
      ) : null}
      <View style={{ marginTop: space.lg }}>
        {r.extension ? <Block title="Price and its 50-day average" state={EXTENSION[r.extension.state]} say={say("extension")}><ExtensionGauge r={r} /></Block> : null}
        {r.trend ? <Block title="Trend" state={TREND[r.trend.state]} say={say("trend")}><TrendLadder r={r} /></Block> : null}
        {r.strength ? <Block title={`Against the ${index}, in points`} state={STRENGTH[r.strength.state]} say={say("strength")}><StrengthGauge r={r} index={index} /></Block> : null}
        {s?.against_market ? (
          <Block title={`Sector: ${s.name}`} state={STRENGTH[s.against_market.state]} say={say("sector")}>
            <Ruler heads={["Sector vs index", `${item.ticker} vs sector`]} say={inPoints}
              rows={SPANS.map(([k, label]) => ({ label, cells: [s.against_market!.gaps[k], s.stock?.gaps[k]] }))} />
          </Block>
        ) : null}
        {r.momentum.rsi != null ? <Block title="Momentum" say={say("momentum")}><MomentumGauge r={r} /></Block> : null}
        {r.range.position != null ? <Block title="52-week range" say={say("range")}><RangeGauge r={r} /></Block> : null}
        {r.volume ? <Block title="Volume" say={say("volume")}><VolumeGauge r={r} /></Block> : null}
        {growth ? <Block title="Growth, by analysts' consensus" state={g?.analysts ? `${g.analysts} analysts` : null} say={say("growth")}>{growth}</Block> : null}
        {valued ? (
          <Block title="Price to earnings" say={say("valuation")}>
            <Figs>
              {v.pe != null ? <Fig value={`${v.pe.toFixed(1)}×`} label="its earnings of the last 12 months" /> : null}
              {v.forward_pe != null ? <Fig value={`${v.forward_pe.toFixed(1)}×`} label="the estimate for next year" /> : null}
              {v.days_to_results != null ? <Fig value={v.days_to_results ? `${v.days_to_results} days` : "Today"} label="to its next results" /> : null}
            </Figs>
          </Block>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scale: { height: 14, justifyContent: "center" },
  scaleLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: color.lineStrong },
  dot: { position: "absolute", width: 10, height: 10, marginLeft: -5, borderRadius: 5, borderWidth: 1.5 },
  tick: { position: "absolute", width: 2, height: 12, marginLeft: -1 },
  band: { position: "absolute", height: 6, borderRadius: 3, backgroundColor: color.lineStrong, opacity: 0.7 },
  labels: { height: 16 },
  labelAt: { position: "absolute", width: 0, alignItems: "center" },
  labelText: { width: 70, textAlign: "center" },
  figs: { flexDirection: "row", flexWrap: "wrap", columnGap: space.xl, rowGap: space.sm },
  ends: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm, marginTop: 4 },
  keyBand: { width: 12, height: 5, borderRadius: 3, backgroundColor: color.lineStrong },
  keyTick: { width: 2, height: 10 },
  rulerRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  rulerLabel: { width: 72 },
  rulerCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  returns: { flexDirection: "row", marginTop: space.md, borderWidth: 1, borderColor: color.line, borderRadius: 2 },
  returnCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  split: { flexDirection: "row", height: 5, gap: 1, borderRadius: 3, overflow: "hidden", marginTop: space.md },
  block: { borderTopWidth: 1, borderTopColor: color.line, paddingVertical: space.lg },
  blockHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, marginBottom: space.md },
  say: { marginTop: space.md, lineHeight: 21 },
  state: { borderWidth: 1, borderColor: color.lineStrong, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 1 },
  states: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  contrast: { flexDirection: "row", gap: space.sm, marginTop: space.md, alignItems: "flex-start" },
});
