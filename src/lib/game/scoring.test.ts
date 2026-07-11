import { describe, expect, it } from "vitest";

import {
  calculateScore,
  createInitialGameState,
  createMissionResult,
  type GameState,
} from "./index";

describe("mission scoring", () => {
  it("awards the authored perfect-victory categories and S rank", () => {
    const state: GameState = {
      ...createInitialGameState(),
      phase: "victory",
      completedEnemyPhases: 5,
      defeatedEnemies: 4,
      outcomeReason: "survived-five-turns",
    };
    expect(calculateScore(state, "victory")).toEqual({
      victory: 500,
      vaultIntegrity: 400,
      enemiesDefeated: 300,
      survivingUnits: 150,
      flawlessSquad: 100,
      untouchedVault: 100,
      lostUnits: 0,
      total: 1550,
      rank: "S",
    });
  });

  it.each([
    [10, 400],
    [8, 400],
    [7, 300],
    [5, 200],
    [3, 200],
    [1, 100],
    [0, 0],
  ])("uses ceil-based Vault quartiles at %i HP", (hp, expected) => {
    const state: GameState = {
      ...createInitialGameState(),
      vault: { ...createInitialGameState().vault, hp },
      vaultEverDamaged: hp < 10,
    };
    expect(calculateScore(state, "victory").vaultIntegrity).toBe(expected);
  });

  it("subtracts casualties and forces every failed mission to rank C", () => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      defeatedEnemies: 4,
      units: initial.units.map((unit, index) =>
        index === 0 ? { ...unit, hp: 0 } : unit,
      ),
    };
    const score = calculateScore(state, "defeat");
    expect(score).toMatchObject({
      victory: 0,
      enemiesDefeated: 300,
      survivingUnits: 100,
      flawlessSquad: 0,
      lostUnits: -50,
      rank: "C",
    });
  });

  it.each([
    [4, 3, "A"],
    [2, 1, "B"],
    [0, 1, "C"],
  ] as const)("assigns the expected victory rank with %i kills", (kills, vaultHp, rank) => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      vault: { ...initial.vault, hp: vaultHp },
      vaultEverDamaged: true,
      defeatedEnemies: kills,
      units: initial.units.map((unit, index) =>
        index === 0 ? unit : { ...unit, hp: 0 },
      ),
    };
    expect(calculateScore(state, "victory").rank).toBe(rank);
  });

  it("creates a result with completed phases and preview-only XP", () => {
    const state: GameState = {
      ...createInitialGameState(),
      phase: "victory",
      completedEnemyPhases: 5,
      outcomeReason: "survived-five-turns",
    };
    const result = createMissionResult(state, "victory");
    expect(result).toMatchObject({
      missionId: "protect-the-vault",
      outcome: "victory",
      turnsSurvived: 5,
      completed: true,
      lostUnits: 0,
      xpPreview: Math.floor(result.score.total / 10),
    });
  });
});
