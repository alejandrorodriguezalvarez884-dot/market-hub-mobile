// Community: the portfolios their owners chose to share, and the monthly competition.
import { useState } from "react";

import { Competition } from "@/components/competition";
import { SharedPortfolios } from "@/components/shared-portfolios";
import { Head, Notice, Screen, Waiting, WordTabs } from "@/components/ui";
import { getBoard, getCompetition } from "@/lib/community";
import { useLoad } from "@/lib/load";

type Part = "portfolios" | "competition";
const PARTS: { key: Part; label: string }[] = [{ key: "portfolios", label: "Shared portfolios" }, { key: "competition", label: "Monthly competition" }];

export default function Community() {
  const [part, setPart] = useState<Part>("portfolios");
  return part === "portfolios" ? <Portfolios part={part} onPart={setPart} /> : <Game part={part} onPart={setPart} />;
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
