// Community, its second section: the monthly competition. A portfolio of single stocks is sent
// in before a month starts and measured over that month; the best return wins. Here: the month
// being played (podium, the month session by session, standings, discussion), the entry for the
// next month, and the months that ended with everybody's record. It is a game, with no money in it.
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { EntryForm } from "@/components/competition-entry";
import { ShareBar } from "@/components/marks";
import { ReturnsChart, type Series } from "@/components/returns-chart";
import { Thread } from "@/components/thread";
import { Button, Chip, Label, Panel, Section, Track, Txt, WordTabs, strong, type Tone } from "@/components/ui";
import { day, monthComment, monthThread, ordinal, who, type Benchmark, type Competition as Data, type Line, type RecordLine } from "@/lib/community";
import { pct, points, signedPct, tidyName, toneOf } from "@/lib/format";
import { openQuote } from "@/lib/hub";
import { color, space } from "@/lib/theme";

type View_ = "month" | "entry" | "history";
const PALETTE = ["#6f93c4", "#c9a45a", "#a388c9", "#5fb0a6", "#c98a6f", "#8fae5d"];
const mix = (l: Line, max = 4) => l.picks.slice().sort((a, b) => b.weight - a.weight).slice(0, max).map((p) => `${p.ticker} ${pct(p.weight, 0)}`).join(" · ");

// The server's clock, kept current once a second: the countdown does not trust the phone's.
function useNow(serverNow: string) {
  const [skew] = useState(() => Date.parse(serverNow) - Date.now());
  const [now, setNow] = useState(() => Date.now() + skew);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + skew), 1000);
    return () => clearInterval(timer);
  }, [skew]);
  return now;
}

function Tags({ l }: { l: { you: boolean; stand_in: boolean } }) {
  return (
    <>
      {l.you ? <Chip text="you" /> : null}
      {l.stand_in ? <Txt size={11.5} tone="warn">sample</Txt> : null}
    </>
  );
}

export function Competition({ c, reload }: { c: Data; reload: () => void }) {
  const [view, setView] = useState<View_>("month");
  const now = useNow(c.now_utc);
  // The month has turned: what is on the screen is another month's.
  const turned = now >= Date.parse(c.open.closes_utc);
  useEffect(() => {
    if (turned) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turned]);

  return (
    <>
      <Hero c={c} now={now} onEntry={() => setView("entry")} />
      <View style={{ gap: space.xl }}>
        <WordTabs value={view} onChange={setView} items={[{ key: "month", label: "This month" }, { key: "entry", label: c.open.entry ? "Your entry ✓" : "Your entry" }, { key: "history", label: "History" }]} />
        {view === "entry" ? <EntryForm c={c} now={now} reload={reload} /> : view === "history" ? <History c={c} /> : <Month c={c} onEntry={() => setView("entry")} />}
      </View>
      <Rules c={c} />
    </>
  );
}

// --- The two months, side by side ------------------------------------------------------------------

function Cell({ label, value, note, tone = "strong" }: { label: string; value: string; note: string; tone?: Tone }) {
  return (
    <View style={styles.cell}>
      <Label numberOfLines={1}>{label}</Label>
      <Txt num size={17} weight="medium" tone={tone} style={{ marginTop: 2 }} numberOfLines={1}>{value}</Txt>
      <Txt size={12} tone="muted" numberOfLines={1}>{note}</Txt>
    </View>
  );
}

export function Countdown({ until, now }: { until: string; now: number }) {
  const left = Math.max(0, Date.parse(until) - now);
  const parts: [number, string][] = [[Math.floor(left / 86400000), "days"], [Math.floor(left / 3600000) % 24, "hours"], [Math.floor(left / 60000) % 60, "min"], [Math.floor(left / 1000) % 60, "sec"]];
  return (
    <View style={{ flexDirection: "row", gap: space.sm }} accessibilityLabel={`${parts[0][0]} days and ${parts[1][0]} hours left`}>
      {parts.map(([n, unit]) => (
        <View key={unit} style={styles.clock}>
          <Txt num size={22} weight="medium" tone="strong">{String(n).padStart(2, "0")}</Txt>
          <Txt size={11} tone="muted">{unit}</Txt>
        </View>
      ))}
    </View>
  );
}

function Hero({ c, now, onEntry }: { c: Data; now: number; onEntry: () => void }) {
  const run = c.running, open = c.open, leader = run.standings[0];
  // How far into the month we are: a line from its first day to its last, and a dot on today.
  const from = Date.parse(`${run.start_date}T00:00:00Z`) + 86400000;
  const done = Math.min(1, Math.max(0, (now - from) / (Date.parse(run.next_starts_utc) - from)));
  return (
    <>
      <Panel>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.up }} />
          <Label>Now playing</Label>
        </View>
        <Txt size={26} weight="medium" tone="strong" style={{ marginTop: 2, letterSpacing: -0.4 }}>{run.label}</Txt>
        <View style={styles.progress} aria-hidden>
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${done * 100}%`, borderRadius: 2, backgroundColor: color.inkStrong }} />
          <View style={[styles.progressDot, { left: `${done * 100}%` }]} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Txt size={12} tone="muted">{day(run.start_date)}</Txt>
          <Txt size={12} tone="muted">{run.as_of ? `${run.days.length} ${run.days.length === 1 ? "session" : "sessions"} · close of ${day(run.as_of)}` : "No close yet"}</Txt>
          <Txt size={12} tone="muted">{day(run.ends)}</Txt>
        </View>
        <View style={styles.cells}>
          <Cell label="Players" value={String(run.entrants)} note={run.entrants ? "portfolios in play" : "nobody this month"} />
          {leader ? <Cell label="Leader" value={signedPct(leader.return, 2)} note={who(leader)} tone={strong(leader.return)} /> : <Cell label="Leader" value="—" note="nobody yet" />}
          <Cell label={run.benchmark.name} value={signedPct(run.benchmark.return, 2)} note="the index, same days" tone={strong(run.benchmark.return)} />
          {run.you ? <Cell label="You" value={signedPct(run.you.return, 2)} note={`${ordinal(run.you.rank)} of ${run.you.of}`} tone={strong(run.you.return)} /> : <Cell label="You" value="—" note="not in this one" />}
        </View>
      </Panel>

      <Panel>
        <Label>Next up · entries open</Label>
        <Txt size={26} weight="medium" tone="strong" style={{ marginTop: 2, marginBottom: space.md, letterSpacing: -0.4 }}>{open.label}</Txt>
        <Countdown until={open.closes_utc} now={now} />
        <Txt size={13} tone="muted" style={{ marginTop: space.md, lineHeight: 19 }}>
          Entries close at the end of {day(run.ends, true)}, New York time. {open.entrants === 1 ? "1 portfolio is" : `${open.entrants} portfolios are`} in so far.
        </Txt>
        {open.entry ? (
          <View style={{ marginTop: space.md, gap: space.md }}>
            <View style={styles.wrap}>
              <Txt size={13} tone="up">✓ Your entry is in</Txt>
              {open.entry.picks.map((p) => <Chip key={p.ticker} text={`${p.ticker} ${p.weight}%`} />)}
            </View>
            <Button title="Change it" kind="ghost" onPress={onEntry} />
          </View>
        ) : <Button title={`Build your entry for ${open.label.split(" ")[0]}`} onPress={onEntry} style={{ marginTop: space.md }} />}
      </Panel>
    </>
  );
}

// --- Standings -------------------------------------------------------------------------------------

// Three steps: the second, the first, the third.
function Podium({ lines }: { lines: Line[] }) {
  const top = lines.slice(0, 3);
  const steps: [Line | undefined, number][] = [[top[1], 60], [top[0], 92], [top[2], 40]];
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.sm }}>
      {steps.map(([l, height], i) => !l ? <View key={i} style={{ flex: 1 }} /> : (
        <View key={l.rank} style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <Txt size={13} weight="semibold" tone="strong" numberOfLines={1}>{who(l)}</Txt>
          <View style={styles.wrap}><Tags l={l} /></View>
          <Txt num size={17} weight="medium" tone={strong(l.return)}>{signedPct(l.return, 2)}</Txt>
          <View style={[styles.stair, { height }, l.rank === 1 && { borderColor: color.inkStrong, backgroundColor: color.raised }]}>
            <Txt num size={17} weight={l.rank === 1 ? "medium" : "regular"} tone={l.rank === 1 ? "strong" : "muted"}>{l.rank}</Txt>
          </View>
        </View>
      ))}
    </View>
  );
}

// What a line opens onto: each stock, its share, what it did and the points it put in.
function Holdings({ l }: { l: Line }) {
  return (
    <View style={{ gap: 8, marginTop: space.sm }}>
      {l.picks.map((p) => (
        <View key={p.ticker}>
          <View style={styles.pick}>
            <Txt size={13} weight="semibold" tone="strong" style={{ width: 58 }} onPress={() => openQuote(p.ticker)} accessibilityRole="link">{p.ticker}</Txt>
            <ShareBar weight={p.weight} />
            <Txt num size={12.5} style={{ width: 38, textAlign: "right" }}>{pct(p.weight, 0)}</Txt>
            <Txt num size={12.5} tone={toneOf(p.return)} style={{ width: 58, textAlign: "right" }}>{p.return == null ? "no price" : signedPct(p.return, 1)}</Txt>
            <Txt num size={12.5} tone="muted" style={{ width: 68, textAlign: "right" }}>{p.return == null ? "" : points(p.weight * p.return, 2)}</Txt>
          </View>
          <Txt size={11.5} tone="muted" numberOfLines={1}>{tidyName(p.name)}</Txt>
        </View>
      ))}
    </View>
  );
}

type Picking = { tint: (l: Line) => string | null; toggle: (l: Line) => void };

// The lines of a month, the best first, with the index among them for reference. `picking` adds
// a mark that puts a line on the chart; `final` marks the winner.
function Standings({ lines, bench, final = false, picking }: { lines: Line[]; bench: Benchmark | null; final?: boolean; picking?: Picking }) {
  const mine = lines.find((l) => l.you);
  const [open, setOpen] = useState<number | null>(mine?.rank ?? null);
  const reach = Math.max(0.01, Math.ceil(Math.max(0, ...lines.map((l) => Math.abs(l.return)), Math.abs(bench?.return ?? 0)) * 100) / 100);
  const index = bench && bench.return != null ? (
    <View key="index" style={[styles.line, styles.rule]}>
      <View style={styles.lineTop}>
        <View style={{ width: 22 }} />
        <View style={styles.who}><Txt size={14} tone="muted">{bench.name}</Txt><Txt size={11.5} tone="faint">index</Txt></View>
        <Txt num size={14} tone="muted" style={styles.figure}>{signedPct(bench.return, 2)}</Txt>
      </View>
      <View style={styles.lineTrack}><Track move={bench.return} scale={reach} /></View>
    </View>
  ) : null;
  const rows: ReactNode[] = [];
  let placed = false;
  for (const l of lines) {
    if (!placed && bench && bench.return != null && l.return < bench.return) {
      placed = true;
      rows.push(index);
    }
    const tint = picking?.tint(l);
    rows.push(
      <Pressable key={l.rank} onPress={() => setOpen(open === l.rank ? null : l.rank)} accessibilityRole="button" accessibilityState={{ expanded: open === l.rank }}
        style={[styles.line, rows.length > 0 && styles.rule, l.you && { backgroundColor: color.panel }]}>
        <View style={styles.lineTop}>
          <Txt num size={13} tone="muted" style={{ width: 22 }}>{l.rank}</Txt>
          <View style={styles.who}>
            <Txt size={14} weight="semibold" tone="strong" numberOfLines={1} style={{ flexShrink: 1 }}>{who(l)}</Txt>
            <Tags l={l} />
            {final && l.rank === 1 ? <Txt size={11.5} tone="up">winner</Txt> : null}
          </View>
          <Txt num size={14} weight="medium" tone={toneOf(l.return)} style={styles.figure}>{signedPct(l.return, 2)}</Txt>
        </View>
        <View style={styles.lineTrack}><Track move={l.return} scale={reach} /></View>
        <View style={styles.lineSub}>
          <Txt size={12} tone="muted" numberOfLines={1} style={{ flex: 1 }}>{mix(l)}</Txt>
          {picking ? (
            // A line on the chart, or not: its swatch is the line's colour.
            <Pressable onPress={() => picking.toggle(l)} hitSlop={8} accessibilityRole="switch" accessibilityState={{ checked: Boolean(tint) }} accessibilityLabel={`Show ${who(l)} on the chart`}
              style={[styles.swatch, tint ? { borderColor: color.inkStrong, backgroundColor: color.raised } : null]}>
              <View style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: tint ?? color.lineStrong }} />
            </Pressable>
          ) : null}
        </View>
        {open === l.rank ? <Holdings l={l} /> : null}
      </Pressable>,
    );
  }
  if (!placed) rows.push(index);
  return <View>{rows}</View>;
}

// --- This month ------------------------------------------------------------------------------------

function Month({ c, onEntry }: { c: Data; onEntry: () => void }) {
  const run = c.running;
  // The chart starts with the podium and the reader's own line.
  const [colors, setColors] = useState<Record<string, string>>(() => {
    const first: Record<string, string> = {};
    for (const l of run.standings) if (l.you || l.rank <= 3) first[who(l)] = l.you ? color.inkStrong : PALETTE.find((p) => !Object.values(first).includes(p))!;
    return first;
  });
  const [withIndex, setWithIndex] = useState(true);
  const [note, setNote] = useState("");
  const talk = (
    <Section title="Discussion" note={`${run.label}: say what you think of the month. Members only.`}>
      <Thread key={run.month} src={{ load: () => monthThread(run.month), post: (text, parent) => monthComment(run.month, text, parent),
        note: "Shown with the name you play under, or your first name. Be civil.", ask: "How is your month going?", none: "Nobody has said anything yet. Open the debate." }} />
    </Section>
  );
  if (!run.standings.length) {
    return (
      <>
        <Panel style={{ gap: space.md }}>
          <Txt size={17} tone="strong">Nobody is playing {run.label}.</Txt>
          <Txt size={14} style={{ lineHeight: 21 }}>A month is played by the portfolios sent in before it started. {c.open.label} is open: send yours before the end of {day(run.ends, true)}.</Txt>
          <Button title={`Build your entry for ${c.open.label.split(" ")[0]}`} onPress={onEntry} />
        </Panel>
        {talk}
      </>
    );
  }
  const shown = run.standings.filter((l) => colors[who(l)]);
  const series: Series[] = [
    ...(withIndex && run.benchmark.series?.length ? [{ name: run.benchmark.name, values: [0, ...run.benchmark.series], tint: color.muted, dashed: true, wide: 1 }] : []),
    ...shown.map((l) => ({ name: who(l), values: [0, ...(l.series ?? [])], tint: colors[who(l)], wide: l.you ? 2.5 : 1.75 })),
  ];
  const toggle = (l: Line) => {
    setNote("");
    const name = who(l), next = { ...colors };
    if (next[name]) delete next[name];
    else if (Object.keys(next).length >= PALETTE.length) return setNote(`Up to ${PALETTE.length} lines at a time: take one off first.`);
    else next[name] = l.you ? color.inkStrong : PALETTE.find((p) => !Object.values(next).includes(p)) ?? PALETTE[0];
    setColors(next);
  };

  return (
    <>
      <Section title="The podium so far" note={`After ${run.days.length} ${run.days.length === 1 ? "session" : "sessions"}. It is settled at the last close of ${day(run.ends, true)}.`}>
        <Podium lines={run.standings} />
      </Section>

      <Section title="The month, session by session" note={`Each line is what a portfolio has returned since the close of ${day(run.start_date)}. Pick the lines in the standings below.`}>
        <View style={[styles.wrap, { marginBottom: space.md }]}>
          {shown.map((l) => (
            <View key={who(l)} style={styles.legend}>
              <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: colors[who(l)] }} />
              <Txt size={11.5}>{who(l)} <Txt num size={11.5} tone={toneOf(l.return)}>{signedPct(l.return, 1)}</Txt></Txt>
            </View>
          ))}
          <Pressable onPress={() => setWithIndex(!withIndex)} hitSlop={6} accessibilityRole="switch" accessibilityState={{ checked: withIndex }} style={[styles.legend, !withIndex && { opacity: 0.5 }]}>
            <View style={{ width: 14, height: 0, borderTopWidth: 2, borderStyle: "dashed", borderColor: color.muted }} />
            <Txt size={11.5}>{run.benchmark.name}</Txt>
          </Pressable>
        </View>
        {run.days.length ? <ReturnsChart series={series} first={day(run.start_date)} last={day(run.days[run.days.length - 1])} />
          : <Txt size={14} tone="muted" style={{ paddingVertical: 32, textAlign: "center" }}>The first close of the month is not in yet: everybody stands at zero.</Txt>}
      </Section>

      <Section title="Standings" note={`${run.entrants} ${run.entrants === 1 ? "portfolio" : "portfolios"}${run.as_of ? `, as of the close of ${day(run.as_of)}` : ""}. A line opens onto its stocks.`}>
        {note ? <Txt size={12.5} tone="warn" style={{ marginBottom: space.sm }}>{note}</Txt> : null}
        <Standings lines={run.standings} bench={run.benchmark} picking={{ tint: (l) => colors[who(l)] ?? null, toggle }} />
        <Txt size={12.5} tone="muted" style={{ marginTop: space.md, lineHeight: 18 }}>
          Measured from the close of {day(run.start_date)}: what each mix, bought then and left alone, has returned on price. In an open line, each stock has its share, its own return and the points it puts into the portfolio&apos;s.{run.partial ? " Some stocks have no price yet and count as flat." : ""}
        </Txt>
      </Section>
      {talk}
    </>
  );
}

// --- History ---------------------------------------------------------------------------------------

type SortKey = "wins" | "months" | "average" | "best";
const SORTS: { key: SortKey; label: string }[] = [{ key: "wins", label: "Won" }, { key: "months", label: "Played" }, { key: "average", label: "Average return" }, { key: "best", label: "Best month" }];

function History({ c }: { c: Data }) {
  const { months, record, you } = c.history;
  const [sortBy, setSortBy] = useState<SortKey>("wins");
  const [pastMonth, setPastMonth] = useState("");
  if (!months.length) {
    return (
      <Panel style={{ gap: space.sm }}>
        <Txt size={17} tone="strong">No month has ended yet.</Txt>
        <Txt size={14} style={{ lineHeight: 21 }}>When a month ends, its final standings are kept here, and with them everybody&apos;s record: the months played, the months won and the average return.</Txt>
      </Panel>
    );
  }
  const rows = [...record].sort((a, b) => b[sortBy] - a[sortBy] || b.wins - a.wins || b.average - a.average);
  const past = months.find((m) => m.month === pastMonth) ?? months[0];
  const winner = past.standings[0];
  const say = (r: RecordLine) => (sortBy === "wins" ? String(r.wins) : sortBy === "months" ? String(r.months) : signedPct(r[sortBy], 2));
  return (
    <>
      {you ? (
        <Section title="Your record">
          <View style={styles.cells}>
            <Cell label="Months played" value={String(you.months)} note="" />
            <Cell label="Months won" value={String(you.wins)} note="" />
            <Cell label="Average return" value={signedPct(you.average, 2)} note="" tone={strong(you.average)} />
            <Cell label="Best month" value={signedPct(you.best, 2)} note="" tone={strong(you.best)} />
            <Cell label="All-time place" value={ordinal(you.rank)} note="" />
          </View>
        </Section>
      ) : null}

      <Section title="The record" note="Every player's months: how many they played, how many they won, and their average return over the months they played.">
        <WordTabs items={SORTS} value={sortBy} onChange={setSortBy} />
        <View style={{ marginTop: space.sm }}>
          {rows.map((r, i) => (
            <View key={`${r.rank}:${r.handle}`} style={[styles.line, i > 0 && styles.rule, r.you && { backgroundColor: color.panel }]}>
              <View style={styles.lineTop}>
                <Txt num size={13} tone="muted" style={{ width: 22 }}>{i + 1}</Txt>
                <View style={styles.who}><Txt size={14} weight="semibold" tone="strong" numberOfLines={1} style={{ flexShrink: 1 }}>{who(r)}</Txt><Tags l={r} /></View>
                <Txt num size={14} weight="medium" tone={sortBy === "average" || sortBy === "best" ? toneOf(r[sortBy]) : "strong"}>{say(r)}</Txt>
              </View>
              <Txt num size={12} tone="muted" style={{ marginLeft: 22 + space.sm }}>
                {r.wins} won · {r.months} played · average {signedPct(r.average, 2)} · best {signedPct(r.best, 2)}
              </Txt>
            </View>
          ))}
        </View>
      </Section>

      <Section title={`${past.label}, as it ended`} note={winner ? `${who(winner)} won it with ${signedPct(winner.return, 2)}, among ${past.entrants}.${past.sample ? " Sample figures." : ""}` : "Nobody played it."}>
        <WordTabs items={months.map((m) => ({ key: m.month, label: m.label }))} value={past.month} onChange={setPastMonth} />
        <View style={{ marginTop: space.sm }}><Standings key={past.month} lines={past.standings} bench={past.benchmark} final /></View>
      </Section>
    </>
  );
}

// --- The rules -------------------------------------------------------------------------------------

function Rules({ c }: { c: Data }) {
  const r = c.rules;
  const lines = [
    `Build a portfolio of ${r.picks_min} to ${r.picks_max} single stocks listed in the US. No funds.`,
    `Give each one between ${r.weight_min}% and ${r.weight_max}% of it, in whole percents that add up to 100.`,
    "Send it before the month starts: until the end of the last day of the month before, New York time. You can change it until then; after that it is fixed.",
    "It is measured from the last close before the month to the last close of the month, as bought at the start and left alone. Dividends are not counted.",
    "The best return wins the month. A tie goes to the entry that was last changed earlier.",
    "It is a game, with no money in it. Nothing here is advice, and a month won says nothing about the next.",
  ];
  return (
    <Section title="How it works">
      <View style={{ gap: space.sm }}>
        {lines.map((text, i) => (
          <View key={i} style={{ flexDirection: "row", gap: space.md }}>
            <Txt num size={13} tone="muted">{i + 1}</Txt>
            <Txt size={13} style={{ flex: 1, lineHeight: 20 }}>{text}</Txt>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  rule: { borderTopWidth: 1, borderTopColor: color.line },
  wrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  cells: { flexDirection: "row", flexWrap: "wrap", marginTop: space.lg, borderTopWidth: 1, borderLeftWidth: 1, borderColor: color.line },
  cell: { width: "50%", flexGrow: 1, padding: space.md, borderRightWidth: 1, borderBottomWidth: 1, borderColor: color.line },
  clock: { minWidth: 58, alignItems: "center", borderWidth: 1, borderColor: color.line, borderRadius: 3, paddingVertical: 6, paddingHorizontal: 8 },
  progress: { height: 3, borderRadius: 2, backgroundColor: color.raised, marginTop: space.lg },
  progressDot: { position: "absolute", top: -3.5, width: 10, height: 10, marginLeft: -5, borderRadius: 5, backgroundColor: color.inkStrong },
  stair: { alignSelf: "stretch", marginTop: 8, alignItems: "center", paddingTop: 6, borderWidth: 1, borderBottomWidth: 0, borderColor: color.line,
    borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: color.panel },
  pick: { flexDirection: "row", alignItems: "center", gap: 6 },
  line: { paddingVertical: space.md, gap: 6 },
  lineTop: { flexDirection: "row", alignItems: "center", gap: space.sm },
  lineSub: { flexDirection: "row", alignItems: "center", gap: space.md, marginLeft: 22 + space.sm },
  who: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  lineTrack: { flexDirection: "row", marginLeft: 22 + space.sm },
  figure: { width: 72, textAlign: "right" },
  swatch: { width: 40, height: 26, alignItems: "center", justifyContent: "center", borderRadius: 3, borderWidth: 1, borderColor: color.lineStrong },
  legend: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: color.lineStrong, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 3 },
});
