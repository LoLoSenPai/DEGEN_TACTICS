import type {
  GameState,
  MissionOutcome,
  MissionResult,
  ScoreBreakdown,
} from "./types";
import { calculateMissionMedals } from "./mastery";

export const calculateScore = (
  state: GameState,
  outcome: MissionOutcome,
): ScoreBreakdown => {
  const survivingUnitCount = state.units.filter((unit) => unit.hp > 0).length;
  const lostUnitCount = Math.max(0, state.initialSquadSize - survivingUnitCount);
  const victory = outcome === "victory" ? 500 : 0;
  const integrityQuartiles = Math.ceil(
    (Math.max(0, state.vault.hp) / state.vault.maxHp) * 4,
  );
  const integrityQuartileValue = state.objective.kind === "extract-object"
    ? 25
    : state.objective.kind === "break-breach"
      ? 50
      : 100;
  const vaultIntegrity = integrityQuartiles * integrityQuartileValue;
  const enemiesDefeated = state.defeatedEnemies * 75;
  const survivingUnits = survivingUnitCount * 50;
  const flawlessSquad = lostUnitCount === 0 ? 100 : 0;
  const untouchedVault = !state.vaultEverDamaged ? 100 : 0;
  const tempo = outcome !== "victory"
    ? 0
    : state.objective.kind === "extract-object"
      ? Math.max(0, state.maxTurns - state.completedEnemyPhases) * 100
      : state.objective.kind === "break-breach"
        ? Math.max(0, state.objective.enemyPhases - state.completedEnemyPhases) * 50
        : 0;
  const lostUnits = lostUnitCount === 0 ? 0 : lostUnitCount * -50;
  const total =
    victory +
    vaultIntegrity +
    enemiesDefeated +
    survivingUnits +
    flawlessSquad +
    untouchedVault +
    tempo +
    lostUnits;
  const rank: ScoreBreakdown["rank"] =
    outcome !== "victory"
      ? "C"
      : total >= 1200
        ? "S"
        : total >= 900
          ? "A"
          : total >= 650
            ? "B"
            : "C";

  return {
    victory,
    vaultIntegrity,
    enemiesDefeated,
    survivingUnits,
    flawlessSquad,
    untouchedVault,
    tempo,
    lostUnits,
    total,
    rank,
  };
};

export const createMissionResult = (
  state: GameState,
  outcome: MissionOutcome = state.phase === "victory" ? "victory" : "defeat",
  outcomeReason: GameState["outcomeReason"] = state.outcomeReason,
): MissionResult => {
  const score = calculateScore(state, outcome);
  const survivingUnits = state.units.filter((unit) => unit.hp > 0).length;
  const reason =
    outcomeReason ??
    (outcome === "victory"
      ? state.objective.kind === "extract-object"
        ? "data-extracted"
        : state.objective.kind === "break-breach"
          ? "breach-broken"
          : "survived-five-turns"
      : state.vault.hp <= 0
        ? "vault-destroyed"
        : state.units.every((unit) => unit.hp <= 0)
          ? "squad-eliminated"
          : state.objective.kind === "extract-object"
            ? "extraction-timeout"
            : state.objective.kind === "break-breach"
              ? "breach-overrun"
              : "vault-destroyed");

  return {
    missionId: state.missionId,
    outcome,
    reason,
    score,
    vaultHp: Math.max(0, state.vault.hp),
    vaultMaxHp: state.vault.maxHp,
    turnsSurvived: state.completedEnemyPhases,
    enemiesDefeated: state.defeatedEnemies,
    survivingUnits,
    lostUnits: Math.max(0, state.initialSquadSize - survivingUnits),
    xpPreview: Math.floor(score.total / 10),
    completed: outcome === "victory",
    medals: calculateMissionMedals(state),
  };
};
