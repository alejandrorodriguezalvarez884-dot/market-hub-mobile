// Community, its first section: sharing your portfolio. It takes a portfolio first; then a name,
// and the say-so. Under it, the portfolios their owners chose to share, ranked by how today's
// holdings did over a period, and where yours stands among them, shared or not. Sharing shows
// weights and returns only: never amounts.
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ShareBar } from "@/components/marks";
import { Button, Chip, Field, Label, Notice, Section, Txt, WordTabs } from "@/components/ui";
import { message } from "@/lib/api";
import { ordinal, setSharing } from "@/lib/community";
import { pct, points, signedPct, timeAgo, toneOf } from "@/lib/format";
import { openQuote } from "@/lib/hub";
import { color, space } from "@/lib/theme";
import type { Board, Member, PeriodKey } from "@/lib/types";

const digits = (key: PeriodKey) => (key === "1d" ? 2 : 1);

export function SharedPortfolios({ b, reload }: { b: Board; reload: () => void }) {
  const [period, setPeriod] = useState<PeriodKey>("ytd");
  return (
    <>
      <Sharing b={b} reload={reload} />
      <Standing b={b} period={period} onPick={setPeriod} />
      <Ranking b={b} period={period} onPick={setPeriod} />
    </>
  );
}

// --- Sharing ---------------------------------------------------------------------------------------

// The way to a shared portfolio, in three steps: the one being taken is lit, those behind it are ticked.
function Steps({ at }: { at: number }) {
  return (
    <View style={styles.steps}>
      {["Add your portfolio", "Pick a name to be shown under", "Members see its weights and returns"].map((text, i) => (
        <View key={text} style={[styles.step, i > 0 && styles.rule, i === at && { backgroundColor: color.raised }]}>
          <View style={[styles.stepMark, { borderColor: i < at ? color.up : i === at ? color.inkStrong : color.lineStrong }]}>
            <Txt num size={12} tone={i < at ? "up" : i === at ? "strong" : "faint"}>{i < at ? "✓" : String(i + 1)}</Txt>
          </View>
          <Txt size={13} tone={i <= at ? "strong" : "muted"} style={{ flex: 1 }}>{text}</Txt>
        </View>
      ))}
    </View>
  );
}

const Bullets = ({ title, items }: { title: string; items: string[] }) => (
  <View style={{ gap: 4 }}>
    <Label>{title}</Label>
    {items.map((x) => <Txt key={x} size={13} style={{ lineHeight: 19 }}>{x}</Txt>)}
  </View>
);

function Sharing({ b, reload }: { b: Board; reload: () => void }) {
  const router = useRouter();
  const on = b.you.sharing;
  const [name, setName] = useState(b.you.handle);
  const [busy, setBusy] = useState<"share" | "stop" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!on && !b.you.performance) {
    // No portfolio, nothing to share: it has to be added first.
    return (
      <Section title="Share your portfolio" note="It starts with a portfolio">
        <Steps at={0} />
        <Txt size={14} style={{ marginTop: space.lg, lineHeight: 21 }}>You have not added a portfolio yet, so there is nothing to share. Add the positions you hold; you then pick a name and decide whether members see it.</Txt>
        <Button title="Add your portfolio" onPress={() => router.push("/portfolio")} style={{ marginTop: space.lg }} />
      </Section>
    );
  }

  async function send(body: { enabled: boolean; handle?: string }) {
    setBusy(body.enabled ? "share" : "stop");
    setError(null);
    try {
      await setSharing(body);
      reload();
    } catch (e) {
      setError(message(e, "That did not work."));
    } finally {
      setBusy(null);
    }
  }
  const since = b.you.since_utc ? `, since ${new Date(b.you.since_utc).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "";

  return (
    <Section title={on ? "Your portfolio is shared" : "Share your portfolio"} note={on ? `As ${b.you.handle}${since}` : "Off until you turn it on"}>
      <Steps at={on ? 3 : 1} />
      <View style={{ gap: space.lg, marginTop: space.lg }}>
        <Bullets title="What others see" items={["The name you pick here", "The tickers you hold and each one's share, in percent", "The returns of those holdings"]} />
        <Bullets title="What nobody sees" items={["Your name, email or picture", "How many shares you hold, or what they are worth", "What you paid, your gains and your watchlist"]} />
        <Txt size={13} tone="muted" style={{ lineHeight: 19 }}>Only signed-in members see the shared portfolios. It follows what you hold, and stops the moment you say so.</Txt>
        <View style={{ gap: space.sm }}>
          <Field value={name} onChangeText={setName} maxLength={20} placeholder="A name to be shown under" accessibilityLabel="The name your portfolio is shown under" autoCapitalize="words" />
          <Button title={on ? "Change the name" : "Share my portfolio"} kind={on ? "ghost" : "primary"} onPress={() => send({ enabled: true, handle: name })} busy={busy === "share"} disabled={busy !== null} />
          {on ? <Button title="Stop sharing" kind="ghost" onPress={() => send({ enabled: false })} busy={busy === "stop"} disabled={busy !== null} /> : null}
        </View>
        {error ? <Notice text={error} /> : null}
      </View>
    </Section>
  );
}

// --- Where you stand -------------------------------------------------------------------------------

function Standing({ b, period, onPick }: { b: Board; period: PeriodKey; onPick: (p: PeriodKey) => void }) {
  if (!b.you.performance) return null; // nothing to stand with yet: the sharing block asks for the portfolio
  return (
    <Section title="Where you stand" note={b.you.sharing ? `Shared as ${b.you.handle}` : "Only you see this: your portfolio is not shared"}>
      <View style={styles.cells}>
        {b.periods.map((p) => {
          const st = b.you.standing[p.key], mine = b.you.performance![p.key];
          return (
            <Pressable key={p.key} onPress={() => onPick(p.key)} accessibilityRole="button" accessibilityState={{ selected: p.key === period }}
              style={[styles.cell, p.key === period && { backgroundColor: color.raised }]}>
              <Label>{p.label}</Label>
              <Txt num size={19} weight="medium" tone={toneOf(mine) === "ink" ? "strong" : toneOf(mine)} style={{ marginTop: 2 }}>{signedPct(mine, digits(p.key))}</Txt>
              {!st ? <Txt size={12.5} tone="muted" style={{ marginTop: 6 }}>Nobody to stand against yet</Txt> : (
                <>
                  <Txt size={13} weight="medium" tone={st.above_average ? "up" : "down"} style={{ marginTop: 2 }}>{st.above_average ? "Above average" : "Below average"}</Txt>
                  <Txt num size={12} tone="muted">{points(st.return - st.average, digits(p.key))} · average {signedPct(st.average, digits(p.key))}</Txt>
                  {/* Where the portfolio falls between the last and the first: a dot on a line. */}
                  <View style={styles.place} aria-hidden>
                    <View style={styles.placeMiddle} />
                    <View style={[styles.placeDot, { left: `${st.ahead_of * 100}%`, backgroundColor: st.above_average ? color.up : color.down }]} />
                  </View>
                  <Txt size={12.5} tone="muted" style={{ marginTop: 8 }}>{ordinal(st.rank)} of {st.of}</Txt>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

// --- The board -------------------------------------------------------------------------------------

type Line = { name: string; value: number | null; kind: "member" | "index" | "average" | "you"; member?: Member };

function Ranking({ b, period, onPick }: { b: Board; period: PeriodKey; onPick: (p: PeriodKey) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const label = b.periods.find((p) => p.key === period)?.label ?? "";
  const lines: Line[] = [
    ...b.members.map((m): Line => ({ name: m.handle, value: m.performance[period], kind: "member", member: m })),
    ...b.indices.map((i): Line => ({ name: i.name, value: i.performance[period], kind: "index" })),
    { name: "Average of the shared portfolios", value: b.average[period], kind: "average" },
  ];
  // Someone who does not share sees their own line among the others; nobody else does.
  if (b.you.performance && !b.you.sharing) lines.push({ name: "You (not shared)", value: b.you.performance[period], kind: "you" });
  lines.sort((x, y) => (y.value ?? -Infinity) - (x.value ?? -Infinity));
  const reach = Math.max(0.01, ...lines.map((l) => Math.abs(l.value ?? 0)));
  let place = 0;

  return (
    <Section title="Shared portfolios" note={`${b.shared ? `${b.shared} shared so far` : "Nobody has shared a portfolio yet"}. Ranked by how today's holdings did: ${label.toLowerCase()}.`}>
      <WordTabs items={b.periods} value={period} onChange={onPick} />
      <View style={{ marginTop: space.sm }}>
        {lines.map((l, i) => {
          const m = l.member, ranked = l.kind === "member" || l.kind === "you";
          if (ranked) place++;
          const mine = l.kind === "you" || m?.you;
          const body = (
            <>
              <View style={styles.lineTop}>
                <Txt num size={13} tone="muted" style={{ width: 22 }}>{ranked ? String(place) : ""}</Txt>
                <View style={styles.who}>
                  <Txt size={14} weight={ranked ? "semibold" : "regular"} tone={ranked ? "strong" : "muted"} numberOfLines={1} style={{ flexShrink: 1 }}>{l.name}</Txt>
                  {m?.you ? <Chip text="you" /> : null}
                  {m?.stand_in ? <Txt size={11.5} tone="warn">sample</Txt> : null}
                  {l.kind === "index" ? <Txt size={11.5} tone="faint">index</Txt> : null}
                </View>
                <Txt num size={14} weight="medium" tone={ranked ? toneOf(l.value) : "muted"}>{signedPct(l.value, digits(period))}</Txt>
              </View>
              <View style={styles.bar} aria-hidden>
                <View style={{ height: 5, borderRadius: 3, width: `${Math.max(2, (Math.abs(l.value ?? 0) / reach) * 100)}%`,
                  backgroundColor: (l.value ?? 0) >= 0 ? color.up : color.down, opacity: ranked ? 1 : 0.4 }} />
              </View>
              {m ? (
                <Txt size={12} tone="muted" style={{ marginLeft: 22 + space.sm }} numberOfLines={1}>
                  {m.count} position{m.count > 1 ? "s" : ""}{m.top_sector ? ` · ${m.top_sector}` : ""}{m.stand_in ? "" : ` · ${timeAgo(m.updated_utc)}`}
                </Txt>
              ) : null}
              {m && open === m.handle ? (
                <View style={styles.holdings}>
                  {m.positions.map((p) => (
                    <View key={p.ticker} style={styles.holding}>
                      <Txt size={13} weight="semibold" tone="strong" style={{ width: 62 }} onPress={() => openQuote(p.ticker)} accessibilityRole="link">{p.ticker}</Txt>
                      <ShareBar weight={p.weight} />
                      <Txt num size={13} style={{ width: 52, textAlign: "right" }}>{pct(p.weight)}</Txt>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          );
          const style = [styles.line, i > 0 && styles.rule, mine && { backgroundColor: color.panel }];
          // A member's line opens onto what they hold.
          return m ? (
            <Pressable key={`${l.kind}:${l.name}`} onPress={() => setOpen(open === m.handle ? null : m.handle)} accessibilityRole="button"
              accessibilityState={{ expanded: open === m.handle }} style={style}>{body}</Pressable>
          ) : <View key={`${l.kind}:${l.name}`} style={style}>{body}</View>;
        })}
      </View>
      <Txt size={12.5} tone="muted" style={{ marginTop: space.md, lineHeight: 18 }}>A line opens onto what that portfolio holds. Every return is that of the holdings as they are now, held through the period: it ranks portfolios, not the trades behind them.</Txt>
    </Section>
  );
}

const styles = StyleSheet.create({
  rule: { borderTopWidth: 1, borderTopColor: color.line },
  steps: { borderWidth: 1, borderColor: color.line, borderRadius: 3 },
  step: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md },
  stepMark: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cells: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderLeftWidth: 1, borderColor: color.line },
  cell: { width: "50%", flexGrow: 1, padding: space.md, borderRightWidth: 1, borderBottomWidth: 1, borderColor: color.line },
  place: { height: 3, borderRadius: 2, backgroundColor: color.raised, marginTop: 12 },
  placeMiddle: { position: "absolute", left: "50%", top: -3, width: 1, height: 9, backgroundColor: color.lineStrong },
  placeDot: { position: "absolute", top: -3.5, width: 10, height: 10, marginLeft: -5, borderRadius: 5 },
  line: { paddingVertical: space.md, gap: 6 },
  lineTop: { flexDirection: "row", alignItems: "center", gap: space.sm },
  who: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: space.sm },
  bar: { marginLeft: 22 + space.sm, height: 5 },
  holdings: { marginLeft: 22 + space.sm, marginTop: space.sm, gap: 6 },
  holding: { flexDirection: "row", alignItems: "center", gap: space.md },
});
