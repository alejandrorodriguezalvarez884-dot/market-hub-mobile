// The account: who is signed in, the way out, and the way to take everything down.
import { openBrowserAsync } from "expo-web-browser";
import { useState } from "react";
import { View } from "react-native";

import { Button, Label, Notice, Screen, Section, Txt } from "@/components/ui";
import { SITE, api, message } from "@/lib/api";
import { confirm } from "@/lib/confirm";
import { useSession } from "@/lib/session";
import { space } from "@/lib/theme";

export default function Account() {
  const { user, signOut } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    const sure = await confirm("Delete your account?", "Your positions, your watchlist, what you share in Community and your comments are deleted for good. This cannot be undone.", "Delete");
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
          <Label style={{ marginTop: space.sm }}>{user?.provider === "password" ? "With an email and a password" : "With Google"}</Label>
        </View>
        <Button title="Sign out" kind="ghost" onPress={() => void signOut()} style={{ marginTop: space.lg }} />
      </Section>

      <Section title="Your data" note="The app keeps only your sign-in, in this phone's keychain. What Market Hub keeps of yours, and what for, is on its privacy page.">
        <Button title="Read the privacy page" kind="ghost" onPress={() => void openBrowserAsync(`${SITE}/privacy/`)} />
      </Section>

      <Section title="Delete account" note="Deletes your account and everything saved with it, here and on themarkethub.app.">
        {error ? <View style={{ marginBottom: space.md }}><Notice text={error} /></View> : null}
        <Button title="Delete my account" kind="danger" onPress={remove} busy={deleting} />
      </Section>
    </Screen>
  );
}
