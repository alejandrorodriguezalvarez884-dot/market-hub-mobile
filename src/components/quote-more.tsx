// What a stock's or a fund's screen shows under its reading, as the portal's quote page does
// (market-hub-landing/site/src/pages/quote.astro): its past against the S&P 500, its calendar
// years and its falls from the high; for a company, its income statements, its business and its
// numbers; for a fund, what it holds and what it costs. All of it from /api/public/quote/more.
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { ReturnsChart } from "@/components/returns-chart";
import { Section, Txt, WordTabs, type Tone } from "@/components/ui";
import { api } from "@/lib/api";
import { compact, count, money, mult, num, pct, shortDate, signedPct, tidyName, type N } from "@/lib/format";
import { openPage } from "@/lib/hub";
import { color, space } from "@/lib/theme";
import type { CompanyFacts, Fund, History, QuoteMore, QuotePeriod, Weight } from "@/lib/types";

const ok = (v: N): v is number => typeof v === "number" && Number.isFinite(v);
const tone = (v: N): Tone => (!ok(v) || v === 0 ? "strong" : v > 0 ? "up" : "down");
// One colour for the stock, one for the S&P 500; one for revenue, one for earnings: as on the site.
const SELF = color.inkStrong;
const BENCH = "#8c8b86";
const REVENUE = "#6f93c4";
const EARNINGS = "#c9a45a";
const MIX = [color.inkStrong, "#6f93c4", "#c9a45a", "#a388c9", color.up, "#8c8b86"];

const month = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

// Asked once per ticker in a run of the app, however many times its screen opens.
const asked = new Map<string, Promise<QuoteMore>>();
function getMore(ticker: string): Promise<QuoteMore> {
  if (!asked.has(ticker)) asked.set(ticker, api<QuoteMore>(`/api/public/quote/more?t=${encodeURIComponent(ticker)}`).catch((e) => (asked.delete(ticker), Promise.reject(e))));
  return asked.get(ticker)!;
}

export function QuoteMoreSections({ ticker }: { ticker: string }) {
  const [more, setMore] = useState<QuoteMore | null>(null);
  useEffect(() => {
    let alive = true;
    // Without it the screen stands as it was: nothing is said.
    getMore(ticker).then((m) => alive && setMore(m)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [ticker]);
  if (!more) return null;
  return (
    <>
      {more.history ? (
        <>
          <Versus ticker={ticker} hist={more.history} />
          <Years ticker={ticker} hist={more.history} />
          <Falls hist={more.history} />
        </>
      ) : null}
      {more.company ? <CompanyParts c={more.company} fin={more.financials} /> : null}
      {more.fund ? <FundParts f={more.fund} type={more.fund_type ?? "Fund"} /> : null}
    </>
  );
}

// --- the past ------------------------------------------------------------------------------------

const SPANS = { "1Y": 252, "3Y": 756, "5Y": 1260 } as const;
type Span = keyof typeof SPANS;
const POINTS = 240; // a line on a phone needs no more

function every<T>(values: T[]): T[] {
  const step = Math.max(1, Math.ceil(values.length / POINTS));
  return values.filter((_, i) => i % step === 0 || i === values.length - 1);
}

function Versus({ ticker, hist }: { ticker: string; hist: History }) {
  const spans = (Object.keys(SPANS) as Span[]).filter((s, i) => !i || hist.dates.length > SPANS[s] * 0.8);
  const [span, setSpan] = useState<Span>(spans.includes("5Y") ? "5Y" : spans[spans.length - 1]);
  const n = Math.min(hist.dates.length, SPANS[span] + 1);
  const dates = hist.dates.slice(-n), mine = hist.closes.slice(-n);
  const bench = hist.benchmark_closes?.slice(-n) ?? null;
  const b0 = bench?.find(ok) ?? null;
  const series = [
    ...(bench && b0 ? [{ name: "S&P 500", values: every(bench.map((c) => (ok(c) ? c / b0 - 1 : 0))), tint: BENCH, wide: 1.25 }] : []),
    { name: ticker, values: every(mine.map((c) => c / mine[0] - 1)), tint: SELF, wide: 1.75 },
  ];
  const end = (i: number) => series[i].values[series[i].values.length - 1];
  const gap = series.length > 1 ? end(1) - end(0) : null;
  return (
    <Section title={hist.benchmark ? "Against the S&P 500" : "Over the years"}
      note={`Price only, without dividends.${ok(gap) ? ` ${ticker} is ${gap >= 0 ? "ahead of" : "behind"} the S&P 500 by ${(Math.abs(gap) * 100).toFixed(1)} percentage points since ${shortDate(dates[0])}.` : ""}`}>
      <View style={{ marginBottom: space.md }}>
        <WordTabs items={spans.map((k) => ({ key: k, label: k === "1Y" ? "1 year" : `${SPANS[k] / 252} years` }))} value={span} onChange={setSpan} />
      </View>
      <Legend items={[...series].reverse().map((s) => ({ name: s.name, tint: s.tint, value: signedPct(s.values[s.values.length - 1]), tone: tone(s.values[s.values.length - 1]) }))} />
      <ReturnsChart series={series} first={shortDate(dates[0])} last={shortDate(dates[dates.length - 1])} />
    </Section>
  );
}

function Years({ ticker, hist }: { ticker: string; hist: History }) {
  const ys = hist.years.slice(-5);
  if (ys.length < 2) return null;
  const last = ys[ys.length - 1];
  return (
    <Section title="Year by year" note="Price return in each calendar year.">
      <Columns series={[{ name: ticker, tint: SELF }, ...(hist.benchmark ? [{ name: "S&P 500", tint: BENCH }] : [])]} format={(v) => signedPct(v, 0)}
        groups={ys.map((y) => ({ label: String(y.year), note: y.partial ? (y === last ? "to date" : "in part") : undefined,
          values: hist.benchmark ? [y.return, y.benchmark] : [y.return] }))} />
    </Section>
  );
}

const FALL_HEIGHT = 140;

// How far below its highest close so far each close stood: zero at a new high.
function belowHigh(closes: number[]): number[] {
  let peak = -Infinity;
  return closes.map((c) => ((peak = Math.max(peak, c)), c / peak - 1));
}

function Falls({ hist }: { hist: History }) {
  const [width, setWidth] = useState(0);
  const n = Math.min(hist.closes.length, SPANS["5Y"] + 1);
  const depths = every(belowHigh(hist.closes.slice(-n)));
  const lo = Math.min(...depths, -0.01);
  const x = (i: number) => (i / Math.max(1, depths.length - 1)) * width;
  const y = (v: number) => (v / lo) * (FALL_HEIGHT - 4);
  const line = depths.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const r = hist.risk, dd = r.max_drawdown, bd = r.benchmark_max_drawdown;
  return (
    <Section title="Falls from its high" note="How far below its highest close so far, each day of the last five years.">
      <View style={{ height: FALL_HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="image"
        accessibilityLabel={dd ? `Deepest fall ${pct(dd.depth)}` : "Falls from its high"}>
        {width > 0 ? (
          <Svg width={width} height={FALL_HEIGHT}>
            <Path d={`${line} L${width},0 L0,0 Z`} fill={color.downSoft} />
            <Path d={line} fill="none" stroke={color.down} strokeWidth={1.25} strokeLinejoin="round" />
            <Line x1={0} x2={width} y1={0.5} y2={0.5} stroke={color.lineStrong} strokeWidth={1} />
          </Svg>
        ) : null}
      </View>
      <View style={{ marginTop: space.md }}>
        <Figures rows={[
          ["Deepest fall", dd ? `${pct(dd.depth)} · ${month(dd.peak)} → ${month(dd.trough)}` : null, "down"],
          ["S&P 500's deepest fall", bd ? `${pct(bd.depth)} · ${month(bd.peak)} → ${month(bd.trough)}` : null, "muted"],
          ["Volatility, last year", ok(r.volatility_1y) ? `${pct(r.volatility_1y)}${ok(r.benchmark_volatility_1y) ? ` (S&P 500 ${pct(r.benchmark_volatility_1y)})` : ""}` : null],
          ["Beta to the S&P 500, last year", ok(r.beta_1y) ? num(r.beta_1y, 2) : null],
          ["Best day, last year", r.best_day ? `${signedPct(r.best_day.return)} · ${shortDate(r.best_day.date)}` : null, "up"],
          ["Worst day, last year", r.worst_day ? `${signedPct(r.worst_day.return)} · ${shortDate(r.worst_day.date)}` : null, "down"],
          ["Days it closed up, last year", ok(r.up_days_1y) ? pct(r.up_days_1y, 0) : null],
        ]} />
      </View>
    </Section>
  );
}

// --- a company ----------------------------------------------------------------------------------

type Accounts = { annual: QuotePeriod[]; quarterly: QuotePeriod[] };
const quarter = (end: string) => new Date(`${end}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" ", " '");

function Statements({ fin }: { fin: Accounts }) {
  const views = (["annual", "quarterly"] as const).filter((k) => fin[k].length);
  const [view, setView] = useState<keyof Accounts>(views[0] ?? "annual");
  if (!views.length) return null;
  return (
    <Section title="Revenue and earnings" note="From the company's income statements. The margin is net income over revenue.">
      <View style={{ marginBottom: space.md }}>
        <WordTabs items={views.map((k) => ({ key: k, label: k === "annual" ? "Years" : "Quarters" }))} value={view} onChange={setView} />
      </View>
      <Columns series={[{ name: "Revenue", tint: REVENUE }, { name: "Net income", tint: EARNINGS }]} format={(v) => money(v, Math.abs(v) >= 1e11 ? 0 : 1)}
        groups={fin[view].slice(-4).map((p) => ({
          label: view === "annual" ? `FY${p.end.slice(0, 4)}` : quarter(p.end),
          note: p.revenue && ok(p.net_income) ? `${pct(p.net_income / p.revenue, 0)} margin` : undefined,
          values: [p.revenue, p.net_income] }))} />
    </Section>
  );
}

function About({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Txt size={14} style={{ lineHeight: 21 }} numberOfLines={open ? undefined : 5}>{text}</Txt>
      {text.length > 300 ? (
        <Pressable onPress={() => setOpen(!open)} hitSlop={8} accessibilityRole="button" style={{ marginTop: space.sm }}>
          <Txt size={13} tone="muted">{open ? "Show less" : "Read more"}</Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

function CompanyParts({ c, fin }: { c: CompanyFacts; fin?: Accounts }) {
  const place = [c.city, c.state, c.country].filter(Boolean).join(", ");
  const site = /^https?:\/\//.test(c.website) ? c.website : null;
  const facts: [string, string][] = ([["Sector", c.sector], ["Industry", c.industry], ["Employees", c.employees ? count(c.employees) : ""],
    ["Headquarters", place], ["Next results", c.next_results ? shortDate(c.next_results) : ""]] as [string, string][]).filter(([, v]) => v);
  const v = c.valuation, p = c.profitability, g = c.growth, h = c.health, o = c.ownership, d = c.dividends;
  return (
    <>
      {fin ? <Statements fin={fin} /> : null}
      <Section title="The company">
        {c.summary ? <About text={c.summary} /> : null}
        <View style={styles.facts}>
          {facts.map(([k, val]) => (
            <View key={k} style={styles.fact}>
              <Txt size={12} tone="muted">{k}</Txt>
              <Txt size={14} tone="strong" numberOfLines={1}>{val}</Txt>
            </View>
          ))}
          {site ? (
            <Pressable style={styles.fact} onPress={() => openPage(site)} accessibilityRole="link">
              <Txt size={12} tone="muted">Website</Txt>
              <Txt size={14} tone="strong" numberOfLines={1}>{site.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</Txt>
            </Pressable>
          ) : null}
        </View>
      </Section>
      <Section title="The numbers" note="As Yahoo Finance reports them.">
        <View style={{ gap: space.xl }}>
          <Figures title="Valuation" rows={[["P/E, trailing", ok(v.pe) ? num(v.pe, 1) : null], ["P/E, forward", ok(v.forward_pe) ? num(v.forward_pe, 1) : null],
            ["Price to sales", mult(v.ps)], ["Price to book", mult(v.pb)], ["EV to EBITDA", mult(v.ev_ebitda)], ["Enterprise value", money(v.enterprise_value)]]} />
          <Figures title="Margins and growth" rows={[["Gross margin", pct(p.gross_margin)], ["Operating margin", pct(p.operating_margin)],
            ["Net margin", pct(p.net_margin)], ["Return on equity", pct(p.roe)], ["Return on assets", pct(p.roa)],
            ["Revenue growth, last quarter", signedPct(g.revenue), tone(g.revenue)], ["Earnings growth, last quarter", signedPct(g.earnings), tone(g.earnings)]]} />
          <Figures title="Balance sheet and cash" rows={[["Revenue, last 12 months", money(h.revenue)], ["EBITDA", money(h.ebitda)],
            ["Free cash flow", money(h.free_cash_flow)], ["Cash", money(h.cash)], ["Debt", money(h.debt)], ["Debt to equity", mult(h.debt_to_equity, 2)],
            ["Current ratio", ok(h.current_ratio) ? num(h.current_ratio, 2) : null]]} />
          <Figures title="Owners and dividends" rows={[["Held by insiders", pct(o.insiders)], ["Held by institutions", pct(o.institutions)],
            ["Short, of the float", pct(o.short_of_float)], ["Shares outstanding", compact(o.shares)],
            ["Dividend a share, a year", d.rate ? `$${d.rate.toFixed(2)}` : null], ["Payout ratio", d.payout_ratio ? pct(d.payout_ratio, 0) : null],
            ["Ex-dividend date", d.ex_date ? shortDate(d.ex_date) : null], ["Average yield, 5 years", d.five_year_avg_yield ? pct(d.five_year_avg_yield, 2) : null]]} />
        </View>
      </Section>
    </>
  );
}

// --- a fund -------------------------------------------------------------------------------------

function FundParts({ f, type }: { f: Fund; type: string }) {
  return (
    <>
      {f.holdings.length ? (
        <Section title="Top holdings" note={ok(f.holdings_weight) ? `The top ${f.holdings.length} are ${pct(f.holdings_weight, 0)} of the fund.` : undefined}>
          <Weights items={f.holdings.map((x) => ({ name: tidyName(x.name), weight: x.weight, tag: x.label,
            open: x.symbol ? () => router.push({ pathname: "/stock/[ticker]", params: { ticker: x.symbol! } }) : undefined }))} />
        </Section>
      ) : null}
      {f.sectors.length ? <Section title="Sectors"><Weights items={f.sectors} /></Section> : null}
      <Section title={type === "ETF" ? "The ETF" : "The fund"}>
        <View style={{ gap: space.xl }}>
          <Figures title="What it is" rows={[["Type", f.legal_type || type], ["Family", f.family], ["Category", f.category],
            ["Started", f.inception ? shortDate(f.inception) : null], ["Beta, 3 years", ok(f.beta_3y) ? num(f.beta_3y, 2) : null]]} />
          <Figures title="What it costs and returns" rows={[["Expense ratio, a year", ok(f.expense_ratio) ? pct(f.expense_ratio, 2) : null],
            ["Net assets", money(f.assets)], ["Yield", ok(f.yield) ? pct(f.yield, 2) : null], ["Net asset value", f.nav ? `$${f.nav.toFixed(2)}` : null],
            ["Total return, 3 years, a year on average", signedPct(f.return_3y), tone(f.return_3y)],
            ["Total return, 5 years, a year on average", signedPct(f.return_5y), tone(f.return_5y)]]} />
          {f.asset_mix.length ? <View><Txt size={13} weight="medium" tone="strong" style={{ marginBottom: space.sm }}>What it holds</Txt><Mix items={f.asset_mix} /></View> : null}
          {f.summary ? <View><Txt size={13} weight="medium" tone="strong" style={{ marginBottom: space.sm }}>What it does</Txt><About text={f.summary} /></View> : null}
        </View>
      </Section>
    </>
  );
}

// --- the pieces ---------------------------------------------------------------------------------

function Legend({ items }: { items: { name: string; tint: string; value?: string; tone?: Tone }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((i) => (
        <View key={i.name} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: i.tint }]} />
          <Txt size={12.5} tone="muted">{i.name}</Txt>
          {i.value ? <Txt num size={12.5} tone={i.tone ?? "strong"}>{i.value}</Txt> : null}
        </View>
      ))}
    </View>
  );
}

// A list of figures under a small heading; a row with nothing to show is left out, and so is a list with none.
type Row = [label: string, value: string | null | undefined, tone?: Tone];
function Figures({ title, rows }: { title?: string; rows: Row[] }) {
  const shown = rows.filter(([, v]) => v && v !== "—");
  if (!shown.length) return null;
  return (
    <View>
      {title ? <Txt size={13} weight="medium" tone="strong" style={{ marginBottom: 2 }}>{title}</Txt> : null}
      {shown.map(([label, v, t], i) => (
        <View key={label} style={[styles.row, i > 0 && styles.rowRule]}>
          <Txt size={13} tone="muted" style={{ flexShrink: 1 }}>{label}</Txt>
          <Txt num size={12.5} tone={t ?? "strong"} style={{ flexShrink: 1, textAlign: "right" }}>{v}</Txt>
        </View>
      ))}
    </View>
  );
}

type Group = { label: string; note?: string; values: N[] };
const COLUMNS_HEIGHT = 150;

// Columns side by side for a few periods, one colour per series, zero as a line and a fall below it.
function Columns({ groups, series, format }: { groups: Group[]; series: { name: string; tint: string }[]; format: (v: number) => string }) {
  const all = groups.flatMap((g) => g.values).filter(ok);
  const hi = Math.max(0, ...all), lo = Math.min(0, ...all);
  const span = hi - lo || 1;
  const zero = (hi / span) * COLUMNS_HEIGHT;
  const label = 16; // room for a figure over (or under) its column
  return (
    <View>
      <Legend items={series} />
      <View style={{ height: COLUMNS_HEIGHT + label * 2, flexDirection: "row", gap: space.sm, marginTop: space.sm }}>
        <View style={[styles.zero, { top: label + zero }]} />
        {groups.map((g) => (
          <View key={g.label} style={{ flex: 1, flexDirection: "row", justifyContent: "center", gap: 3 }}>
            {g.values.map((v, i) => {
              if (!ok(v)) return <View key={i} style={{ flex: 1, maxWidth: 30 }} />;
              const size = Math.max((Math.abs(v) / span) * COLUMNS_HEIGHT, 1);
              const top = label + (v >= 0 ? zero - size : zero);
              return (
                <View key={i} style={{ flex: 1, maxWidth: 30 }} accessibilityLabel={`${g.label}, ${series[i].name}: ${format(v)}`}>
                  <View style={{ position: "absolute", left: 0, right: 0, top, height: size, borderRadius: 2, backgroundColor: series[i].tint }} />
                  <Txt num size={9.5} tone="ink" numberOfLines={1} style={{ position: "absolute", left: -8, right: -8, textAlign: "center",
                    top: v >= 0 ? top - 14 : top + size + 2 }}>{format(v)}</Txt>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        {groups.map((g) => (
          <View key={g.label} style={{ flex: 1, alignItems: "center" }}>
            <Txt num size={11.5} numberOfLines={1}>{g.label}</Txt>
            {g.note ? <Txt size={10.5} tone="faint" numberOfLines={1}>{g.note}</Txt> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

// Shares of a whole, largest first: a name, a bar and a percent. A holding with a page here opens it.
function Weights({ items }: { items: (Weight & { tag?: string; open?: () => void })[] }) {
  const max = Math.max(...items.map((i) => i.weight), 0.0001);
  return (
    <View style={{ gap: 10 }}>
      {items.map((i) => {
        const body = (
          <>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
              {i.tag ? <Txt num size={12} tone="muted">{i.tag}</Txt> : null}
              <Txt size={13.5} tone={i.open ? "strong" : "ink"} numberOfLines={1} style={{ flex: 1 }}>{i.name}</Txt>
              <Txt num size={12.5} tone="strong">{pct(i.weight)}</Txt>
            </View>
            <View style={styles.bar}><View style={[styles.barFill, { width: `${(i.weight / max) * 100}%` }]} /></View>
          </>
        );
        return i.open ? (
          <Pressable key={i.name + (i.tag ?? "")} onPress={i.open} accessibilityRole="link" style={({ pressed }) => pressed && { opacity: 0.6 }}>{body}</Pressable>
        ) : <View key={i.name + (i.tag ?? "")}>{body}</View>;
      })}
    </View>
  );
}

// One bar split into what a fund holds.
function Mix({ items }: { items: Weight[] }) {
  return (
    <View>
      <View style={styles.mix}>
        {items.map((i, k) => <View key={i.name} style={{ width: `${i.weight * 100}%`, backgroundColor: MIX[k % MIX.length] }} />)}
      </View>
      <View style={[styles.legend, { marginTop: space.sm }]}>
        {items.map((i, k) => (
          <View key={i.name} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: MIX[k % MIX.length] }]} />
            <Txt size={12.5} tone="muted">{i.name}</Txt>
            <Txt num size={12.5} tone="strong">{pct(i.weight)}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: space.lg, rowGap: 4, marginBottom: space.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 14, height: 3, borderRadius: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: space.md, paddingVertical: 8 },
  rowRule: { borderTopWidth: 1, borderTopColor: color.line },
  zero: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: color.lineStrong },
  facts: { flexDirection: "row", flexWrap: "wrap", rowGap: space.md, marginTop: space.lg },
  fact: { width: "50%", paddingRight: space.md },
  bar: { height: 5, borderRadius: 3, backgroundColor: color.line, marginTop: 5 },
  barFill: { height: 5, borderRadius: 3, backgroundColor: "rgba(242, 240, 234, 0.7)" },
  mix: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: color.line },
});
