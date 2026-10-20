// Community, its third section: the bot competition, as the web's /community/bots/ draws it. The
// member's bot (its returns and rank by period, its record, what it holds and its rules), how one
// is built, the board over the day, week, month, year and since each bot started with the S&P 500
// among the lines, and the rules. A bot is built and sent in from a computer, by the member's AI
// agent: the app explains that and links to the web page; it never downloads the kit nor shows a
// key. It can withdraw the bot and take the key back.
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ReturnsChart } from "@/components/returns-chart";
import { Button, Chip, Label, Notice, Section, Txt, WordTabs } from "@/components/ui";
import { SITE, message } from "@/lib/api";
import { PERIODS, botDigits, closeDay, dropBotKey, withdrawBot, type BotBoard, type BotHolding, type BotLine, type BotPeriod, type MyBot } from "@/lib/bots";
import { ordinal } from "@/lib/community";
import { confirm } from "@/lib/confirm";
import { pct, signedPct, timeAgo, toneOf } from "@/lib/format";
import { openPage, openQuote } from "@/lib/hub";
import { color, space } from "@/lib/theme";

export const BOTS_PAGE = `${SITE}/community/bots/`;

export function Bots({ b, reload }: { b: BotBoard; reload: () => void }) {
  const [period, setPeriod] = useState<BotPeriod>("1m");
  return (
    <>
      <Mine b={b} reload={reload} />
      <Build b={b} reload={reload} />
      <Board b={b} period={period} onPick={setPeriod} />
      <Rules b={b} />
    </>
  );
}

// What a bot holds: each ticker with its weight (opening its page), and the cash it keeps.
function Mix({ held, cash, max = 12 }: { held: BotHolding[]; cash: number | null; max?: number }) {
  return (
    <View style={styles.chips}>
      {held.slice(0, max).map((x) => <Chip key={x.ticker} text={`${x.ticker} ${pct(x.weight, x.weight < 0.1 ? 1 : 0)}`} onPress={() => openQuote(x.ticker)} />)}
      {cash && cash > 0.005 ? <Txt num size={11.5} tone="muted" style={styles.cash}>cash {pct(cash, 0)}</Txt> : null}
    </View>
  );
}

const sessions = (n: number) => `${n} ${n === 1 ? "session" : "sessions"}`;

// --- The member's bot --------------------------------------------------------------------------------

function Mine({ b, reload }: { b: BotBoard; reload: () => void }) {
  const you = b.you;
  const [rules, setRules] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!you) {
    return (
      <Section title="Your bot" note="No bot yet">
        <Txt size={14} style={{ lineHeight: 21 }}>A bot here is a few rules, not code: which of the largest US companies it looks at, what it scores them on, how many it holds and how often it looks again. Your AI agent writes them with you, backtests them and sends them in. Market Hub runs the bot on paper, with no money and no broker, and ranks it from the next close.</Txt>
      </Section>
    );
  }

  async function withdraw() {
    if (!(await confirm("Withdraw your bot?", "Its record goes with it, and a new one starts from zero.", "Withdraw"))) return;
    setBusy(true);
    setError(null);
    try {
      await withdrawBot();
      reload();
    } catch (e) {
      setError(message(e, "The bot could not be withdrawn."));
    } finally {
      setBusy(false);
    }
  }

  const started = you.since
    ? `Running since the close of ${closeDay(you.since)} · ${sessions(you.sessions)}${you.as_of ? ` · as of ${closeDay(you.as_of)}` : ""}`
    : `Sent in ${timeAgo(you.submitted_utc)}: its record starts at the next close.`;
  return (
    <Section title="Your bot" note={`Shown as ${you.handle} · ${you.universe} companies to choose from`}>
      <Txt size={22} weight="medium" tone="strong">{you.name}</Txt>
      {you.about ? <Txt size={14} style={{ marginTop: space.sm, lineHeight: 21 }}>{you.about}</Txt> : null}
      <Txt size={12.5} tone="muted" style={{ marginTop: space.md, lineHeight: 18 }}>{started}</Txt>
      {you.returns ? <Stats you={you} /> : null}
      {you.curve.length > 1 ? (
        <View style={{ marginTop: space.lg }}>
          <ReturnsChart series={[{ name: you.name, values: you.curve.map((p) => p.value - 1), tint: color.inkStrong }]}
            first={closeDay(you.curve[0].date)} last={closeDay(you.curve[you.curve.length - 1].date)} />
        </View>
      ) : null}
      {you.holdings.length ? (
        <View style={{ marginTop: space.lg, gap: 6 }}>
          <Label>Holds now</Label>
          <Mix held={you.holdings} cash={you.cash} max={50} />
        </View>
      ) : null}
      <View style={styles.rules}>
        <Pressable onPress={() => setRules(!rules)} accessibilityRole="button" accessibilityState={{ expanded: rules }} style={{ padding: space.md }}>
          <Txt size={13} weight="semibold">{rules ? "▾" : "▸"} Its rules · only you see them</Txt>
        </Pressable>
        {rules ? (
          <View style={{ paddingHorizontal: space.md, paddingBottom: space.md, gap: 4 }}>
            {you.rules.map((r) => <Txt key={r} size={13} style={{ lineHeight: 19 }}>• {r}</Txt>)}
          </View>
        ) : null}
      </View>
      <Button title="Withdraw it" kind="ghost" onPress={withdraw} busy={busy} style={{ marginTop: space.lg }} />
      <Txt size={12.5} tone="muted" style={{ marginTop: space.sm, lineHeight: 18 }}>To change it, ask your agent: a new bot replaces this one and starts its record again.</Txt>
      {error ? <View style={{ marginTop: space.md }}><Notice text={error} /></View> : null}
    </Section>
  );
}

// Its return over each period, with where it ranks among the bots that have run that long.
function Stats({ you }: { you: MyBot }) {
  return (
    <View style={styles.cells}>
      {PERIODS.map((p) => {
        const v = you.returns?.[p.key] ?? null;
        const rank = you.ranks[p.key];
        return (
          <View key={p.key} style={styles.cell}>
            <Label>{p.label}</Label>
            <Txt num size={18} weight="medium" tone={v == null ? "faint" : toneOf(v) === "ink" ? "strong" : toneOf(v)} style={{ marginTop: 2 }}>{v == null ? "—" : signedPct(v, botDigits(p.key))}</Txt>
            <Txt size={12} tone="muted" numberOfLines={1}>{rank ? `${ordinal(rank)} of ${you.entrants}` : v == null ? "not yet" : " "}</Txt>
          </View>
        );
      })}
    </View>
  );
}

// --- Building one ----------------------------------------------------------------------------------

function Build({ b, reload }: { b: BotBoard; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function takeBack() {
    if (!(await confirm("Take your key back?", "Your agent can no longer send in or follow your bot until you make a new key on the web page.", "Take it back"))) return;
    setBusy(true);
    setError(null);
    try {
      await dropBotKey();
      reload();
    } catch (e) {
      setError(message(e, "The key could not be taken back."));
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    ["Download the kit", "On a computer, from the web page: a folder with the instructions for your agent, the format of a bot, examples and a small tool. It comes with your key in it."],
    ["Open the folder with your agent", "Unzip it and open it with Claude Code, Codex or the agent you use (in a terminal: cd into it and run claude or codex)."],
    ["Say “Let's build my bot”", "It asks what you have in mind, or proposes ideas, writes the rules, backtests them against the S&P 500 and sends the bot in when you say so."],
  ];
  return (
    <Section title="Build yours with your AI agent" note={b.you ? "Change it, or start again. It is done on a computer, with your agent." : "Three steps, and a conversation. It is done on a computer, with your agent."}>
      <View style={{ gap: space.lg }}>
        {steps.map(([title, text], i) => (
          <View key={title} style={styles.step}>
            <View style={styles.stepMark}><Txt num size={12} tone="strong">{String(i + 1)}</Txt></View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Txt size={14} weight="semibold" tone="strong">{title}</Txt>
              <Txt size={13} tone="muted" style={{ lineHeight: 19 }}>{text}</Txt>
            </View>
          </View>
        ))}
      </View>
      <Button title="Open the page on the web" kind="ghost" onPress={() => openPage(BOTS_PAGE)} style={{ marginTop: space.lg }} />

      <View style={styles.key}>
        <Label>Your key</Label>
        <Txt size={13} tone="muted" style={{ marginTop: 4, lineHeight: 19 }}>{b.key
          ? `Made ${timeAgo(b.key.created_utc)}, ${b.key.used_utc ? `last used ${timeAgo(b.key.used_utc)}` : "not used yet"}. It lets your agent check, backtest and send in your bot, nothing else. Keep it to yourself.`
          : "No key: your agent needs one. Downloading the kit on the web page makes one."}</Txt>
        {b.key ? <Button title="Take it back" kind="ghost" onPress={takeBack} busy={busy} style={{ marginTop: space.md }} /> : null}
        {error ? <View style={{ marginTop: space.md }}><Notice text={error} /></View> : null}
      </View>
    </Section>
  );
}

// --- The board -------------------------------------------------------------------------------------

function Board({ b, period, onPick }: { b: BotBoard; period: BotPeriod; onPick: (p: BotPeriod) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const p = PERIODS.find((x) => x.key === period)!;
  const rows = b.rows.slice().sort((x, y) => (x.ranks[period] ?? 1e9) - (y.ranks[period] ?? 1e9) || (y.returns.all ?? -1e9) - (x.returns.all ?? -1e9));
  const bench = b.benchmark.returns?.[period] ?? null;
  // The index goes in among the bots, above the first that did worse (or has no figure yet).
  const at = bench == null ? -1 : (() => {
    const i = rows.findIndex((r) => r.returns[period] == null || r.returns[period]! < bench);
    return i < 0 ? rows.length : i;
  })();
  const index = (
    <View key="index" style={[styles.line, at > 0 && styles.rule]}>
      <View style={styles.lineTop}>
        <View style={styles.place} />
        <View style={styles.who}>
          <Txt size={14} tone="muted">{"S&P 500"}</Txt>
          <Txt size={11.5} tone="faint">{b.benchmark.ticker}</Txt>
        </View>
        <Txt num size={14} weight="medium" tone="muted">{signedPct(bench, botDigits(period))}</Txt>
      </View>
    </View>
  );
  const lines = rows.map((r, i) => (
    <Row key={`${r.handle}:${r.name}`} r={r} period={period} first={i === 0 && at !== 0} open={open === r.handle} onToggle={() => setOpen(open === r.handle ? null : r.handle)} />
  ));
  if (at >= 0) lines.splice(at, 0, index);

  return (
    <Section title="The board" note={b.as_of ? `Returns over ${p.long}, to the close of ${closeDay(b.as_of)}.` : "No close yet."}>
      <WordTabs items={PERIODS} value={period} onChange={onPick} />
      {rows.length ? <View style={{ marginTop: space.sm }}>{lines}</View>
        : <Txt size={13} tone="muted" style={{ paddingVertical: space.lg }}>No bot is running yet. Yours can be the first.</Txt>}
      <Txt size={12.5} tone="muted" style={{ marginTop: space.md, lineHeight: 18 }}>
        A line opens onto the bot&apos;s idea and what it holds. A bot shows in a period once it has run that long. {b.entrants} {b.entrants === 1 ? "bot" : "bots"} in the competition.
      </Txt>
    </Section>
  );
}

function Row({ r, period, first, open, onToggle }: { r: BotLine; period: BotPeriod; first: boolean; open: boolean; onToggle: () => void }) {
  const v = r.returns[period];
  const rank = r.ranks[period];
  return (
    <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}
      style={[styles.line, !first && styles.rule, r.you && { backgroundColor: color.panel }]}>
      <View style={styles.lineTop}>
        <Txt num size={13} tone="muted" style={styles.place}>{rank ? String(rank) : ""}</Txt>
        <View style={styles.who}>
          <Txt size={14} weight="semibold" tone="strong" numberOfLines={1} style={{ flexShrink: 1 }}>{r.handle}</Txt>
          {r.you ? <Chip text="you" /> : null}
          {r.stand_in ? <Txt size={11.5} tone="warn">sample</Txt> : null}
        </View>
        <Txt num size={14} weight="medium" tone={v == null ? "faint" : toneOf(v)}>{v == null ? "—" : signedPct(v, botDigits(period))}</Txt>
      </View>
      <View style={[styles.lineTop, styles.under]}>
        <Txt size={12} tone="muted" numberOfLines={1} style={{ flex: 1 }}>{r.name}</Txt>
        {/* Its return since it started, unless that is the figure the line already shows: then how long it has run. */}
        {!r.since ? <Txt size={12} tone="muted">starts next close</Txt>
          : period === "all" ? <Txt size={12} tone="muted">{sessions(r.sessions)}</Txt>
          : <Txt num size={12} tone={toneOf(r.returns.all)}>{signedPct(r.returns.all, 1)} since start</Txt>}
      </View>
      {open ? (
        <View style={[styles.under, { marginTop: space.sm, gap: 6 }]}>
          {r.about ? <Txt size={13} style={{ lineHeight: 19 }}>{r.about}</Txt> : null}
          <Txt size={12.5} tone="muted">{r.since ? `Running since the close of ${closeDay(r.since)} · ${sessions(r.sessions)} · holds ${r.holding} ${r.holding === 1 ? "stock" : "stocks"}` : "Its record starts at the next close."}</Txt>
          {r.holdings.length ? <Mix held={r.holdings} cash={r.cash} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

// --- The rules -------------------------------------------------------------------------------------

function Rules({ b }: { b: BotBoard }) {
  const items = [
    "A bot is a set of rules in a file, not code: the format is in the kit (SPEC.md). Your agent writes it with you.",
    `It chooses among the ${b.rules.universe} largest US companies, funds left out, and holds up to ${b.rules.hold} of them. Long only: no short sales, no borrowing.`,
    "Market Hub runs it on paper: no money, no broker, no orders. On the sessions it looks again it decides at the close and trades at that close.",
    `Each trade pays ${pct(b.rules.cost, 2)} of what is traded. Returns are on price, dividends left out, and cash earns nothing.`,
    "Its record starts at the first close after you send it in. Nothing before counts: a backtest is for you alone.",
    "One bot per member. Sending in another one replaces it and starts its record again.",
    "Other members see your name, the bot's name and idea, its returns and what it holds. Its rules are yours alone.",
  ];
  return (
    <Section title="How it works">
      <View style={{ gap: 6 }}>
        {items.map((t) => <Txt key={t} size={13} style={{ lineHeight: 19 }}>• {t}</Txt>)}
      </View>
    </Section>
  );
}

const PLACE = 22;

const styles = StyleSheet.create({
  rule: { borderTopWidth: 1, borderTopColor: color.line },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  cash: { paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: color.line, borderRadius: 2 },
  cells: { flexDirection: "row", flexWrap: "wrap", marginTop: space.md, borderTopWidth: 1, borderLeftWidth: 1, borderColor: color.line },
  cell: { width: "50%", flexGrow: 1, padding: space.md, borderRightWidth: 1, borderBottomWidth: 1, borderColor: color.line },
  rules: { marginTop: space.lg, borderWidth: 1, borderColor: color.line, borderRadius: 3 },
  step: { flexDirection: "row", gap: space.md },
  stepMark: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: color.lineStrong, alignItems: "center", justifyContent: "center" },
  key: { marginTop: space.lg, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: color.line },
  line: { paddingVertical: space.md, gap: 4 },
  lineTop: { flexDirection: "row", alignItems: "center", gap: space.sm },
  place: { width: PLACE },
  who: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: space.sm },
  under: { marginLeft: PLACE + space.sm },
});
