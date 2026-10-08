// The account: who is signed in, everything the portal keeps of them, a new password for an
// account that has one, the way out, and the way to take everything down.
import { useRouter } from "expo-router";
import { useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type TextInput } from "react-native";

import { Button, Field, Label, Notice, Screen, Section, Txt } from "@/components/ui";
import { SITE, api, message } from "@/lib/api";
import type { Entry } from "@/lib/community";
import { confirm } from "@/lib/confirm";
import { openPage } from "@/lib/hub";
import { useLoad } from "@/lib/load";
import { useSession } from "@/lib/session";
import { color, space } from "@/lib/theme";
import type { Portfolio, Sharing } from "@/lib/types";

type Mine = { id: string; slug: string; text: string; created_utc: string };
type Kept = { portfolio: Portfolio; sharing: Sharing; entries: Entry[]; comments: Mine[] };

// What is saved now. The portfolio has to come; the rest is shown as empty if it does not.
async function getKept(): Promise<Kept> {
  const [portfolio, sharing, played, said] = await Promise.all([
    api<Portfolio>("/api/portfolio"),
    api<Sharing>("/api/sharing").catch(() => ({ enabled: false, handle: "", since_utc: null })),
    api<{ entries: Entry[] }>("/api/competitions/mine").catch(() => ({ entries: [] })),
    api<{ comments: Mine[] }>("/api/opinion/mine").catch(() => ({ comments: [] })),
  ]);
  return { portfolio, sharing, entries: played.entries, comments: said.comments };
}

const month = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const COMPETITION = "competition-"; // the thread of a month of the competition, among the articles'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Label style={styles.rowLabel}>{label}</Label>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>{children}</View>
    </View>
  );
}
const Value = ({ children }: { children: ReactNode }) => <Txt size={13.5} tone="strong" style={{ lineHeight: 19 }}>{children}</Txt>;

export default function Account() {
  const { user, signOut } = useSession();
  const router = useRouter();
  const { data: kept, error: unread } = useLoad(getKept);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const own = user?.provider === "password";
  const community = () => router.navigate("/community");

  async function remove() {
    const sure = await confirm("Delete your account?", "Your positions, your watchlist, what you share in Community, your entries to the competition and your comments are deleted for good. This cannot be undone.", "Delete");
    if (!sure) return;
    setDeleting(true);
    setError(null);
    try {
      await api("/api/me", { method: "DELETE" });
      await signOut();
    } catch (e) {
      setError(message(e, "The account could not be deleted."));
      setDeleting(false);
    }
  }

  return (
    <Screen headed>
      <Section title="Signed in as">
        <View style={{ gap: 2 }}>
          <Txt size={16} weight="semibold" tone="strong">{user?.name}</Txt>
          <Txt size={14} tone="muted">{user?.email}</Txt>
          <Label style={{ marginTop: space.sm }}>{own ? "With an email and a password" : "With Google"}</Label>
        </View>
        <Button title="Sign out" kind="ghost" onPress={() => void signOut()} style={{ marginTop: space.lg }} />
      </Section>

      <Section title="What we keep" note="Everything stored about you on themarkethub.app, as saved now. The app itself keeps only your sign-in, in this phone's keychain.">
        {unread ? <View style={{ marginBottom: space.md }}><Notice text={unread} /></View> : null}
        <Row label="Name"><Value>{user?.name}</Value></Row>
        <Row label="Email"><Value>{user?.email}</Value></Row>
        <Row label="Sign-in"><Value>{own ? "With this email and a password. We keep the password scrambled, never as you typed it." : "With Google. We keep no password."}</Value></Row>
        {kept ? (
          <>
            <Row label="Positions"><Value>{kept.portfolio.positions.map((x) => `${x.ticker} (${x.shares})`).join(", ") || "None"}</Value></Row>
            <Row label="Watchlist"><Value>{kept.portfolio.watchlist.join(", ") || "None"}</Value></Row>
            <Row label="Shared portfolio">
              <Value>{kept.sharing.enabled ? `Shared as "${kept.sharing.handle}": your tickers and their weights, to signed-in members.` : "Not shared."}</Value>
              <Txt size={13} tone="muted" style={styles.link} accessibilityRole="link" onPress={community}>{kept.sharing.enabled ? "Change it" : "About sharing"}</Txt>
            </Row>
            <Row label="Competition">
              {kept.entries.length ? kept.entries.slice(0, 12).map((e) => (
                <Value key={e.month}>{month(e.month)}, as &quot;{e.handle}&quot;: {e.picks.map((p) => `${p.ticker} ${p.weight}%`).join(", ")}</Value>
              )) : <Value>No entries.</Value>}
            </Row>
            <Row label="Comments">
              <Value>{kept.comments.length
                ? `${kept.comments.length}: under articles they are public, with your first name; in the competition members see them, with the name you play under.` : "None"}</Value>
              {kept.comments.slice(0, 20).map((c) => (
                <Pressable key={c.id} hitSlop={4} accessibilityRole="link"
                  onPress={() => (c.slug.startsWith(COMPETITION) ? community() : openPage(`${SITE}/opinion/article/?slug=${encodeURIComponent(c.slug)}`))}>
                  <Txt size={13} tone="muted" numberOfLines={1} style={styles.link}>{c.text}</Txt>
                </Pressable>
              ))}
            </Row>
          </>
        ) : unread ? null : <View style={styles.waiting} accessibilityLabel="Loading" />}
        <Button title="Read the privacy page" kind="ghost" onPress={() => openPage(`${SITE}/privacy/`)} style={{ marginTop: space.lg }} />
      </Section>

      {own ? <NewPassword /> : null}

      <Section title="Delete account" note="Removes your positions, watchlist and profile at once, takes your portfolio off the community board, removes your entries to the competition and empties the comments you wrote. Signing in again later starts from zero.">
        {error ? <View style={{ marginBottom: space.md }}><Notice text={error} /></View> : null}
        <Button title="Delete my account" kind="danger" onPress={remove} busy={deleting} />
      </Section>
    </Screen>
  );
}

// An account of the portal's own can change its password: it takes the one it has now.
function NewPassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<{ text: string; done: boolean } | null>(null);
  const second = useRef<TextInput>(null);

  async function change() {
    if (!current || !next) return setSaid({ text: "Your current password and the new one, please.", done: false });
    setBusy(true);
    setSaid(null);
    try {
      await api("/api/auth/password", { method: "PUT", body: { current, new: next }, stays: true });
      setCurrent("");
      setNext("");
      setSaid({ text: "Changed. This phone and your other devices stay signed in until their session ends.", done: true });
    } catch (e) {
      setSaid({ text: message(e, "That did not work."), done: false });
    }
    setBusy(false);
  }

  return (
    <Section title="Change your password" note="It takes your current one. We cannot send you a new one if you forget it.">
      <View style={{ gap: space.md }}>
        <View style={{ gap: 6 }}>
          <Label>Current password</Label>
          <Field accessibilityLabel="Current password" value={current} onChangeText={setCurrent} maxLength={200} secureTextEntry textContentType="password"
            autoComplete="current-password" returnKeyType="next" onSubmitEditing={() => second.current?.focus()} submitBehavior="submit" />
        </View>
        <View style={{ gap: 6 }}>
          <Label>New password, at least 10 characters</Label>
          <Field ref={second} accessibilityLabel="New password, at least 10 characters" value={next} onChangeText={setNext} maxLength={200} secureTextEntry
            textContentType="newPassword" autoComplete="new-password" returnKeyType="done" />
        </View>
        {said ? (said.done ? <Txt size={13} tone="up" accessibilityRole="alert">{said.text}</Txt> : <Notice text={said.text} />) : null}
        <Button title="Change password" kind="ghost" onPress={change} busy={busy} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.md, paddingVertical: 7 },
  rowLabel: { width: 104, lineHeight: 19 },
  link: { textDecorationLine: "underline" },
  waiting: { height: 120, borderRadius: 2, backgroundColor: color.raised, marginTop: space.sm },
});
