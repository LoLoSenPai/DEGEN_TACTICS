import { describe, expect, it } from "vitest";

import {
  calculateMissionMedals,
  calculateRankGoal,
  calculateScore,
  createInitialGameState,
  type GameState,
} from "./index";

describe("mission mastery", () => {
  it("evaluates Vault, squad, and Whale goals from immutable run state", () => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      vaultEverDamaged: true,
      whaleChargeCancelled: true,
      units: initial.units.map((unit, index) =>
        index === 0 ? { ...unit, hp: 0 } : unit,
      ),
    };

    expect(calculateMissionMedals(state)).toEqual([
      expect.objectContaining({ id: "vault-untouched", earned: false }),
      expect.objectContaining({ id: "full-squad", earned: false }),
      expect.objectContaining({ id: "charge-broken", earned: true }),
    ]);
    expect(initial.whaleChargeCancelled).toBe(false);
  });

  it("returns the next victory rank target and caps a mastered S run", () => {
    const initial = createInitialGameState();
    const aRank = calculateScore(
      {
        ...initial,
        vault: { ...initial.vault, hp: 1 },
        vaultEverDamaged: true,
        defeatedEnemies: 4,
      },
      "victory",
    );
    expect(calculateRankGoal(aRank, "victory")).toEqual({
      nextRank: "S",
      targetScore: 1200,
      pointsNeeded: 50,
      requiresVictory: false,
    });

    const sRank = calculateScore(
      { ...initial, defeatedEnemies: 4 },
      "victory",
    );
    expect(calculateRankGoal(sRank, "victory")).toEqual({
      nextRank: null,
      targetScore: null,
      pointsNeeded: 0,
      requiresVictory: false,
    });
  });

  it("makes the victory requirement explicit on a failed run", () => {
    const score = calculateScore(createInitialGameState(), "defeat");
    expect(calculateRankGoal(score, "defeat")).toEqual({
      nextRank: "B",
      targetScore: 650,
      pointsNeeded: 0,
      requiresVictory: true,
    });
  });
});
