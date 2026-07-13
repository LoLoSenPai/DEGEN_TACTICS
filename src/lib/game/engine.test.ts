import { describe, expect, it } from "vitest";

import {
  PROTECT_THE_VAULT,
  TRAINING_BASICS,
  TRAINING_LESSONS,
  TRAINING_MOMENTUM,
  TRAINING_SQUAD,
  activateDeadeye,
  applyShield,
  attackEnemy,
  calculateEnemyPlan,
  createInitialGameState,
  getMissionDefinition,
  getAttackableTargets,
  getMovementPath,
  getPushTargets,
  getValidMoves,
  isTrainingMissionId,
  moveUnit,
  pushTarget,
  resolveEnemyTurn,
  waitUnit,
  type Enemy,
  type GameState,
  type PlayerUnit,
  type Position,
} from "./index";

const at = (x: number, y: number): Position => ({ x, y });
const hasPosition = (positions: readonly Position[], expected: Position) =>
  positions.some(
    (position) =>
      position.x === expected.x && position.y === expected.y,
  );

const updateUnit = (
  state: GameState,
  unitId: string,
  changes: Partial<PlayerUnit>,
): GameState => ({
  ...state,
  units: state.units.map((unit) =>
    unit.id === unitId ? { ...unit, ...changes } : unit,
  ),
});

const whaleEnemy = (): Enemy => {
  const definition = PROTECT_THE_VAULT.breach.enemy;
  return {
    ...definition,
    position: { ...definition.position },
    hp: definition.maxHp,
    whaleState: "ready",
    lockedArea: [],
  };
};

const whaleTurnThreeState = (): GameState => ({
  ...createInitialGameState(),
  turn: 3,
  completedEnemyPhases: 2,
  enemies: [whaleEnemy()],
  breach: { position: at(6, 3), status: "spawned" },
});

describe("engine-valid training missions", () => {
  it("registers the three ordered lessons and safely falls back for unknown IDs", () => {
    expect(TRAINING_LESSONS.map((lesson) => [lesson.order, lesson.missionId])).toEqual([
      [1, "training-basics"],
      [2, "training-squad"],
      [3, "training-momentum"],
    ]);
    expect(getMissionDefinition("training-basics")).toBe(TRAINING_BASICS);
    expect(getMissionDefinition("training-squad")).toBe(TRAINING_SQUAD);
    expect(getMissionDefinition("training-momentum")).toBe(TRAINING_MOMENTUM);
    expect(getMissionDefinition("unknown-mission")).toBe(PROTECT_THE_VAULT);
    expect(isTrainingMissionId("training-momentum")).toBe(true);
    expect(isTrainingMissionId("protect-the-vault")).toBe(false);
  });

  it("teaches movement, attack, and an exact resolved intent in First Contact", () => {
    const initial = createInitialGameState(TRAINING_BASICS);
    expect(initial).toMatchObject({ missionId: "training-basics", maxTurns: 1 });
    expect(initial.vault.position).toEqual(at(3, 5));
    expect(initial.units.map((unit) => [unit.id, unit.position])).toEqual([
      ["guardian", at(3, 3)],
    ]);

    const moved = moveUnit(initial, "guardian", at(3, 1));
    expect(moved.events).toContainEqual({
      type: "unit-moved",
      unitId: "guardian",
      from: at(3, 3),
      to: at(3, 1),
    });
    const attacked = attackEnemy(moved.state, "guardian", "rugger-training");
    expect(attacked.state.enemies[0]).toMatchObject({ hp: 4, position: at(3, 0) });

    const plan = calculateEnemyPlan(attacked.state);
    expect(plan.intents).toHaveLength(1);
    expect(plan.intents[0]).toMatchObject({
      enemyId: "rugger-training",
      order: 1,
      action: "attack",
      path: [],
      destination: at(3, 0),
      target: { id: "guardian", expectedDamage: 3 },
      damage: 3,
    });

    const resolved = resolveEnemyTurn(attacked.state, plan);
    expect(resolved.state).toMatchObject({
      phase: "victory",
      completedEnemyPhases: 1,
    });
    expect(resolved.state.units[0].hp).toBe(9);
    expect(resolved.events).toContainEqual({
      type: "damage",
      sourceId: "rugger-training",
      targetId: "guardian",
      amount: 3,
      absorbed: 0,
    });
  });

  it("teaches independent activations, Shield Wall, and Deadeye in Action Economy", () => {
    let state = createInitialGameState(TRAINING_SQUAD);
    state = moveUnit(state, "guardian", at(3, 2)).state;

    const shielded = applyShield(state, "guardian");
    expect(shielded.events).toContainEqual({
      type: "shield-applied",
      sourceId: "guardian",
      unitIds: ["guardian", "sniper"],
      value: 2,
    });
    expect(
      shielded.state.units.find((unit) => unit.id === "guardian"),
    ).toMatchObject({ hasMoved: true, hasActed: true, signatureAvailable: false });
    expect(
      shielded.state.units.find((unit) => unit.id === "sniper"),
    ).toMatchObject({ hasMoved: false, hasActed: false, shield: { value: 2 } });

    const deadeye = activateDeadeye(
      shielded.state,
      "sniper",
      "drainer-training",
    );
    expect(deadeye.state.enemies.some((enemy) => enemy.id === "drainer-training")).toBe(false);
    expect(deadeye.state.units.find((unit) => unit.id === "sniper")).toMatchObject({
      hasMoved: true,
      hasActed: true,
      signatureAvailable: false,
    });

    const plan = calculateEnemyPlan(deadeye.state);
    expect(plan.intents).toHaveLength(1);
    expect(plan.intents[0]).toMatchObject({
      enemyId: "rugger-training",
      action: "attack",
      path: [at(3, 1)],
      target: { id: "guardian", expectedDamage: 1 },
      damage: 3,
    });

    const resolved = resolveEnemyTurn(deadeye.state, plan);
    expect(resolved.state.phase).toBe("victory");
    expect(resolved.state.units.find((unit) => unit.id === "guardian")).toMatchObject({
      hp: 11,
      shield: null,
    });
    expect(resolved.events).toContainEqual({
      type: "damage",
      sourceId: "rugger-training",
      targetId: "guardian",
      amount: 1,
      absorbed: 2,
    });
  });

  it("teaches object push, enemy-only collision, Whale lock, cancellation, and stagger", () => {
    let state = createInitialGameState(TRAINING_MOMENTUM);
    expect(state).toMatchObject({ missionId: "training-momentum", maxTurns: 5 });
    expect(state.vault.position).toEqual(at(3, 2));
    expect(state.obstacles).toEqual([at(4, 2)]);

    state = moveUnit(state, "pusher", at(4, 5)).state;
    const blockPush = pushTarget(state, "pusher", "data-block", "shove");
    expect(blockPush.state.objects[0].position).toEqual(at(2, 5));
    expect(blockPush.events).toContainEqual({
      type: "target-pushed",
      sourceId: "pusher",
      targetId: "data-block",
      targetKind: "object",
      from: at(3, 5),
      to: at(2, 5),
      distance: 1,
      ability: "shove",
    });

    let resolved = resolveEnemyTurn(
      blockPush.state,
      calculateEnemyPlan(blockPush.state),
    );
    state = resolved.state;
    expect(state).toMatchObject({ turn: 2, phase: "player" });
    expect(state.breach.status).toBe("incoming");
    expect(state.enemies.some((enemy) => enemy.kind === "whale")).toBe(false);

    state = moveUnit(state, "pusher", at(4, 4)).state;
    const collision = pushTarget(state, "pusher", "rugger-dummy", "shove");
    expect(collision.events).toContainEqual({
      type: "collision",
      sourceId: "pusher",
      targetId: "rugger-dummy",
      targetKind: "enemy",
      damage: 1,
      ability: "shove",
    });
    expect(collision.events).toContainEqual({
      type: "enemy-defeated",
      enemyId: "rugger-dummy",
    });
    expect(collision.state.enemies).toEqual([]);
    expect(collision.state.units[0].hp).toBe(9);
    expect(collision.state.vault.hp).toBe(10);

    resolved = resolveEnemyTurn(
      collision.state,
      calculateEnemyPlan(collision.state),
    );
    state = resolved.state;
    expect(state).toMatchObject({ turn: 3, phase: "player" });
    expect(state.breach.status).toBe("spawned");
    expect(state.enemies).toContainEqual(expect.objectContaining({
      id: "whale-training",
      position: at(6, 3),
      whaleState: "ready",
    }));

    const chargePlan = calculateEnemyPlan(state);
    expect(chargePlan.intents).toHaveLength(1);
    expect(chargePlan.intents[0]).toMatchObject({
      enemyId: "whale-training",
      action: "charge",
      path: [at(5, 3)],
      destination: at(5, 3),
      area: [at(4, 3), at(3, 2), at(3, 3), at(3, 4)],
      damage: 0,
      special: "lock-cone",
      facing: "west",
    });
    resolved = resolveEnemyTurn(state, chargePlan);
    state = resolved.state;
    expect(state).toMatchObject({ turn: 4, phase: "player" });
    expect(resolved.events).toContainEqual({
      type: "whale-cone-locked",
      enemyId: "whale-training",
      area: [at(4, 3), at(3, 2), at(3, 3), at(3, 4)],
      facing: "west",
    });
    expect(state.enemies[0]).toMatchObject({
      id: "whale-training",
      position: at(5, 3),
      whaleState: "charging",
    });

    state = moveUnit(state, "pusher", at(5, 4)).state;
    const interrupted = pushTarget(state, "pusher", "whale-training", "shove");
    expect(interrupted.events).toContainEqual({
      type: "target-pushed",
      sourceId: "pusher",
      targetId: "whale-training",
      targetKind: "enemy",
      from: at(5, 3),
      to: at(5, 2),
      distance: 1,
      ability: "shove",
    });
    expect(interrupted.events).toContainEqual({
      type: "whale-charge-cancelled",
      enemyId: "whale-training",
    });
    expect(interrupted.state.enemies[0]).toMatchObject({
      position: at(5, 2),
      whaleState: "staggered",
      lockedArea: [],
    });

    const staggerPlan = calculateEnemyPlan(interrupted.state);
    expect(staggerPlan.intents[0]).toMatchObject({
      enemyId: "whale-training",
      action: "staggered",
      area: [],
      damage: 0,
      special: "stagger-skip",
    });
    resolved = resolveEnemyTurn(interrupted.state, staggerPlan);
    expect(resolved.events).toContainEqual({
      type: "whale-staggered",
      enemyId: "whale-training",
    });
    expect(resolved.state.enemies[0].whaleState).toBe("ready");
  });
});

describe("mission state and player movement", () => {
  it("creates the authored 7x7 mission without sharing mutable positions", () => {
    const first = createInitialGameState();
    const second = createInitialGameState();

    expect(first.vault).toMatchObject({ position: at(3, 3), hp: 10 });
    expect(first.units.map((unit) => [unit.id, unit.position])).toEqual([
      ["guardian", at(3, 2)],
      ["sniper", at(1, 4)],
      ["pusher", at(5, 5)],
    ]);
    expect(first.enemies.map((enemy) => [enemy.id, enemy.position])).toEqual([
      ["rugger-north", at(3, 0)],
      ["rugger-east", at(6, 5)],
      ["drainer", at(1, 1)],
    ]);
    expect(first.objects[0].position).toEqual(at(3, 5));
    expect(first.obstacles).toEqual([at(2, 2), at(4, 2), at(2, 4), at(4, 4)]);
    expect(first.units[0].position).not.toBe(second.units[0].position);
  });

  it("uses cardinal BFS movement and respects every occupied tile", () => {
    const state = createInitialGameState();
    const moves = getValidMoves(state, "guardian");

    expect(moves).toEqual([at(3, 1), at(4, 1), at(2, 1)]);
    expect(hasPosition(moves, at(2, 2))).toBe(false);
    expect(hasPosition(moves, at(4, 2))).toBe(false);
    expect(hasPosition(moves, at(3, 3))).toBe(false);
    expect(hasPosition(moves, at(2, 3))).toBe(false);
  });

  it("returns the exact deterministic route used by a legal movement preview", () => {
    const state = createInitialGameState(TRAINING_MOMENTUM);

    expect(getMovementPath(state, "pusher", at(4, 4))).toEqual([
      at(5, 5),
      at(5, 4),
      at(4, 4),
    ]);
    expect(getMovementPath(state, "pusher", at(4, 2))).toBeNull();
    expect(getMovementPath(state, "missing", at(4, 4))).toBeNull();
    expect(getMovementPath(state, "pusher", at(5, 5))).toBeNull();
  });

  it("allows one move followed by one action, then closes activation", () => {
    const initial = createInitialGameState();
    const moved = moveUnit(initial, "guardian", at(3, 1));

    expect(moved.state).not.toBe(initial);
    expect(initial.units.find((unit) => unit.id === "guardian")?.position).toEqual(
      at(3, 2),
    );
    expect(getValidMoves(moved.state, "guardian")).toEqual([]);

    const attacked = attackEnemy(moved.state, "guardian", "rugger-north");
    expect(
      attacked.state.enemies.find((enemy) => enemy.id === "rugger-north")?.hp,
    ).toBe(4);
    expect(
      attacked.state.units.find((unit) => unit.id === "guardian")?.hasActed,
    ).toBe(true);
    expect(attackEnemy(attacked.state, "guardian", "rugger-north").events[0]).toMatchObject(
      { type: "action-rejected" },
    );
  });

  it("supports holding position with Wait", () => {
    const transition = waitUnit(createInitialGameState(), "sniper");
    expect(
      transition.state.units.find((unit) => unit.id === "sniper")?.hasActed,
    ).toBe(true);
    expect(transition.events).toEqual([{ type: "unit-waited", unitId: "sniper" }]);
  });
});

describe("attacks and one-charge signatures", () => {
  it("lets the Sniper shoot through combatants but not terrain, Vault, or Data Block", () => {
    let state = createInitialGameState();
    expect(getAttackableTargets(state, "sniper").map((enemy) => enemy.id)).toEqual([
      "drainer",
    ]);

    state = {
      ...state,
      objects: [{ ...state.objects[0], position: at(1, 3) }],
    };
    expect(getAttackableTargets(state, "sniper")).toEqual([]);

    state = {
      ...createInitialGameState(),
      enemies: [
        { ...createInitialGameState().enemies[2], position: at(1, 2) },
        { ...createInitialGameState().enemies[0], position: at(1, 3) },
      ],
    };
    expect(getAttackableTargets(state, "sniper").map((enemy) => enemy.id)).toEqual([
      "drainer",
      "rugger-north",
    ]);
  });

  it("Deadeye requires no movement, deals 4, and consumes its charge", () => {
    const initial = createInitialGameState();
    const fired = activateDeadeye(initial, "sniper", "drainer");
    const sniper = fired.state.units.find((unit) => unit.id === "sniper");

    expect(fired.state.enemies.some((enemy) => enemy.id === "drainer")).toBe(false);
    expect(fired.state.defeatedEnemies).toBe(1);
    expect(sniper).toMatchObject({
      hasMoved: true,
      hasActed: true,
      signatureAvailable: false,
    });

    const moved = moveUnit(initial, "sniper", at(1, 3));
    expect(activateDeadeye(moved.state, "sniper", "drainer").events[0]).toMatchObject(
      { type: "action-rejected" },
    );
    expect(attackEnemy(moved.state, "sniper", "drainer").events[0]).toMatchObject(
      { type: "unit-attacked", damage: 3, deadeye: false },
    );
  });

  it("Shield Wall protects self and adjacent allies for exactly one incoming hit", () => {
    let state = updateUnit(createInitialGameState(), "sniper", {
      position: at(3, 1),
    });
    const shielded = applyShield(state, "guardian");
    expect(
      shielded.state.units
        .filter((unit) => unit.shield)
        .map((unit) => unit.id),
    ).toEqual(["guardian", "sniper"]);
    expect(
      shielded.state.units.find((unit) => unit.id === "guardian"),
    ).toMatchObject({ hasActed: true, signatureAvailable: false });

    state = {
      ...shielded.state,
      enemies: [
        {
          ...shielded.state.enemies[0],
          position: at(3, 0),
          moveRange: 2,
          attackDamage: 3,
        },
      ],
    };
    const plan = calculateEnemyPlan(state);
    expect(plan.intents[0].target).toMatchObject({
      id: "sniper",
      expectedDamage: 1,
    });
    const resolved = resolveEnemyTurn(state, plan);
    expect(
      resolved.state.units.find((unit) => unit.id === "sniper"),
    ).toMatchObject({ hp: 6, shield: null });
    expect(
      resolved.events.find((event) => event.type === "damage"),
    ).toMatchObject({ amount: 1, absorbed: 2 });
  });

  it("expires an unused Shield Wall after the upcoming enemy phase", () => {
    const shielded = applyShield(createInitialGameState(), "guardian").state;
    const quietTurn = { ...shielded, enemies: [] };
    const resolved = resolveEnemyTurn(quietTurn, calculateEnemyPlan(quietTurn));
    expect(
      resolved.state.units.find((unit) => unit.id === "guardian")?.shield,
    ).toBeNull();
  });
});

describe("pushes, objects, and collision damage", () => {
  it("pushes the Data Block through free tiles after moving", () => {
    const moved = moveUnit(createInitialGameState(), "pusher", at(4, 5));
    expect(getPushTargets(moved.state, "pusher")).toContainEqual({
      id: "data-block",
      kind: "object",
      position: at(3, 5),
      canMove: true,
    });

    const pushed = pushTarget(moved.state, "pusher", "data-block", "shove");
    expect(pushed.state.objects[0].position).toEqual(at(2, 5));
    expect(
      pushed.state.units.find((unit) => unit.id === "pusher")?.hasActed,
    ).toBe(true);
  });

  it("applies blocked collision damage only to an enemy", () => {
    const initial = createInitialGameState();
    const pusherHp = initial.units.find((unit) => unit.id === "pusher")?.hp;
    const vaultHp = initial.vault.hp;
    const collision = pushTarget(
      initial,
      "pusher",
      "rugger-east",
      "batter-up",
    );

    expect(
      collision.state.enemies.find((enemy) => enemy.id === "rugger-east"),
    ).toMatchObject({ hp: 4, position: at(6, 5) });
    expect(collision.state.vault.hp).toBe(vaultHp);
    expect(
      collision.state.units.find((unit) => unit.id === "pusher")?.hp,
    ).toBe(pusherHp);
    expect(
      collision.state.units.find((unit) => unit.id === "pusher"),
    ).toMatchObject({ hasActed: true, signatureAvailable: false });
  });

  it("never damages an object or blocker on a failed object push", () => {
    let state = updateUnit(createInitialGameState(), "pusher", {
      position: at(4, 5),
    });
    state = { ...state, obstacles: [...state.obstacles, at(2, 5)] };
    const transition = pushTarget(state, "pusher", "data-block", "shove");

    expect(transition.state.objects[0].position).toEqual(at(3, 5));
    expect(transition.state.vault.hp).toBe(10);
    expect(
      transition.events.find((event) => event.type === "collision"),
    ).toMatchObject({ targetKind: "object", damage: 0 });
  });
});

describe("deterministic enemy plans", () => {
  it("uses initiative, stable IDs, fixed BFS ties, and exact previewed targets", () => {
    const state = createInitialGameState();
    const first = calculateEnemyPlan(state);
    const second = calculateEnemyPlan(state);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.intents.map((intent) => intent.enemyId)).toEqual([
      "rugger-east",
      "rugger-north",
      "drainer",
    ]);
    expect(first.intents[0]).toMatchObject({
      path: [at(6, 4), at(5, 4)],
      destination: at(5, 4),
      action: "advance",
    });
    expect(first.intents[1]).toMatchObject({
      path: [at(3, 1)],
      destination: at(3, 1),
      action: "attack",
      target: { id: "guardian", expectedDamage: 3 },
    });
    expect(first.intents[2]).toMatchObject({
      path: [at(1, 2), at(1, 3)],
      destination: at(1, 3),
      action: "attack",
      target: { id: "sniper", expectedDamage: 2 },
    });
  });

  it("resolves the exact committed paths and targets, then warns about turn-two breach", () => {
    const state = createInitialGameState();
    const plan = calculateEnemyPlan(state);
    const transition = resolveEnemyTurn(state, plan);

    for (const intent of plan.intents) {
      const resolvedEnemy = transition.state.enemies.find(
        (enemy) => enemy.id === intent.enemyId,
      );
      expect(resolvedEnemy?.position).toEqual(intent.destination);
    }
    expect(
      transition.state.units.find((unit) => unit.id === "guardian")?.hp,
    ).toBe(9);
    expect(
      transition.state.units.find((unit) => unit.id === "sniper")?.hp,
    ).toBe(5);
    expect(transition.state).toMatchObject({
      turn: 2,
      completedEnemyPhases: 1,
      phase: "player",
      breach: { position: at(6, 3), status: "incoming" },
    });
  });

  it("rejects a stale plan rather than silently retargeting", () => {
    const state = createInitialGameState();
    const plan = calculateEnemyPlan(state);
    const moved = moveUnit(state, "guardian", at(3, 1)).state;
    const transition = resolveEnemyTurn(moved, plan);

    expect(transition.state).toBe(moved);
    expect(transition.events[0]).toMatchObject({
      type: "action-rejected",
      message: expect.stringContaining("stale"),
    });
  });

  it("chooses Drainer targets by current HP, path length, then stable ID", () => {
    let state = createInitialGameState();
    state = {
      ...state,
      enemies: [{ ...state.enemies.find((enemy) => enemy.id === "drainer")!, position: at(3, 3) }],
      vault: { ...state.vault, position: at(6, 6) },
      obstacles: [],
      objects: [],
      units: state.units.map((unit) => ({
        ...unit,
        hp: 5,
        position:
          unit.id === "guardian"
            ? at(3, 1)
            : unit.id === "pusher"
              ? at(5, 3)
              : at(1, 3),
      })),
    };

    expect(calculateEnemyPlan(state).intents[0].target?.id).toBe("guardian");
  });

  it("falls back to the Vault when every lowest-HP target is unreachable", () => {
    const initial = createInitialGameState();
    const drainer = initial.enemies.find((enemy) => enemy.id === "drainer")!;
    const state: GameState = {
      ...initial,
      vault: { ...initial.vault, position: at(3, 4) },
      enemies: [{ ...drainer, position: at(3, 3) }],
      objects: [],
      obstacles: [at(1, 0), at(0, 1)],
      units: initial.units.map((unit) =>
        unit.id === "sniper"
          ? { ...unit, hp: 1, position: at(0, 0) }
          : unit.id === "guardian"
            ? { ...unit, hp: 10, position: at(4, 3) }
            : { ...unit, hp: 9, position: at(6, 6) },
      ),
    };

    expect(calculateEnemyPlan(state).intents[0].target).toMatchObject({
      id: "vault",
      kind: "vault",
    });
  });

  it("heals the Drainer only after it deals at least one actual damage", () => {
    const initial = createInitialGameState();
    const drainer = initial.enemies.find((enemy) => enemy.id === "drainer")!;
    const state: GameState = {
      ...initial,
      enemies: [{ ...drainer, hp: 2, position: at(1, 3) }],
      obstacles: [],
      objects: [],
    };
    const damaged = resolveEnemyTurn(state, calculateEnemyPlan(state));
    expect(damaged.state.enemies[0].hp).toBe(3);
    expect(damaged.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "enemy-healed", amount: 1 }),
      ]),
    );

    const shielded: GameState = updateUnit(state, "sniper", {
      shield: { value: 2, expiresAfterEnemyPhase: 1 },
    });
    const absorbed = resolveEnemyTurn(shielded, calculateEnemyPlan(shielded));
    expect(absorbed.state.enemies[0].hp).toBe(2);
    expect(
      absorbed.events.some((event) => event.type === "enemy-healed"),
    ).toBe(false);
  });

  it("plans sequential occupancy so later enemies never share a destination", () => {
    const initial = createInitialGameState();
    const baseRugger = initial.enemies.find(
      (enemy) => enemy.kind === "rugger",
    )!;
    const state: GameState = {
      ...initial,
      vault: { ...initial.vault, position: at(3, 3) },
      enemies: [
        { ...baseRugger, id: "rugger-a", position: at(2, 1) },
        { ...baseRugger, id: "rugger-b", position: at(4, 1) },
      ],
      units: initial.units.map((unit, index) => ({
        ...unit,
        position: at(0, index),
      })),
      obstacles: [],
      objects: [],
      breach: { position: at(6, 3), status: "spawned" },
    };
    const plan = calculateEnemyPlan(state);
    const destinations = plan.intents.map((intent) =>
      `${intent.destination.x},${intent.destination.y}`,
    );
    expect(new Set(destinations).size).toBe(destinations.length);
    const resolved = resolveEnemyTurn(state, plan).state;
    expect(
      new Set(resolved.enemies.map((enemy) => `${enemy.position.x},${enemy.position.y}`))
        .size,
    ).toBe(2);
  });
});

describe("scripted breach and Whale", () => {
  it("marks G4 on turn two and spawns the Whale at the start of turn three", () => {
    let state: GameState = { ...createInitialGameState(), enemies: [] };
    state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;
    expect(state).toMatchObject({ turn: 2, breach: { status: "incoming" } });
    expect(hasPosition(getValidMoves(updateUnit(state, "pusher", { position: at(5, 3) }), "pusher"), at(6, 3))).toBe(false);

    state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;
    expect(state).toMatchObject({ turn: 3, breach: { status: "spawned" } });
    expect(state.enemies.find((enemy) => enemy.id === "whale")).toMatchObject({
      position: at(6, 3),
      whaleState: "ready",
    });
  });

  it("moves G4 to F4 and locks the exact west cone before dealing damage", () => {
    const state = whaleTurnThreeState();
    const plan = calculateEnemyPlan(state);
    expect(plan.intents[0]).toMatchObject({
      action: "charge",
      path: [at(5, 3)],
      destination: at(5, 3),
      facing: "west",
      area: [at(4, 3), at(3, 2), at(3, 3), at(3, 4)],
      damage: 0,
    });

    const charged = resolveEnemyTurn(state, plan);
    expect(charged.state.vault.hp).toBe(10);
    expect(
      charged.state.enemies.find((enemy) => enemy.id === "whale"),
    ).toMatchObject({
      position: at(5, 3),
      whaleState: "charging",
      lockedArea: [at(4, 3), at(3, 2), at(3, 3), at(3, 4)],
    });
  });

  it("slams the unchanged locked area on the following activation", () => {
    const charge = resolveEnemyTurn(
      whaleTurnThreeState(),
      calculateEnemyPlan(whaleTurnThreeState()),
    ).state;
    const slamPlan = calculateEnemyPlan(charge);

    expect(slamPlan.intents[0]).toMatchObject({
      action: "slam",
      damage: 4,
      targets: expect.arrayContaining([
        expect.objectContaining({ id: "guardian", expectedDamage: 4 }),
        expect.objectContaining({ id: "vault", expectedDamage: 4 }),
      ]),
    });
    const slammed = resolveEnemyTurn(charge, slamPlan).state;
    expect(slammed.vault.hp).toBe(6);
    expect(
      slammed.units.find((unit) => unit.id === "guardian")?.hp,
    ).toBe(8);
    expect(slammed.enemies[0]).toMatchObject({ whaleState: "ready" });
  });

  it("cancels a charge only when a push actually displaces the Whale", () => {
    const turnFour = resolveEnemyTurn(
      whaleTurnThreeState(),
      calculateEnemyPlan(whaleTurnThreeState()),
    ).state;
    const adjacent = updateUnit(turnFour, "pusher", { position: at(6, 3) });
    const pushed = pushTarget(adjacent, "pusher", "whale", "shove");

    expect(pushed.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "target-pushed", distance: 1 }),
        expect.objectContaining({ type: "whale-charge-cancelled" }),
      ]),
    );
    expect(pushed.state.enemies[0]).toMatchObject({
      position: at(4, 3),
      whaleState: "staggered",
      lockedArea: [],
    });
    const staggerPlan = calculateEnemyPlan(pushed.state);
    expect(staggerPlan.intents[0]).toMatchObject({
      action: "staggered",
      damage: 0,
    });
    const skipped = resolveEnemyTurn(pushed.state, staggerPlan).state;
    expect(skipped.vault.hp).toBe(10);
    expect(skipped.enemies[0]).toMatchObject({ whaleState: "ready" });

    const blocked = {
      ...adjacent,
      objects: [{ ...adjacent.objects[0], position: at(4, 3) }],
    };
    const failedPush = pushTarget(blocked, "pusher", "whale", "shove");
    expect(failedPush.state.enemies[0]).toMatchObject({
      position: at(5, 3),
      hp: 9,
      whaleState: "charging",
    });
    expect(
      failedPush.events.some((event) => event.type === "whale-charge-cancelled"),
    ).toBe(false);
  });
});

describe("mission outcome timing", () => {
  it("does not win when enemies are cleared early and wins only after enemy phase five", () => {
    let state: GameState = {
      ...createInitialGameState(),
      turn: 5,
      completedEnemyPhases: 4,
      enemies: [],
    };
    expect(state.phase).toBe("player");
    state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;
    expect(state).toMatchObject({
      phase: "victory",
      completedEnemyPhases: 5,
      outcomeReason: "survived-five-turns",
    });
  });

  it("gives defeat precedence on phase five and does not count the failed phase", () => {
    let state: GameState = {
      ...createInitialGameState(),
      turn: 5,
      completedEnemyPhases: 4,
      vault: { ...createInitialGameState().vault, hp: 2 },
      enemies: [
        {
          ...createInitialGameState().enemies[0],
          position: at(4, 3),
          attackDamage: 3,
        },
      ],
      units: createInitialGameState().units.map((unit) => ({
        ...unit,
        position:
          unit.id === "guardian"
            ? at(0, 0)
            : unit.id === "sniper"
              ? at(0, 1)
              : at(0, 2),
      })),
      obstacles: [],
      objects: [],
    };
    state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;
    expect(state).toMatchObject({
      phase: "defeat",
      completedEnemyPhases: 4,
      outcomeReason: "vault-destroyed",
    });
  });

  it("ends immediately when the final living squad member is defeated", () => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      enemies: [
        {
          ...initial.enemies[0],
          position: at(3, 0),
          moveRange: 2,
        },
      ],
      units: initial.units.map((unit) =>
        unit.id === "guardian"
          ? { ...unit, hp: 1, position: at(3, 2) }
          : { ...unit, hp: 0 },
      ),
    };
    const defeated = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;
    expect(defeated).toMatchObject({
      phase: "defeat",
      completedEnemyPhases: 0,
      outcomeReason: "squad-eliminated",
    });
  });
});
