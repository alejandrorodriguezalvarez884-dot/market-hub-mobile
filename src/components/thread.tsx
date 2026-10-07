// A thread of comments: a box to write in, and the comments nested under the ones they answer.
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button, Field, Txt } from "@/components/ui";
import { message } from "@/lib/api";
import { removeComment, type Comment, type Thread as ThreadData } from "@/lib/community";
import { confirm } from "@/lib/confirm";
import { timeAgo } from "@/lib/format";
import { color, space } from "@/lib/theme";

const DEPTH_MAX = 6; // as the server's: below this a thread is answered further up

type Source = { load: () => Promise<ThreadData>; post: (text: string, parent: string | null) => Promise<unknown>; note: string; ask: string; none: string };

function Composer({ parent, src, onSent, onCancel }: { parent: string | null; src: Source; onSent: () => void; onCancel?: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await src.post(text, parent);
      setText("");
      onSent();
    } catch (e) {
      setError(message(e, "The comment could not be sent."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: space.sm }}>
      <Field value={text} onChangeText={setText} multiline maxLength={2000} placeholder={parent ? "Write your answer" : src.ask} accessibilityLabel={parent ? "Write your answer" : src.ask}
        autoCapitalize="sentences" autoCorrect style={styles.box} />
      <View style={styles.actions}>
        <Button title={parent ? "Answer" : "Comment"} onPress={send} busy={busy} disabled={!text.trim()} />
        {onCancel ? <Button title="Cancel" kind="ghost" onPress={onCancel} /> : null}
      </View>
      {error ? <Txt size={13} tone="down" accessibilityRole="alert">{error}</Txt> : <Txt size={12.5} tone="muted">{src.note}</Txt>}
    </View>
  );
}

export function Thread({ src }: { src: Source }) {
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [answering, setAnswering] = useState<string | null>(null);
  const load = useCallback(() => {
    src.load().then(setThread).catch(() => {});
    // The source is made anew on every draw; what it reads does not change within a month.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(load, [load]);
  if (!thread) return null;

  const children = new Map<string | null, Comment[]>();
  for (const c of thread.comments) children.set(c.parent_id, [...(children.get(c.parent_id) ?? []), c]);
  // A deleted comment with nothing under it leaves no trace.
  const kept = (c: Comment): boolean => !c.deleted || (children.get(c.id) ?? []).some(kept);
  for (const [k, list] of children) children.set(k, list.filter(kept));
  const top = [...(children.get(null) ?? [])].reverse(); // the newest conversation first; its answers in order

  async function remove(c: Comment) {
    if (!(await confirm("Delete this comment?", "", "Delete"))) return;
    await removeComment(c.id).catch(() => {});
    load();
  }

  const one = (c: Comment) => {
    const under = children.get(c.id) ?? [];
    return (
      <View key={c.id} style={{ paddingTop: space.lg }}>
        <View style={styles.head}>
          {c.deleted ? <Txt size={12.5} tone="muted">Deleted</Txt> : (
            <>
              <View style={styles.initial}><Txt size={11} tone="strong">{c.name.charAt(0).toUpperCase()}</Txt></View>
              <Txt size={12.5} weight="medium" tone="strong">{c.name}</Txt>
            </>
          )}
          <Txt num size={12} tone="muted">{timeAgo(c.created_utc)}</Txt>
        </View>
        {c.deleted ? null : <Txt size={15} style={{ marginTop: 6, lineHeight: 22 }}>{c.text}</Txt>}
        {c.deleted ? null : (
          <View style={styles.links}>
            {thread.signed_in && c.depth < DEPTH_MAX ? <Txt size={12.5} tone="muted" accessibilityRole="button" onPress={() => setAnswering(c.id)}>Answer</Txt> : null}
            {c.mine || thread.moderator ? <Txt size={12.5} tone="muted" accessibilityRole="button" onPress={() => remove(c)}>Delete</Txt> : null}
          </View>
        )}
        {answering === c.id ? <View style={{ marginTop: space.md }}><Composer parent={c.id} src={src} onSent={() => (setAnswering(null), load())} onCancel={() => setAnswering(null)} /></View> : null}
        {/* Answers hang from a rule at the left of what they answer, as deep as the thread goes. */}
        {under.length ? <View style={styles.under}>{under.map(one)}</View> : null}
      </View>
    );
  };

  return (
    <View>
      {thread.signed_in ? <Composer parent={null} src={src} onSent={load} /> : null}
      {top.length ? top.map(one) : <Txt size={14} tone="muted" style={{ marginTop: space.lg }}>{src.none}</Txt>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: 84, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: space.sm },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  initial: { width: 24, height: 24, borderRadius: 12, backgroundColor: color.raised, alignItems: "center", justifyContent: "center" },
  links: { flexDirection: "row", gap: space.lg, marginTop: 6 },
  under: { marginLeft: 6, paddingLeft: space.md, borderLeftWidth: 1, borderLeftColor: color.line },
});
