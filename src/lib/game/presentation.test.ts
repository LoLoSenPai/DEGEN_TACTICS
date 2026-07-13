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
    expect(beats.at(-1)).toMatchObject({ targetId: "guardian", fatal: true, duration: 760 });
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

  it("groups every Whale target into one slam windup and one simultaneous impact", () => {
    const initial = createInitialGameState(TRAINING_BASICS);
    const whaleState = {
      ...initial,
      enemies: [{
        ...initial.enemies[0],
        id: "whale-test",
        kind: "whale" as const,
        name: "Test Whale",
        hp: 10,
        maxHp: 10,
        position: { x: 5, y: 3 },
        whaleState: "charging" as const,
        lockedArea: [{ x: 4, y: 3 }, { x: 3, y: 3 }],
      }],
    };
    const events = [
      { type: "damage" as const, sourceId: "whale-test", targetId: "guardian", amount: 4, absorbed: 0 },
      { type: "damage" as const, sourceId: "whale-test", targetId: "vault", amount: 4, absorbed: 0 },
    ];
    const beats = compileEnemyPlayback(whaleState, whaleState, events);

    expect(beats.map((beat) => beat.stage)).toEqual(["attack", "impact"]);
    expect(beats[0]).toMatchObject({ sourceId: "whale-test", area: [{ x: 4, y: 3 }, { x: 3, y: 3 }] });
    expect(beats[1].hits).toEqual([
      { targetId: "guardian", amount: 4, absorbed: 0, fatal: false },
      { targetId: "vault", amount: 4, absorbed: 0, fatal: false },
    ]);
    expect(beats[1].state.units[0].hp).toBe(8);
    expect(beats[1].state.vault.hp).toBe(6);
  });
});
