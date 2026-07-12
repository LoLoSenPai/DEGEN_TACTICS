import { describe, expect, it } from "vitest";
import { calculateEnemyPlan, createInitialGameState, resolveEnemyTurn } from "./engine";
import { TRAINING_BASICS, TRAINING_SQUAD } from "./mission";
import { compileEnemyPlayback } from "./presentation";

describe("combat presentation playback", () => {
  it("turns an enemy hit into anticipation and impact beats", () => {
    const state = createInitialGameState(TRAINING_BASICS);
    const resolved = resolveEnemyTurn(state, calculateEnemyPlan(state));
    const beats = compileEnemyPlayback(state, resolved.state, resolved.events);

    expect(beats.map((beat) => beat.stage)).toEqual(["move", "attack", "impact"]);
    expect(beats[1]).toMatchObject({ sourceId: "rugger-training", targetId: "guardian", amount: 3, fatal: false });
    expect(beats[1].state.units.find((unit) => unit.id === "guardian")?.hp).toBe(12);
    expect(beats[2].state.units.find((unit) => unit.id === "guardian")?.hp).toBe(9);
  });

  it("keeps a lethal target visible for a dedicated death beat", () => {
    const initial = createInitialGameState(TRAINING_BASICS);
    const state = { ...initial, units: initial.units.map((unit) => ({ ...unit, hp: 3 })) };
    const resolved = resolveEnemyTurn(state, calculateEnemyPlan(state));
    const beats = compileEnemyPlayback(state, resolved.state, resolved.events);

    expect(beats.map((beat) => beat.stage)).toEqual(["move", "attack", "impact", "death"]);
    expect(beats.at(-1)).toMatchObject({ targetId: "guardian", fatal: true });
    expect(beats.at(-1)?.state.units[0].hp).toBe(0);
  });

  it("separates shield absorption from the attack windup", () => {
    const initial = createInitialGameState(TRAINING_SQUAD);
    const state = {
      ...initial,
      units: initial.units.map((unit) => unit.id === "guardian"
        ? { ...unit, shield: { value: 2, expiresAfterEnemyPhase: 1 } }
        : unit),
    };
    const resolved = resolveEnemyTurn(state, calculateEnemyPlan(state));
    const beats = compileEnemyPlayback(state, resolved.state, resolved.events);
    const guardianImpact = beats.find((beat) => beat.stage === "impact" && beat.targetId === "guardian");

    expect(guardianImpact).toMatchObject({ amount: 1, absorbed: 2, fatal: false });
    expect(guardianImpact?.state.units.find((unit) => unit.id === "guardian")).toMatchObject({ hp: 11, shield: null });
  });
});
