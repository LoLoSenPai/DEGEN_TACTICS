import { describe, expect, it } from "vitest";
import { blackoutEnemy, calculateEnemyPlan, createInitialGameState, jamEnemy, moveUnit, pushTarget, resolveEnemyTurn } from "./engine";
import { DATA_EXTRACTION, TRAINING_BASICS, TRAINING_MOMENTUM, TRAINING_OVERRIDE, TRAINING_SQUAD } from "./mission";
import {
  compileEnemyPlayback,
  compilePushPlayback,
  getPlayerMovementPresentationDuration,
  getReducedPlayerMovementPresentationDuration,
} from "./presentation";

describe("player movement presentation", () => {
  it("keeps a one-tile move readable and adds time for every extra step", () => {
    expect(getPlayerMovementPresentationDuration(1)).toBe(400);
    expect(getPlayerMovementPresentationDuration(2)).toBe(400);
    expect(getPlayerMovementPresentationDuration(3)).toBe(620);
    expect(getPlayerMovementPresentationDuration(4)).toBe(840);
    expect(getReducedPlayerMovementPresentationDuration(2)).toBe(280);
    expect(getReducedPlayerMovementPresentationDuration(3)).toBe(430);
  });
});

describe("combat presentation playback", () => {
  it("turns an enemy hit into anticipation and impact beats", () => {
    const state = createInitialGameState(TRAINING_BASICS);
    const resolved = resolveEnemyTurn(state, calculateEnemyPlan(state));
    const beats = compileEnemyPlayback(state, resolved.state, resolved.events);

    expect(beats.map((beat) => beat.stage)).toEqual(["move", "attack", "impact"]);
    expect(beats[1]).toMatchObject({ sourceId: "rugger-training", targetId: "guardian", amount: 3, fatal: false });
    expect(beats[1].state.units.find((unit) => unit.id === "guardian")?.hp).toBe(12);
    expect(beats[2].state.units.find((unit) => unit.id === "guardian")?.hp).toBe(9);
    expect(beats[0].event).toMatchObject({
      type: "enemy-moved",
      path: [{ x: 3, y: 1 }, { x: 3, y: 2 }],
    });
    expect(beats[0].duration).toBe(360);
  });

  it("plays Jam movement and damage before clearing the disruption", () => {
    const initial = createInitialGameState(TRAINING_OVERRIDE);
    const jammed = jamEnemy(initial, "hacker", "rugger-override").state;
    const resolved = resolveEnemyTurn(jammed, calculateEnemyPlan(jammed));
    const beats = compileEnemyPlayback(jammed, resolved.state, resolved.events);

    expect(beats.map((beat) => beat.stage)).toEqual(["move", "attack", "impact", "status", "status"]);
    expect(beats[2]).toMatchObject({ sourceId: "rugger-override", targetId: "hacker", amount: 1 });
    expect(beats[3]).toMatchObject({ sourceId: "rugger-override", statusKind: "jam-cleared" });
    expect(beats[3].state.enemies.find((enemy) => enemy.id === "rugger-override")?.disruption?.kind).toBe("jam");
    expect(beats[4]).toMatchObject({ sourceId: "sentinel-override", statusKind: "intercept-grid" });
  });

  it("gives Blackout HOLD its own readable status beat", () => {
    const initial = createInitialGameState(TRAINING_OVERRIDE);
    const moved = moveUnit(initial, "hacker", { x: 6, y: 2 }).state;
    const blackedOut = blackoutEnemy(moved, "hacker", "sentinel-override").state;
    const resolved = resolveEnemyTurn(blackedOut, calculateEnemyPlan(blackedOut));
    const beats = compileEnemyPlayback(blackedOut, resolved.state, resolved.events);
    const hold = beats.find((beat) => beat.statusKind === "blackout-hold");

    expect(hold).toMatchObject({ stage: "status", sourceId: "sentinel-override", targetId: "sentinel-override", duration: 760 });
    expect(hold?.state.enemies.find((enemy) => enemy.id === "sentinel-override")?.disruption?.kind).toBe("blackout");
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

  it("shows the Whale losing its activation while staggered", () => {
    const initial = createInitialGameState(TRAINING_MOMENTUM);
    const state = {
      ...initial,
      enemies: [{
        ...initial.enemies[0],
        id: "whale-test",
        kind: "whale" as const,
        name: "Test Whale",
        whaleState: "staggered" as const,
        lockedArea: [],
      }],
    };
    const finalState = {
      ...state,
      enemies: state.enemies.map((enemy) => ({ ...enemy, whaleState: "ready" as const })),
    };
    const beats = compileEnemyPlayback(state, finalState, [{ type: "whale-staggered", enemyId: "whale-test" }]);

    expect(beats).toHaveLength(1);
    expect(beats[0]).toMatchObject({
      stage: "status",
      sourceId: "whale-test",
      targetId: "whale-test",
      statusKind: "staggered",
      duration: 820,
    });
    expect(beats[0].state.enemies[0].whaleState).toBe("staggered");
  });

  it("presents the Sentinel interception grid without mutating combat state", () => {
    const state = createInitialGameState(DATA_EXTRACTION);
    const area = [{ x: 4, y: 1 }, { x: 4, y: 3 }, { x: 4, y: 4 }];
    const event = {
      type: "sentinel-fortified" as const,
      enemyId: "sentinel-extraction",
      area,
      guardedEnemyIds: ["rugger-extraction"],
    };
    const beats = compileEnemyPlayback(state, state, [event]);

    expect(beats).toHaveLength(1);
    expect(beats[0]).toMatchObject({
      stage: "status",
      sourceId: "sentinel-extraction",
      targetId: "rugger-extraction",
      area,
      statusKind: "intercept-grid",
      duration: 520,
    });
    expect(beats[0].state.enemies).toEqual(state.enemies);
    expect(beats[0].state.units).toEqual(state.units);
    expect(beats[0].state.vault).toEqual(state.vault);
  });

  it("keeps every lethal Whale target visible in one shared death beat", () => {
    const initial = createInitialGameState(TRAINING_BASICS);
    const whaleState = {
      ...initial,
      units: initial.units.map((unit) => ({ ...unit, hp: 4 })),
      vault: { ...initial.vault, hp: 4 },
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
    const deathBeats = beats.filter((beat) => beat.stage === "death");

    expect(deathBeats).toHaveLength(1);
    expect(deathBeats[0]).toMatchObject({ statusKind: "vault-breached", duration: 900 });
    expect(deathBeats[0].hits).toEqual([
      { targetId: "guardian", amount: 4, absorbed: 0, fatal: true },
      { targetId: "vault", amount: 4, absorbed: 0, fatal: true },
    ]);
  });

  it("classifies a lethal Vault strike as a breach", () => {
    const initial = createInitialGameState(TRAINING_BASICS);
    const state = { ...initial, vault: { ...initial.vault, hp: 3 } };
    const events = [{ type: "damage" as const, sourceId: "rugger-training", targetId: "vault", amount: 3, absorbed: 0 }];
    const beats = compileEnemyPlayback(state, state, events);

    expect(beats.map((beat) => beat.stage)).toEqual(["attack", "impact", "death"]);
    expect(beats.at(-1)).toMatchObject({ targetId: "vault", statusKind: "vault-breached", duration: 900 });
  });

  it("sequences a free Data Block shove as windup then movement", () => {
    const initial = createInitialGameState(TRAINING_MOMENTUM);
    const state = {
      ...initial,
      units: initial.units.map((unit) => ({ ...unit, position: { x: 4, y: 5 } })),
    };
    const transition = pushTarget(state, "pusher", "data-block", "shove");
    const beats = compilePushPlayback(state, transition.state, transition.events);

    expect(beats.map((beat) => beat.stage)).toEqual(["push", "move"]);
    expect(beats[1].event).toMatchObject({ type: "target-pushed", from: { x: 3, y: 5 }, to: { x: 2, y: 5 } });
    expect(beats[1].state.objects[0].position).toEqual({ x: 2, y: 5 });
  });

  it("separates collision impact and enemy KO after the push windup", () => {
    const initial = createInitialGameState(TRAINING_MOMENTUM);
    const state = {
      ...initial,
      units: initial.units.map((unit) => ({ ...unit, position: { x: 4, y: 4 } })),
    };
    const transition = pushTarget(state, "pusher", "rugger-dummy", "shove");
    const beats = compilePushPlayback(state, transition.state, transition.events);

    expect(beats.map((beat) => beat.stage)).toEqual(["push", "impact", "death"]);
    expect(beats[1]).toMatchObject({ targetId: "rugger-dummy", amount: 1, fatal: true });
    expect(beats[1].state.enemies.find((enemy) => enemy.id === "rugger-dummy")?.hp).toBe(0);
  });

  it("shows a blocked object shove without fake damage or impact", () => {
    const initial = createInitialGameState(TRAINING_MOMENTUM);
    const state = {
      ...initial,
      units: initial.units.map((unit) => ({ ...unit, position: { x: 4, y: 5 } })),
      obstacles: [...initial.obstacles, { x: 2, y: 5 }],
    };
    const transition = pushTarget(state, "pusher", "data-block", "shove");
    const beats = compilePushPlayback(state, transition.state, transition.events);

    expect(beats.map((beat) => beat.stage)).toEqual(["push", "status"]);
    expect(beats[0].duration).toBe(520);
    expect(beats[1]).toMatchObject({ targetId: "data-block", statusKind: "push-blocked" });
  });

  it("distinguishes a partially moved Data Block from a fully jammed push", () => {
    const initial = createInitialGameState(TRAINING_MOMENTUM);
    const state = {
      ...initial,
      units: initial.units.map((unit) => unit.id === "pusher" ? { ...unit, position: { x: 4, y: 5 } } : unit),
      obstacles: [...initial.obstacles, { x: 1, y: 5 }],
    };
    const transition = pushTarget(state, "pusher", "data-block", "batter-up");
    const beats = compilePushPlayback(state, transition.state, transition.events);

    expect(transition.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "target-pushed", targetId: "data-block", distance: 1 }),
      expect.objectContaining({ type: "collision", targetId: "data-block", damage: 0 }),
    ]));
    expect(beats.map((beat) => beat.stage)).toEqual(["push", "move", "status"]);
    expect(beats[0].duration).toBe(580);
    expect(beats[2]).toMatchObject({ targetId: "data-block", statusKind: "push-stopped" });
  });

  it("shows Whale displacement before charge cancellation and stagger", () => {
    const initial = createInitialGameState(TRAINING_MOMENTUM);
    const state = {
      ...initial,
      units: initial.units.map((unit) => ({ ...unit, position: { x: 3, y: 3 } })),
      enemies: [{
        ...initial.enemies[0],
        id: "whale-training",
        kind: "whale" as const,
        name: "The Whale",
        position: { x: 4, y: 3 },
        hp: 10,
        maxHp: 10,
        whaleState: "charging" as const,
        lockedArea: [{ x: 4, y: 3 }],
      }],
    };
    const transition = pushTarget(state, "pusher", "whale-training", "shove");
    const beats = compilePushPlayback(state, transition.state, transition.events);

    expect(beats.map((beat) => beat.stage)).toEqual(["push", "move", "status"]);
    expect(beats[2]).toMatchObject({ targetId: "whale-training", statusKind: "charge-cancelled" });
    expect(beats[2].state.enemies[0]).toMatchObject({ position: { x: 5, y: 3 }, whaleState: "staggered", lockedArea: [] });
  });
});
