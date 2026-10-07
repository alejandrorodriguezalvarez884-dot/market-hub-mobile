// The entry for next month's competition: a name to play under, a few single stocks and the
// share of each. The portal checks it again; what is here is what it will ask for.
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CompanySearch } from "@/components/company-search";
import { Icon } from "@/components/marks";
import { Button, Field, Label, Panel, Txt } from "@/components/ui";
import { message } from "@/lib/api";
import { day, evenly, sendEntry, withdrawEntry, type Competition } from "@/lib/community";
import { confirm } from "@/lib/confirm";
import { tidyName, timeAgo } from "@/lib/format";
import { color, font, space } from "@/lib/theme";
import type { Company } from "@/lib/types";

// `even`: the weights have not been set by hand, so they are dealt evenly as stocks come and go.
type Draft = { handle: string; picks: { ticker: string; name: string; weight: number }[]; even: boolean };
type Said = { text: string; tone: "muted" | "down" | "up" };
const NAME = /^[A-Za-z0-9](?:[A-Za-z0-9_\-]| (?! )){1,18}[A-Za-z0-9]$/;

function left(until: string, now: number): string {
  const ms = Math.max(0, Date.parse(until) - now);
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return d ? `${d}d ${h}h` : `${h}h ${m}m ${s}s`;
}

export function EntryForm({ c, now, reload }: { c: Competition; now: number; reload: () => void }) {
  const { rules, open } = c;
  const [d, setD] = useState<Draft>(() => ({ handle: open.entry?.handle ?? c.name, picks: open.entry?.picks.map((p) => ({ ...p })) ?? [], even: !open.entry }));
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<Said | null>(null);

  const key = (handle: string, picks: { ticker: string; weight: number }[]) => JSON.stringify([handle, ...picks.map((p) => [p.ticker, p.weight])]);
  const saved = key(open.entry?.handle ?? "", open.entry?.picks ?? []) === key(d.handle.trim(), d.picks);
  const sum = d.picks.reduce((s, p) => s + p.weight, 0);
  const dealt = (picks: Draft["picks"]) => {
    const shares = evenly(picks.length || 1);
    return picks.map((p, i) => ({ ...p, weight: Math.min(rules.weight_max, shares[i]) }));
  };
  const change = (next: Partial<Draft>) => (setD({ ...d, ...next }), setSaid(null));
  const weigh = (ticker: string, weight: number) => change({ even: false, picks: d.picks.map((p) => (p.ticker === ticker ? { ...p, weight: Math.max(0, Math.min(100, Math.round(weight) || 0)) } : p)) });

  function add(company: Company) {
    if (d.picks.some((p) => p.ticker === company.ticker)) return setSaid({ text: `${company.ticker} is already in the portfolio.`, tone: "muted" });
    if (d.picks.length >= rules.picks_max) return setSaid({ text: `Up to ${rules.picks_max} stocks.`, tone: "down" });
    // A new stock takes what is left to place, within what one stock may be.
    const picks = [...d.picks, { ticker: company.ticker, name: company.name, weight: Math.min(rules.weight_max, Math.max(rules.weight_min, 100 - sum)) }];
    change({ picks: d.even ? dealt(picks) : picks });
  }
  const drop = (ticker: string) => {
    const picks = d.picks.filter((p) => p.ticker !== ticker);
    change({ picks: d.even ? dealt(picks) : picks });
  };

  const ok = {
    name: NAME.test(d.handle.trim()),
    count: d.picks.length >= rules.picks_min && d.picks.length <= rules.picks_max,
    each: d.picks.length > 0 && d.picks.every((p) => p.weight >= rules.weight_min && p.weight <= rules.weight_max),
    sum: sum === 100,
  };
  const ready = Object.values(ok).every(Boolean);

  async function send() {
    setBusy(true);
    setSaid({ text: "Sending…", tone: "muted" });
    try {
      await sendEntry(d.handle.trim(), d.picks.map(({ ticker, weight }) => ({ ticker, weight })));
      setSaid({ text: `Your entry for ${open.label} is in. You can change it until the end of ${day(c.running.ends, true)}.`, tone: "up" });
      reload();
    } catch (e) {
      setSaid({ text: message(e, "The entry could not be sent."), tone: "down" });
    } finally {
      setBusy(false);
    }
  }
  async function withdraw() {
    if (!(await confirm(`Take your entry for ${open.label} back?`, "", "Withdraw"))) return;
    await withdrawEntry().catch(() => {});
    setD({ handle: c.name, picks: [], even: true });
    setSaid(null);
    reload();
  }

  return (
    <Panel style={{ gap: space.lg }}>
      <View>
        <Txt size={14} weight="semibold" tone="strong">Your portfolio for {open.label}</Txt>
        <Txt size={12} tone="muted" style={{ marginTop: 2, lineHeight: 17 }}>
          {open.entry ? `Sent${open.entry.updated_utc ? ` ${timeAgo(open.entry.updated_utc)}` : ""}. You can change it until the end of ${day(c.running.ends, true)}, New York time.`
            : `Not sent yet. Entries close at the end of ${day(c.running.ends, true)}, New York time.`}
        </Txt>
        <Txt size={12.5} tone="muted" style={{ marginTop: 4 }}>Closes in <Txt num size={12.5} tone="strong">{left(open.closes_utc, now)}</Txt></Txt>
      </View>

      <View style={{ gap: 6 }}>
        <Label>The name you play under</Label>
        <Field value={d.handle} onChangeText={(handle) => change({ handle })} maxLength={20} placeholder="The name you play under" accessibilityLabel="The name you play under" autoCapitalize="words" />
      </View>
      <View style={{ gap: 6 }}>
        <Label>Add a stock</Label>
        <CompanySearch label="Add a stock: company or ticker" onPick={add} />
      </View>

      <View style={{ gap: 6 }}>
        <Label>The mix</Label>
        <View style={[styles.bar, sum > 100 && { borderColor: color.down }]} accessibilityRole="image" accessibilityLabel={d.picks.map((p) => `${p.ticker} ${p.weight}%`).join(", ") || "Empty"}>
          {d.picks.map((p, i) => (
            <View key={p.ticker} style={[styles.segment, { flexGrow: p.weight, opacity: Math.max(0.35, 1 - i * 0.07) }]}>
              {p.weight >= 14 ? <Txt size={11} weight="semibold" tone="page" numberOfLines={1}>{p.ticker}</Txt> : null}
            </View>
          ))}
          {sum < 100 ? (
            <View style={[styles.rest, { flexGrow: 100 - sum }]}>
              <Txt size={11.5} tone="muted" numberOfLines={1}>{sum ? `${100 - sum}% to place` : "Empty: add your first stock"}</Txt>
            </View>
          ) : null}
        </View>
      </View>

      <View>
        {d.picks.length ? d.picks.map((p) => (
          <View key={p.ticker} style={styles.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={15} weight="semibold" tone="strong">{p.ticker}</Txt>
              <Txt size={12} tone="muted" numberOfLines={1}>{tidyName(p.name)}</Txt>
            </View>
            <Pressable onPress={() => weigh(p.ticker, p.weight - 1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`One percent less of ${p.ticker}`} style={styles.step}><Txt size={18} tone="strong">−</Txt></Pressable>
            <Field value={String(p.weight)} onChangeText={(text) => weigh(p.ticker, Number(text.replace(/[^0-9]/g, "")))} keyboardType="number-pad" maxLength={3}
              accessibilityLabel={`Weight of ${p.ticker}, in percent`} style={styles.weight} />
            <Pressable onPress={() => weigh(p.ticker, p.weight + 1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`One percent more of ${p.ticker}`} style={styles.step}><Txt size={18} tone="strong">+</Txt></Pressable>
            <Txt size={13} tone="muted">%</Txt>
            <Pressable onPress={() => drop(p.ticker)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${p.ticker}`} style={styles.remove}><Icon name="close" size={18} /></Pressable>
          </View>
        )) : <Txt size={13} tone="muted" style={styles.none}>Search a company or a ticker to add it. Single stocks only: no funds.</Txt>}
      </View>

      <View style={{ gap: 8 }}>
        <Label>What an entry needs</Label>
        <Check met={ok.name} text="A name of 3 to 20 letters, digits, spaces, hyphens or underscores" />
        <Check met={ok.count} text={`${rules.picks_min} to ${rules.picks_max} single stocks (${d.picks.length} now)`} />
        <Check met={ok.each} text={`Each one between ${rules.weight_min}% and ${rules.weight_max}%`} />
        <Check met={ok.sum} text={`Weights that add up to 100% (${sum}% now)`} />
      </View>

      <View style={{ gap: space.sm }}>
        <Button title={open.entry ? (saved ? "Entry sent" : "Update my entry") : `Send my entry for ${open.label.split(" ")[0]}`} onPress={send} busy={busy} disabled={!ready || saved} />
        <Button title="Equal weights" kind="ghost" onPress={() => change({ even: true, picks: dealt(d.picks) })} disabled={!d.picks.length} />
        {open.entry ? <Button title="Withdraw my entry" kind="ghost" onPress={withdraw} /> : null}
        {said ? <Txt size={13} tone={said.tone} accessibilityLiveRegion="polite" style={{ lineHeight: 19 }}>{said.text}</Txt> : null}
      </View>
      <Txt size={12.5} tone="muted" style={{ lineHeight: 18 }}>
        It plays {open.label}, from the last close before it to its last close. Others see your name, your stocks and their weights once the month starts; until then, only that you are in.
      </Txt>
    </Panel>
  );
}

function Check({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }} accessibilityLabel={`${met ? "Met" : "Not met"}: ${text}`}>
      <View style={[styles.check, met && { borderColor: color.up }]}>{met ? <Txt size={10} tone="up">✓</Txt> : null}</View>
      <Txt size={13} tone={met ? "ink" : "muted"} style={{ flex: 1, lineHeight: 18 }}>{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", height: 36, borderWidth: 1, borderColor: color.line, borderRadius: 3, backgroundColor: color.panel, overflow: "hidden" },
  segment: { flexBasis: 0, alignItems: "center", justifyContent: "center", backgroundColor: color.inkStrong, borderRightWidth: 1, borderRightColor: color.page, overflow: "hidden" },
  rest: { flexBasis: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: color.line },
  step: { width: 34, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color.lineStrong, borderRadius: 3 },
  weight: { width: 54, textAlign: "center", fontFamily: font.mono, fontSize: 15, paddingHorizontal: 4 },
  remove: { width: 30, height: 44, alignItems: "center", justifyContent: "center" },
  none: { paddingVertical: space.xl, textAlign: "center", borderBottomWidth: 1, borderBottomColor: color.line },
  check: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: color.lineStrong, alignItems: "center", justifyContent: "center" },
});
