import { BattleClient } from "@/components/battle/BattleClient";
import "@/components/battle/battle.css";
import "@/components/battle/battle-tutorial.css";

type BattlePageProps = {
  searchParams: Promise<{ mission?: string | string[] }>;
};

export default async function ProtectTheVaultBattlePage({ searchParams }: BattlePageProps) {
  const params = await searchParams;
  const requestedMissionId = typeof params.mission === "string" ? params.mission : undefined;
  return <BattleClient key={requestedMissionId ?? "protect-the-vault"} requestedMissionId={requestedMissionId} />;
}
