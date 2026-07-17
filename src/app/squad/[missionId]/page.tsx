import { notFound } from "next/navigation";
import { SquadSelectScreen } from "@/components/menu/SquadSelectScreen";
import { isPlayableMissionId } from "@/lib/game";
import "@/components/menu/squad-select-screen.css";

type SquadPageProps = {
  params: Promise<{ missionId: string }>;
};

export default async function SquadPage({ params }: SquadPageProps) {
  const { missionId } = await params;
  if (!isPlayableMissionId(missionId)) notFound();
  return <SquadSelectScreen key={missionId} missionId={missionId} />;
}
