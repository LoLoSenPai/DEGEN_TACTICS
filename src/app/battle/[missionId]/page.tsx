import { notFound } from "next/navigation";
import { BattleClient } from "@/components/battle/BattleClient";
import { isMissionId } from "@/lib/game";
import "@/components/battle/battle.css";
import "@/components/battle/battle-tutorial.css";

type BattlePageProps = {
  params: Promise<{ missionId: string }>;
};

export default async function BattlePage({ params }: BattlePageProps) {
  const { missionId } = await params;
  if (!isMissionId(missionId)) notFound();
  return <BattleClient key={missionId} requestedMissionId={missionId} />;
}
