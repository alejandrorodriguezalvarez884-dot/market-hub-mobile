// Community: the portfolios their owners chose to share, the monthly competition and the bot competition.
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { Bots } from "@/components/bots";
import { Competition } from "@/components/competition";
import { SharedPortfolios } from "@/components/shared-portfolios";
import { Head, Notice, Screen, Txt, Waiting, WordTabs } from "@/components/ui";
import { botBoard, refreshBots } from "@/lib/bots";
import { getBoard, getCompetition } from "@/lib/community";
import { useLoad } from "@/lib/load";

type Part = "portfolios" | "competition" | "bots";
const PARTS: { key: Part; label: string }[] = [
  { key: "portfolios", label: "Shared portfolios" }, { key: "competition", label: "Monthly competition" }, { key: "bots", label: "Bot competition" },
];

export default function Community() {
  // A link from elsewhere in the app may name the section to open on (`/community?part=bots`).
  const asked = useLocalSearchParams<{ part?: string }>().part;
  const named = PARTS.find((p) => p.key === asked)?.key;
  const [part, setPart] = useState<Part>(named ?? "portfolios");
  const [followed, setFollowed] = useState(named);
  if (named !== followed) {
    setFollowed(named);
    if (named) setPart(named);
  }
  if (part === "portfolios") return <Portfolios part={part} onPart={setPart} />;
  return part === "competition" ? <Game part={part} onPart={setPart} /> : <Robots part={part} onPart={setPart} />;
}

type Props = { part: Part; onPart: (p: Part) => void };

function Portfolios({ part, onPart }: Props) {
  const { data: b, error, refreshing, refresh } = useLoad(getBoard);
  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Head title="Community" note="Portfolios their owners chose to share, and where yours stands among them." sample={b?.sample} />
      <WordTabs items={PARTS} value={part} onChange={onPart} />
      {error ? <Notice text={error} /> : null}
      {b ? <SharedPortfolios b={b} reload={refresh} /> : error ? null : <Waiting />}
    </Screen>
  );
}

function Game({ part, onPart }: Props) {
  const { data: c, error, refreshing, refresh } = useLoad(getCompetition);
  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Head title="Community" note="A portfolio of single stocks, one month, and the best return wins it." sample={c?.sample} />
      <WordTabs items={PARTS} value={part} onChange={onPart} />
      {error ? <Notice text={error} /> : null}
      {c ? <Competition c={c} reload={refresh} /> : error ? null : <Waiting />}
    </Screen>
  );
}

function Robots({ part, onPart }: Props) {
  const { data: b, error, refreshing, refresh } = useLoad(botBoard);
  const [moving, setMoving] = useState(false);
  const asked = useRef(false);
  // A visit that finds the bots behind the last close moves them on, then shows them again (once).
  useEffect(() => {
    if (!b?.stale || asked.current) return;
    asked.current = true;
    setMoving(true);
    void refreshBots().catch(() => null).then(() => {
      setMoving(false);
      refresh();
    });
  }, [b, refresh]);
  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Head title="Community" note="Bots built with an AI agent, run on paper by Market Hub and ranked from the close after each was sent in." sample={b?.sample} />
      <WordTabs items={PARTS} value={part} onChange={onPart} />
      {moving ? <Txt size={12.5} tone="muted">Moving the bots on to the last close…</Txt> : null}
      {error ? <Notice text={error} /> : null}
      {b ? <Bots b={b} reload={refresh} /> : error ? null : <Waiting />}
    </Screen>
  );
}
