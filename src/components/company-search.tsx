// The search box: a ticker or a company's name. The suggestions are the portal's (the SEC's list
// of companies listed in the US); choosing one hands it to the screen.
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/marks";
import { Field, Txt } from "@/components/ui";
import { api, message } from "@/lib/api";
import { tidyName } from "@/lib/format";
import { color, radius, space } from "@/lib/theme";
import type { Company } from "@/lib/types";

export function CompanySearch({ label, onPick }: { label: string; onPick: (c: Company) => void }) {
  const [q, setQ] = useState("");
  // What the portal answered, and to what: an answer to something no longer typed is not shown.
  const [answer, setAnswer] = useState<{ to: string; found: Company[]; note: string | null } | null>(null);
  const asked = q.trim();
  const { found, note } = answer?.to === asked ? answer : { found: [], note: null };

  useEffect(() => {
    if (!asked) return;
    let alive = true;
    // Asked once the typing pauses, and only the last answer is kept.
    const timer = setTimeout(() => {
      api<{ companies: Company[] }>(`/api/search?q=${encodeURIComponent(asked)}`)
        .then((r) => alive && setAnswer({ to: asked, found: r.companies.slice(0, 6), note: r.companies.length ? null : `No company matches "${asked}".` }))
        .catch((e) => alive && setAnswer({ to: asked, found: [], note: message(e, "The search is not answering.") }));
    }, 220);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [asked]);

  const pick = (c: Company) => {
    setQ("");
    onPick({ ticker: c.ticker, name: tidyName(c.name) });
  };

  return (
    <View>
      <View style={styles.box}>
        <Icon name="search" size={18} />
        <Field accessibilityLabel={label} placeholder="Company or ticker: Apple, MSFT, SPY…" value={q} onChangeText={setQ} 
          returnKeyType="search" onSubmitEditing={() => found[0] && pick(found[0])} style={styles.input} />
      </View>
      {found.length ? (
        <View style={styles.list} accessibilityRole="list">
          {found.map((c, i) => (
            <Pressable key={c.ticker} onPress={() => pick(c)} accessibilityRole="button" accessibilityLabel={`Add ${c.ticker}, ${tidyName(c.name)}`}
              style={({ pressed }) => [styles.item, i > 0 && styles.itemRule, pressed && { backgroundColor: color.raised }]}>
              <Txt size={14} weight="semibold" tone="strong" style={{ width: 64 }}>{c.ticker}</Txt>
              <Txt size={13} tone="muted" numberOfLines={1} style={{ flex: 1 }}>{tidyName(c.name)}</Txt>
              <Txt size={13} tone="strong">Add</Txt>
            </Pressable>
          ))}
        </View>
      ) : null}
      {note ? <Txt size={12} tone="muted" style={{ marginTop: space.sm }}>{note}</Txt> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: space.sm, borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius, paddingLeft: 12 },
  input: { flex: 1, borderWidth: 0, paddingLeft: 0 },
  list: { marginTop: 6, borderWidth: 1, borderColor: color.line, borderRadius: radius, backgroundColor: color.panel },
  item: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 44, paddingHorizontal: 12 },
  itemRule: { borderTopWidth: 1, borderTopColor: color.line },
});
