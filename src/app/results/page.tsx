"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ResultsView, type ResultsDisplayData } from "@/components/results/ResultsView";
import { useGameStore } from "@/store/gameStore";
import "@/components/results/results.css";

export default function ResultsPage() {
  const router = useRouter();
  const retrying = useRef(false);
  const hydrated = useGameStore((state) => state.hydrated);
  const result = useGameStore((state) => state.lastResult);
  const bestScores = useGameStore((state) => state.bestScores);
  const startMission = useGameStore((state) => state.startMission);

  useEffect(() => {
    if (hydrated && !result && !retrying.current) router.replace("/");
  }, [hydrated, result, router]);

  if (!hydrated || !result) {
    return (
      <main className="game-results result-loading" aria-live="polite">
        <div className="result-loader-mark" aria-hidden="true" />
        <p>Loading result</p>
      </main>
    );
  }

  const display: ResultsDisplayData = {
    outcome: result.outcome,
    score: result.score.total,
    rank: result.score.rank,
    vaultHp: result.vaultHp,
    vaultMaxHp: result.vaultMaxHp,
    turnsSurvived: result.turnsSurvived,
    enemiesDefeated: result.enemiesDefeated,
    unitsLost: result.lostUnits,
    bestScore: bestScores[result.missionId] ?? 0,
    breakdown: [
      { label: "Mission completed", value: result.score.victory },
      { label: "Vault integrity", value: result.score.vaultIntegrity },
      { label: "Enemies neutralized", value: result.score.enemiesDefeated },
      { label: "Surviving squad", value: result.score.survivingUnits },
      { label: "No operators lost", value: result.score.flawlessSquad },
      { label: "Untouched Vault", value: result.score.untouchedVault },
      { label: "Casualty penalty", value: result.score.lostUnits },
    ],
  };

  const retry = () => {
    retrying.current = true;
    startMission();
    window.location.replace("/battle/protect-the-vault");
  };

  return <ResultsView result={display} onRetry={retry} />;
}
