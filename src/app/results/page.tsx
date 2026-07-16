"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ResultsView, type ResultsDisplayData } from "@/components/results/ResultsView";
import {
  calculateRankGoal,
  getBattleHref,
  getFollowingOperationId,
  getMissionDefinition,
  getOperationMetadata,
} from "@/lib/game";
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
    if (hydrated && !result && !retrying.current) router.replace("/operations");
  }, [hydrated, result, router]);

  if (!hydrated || !result) {
    return (
      <main className="game-results result-loading" aria-live="polite">
        <div className="result-loader-mark" aria-hidden="true" />
        <p>Loading result</p>
      </main>
    );
  }

  const mission = getMissionDefinition(result.missionId);
  const operation = getOperationMetadata(result.missionId);
  const followingOperationId = result.outcome === "victory"
    ? getFollowingOperationId(result.missionId)
    : null;
  const followingOperation = followingOperationId
    ? getOperationMetadata(followingOperationId)
    : null;
  const integrityLabel = operation?.integrityLabel ?? mission.vault.name;

  const display: ResultsDisplayData = {
    missionId: result.missionId,
    missionEyebrow: operation?.eyebrow ?? "Operation complete",
    missionTitle: operation?.title ?? mission.name,
    missionObjective: operation?.shortObjective ?? mission.name,
    resultTitle: result.outcome === "victory"
      ? (operation?.victoryTitle ?? "Mission Complete")
      : (operation?.defeatTitle ?? "Mission Failed"),
    resultMessage: result.outcome === "victory"
      ? (operation?.victoryMessage ?? "Objective secured.")
      : (operation?.defeatMessage ?? "Regroup and try again."),
    outcome: result.outcome,
    score: result.score.total,
    rank: result.score.rank,
    integrityLabel,
    vaultHp: result.vaultHp,
    vaultMaxHp: result.vaultMaxHp,
    turnLabel: mission.objective.kind === "extract-object"
      ? result.outcome === "victory" ? "Extracted" : "Window"
      : "Turns",
    turnsSurvived: mission.objective.kind === "extract-object" && result.outcome === "victory"
      ? Math.min(mission.maxTurns, result.turnsSurvived + 1)
      : result.turnsSurvived,
    maxTurns: mission.maxTurns,
    enemiesDefeated: result.enemiesDefeated,
    unitsLost: result.lostUnits,
    bestScore: bestScores[result.missionId] ?? 0,
    medals: result.medals,
    rankGoal: calculateRankGoal(result.score, result.outcome),
    breakdown: [
      { label: "Mission completed", value: result.score.victory },
      { label: `${integrityLabel} integrity`, value: result.score.vaultIntegrity },
      { label: "Enemies neutralized", value: result.score.enemiesDefeated },
      { label: "Surviving squad", value: result.score.survivingUnits },
      { label: "No operators lost", value: result.score.flawlessSquad },
      { label: `Untouched ${integrityLabel}`, value: result.score.untouchedVault },
      ...(result.score.tempo > 0
        ? [{ label: "Express extraction", value: result.score.tempo }]
        : []),
      { label: "Casualty penalty", value: result.score.lostUnits },
    ],
    nextOperation: followingOperationId && followingOperation
      ? {
          id: followingOperationId,
          eyebrow: followingOperation.eyebrow,
          title: followingOperation.title,
          objective: followingOperation.shortObjective,
        }
      : null,
  };

  const retry = () => {
    retrying.current = true;
    startMission(result.missionId);
    window.location.replace(getBattleHref(result.missionId));
  };

  const continueToNextOperation = followingOperationId
    ? () => {
        retrying.current = true;
        startMission(followingOperationId);
        const href = getBattleHref(followingOperationId);
        window.location.replace(`${href}${href.includes("?") ? "&" : "?"}intro=1`);
      }
    : undefined;

  return (
    <ResultsView
      result={display}
      onRetry={retry}
      onNextOperation={continueToNextOperation}
    />
  );
}
