import type {
  GameState,
  MissionMedal,
  MissionOutcome,
  RankGoal,
  ScoreBreakdown,
} from "./types";

const RANK_TARGETS = {
  B: 650,
  A: 900,
  S: 1200,
} as const;

/**
 * Evaluates the three authored Protect the Vault mastery goals from immutable
 * mission state. These are run achievements, so a player can keep a medal even
 * when the overall mission ends in defeat.
 */
export const calculateMissionMedals = (
  state: GameState,
): readonly MissionMedal[] => {
  const survivingUnits = state.units.filter((unit) => unit.hp > 0).length;

  if (state.objective.kind === "extract-object") {
    return [
      {
        id: "express-transfer",
        name: "Express Transfer",
        description: "Extract the Data Block by Turn 4.",
        earned: state.outcomeReason === "data-extracted" && state.completedEnemyPhases <= 3,
      },
      {
        id: "rig-untouched",
        name: "Rig Untouched",
        description: "Finish without the Extraction Rig taking damage.",
        earned: !state.vaultEverDamaged,
      },
      {
        id: "full-squad",
        name: "Full Escort",
        description: "Keep every operator alive.",
        earned: survivingUnits === state.initialSquadSize,
      },
    ];
  }

  if (state.objective.kind === "break-breach") {
    return [
      {
        id: "charge-broken",
        name: "Charge Broken",
        description: "Interrupt the Whale's locked cone.",
        earned: state.whaleChargeCancelled,
      },
      {
        id: "breach-window",
        name: "Breach Window",
        description: "Destroy the Whale by player Turn 4.",
        earned: state.outcomeReason === "breach-broken" && state.completedEnemyPhases <= 3,
      },
      {
        id: "full-squad",
        name: "Full Squad",
        description: "Keep every operator alive.",
        earned: survivingUnits === state.initialSquadSize,
      },
    ];
  }

  return [
    {
      id: "vault-untouched",
      name: "Vault Untouched",
      description: "Finish without the Vault taking damage.",
      earned: !state.vaultEverDamaged,
    },
    {
      id: "full-squad",
      name: "Full Squad",
      description: "Keep every operator alive.",
      earned: survivingUnits === state.initialSquadSize,
    },
    {
      id: "charge-broken",
      name: "Charge Broken",
      description: "Interrupt the Whale's locked cone.",
      earned: state.whaleChargeCancelled,
    },
  ];
};

const victoryRankForScore = (score: number): "S" | "A" | "B" =>
  score >= RANK_TARGETS.S
    ? "S"
    : score >= RANK_TARGETS.A
      ? "A"
      : "B";

/** Returns the next useful score target without duplicating rank rules in UI. */
export const calculateRankGoal = (
  score: ScoreBreakdown,
  outcome: MissionOutcome,
): RankGoal => {
  if (outcome === "defeat") {
    const nextRank = victoryRankForScore(score.total);
    const targetScore = RANK_TARGETS[nextRank];
    return {
      nextRank,
      targetScore,
      pointsNeeded: Math.max(0, targetScore - score.total),
      requiresVictory: true,
    };
  }

  const nextRank =
    score.rank === "S"
      ? null
      : score.rank === "A"
        ? "S"
        : score.rank === "B"
          ? "A"
          : "B";

  if (!nextRank) {
    return {
      nextRank: null,
      targetScore: null,
      pointsNeeded: 0,
      requiresVictory: false,
    };
  }

  const targetScore = RANK_TARGETS[nextRank];
  return {
    nextRank,
    targetScore,
    pointsNeeded: Math.max(0, targetScore - score.total),
    requiresVictory: false,
  };
};
