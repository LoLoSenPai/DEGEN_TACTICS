import { describe, expect, it } from "vitest";

import {
  BREAK_THE_BREACH,
  PROTECT_THE_VAULT,
  DATA_EXTRACTION,
  TRAINING_BASICS,
  TRAINING_LESSONS,
  TRAINING_MOMENTUM,
  TRAINING_OVERRIDE,
  TRAINING_SQUAD,
  activateDeadeye,
  applyShield,
  attackEnemy,
  blackoutEnemy,
  calculateEnemyPlan,
  checkVictoryDefeat,
  createInitialGameState,
  getMissionDefinition,
  getBattleHref,
  getFollowingOperationId,
  getNextOperationId,
  getAttackableTargets,
  getEnemyInterceptor,
  getHackableTargets,
  getMovementPath,
  getPushTargets,
  getSentinelGuardArea,
  getStateFingerprint,
  getValidMoves,
  isTrainingMissionId,
  isOperationUnlocked,
  jamEnemy,
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
  it("registers the four ordered lessons and safely falls back for unknown IDs", () => {
    expect(TRAINING_LESSONS.map((lesson) => [lesson.order, lesson.missionId])).toEqual([
      [1, "training-basics"],
      [2, "training-squad"],
      [3, "training-momentum"],
      [4, "training-override"],
    ]);
    expect(getMissionDefinition("training-basics")).toBe(TRAINING_BASICS);
    expect(getMissionDefinition("training-squad")).toBe(TRAINING_SQUAD);
    expect(getMissionDefinition("training-momentum")).toBe(TRAINING_MOMENTUM);
    expect(getMissionDefinition("training-override")).toBe(TRAINING_OVERRIDE);
    expect(getMissionDefinition("data-extraction")).toBe(DATA_EXTRACTION);
    expect(getMissionDefinition("break-the-breach")).toBe(BREAK_THE_BREACH);
    expect(getMissionDefinition("unknown-mission")).toBe(PROTECT_THE_VAULT);
    expect(isTrainingMissionId("training-momentum")).toBe(true);
    expect(isTrainingMissionId("protect-the-vault")).toBe(false);
  });

  it("derives operation unlocks from completed missions", () => {
    expect(getNextOperationId([])).toBe("protect-the-vault");
    expect(isOperationUnlocked("data-extraction", [])).toBe(false);
    expect(getNextOperationId(["protect-the-vault"])).toBe("data-extraction");
    expect(isOperationUnlocked("data-extraction", ["protect-the-vault"])).toBe(true);
    expect(isOperationUnlocked("break-the-breach", ["protect-the-vault"])).toBe(false);
    expect(getNextOperationId(["protect-the-vault", "data-extraction"])).toBe("break-the-breach");
    expect(isOperationUnlocked("break-the-breach", ["protect-the-vault", "data-extraction"])).toBe(true);
    expect(getNextOperationId(["protect-the-vault", "data-extraction", "break-the-breach"])).toBe("break-the-breach");
    expect(getFollowingOperationId("data-extraction")).toBe("break-the-breach");
    expect(getBattleHref("data-extraction")).toBe("/battle/data-extraction");
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
    expect(interrupted.state.whaleChargeCancelled).toBe(true);

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

describe("Hacker disruption", () => {
  it("authors a two-turn specialist lesson with the intended stats and exact opening threat", () => {
    const state = createInitialGameState(TRAINING_OVERRIDE);
    expect(state).toMatchObject({ missionId: "training-override", maxTurns: 2 });
    expect(state.units.find((unit) => unit.id === "hacker")).toMatchObject({
      role: "hacker",
      position: at(3, 2),
      hp: 6,
      moveRange: 3,
      attackDamage: 0,
      attackRange: 3,
      signatureName: "Blackout",
    });
    expect(calculateEnemyPlan(state).intents[0]).toMatchObject({
      enemyId: "rugger-override",
      action: "attack",
      path: [at(3, 1)],
      destination: at(3, 1),
      target: { id: "hacker", expectedDamage: 3 },
      damage: 3,
    });
  });

  it("targets cardinal range 1-3 through combatants but not diagonals or LOS blockers", () => {
    const initial = createInitialGameState(TRAINING_OVERRIDE);
    expect(getHackableTargets(initial, "hacker").map((enemy) => enemy.id)).toEqual(["rugger-override"]);
    expect(getAttackableTargets(initial, "hacker")).toEqual([]);
    expect(attackEnemy(initial, "hacker", "rugger-override").events[0]).toMatchObject({ type: "action-rejected" });

    const combatantBetween: GameState = {
      ...initial,
      units: initial.units.map((unit) => unit.id === "sniper" ? { ...unit, position: at(3, 1) } : unit),
    };
    expect(getHackableTargets(combatantBetween, "hacker").some((enemy) => enemy.id === "rugger-override")).toBe(true);

    const obstacleBetween: GameState = { ...initial, obstacles: [at(3, 1)] };
    expect(getHackableTargets(obstacleBetween, "hacker")).toEqual([]);
    const objectBetween: GameState = { ...initial, objects: [{ id: "blocker", name: "Blocker", position: at(3, 1) }] };
    expect(getHackableTargets(objectBetween, "hacker")).toEqual([]);

    const diagonalSentinel: GameState = {
      ...initial,
      enemies: initial.enemies.map((enemy) => enemy.id === "sentinel-override" ? { ...enemy, position: at(5, 1) } : enemy),
    };
    expect(getHackableTargets(diagonalSentinel, "hacker").some((enemy) => enemy.id === "sentinel-override")).toBe(false);
  });

  it("Jam preserves path and target while rewriting exact damage from 3 to 1", () => {
    const initial = createInitialGameState(TRAINING_OVERRIDE);
    const stalePlan = calculateEnemyPlan(initial);
    const jammed = jamEnemy(initial, "hacker", "rugger-override");
    expect(jammed.events).toEqual([{
      type: "enemy-disrupted",
      unitId: "hacker",
      enemyId: "rugger-override",
      kind: "jam",
      damageReduction: 2,
    }]);
    expect(jammed.state.units.find((unit) => unit.id === "hacker")).toMatchObject({
      hasActed: true,
      signatureAvailable: true,
    });
    expect(getStateFingerprint(jammed.state)).not.toBe(getStateFingerprint(initial));

    const plan = calculateEnemyPlan(jammed.state);
    expect(plan.intents[0]).toMatchObject({
      enemyId: "rugger-override",
      action: "attack",
      path: [at(3, 1)],
      destination: at(3, 1),
      target: { id: "hacker", expectedDamage: 1 },
      damage: 1,
      disruption: "jam",
      damageReduction: 2,
    });
    expect(JSON.stringify(plan)).toBe(JSON.stringify(calculateEnemyPlan(jammed.state)));
    expect(resolveEnemyTurn(jammed.state, stalePlan).events[0]).toMatchObject({ type: "action-rejected" });

    const resolved = resolveEnemyTurn(jammed.state, plan);
    expect(resolved.state.units.find((unit) => unit.id === "hacker")?.hp).toBe(5);
    expect(resolved.state.enemies.find((enemy) => enemy.id === "rugger-override")).toMatchObject({
      position: at(3, 1),
      disruption: undefined,
    });
    expect(resolved.events).toContainEqual({ type: "damage", sourceId: "rugger-override", targetId: "hacker", amount: 1, absorbed: 0 });
    expect(resolved.events).toContainEqual({ type: "enemy-disruption-resolved", enemyId: "rugger-override", kind: "jam" });
  });

  it("allows move then Blackout, removes the Sentinel grid immediately, and resolves an exact HOLD", () => {
    let state = jamEnemy(createInitialGameState(TRAINING_OVERRIDE), "hacker", "rugger-override").state;
    state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;
    state = moveUnit(state, "hacker", at(6, 2)).state;
    expect(getHackableTargets(state, "hacker", { blackout: true }).map((enemy) => enemy.id)).toContain("sentinel-override");

    const blackedOut = blackoutEnemy(state, "hacker", "sentinel-override");
    expect(blackedOut.state.units.find((unit) => unit.id === "hacker")).toMatchObject({
      hasMoved: true,
      hasActed: true,
      signatureAvailable: false,
    });
    expect(getSentinelGuardArea(blackedOut.state, "sentinel-override")).toEqual([]);
    expect(getEnemyInterceptor(blackedOut.state, "rugger-override")).toBeUndefined();

    const direct = attackEnemy(blackedOut.state, "sniper", "rugger-override");
    expect(direct.events).not.toContainEqual(expect.objectContaining({ type: "attack-intercepted" }));
    expect(direct.events).toContainEqual(expect.objectContaining({ type: "unit-attacked", enemyId: "rugger-override", damage: 3 }));
    const plan = calculateEnemyPlan(direct.state);
    expect(plan.intents.find((intent) => intent.enemyId === "sentinel-override")).toMatchObject({
      action: "hold",
      path: [],
      targets: [],
      area: [],
      damage: 0,
      special: "system-shutdown",
      disruption: "blackout",
      originalAction: "guard",
    });

    const resolved = resolveEnemyTurn(direct.state, plan);
    expect(resolved.state.phase).toBe("victory");
    expect(resolved.state.completedEnemyPhases).toBe(2);
    expect(resolved.state.enemies.find((enemy) => enemy.id === "sentinel-override")?.disruption).toBeUndefined();
    expect(resolved.events).toContainEqual({ type: "enemy-disruption-resolved", enemyId: "sentinel-override", kind: "blackout" });
  });

  it("does not spend the Hacker action or signature on invalid disruption targets", () => {
    const initial = createInitialGameState(TRAINING_OVERRIDE);
    const jammed = jamEnemy(initial, "hacker", "sentinel-override");
    const blackedOut = blackoutEnemy(initial, "hacker", "sentinel-override");
    expect(jammed.state).toBe(initial);
    expect(blackedOut.state).toBe(initial);
    expect(jammed.events[0]).toMatchObject({ type: "action-rejected" });
    expect(initial.units.find((unit) => unit.id === "hacker")).toMatchObject({ hasActed: false, signatureAvailable: true });
  });

  it("keeps zero-damage Drain from healing and rewrites or cancels a locked Whale slam exactly", () => {
    const base = createInitialGameState(TRAINING_OVERRIDE);
    const drainerState: GameState = {
      ...base,
      enemies: [{
        id: "drainer-override",
        name: "Drainer",
        kind: "drainer",
        position: at(3, 0),
        hp: 3,
        maxHp: 4,
        moveRange: 3,
        attackDamage: 2,
        initiative: 10,
      }],
    };
    const jammedDrainer = jamEnemy(drainerState, "hacker", "drainer-override").state;
    const drainPlan = calculateEnemyPlan(jammedDrainer);
    expect(drainPlan.intents[0]).toMatchObject({ action: "attack", damage: 0, target: { id: "hacker", expectedDamage: 0 } });
    const drained = resolveEnemyTurn(jammedDrainer, drainPlan);
    expect(drained.state.units.find((unit) => unit.id === "hacker")?.hp).toBe(6);
    expect(drained.state.enemies[0].hp).toBe(3);
    expect(drained.events.some((event) => event.type === "enemy-healed")).toBe(false);

    const chargingWhale: Enemy = {
      id: "whale-override",
      name: "Whale",
      kind: "whale",
      position: at(3, 0),
      hp: 10,
      maxHp: 10,
      moveRange: 1,
      attackDamage: 4,
      initiative: 10,
      whaleState: "charging",
      lockedArea: [at(3, 2)],
      facing: "south",
    };
    const whaleState: GameState = { ...base, enemies: [chargingWhale], breach: { position: at(6, 6), status: "spawned" } };
    const jammedWhale = jamEnemy(whaleState, "hacker", "whale-override").state;
    expect(calculateEnemyPlan(jammedWhale).intents[0]).toMatchObject({ action: "slam", damage: 2, targets: [{ id: "hacker", expectedDamage: 2 }] });

    const blackedOutWhale = blackoutEnemy(whaleState, "hacker", "whale-override").state;
    const blackoutPlan = calculateEnemyPlan(blackedOutWhale);
    expect(blackoutPlan.intents[0]).toMatchObject({ action: "hold", originalAction: "slam", area: [], damage: 0 });
    const held = resolveEnemyTurn(blackedOutWhale, blackoutPlan);
    expect(held.state.units.find((unit) => unit.id === "hacker")?.hp).toBe(6);
    expect(held.state.enemies[0]).toMatchObject({ whaleState: "ready", lockedArea: [], disruption: undefined });
  });
});

describe("Data Extraction objective", () => {
  it("wins immediately when the configured Data Block reaches E3", () => {
    let state: GameState = {
      ...createInitialGameState(DATA_EXTRACTION),
      enemies: [],
    };

    state = pushTarget(state, "pusher", "data-block", "shove").state;
    state = updateUnit(state, "pusher", {
      position: at(2, 4),
      hasMoved: false,
      hasActed: false,
    });
    state = pushTarget(state, "pusher", "data-block", "shove").state;
    state = updateUnit(state, "pusher", {
      position: at(1, 2),
      hasMoved: false,
      hasActed: false,
      signatureAvailable: true,
    });

    const extracted = pushTarget(state, "pusher", "data-block", "batter-up");

    expect(extracted.state).toMatchObject({
      phase: "victory",
      outcomeReason: "data-extracted",
      objects: [expect.objectContaining({ id: "data-block", position: at(4, 2) })],
    });
    expect(extracted.events.slice(-2)).toEqual([
      { type: "object-extracted", objectId: "data-block", position: at(4, 2) },
      { type: "mission-ended", outcome: "victory", reason: "data-extracted" },
    ]);
  });

  it("does not accept the wrong object or an undelivered Block", () => {
    const state = createInitialGameState(DATA_EXTRACTION);
    expect(checkVictoryDefeat(state)).toEqual({ outcome: null, reason: null });
    expect(checkVictoryDefeat({
      ...state,
      objects: [{ id: "decoy", name: "Decoy", position: at(4, 2) }],
    })).toEqual({ outcome: null, reason: null });
  });

  it.each([
    ["west", at(3, 2), at(2, 2)],
    ["east", at(5, 2), at(6, 2)],
    ["north", at(4, 1), at(4, 0)],
    ["south", at(4, 3), at(4, 4)],
  ])("accepts an exact delivery pushed from the %s", (_direction, objectPosition, pusherPosition) => {
    const initial = createInitialGameState(DATA_EXTRACTION);
    const state: GameState = {
      ...initial,
      obstacles: [],
      enemies: [],
      vault: { ...initial.vault, position: at(6, 6) },
      breach: { position: at(0, 6), status: "spawned" },
      objects: [{ ...initial.objects[0], position: objectPosition }],
      units: initial.units.map((unit, index) =>
        unit.id === "pusher"
          ? { ...unit, position: pusherPosition }
          : { ...unit, position: at(index, 6) },
      ),
    };
    const delivered = pushTarget(state, "pusher", "data-block", "shove");
    expect(delivered.state).toMatchObject({ phase: "victory", outcomeReason: "data-extracted" });
    expect(delivered.events).toContainEqual({
      type: "object-extracted",
      objectId: "data-block",
      position: at(4, 2),
    });
  });

  it("does not extract when a blocker stops the cargo before E3", () => {
    const initial = createInitialGameState(DATA_EXTRACTION);
    const state: GameState = {
      ...initial,
      enemies: [],
      obstacles: [at(3, 2)],
      objects: [{ ...initial.objects[0], position: at(2, 2) }],
      units: initial.units.map((unit) =>
        unit.id === "pusher" ? { ...unit, position: at(1, 2) } : unit,
      ),
    };
    const blocked = pushTarget(state, "pusher", "data-block", "batter-up");
    expect(blocked.state.phase).toBe("player");
    expect(blocked.state.objects[0].position).toEqual(at(2, 2));
    expect(blocked.events.some((event) => event.type === "object-extracted")).toBe(false);
  });

  it("fails after enemy phase five and preserves defeat priority", () => {
    const initial = createInitialGameState(DATA_EXTRACTION);
    const turnFive: GameState = {
      ...initial,
      turn: 5,
      completedEnemyPhases: 4,
      enemies: [],
    };
    const timedOut = resolveEnemyTurn(turnFive, calculateEnemyPlan(turnFive));
    expect(timedOut.state).toMatchObject({
      phase: "defeat",
      completedEnemyPhases: 5,
      outcomeReason: "extraction-timeout",
    });

    expect(checkVictoryDefeat({
      ...timedOut.state,
      vault: { ...timedOut.state.vault, hp: 0 },
    })).toEqual({ outcome: "defeat", reason: "vault-destroyed" });
  });

  it("produces byte-equivalent enemy plans for identical extraction states", () => {
    const first = createInitialGameState(DATA_EXTRACTION);
    const second = createInitialGameState(DATA_EXTRACTION);
    expect(JSON.stringify(calculateEnemyPlan(first))).toBe(JSON.stringify(calculateEnemyPlan(second)));
  });
});

describe("Lane Sentinel interception", () => {
  it("authors an exact stationary guard plan after the Rugger intent", () => {
    const state = createInitialGameState(DATA_EXTRACTION);
    const first = calculateEnemyPlan(state);
    const second = calculateEnemyPlan(createInitialGameState(DATA_EXTRACTION));

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(state.enemies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "rugger-extraction",
          kind: "rugger",
          position: at(4, 1),
          hp: 6,
        }),
        expect.objectContaining({
          id: "sentinel-extraction",
          kind: "sentinel",
          position: at(4, 2),
          hp: 6,
          moveRange: 0,
          attackDamage: 0,
          initiative: 20,
        }),
      ]),
    );
    expect(first.intents).toHaveLength(2);
    expect(first.intents[0]).toMatchObject({
      enemyId: "rugger-extraction",
      action: "attack",
      path: [],
      destination: at(4, 1),
      target: { id: "guardian", expectedDamage: 3 },
    });
    expect(first.intents[1]).toMatchObject({
      enemyId: "sentinel-extraction",
      action: "guard",
      path: [],
      destination: at(4, 2),
      damage: 0,
      special: "intercept-grid",
      guardedEnemyIds: ["rugger-extraction"],
      supportTargets: [
        {
          id: "rugger-extraction",
          kind: "enemy",
          position: at(4, 1),
          effect: "intercept-direct-attack",
        },
      ],
    });
    expect(getSentinelGuardArea(state, "sentinel-extraction")).toEqual([
      at(4, 1),
      at(4, 0),
      at(4, 3),
      at(4, 4),
      at(4, 5),
      at(4, 6),
      at(3, 2),
      at(2, 2),
      at(1, 2),
      at(0, 2),
    ]);
  });

  it("redirects basic attacks to the exact Sentinel receiver", () => {
    const state = createInitialGameState(DATA_EXTRACTION);
    const transition = attackEnemy(state, "guardian", "rugger-extraction");

    expect(transition.state.enemies.find((enemy) => enemy.id === "rugger-extraction")?.hp).toBe(6);
    expect(transition.state.enemies.find((enemy) => enemy.id === "sentinel-extraction")?.hp).toBe(4);
    expect(transition.events.slice(0, 2)).toEqual([
      {
        type: "attack-intercepted",
        unitId: "guardian",
        intendedEnemyId: "rugger-extraction",
        interceptorId: "sentinel-extraction",
        damage: 2,
      },
      {
        type: "unit-attacked",
        unitId: "guardian",
        enemyId: "sentinel-extraction",
        damage: 2,
        deadeye: false,
      },
    ]);
  });

  it("redirects Deadeye without refunding its action or mission charge", () => {
    let state = createInitialGameState(DATA_EXTRACTION);
    state = updateUnit(state, "sniper", { position: at(4, 4) });

    const transition = activateDeadeye(state, "sniper", "rugger-extraction");
    const sniper = transition.state.units.find((unit) => unit.id === "sniper");

    expect(transition.state.enemies.find((enemy) => enemy.id === "rugger-extraction")?.hp).toBe(6);
    expect(transition.state.enemies.find((enemy) => enemy.id === "sentinel-extraction")?.hp).toBe(2);
    expect(sniper).toMatchObject({
      hasMoved: true,
      hasActed: true,
      signatureAvailable: false,
    });
    expect(transition.events[0]).toMatchObject({
      type: "attack-intercepted",
      intendedEnemyId: "rugger-extraction",
      interceptorId: "sentinel-extraction",
      damage: 4,
    });
  });

  it("loses interception when alignment or terrain/object line of sight breaks", () => {
    const initial = createInitialGameState(DATA_EXTRACTION);
    expect(getEnemyInterceptor(initial, "rugger-extraction")?.id).toBe("sentinel-extraction");

    const misaligned: GameState = {
      ...initial,
      enemies: initial.enemies.map((enemy) =>
        enemy.id === "rugger-extraction"
          ? { ...enemy, position: at(3, 1) }
          : enemy,
      ),
    };
    expect(getEnemyInterceptor(misaligned, "rugger-extraction")).toBeUndefined();
    const misalignedAttack = attackEnemy(
      updateUnit(misaligned, "guardian", { position: at(3, 2) }),
      "guardian",
      "rugger-extraction",
    );
    expect(misalignedAttack.state.enemies.find((enemy) => enemy.id === "rugger-extraction")?.hp).toBe(4);
    expect(misalignedAttack.events.some((event) => event.type === "attack-intercepted")).toBe(false);

    const blocked: GameState = {
      ...initial,
      enemies: initial.enemies.map((enemy) =>
        enemy.id === "rugger-extraction"
          ? { ...enemy, position: at(4, 0) }
          : enemy,
      ),
      objects: [
        ...initial.objects,
        { id: "guard-blocker", name: "Guard Blocker", position: at(4, 1) },
      ],
    };
    expect(getEnemyInterceptor(blocked, "rugger-extraction")).toBeUndefined();
    expect(getSentinelGuardArea(blocked, "sentinel-extraction")).not.toContainEqual(at(4, 0));
    const blockedAttack = attackEnemy(
      updateUnit(blocked, "sniper", { position: at(1, 0) }),
      "sniper",
      "rugger-extraction",
    );
    expect(blockedAttack.state.enemies.find((enemy) => enemy.id === "rugger-extraction")?.hp).toBe(3);
    expect(blockedAttack.state.enemies.find((enemy) => enemy.id === "sentinel-extraction")?.hp).toBe(6);
  });

  it("chooses the nearest interceptor, then initiative and stable ID", () => {
    const initial = createInitialGameState(DATA_EXTRACTION);
    const sentinel = initial.enemies.find((enemy) => enemy.kind === "sentinel")!;
    const rugger = initial.enemies.find((enemy) => enemy.kind === "rugger")!;
    const state: GameState = {
      ...initial,
      obstacles: [],
      objects: [],
      vault: { ...initial.vault, position: at(0, 0) },
      enemies: [
        { ...rugger, position: at(3, 3) },
        { ...sentinel, id: "sentinel-far", position: at(3, 6), initiative: 1 },
        { ...sentinel, id: "sentinel-near-z", position: at(3, 2), initiative: 5 },
        { ...sentinel, id: "sentinel-near-a", position: at(3, 5), initiative: 5 },
      ],
    };

    expect(getEnemyInterceptor(state, "rugger-extraction")?.id).toBe("sentinel-near-z");
    const initiativeTie: GameState = {
      ...state,
      enemies: state.enemies.map((enemy) =>
        enemy.id === "sentinel-near-z"
          ? { ...enemy, position: at(1, 3), initiative: 4 }
          : enemy.id === "sentinel-near-a"
            ? { ...enemy, position: at(5, 3) }
            : enemy,
      ),
    };
    expect(getEnemyInterceptor(initiativeTie, "rugger-extraction")?.id).toBe("sentinel-near-z");
    const stableIdTie: GameState = {
      ...initiativeTie,
      enemies: initiativeTie.enemies.map((enemy) =>
        enemy.id === "sentinel-near-z" ? { ...enemy, initiative: 5 } : enemy,
      ),
    };
    expect(getEnemyInterceptor(stableIdTie, "rugger-extraction")?.id).toBe("sentinel-near-a");
  });

  it("lets push collision damage bypass the interception grid", () => {
    let state = createInitialGameState(DATA_EXTRACTION);
    state = updateUnit(state, "pusher", { position: at(3, 1) });

    const transition = pushTarget(state, "pusher", "rugger-extraction", "shove");

    expect(getEnemyInterceptor(state, "rugger-extraction")?.id).toBe("sentinel-extraction");
    expect(transition.state.enemies.find((enemy) => enemy.id === "rugger-extraction")?.hp).toBe(5);
    expect(transition.state.enemies.find((enemy) => enemy.id === "sentinel-extraction")?.hp).toBe(6);
    expect(transition.events).toContainEqual({
      type: "collision",
      sourceId: "pusher",
      targetId: "rugger-extraction",
      targetKind: "enemy",
      damage: 1,
      ability: "shove",
    });
    expect(transition.events.some((event) => event.type === "attack-intercepted")).toBe(false);
  });

  it("emits the exact fortified grid without changing state", () => {
    const state = createInitialGameState(DATA_EXTRACTION);
    const plan = calculateEnemyPlan(state);
    const transition = resolveEnemyTurn(state, plan);
    const guardIntent = plan.intents.find((intent) => intent.enemyKind === "sentinel")!;

    expect(transition.events).toContainEqual({
      type: "sentinel-fortified",
      enemyId: "sentinel-extraction",
      area: guardIntent.area,
      guardedEnemyIds: ["rugger-extraction"],
    });
    expect(transition.state.enemies.find((enemy) => enemy.id === "sentinel-extraction")).toMatchObject({
      position: at(4, 2),
      hp: 6,
    });
  });

  it("keeps the authored Turn 4 extraction solution valid", () => {
    let state = createInitialGameState(DATA_EXTRACTION);
    const endEnemyPhase = () => {
      state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;
    };

    state = moveUnit(state, "sniper", at(1, 2)).state;
    state = attackEnemy(state, "sniper", "sentinel-extraction").state;
    state = applyShield(state, "guardian").state;
    state = pushTarget(state, "pusher", "data-block", "shove").state;
    endEnemyPhase();
    expect(state.units.find((unit) => unit.id === "guardian")?.hp).toBe(11);

    state = attackEnemy(state, "sniper", "sentinel-extraction").state;
    state = attackEnemy(state, "guardian", "rugger-extraction").state;
    state = moveUnit(state, "pusher", at(2, 4)).state;
    state = pushTarget(state, "pusher", "data-block", "shove").state;
    endEnemyPhase();
    expect(state.units.find((unit) => unit.id === "guardian")?.hp).toBe(8);

    state = attackEnemy(state, "guardian", "rugger-extraction").state;
    state = moveUnit(state, "sniper", at(0, 2)).state;
    state = waitUnit(state, "sniper").state;
    state = moveUnit(state, "pusher", at(1, 3)).state;
    state = waitUnit(state, "pusher").state;
    endEnemyPhase();
    expect(state.units.find((unit) => unit.id === "guardian")?.hp).toBe(5);

    state = attackEnemy(state, "guardian", "rugger-extraction").state;
    state = moveUnit(state, "pusher", at(1, 2)).state;
    const extracted = pushTarget(state, "pusher", "data-block", "batter-up");

    expect(extracted.state).toMatchObject({
      phase: "victory",
      outcomeReason: "data-extracted",
      completedEnemyPhases: 3,
      defeatedEnemies: 2,
      vault: { hp: 10 },
      objects: [expect.objectContaining({ id: "data-block", position: at(4, 2) })],
    });
    expect(extracted.events.slice(-2)).toEqual([
      { type: "object-extracted", objectId: "data-block", position: at(4, 2) },
      { type: "mission-ended", outcome: "victory", reason: "data-extracted" },
    ]);
  });
});

describe("Break the Breach objective", () => {
  it("creates the authored boss puzzle and fingerprints its anvil data", () => {
    const first = createInitialGameState(BREAK_THE_BREACH);
    const second = createInitialGameState(BREAK_THE_BREACH);

    expect(first).toMatchObject({
      missionId: "break-the-breach",
      turn: 1,
      maxTurns: 5,
      objective: {
        kind: "break-breach",
        enemyId: "breach-whale",
        enemyPhases: 5,
        anvilObjectId: "data-block",
        anvilDestination: at(5, 1),
      },
      vault: { id: "seal-generator", position: at(3, 3), hp: 4, maxHp: 4 },
      breach: { position: at(6, 3), status: "incoming" },
    });
    expect(first.units.map((unit) => [unit.id, unit.position])).toEqual([
      ["guardian", at(3, 2)],
      ["sniper", at(1, 2)],
      ["pusher", at(5, 4)],
    ]);
    expect(first.objects).toEqual([
      expect.objectContaining({ id: "data-block", position: at(5, 2) }),
    ]);
    expect(first.obstacles).toEqual([
      at(1, 1),
      at(6, 1),
      at(2, 3),
      at(2, 4),
      at(4, 4),
      at(6, 4),
    ]);
    expect(first.enemies).toEqual([]);
    expect(checkVictoryDefeat(first)).toEqual({ outcome: null, reason: null });

    if (first.objective.kind !== "break-breach" || second.objective.kind !== "break-breach") {
      throw new Error("Expected the break-breach objective.");
    }
    expect(first.objective.anvilDestination).not.toBe(second.objective.anvilDestination);
    const changed: GameState = {
      ...first,
      objective: { ...first.objective, anvilDestination: at(4, 1) },
    };
    expect(getStateFingerprint(changed)).not.toBe(getStateFingerprint(first));
  });

  it("spawns on Turn 2 and promises the exact west-facing locked cone", () => {
    let state = createInitialGameState(BREAK_THE_BREACH);
    const firstPlan = calculateEnemyPlan(state);
    expect(firstPlan.intents).toEqual([]);
    state = resolveEnemyTurn(state, firstPlan).state;

    expect(state).toMatchObject({
      turn: 2,
      completedEnemyPhases: 1,
      breach: { status: "spawned" },
      enemies: [
        expect.objectContaining({
          id: "breach-whale",
          position: at(6, 3),
          hp: 12,
          whaleState: "ready",
        }),
      ],
    });

    const plan = calculateEnemyPlan(state);
    expect(plan.intents).toEqual([
      expect.objectContaining({
        enemyId: "breach-whale",
        action: "charge",
        path: [at(5, 3)],
        destination: at(5, 3),
        facing: "west",
        area: [at(4, 3), at(3, 2), at(3, 3), at(3, 4)],
        damage: 0,
      }),
    ]);
    expect(JSON.stringify(plan)).toBe(JSON.stringify(calculateEnemyPlan(state)));
  });

  it("follows the full setup, charge break, stagger, anvil collision, and Turn 4 kill", () => {
    let state = createInitialGameState(BREAK_THE_BREACH);

    state = moveUnit(state, "pusher", at(5, 3)).state;
    state = pushTarget(state, "pusher", "data-block", "shove").state;
    expect(state.objects[0].position).toEqual(at(5, 1));
    state = moveUnit(state, "guardian", at(4, 2)).state;
    state = waitUnit(state, "guardian").state;
    state = moveUnit(state, "sniper", at(2, 2)).state;
    state = waitUnit(state, "sniper").state;
    state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;

    state = moveUnit(state, "pusher", at(5, 4)).state;
    state = waitUnit(state, "pusher").state;
    state = waitUnit(state, "guardian").state;
    state = waitUnit(state, "sniper").state;
    const chargePlan = calculateEnemyPlan(state);
    expect(chargePlan.intents[0]).toMatchObject({
      enemyId: "breach-whale",
      action: "charge",
      destination: at(5, 3),
      area: [at(4, 3), at(3, 2), at(3, 3), at(3, 4)],
    });
    state = resolveEnemyTurn(state, chargePlan).state;

    const interrupted = pushTarget(state, "pusher", "breach-whale", "shove");
    expect(interrupted.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "target-pushed",
        targetId: "breach-whale",
        from: at(5, 3),
        to: at(5, 2),
        distance: 1,
      }),
      { type: "whale-charge-cancelled", enemyId: "breach-whale" },
    ]));
    state = interrupted.state;
    expect(state).toMatchObject({ whaleChargeCancelled: true });
    expect(state.enemies[0]).toMatchObject({
      position: at(5, 2),
      hp: 12,
      whaleState: "staggered",
      lockedArea: [],
    });

    state = attackEnemy(state, "guardian", "breach-whale").state;
    state = attackEnemy(state, "sniper", "breach-whale").state;
    expect(state.enemies[0].hp).toBe(7);
    const staggerPlan = calculateEnemyPlan(state);
    expect(staggerPlan.intents[0]).toMatchObject({
      action: "staggered",
      special: "stagger-skip",
    });
    state = resolveEnemyTurn(state, staggerPlan).state;
    expect(state).toMatchObject({ turn: 4, completedEnemyPhases: 3, phase: "player" });

    state = moveUnit(state, "pusher", at(5, 3)).state;
    const collision = pushTarget(state, "pusher", "breach-whale", "batter-up");
    expect(collision.events).toContainEqual({
      type: "collision",
      sourceId: "pusher",
      targetId: "breach-whale",
      targetKind: "enemy",
      damage: 2,
      ability: "batter-up",
    });
    state = collision.state;
    expect(state.enemies[0]).toMatchObject({ position: at(5, 2), hp: 5 });
    state = attackEnemy(state, "guardian", "breach-whale").state;
    const finalAttack = attackEnemy(state, "sniper", "breach-whale");

    expect(finalAttack.state).toMatchObject({
      phase: "victory",
      outcomeReason: "breach-broken",
      completedEnemyPhases: 3,
      defeatedEnemies: 1,
    });
    expect(finalAttack.state.enemies).toEqual([]);
    expect(finalAttack.events.slice(-2)).toEqual([
      { type: "enemy-defeated", enemyId: "breach-whale" },
      { type: "mission-ended", outcome: "victory", reason: "breach-broken" },
    ]);
  });

  it("leaves a blocked charge active and loses the 4 HP Seal to the promised slam", () => {
    let state = createInitialGameState(BREAK_THE_BREACH);
    state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;
    state = resolveEnemyTurn(state, calculateEnemyPlan(state)).state;

    const blocked = pushTarget(state, "pusher", "breach-whale", "shove");
    expect(blocked.events).toContainEqual({
      type: "collision",
      sourceId: "pusher",
      targetId: "breach-whale",
      targetKind: "enemy",
      damage: 1,
      ability: "shove",
    });
    expect(blocked.state.enemies[0]).toMatchObject({
      position: at(5, 3),
      hp: 11,
      whaleState: "charging",
    });
    expect(blocked.state.whaleChargeCancelled).toBe(false);

    const slamPlan = calculateEnemyPlan(blocked.state);
    expect(slamPlan.intents[0]).toMatchObject({
      action: "slam",
      targets: expect.arrayContaining([
        expect.objectContaining({ id: "seal-generator", expectedDamage: 4 }),
      ]),
    });
    const defeated = resolveEnemyTurn(blocked.state, slamPlan);
    expect(defeated.state).toMatchObject({
      phase: "defeat",
      outcomeReason: "vault-destroyed",
      completedEnemyPhases: 2,
      vault: { hp: 0 },
    });
  });

  it("also terminalizes a fatal anvil collision during the player phase", () => {
    const initial = createInitialGameState(BREAK_THE_BREACH);
    const target = BREAK_THE_BREACH.breach.enemy;
    const state: GameState = {
      ...initial,
      breach: { ...initial.breach, status: "spawned" },
      enemies: [{
        ...target,
        position: at(5, 2),
        hp: 2,
        whaleState: "ready",
        lockedArea: [],
      }],
      objects: [{ ...initial.objects[0], position: at(5, 1) }],
      units: initial.units.map((unit) =>
        unit.id === "pusher" ? { ...unit, position: at(5, 3) } : unit,
      ),
    };

    const finished = pushTarget(state, "pusher", "breach-whale", "batter-up");
    expect(finished.state).toMatchObject({
      phase: "victory",
      outcomeReason: "breach-broken",
      defeatedEnemies: 1,
    });
    expect(finished.events).toEqual(expect.arrayContaining([
      { type: "enemy-defeated", enemyId: "breach-whale" },
      {
        type: "collision",
        sourceId: "pusher",
        targetId: "breach-whale",
        targetKind: "enemy",
        damage: 2,
        ability: "batter-up",
      },
    ]));
    expect(finished.events.at(-1)).toEqual({
      type: "mission-ended",
      outcome: "victory",
      reason: "breach-broken",
    });
  });

  it("times out after phase five when the spawned target remains alive", () => {
    const initial = createInitialGameState(BREAK_THE_BREACH);
    const target = BREAK_THE_BREACH.breach.enemy;
    const turnFive: GameState = {
      ...initial,
      turn: 5,
      completedEnemyPhases: 4,
      breach: { ...initial.breach, status: "spawned" },
      enemies: [{
        ...target,
        position: { ...target.position },
        hp: target.maxHp,
        whaleState: "staggered",
        lockedArea: [],
      }],
    };
    const timedOut = resolveEnemyTurn(turnFive, calculateEnemyPlan(turnFive));
    expect(timedOut.state).toMatchObject({
      phase: "defeat",
      completedEnemyPhases: 5,
      outcomeReason: "breach-overrun",
      vault: { hp: 4 },
    });
    expect(timedOut.events.at(-1)).toEqual({
      type: "mission-ended",
      outcome: "defeat",
      reason: "breach-overrun",
    });
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

  it("applies Shove collision damage against a Data Block in all four directions", () => {
    const scenarios = [
      { name: "north", pusher: at(3, 4), enemy: at(3, 3), block: at(3, 2) },
      { name: "east", pusher: at(2, 3), enemy: at(3, 3), block: at(4, 3) },
      { name: "south", pusher: at(3, 2), enemy: at(3, 3), block: at(3, 4) },
      { name: "west", pusher: at(4, 3), enemy: at(3, 3), block: at(2, 3) },
    ];

    for (const scenario of scenarios) {
      const initial = createInitialGameState();
      const state: GameState = {
        ...initial,
        obstacles: [],
        vault: { ...initial.vault, position: at(6, 6) },
        units: initial.units
          .filter((unit) => unit.id === "pusher")
          .map((unit) => ({ ...unit, position: scenario.pusher })),
        enemies: initial.enemies
          .filter((enemy) => enemy.id === "rugger-east")
          .map((enemy) => ({ ...enemy, position: scenario.enemy })),
        objects: initial.objects.map((object) => ({ ...object, position: scenario.block })),
      };
      const transition = pushTarget(state, "pusher", "rugger-east", "shove");

      expect(transition.state.enemies[0], scenario.name).toMatchObject({
        position: scenario.enemy,
        hp: 5,
      });
      expect(transition.events, scenario.name).toContainEqual({
        type: "collision",
        sourceId: "pusher",
        targetId: "rugger-east",
        targetKind: "enemy",
        damage: 1,
        ability: "shove",
      });
      expect(transition.events.some((event) => event.type === "target-pushed"), scenario.name).toBe(false);
    }
  });

  it("moves once without damage when a Shove does not attempt the blocked second tile", () => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      obstacles: [],
      vault: { ...initial.vault, position: at(6, 6) },
      units: initial.units
        .filter((unit) => unit.id === "pusher")
        .map((unit) => ({ ...unit, position: at(1, 3) })),
      enemies: initial.enemies
        .filter((enemy) => enemy.id === "rugger-east")
        .map((enemy) => ({ ...enemy, position: at(2, 3) })),
      objects: initial.objects.map((object) => ({ ...object, position: at(4, 3) })),
    };
    const transition = pushTarget(state, "pusher", "rugger-east", "shove");

    expect(transition.state.enemies[0]).toMatchObject({ position: at(3, 3), hp: 6 });
    expect(transition.events).toContainEqual(expect.objectContaining({
      type: "target-pushed",
      distance: 1,
      ability: "shove",
    }));
    expect(transition.events.some((event) => event.type === "collision")).toBe(false);
  });

  it("moves one tile then deals 2 when Batter Up reaches a blocker on its second tile", () => {
    const initial = createInitialGameState();
    const state: GameState = {
      ...initial,
      obstacles: [],
      vault: { ...initial.vault, position: at(6, 6) },
      units: initial.units
        .filter((unit) => unit.id === "pusher")
        .map((unit) => ({ ...unit, position: at(1, 3) })),
      enemies: initial.enemies
        .filter((enemy) => enemy.id === "rugger-east")
        .map((enemy) => ({ ...enemy, position: at(2, 3) })),
      objects: initial.objects.map((object) => ({ ...object, position: at(4, 3) })),
    };
    const transition = pushTarget(state, "pusher", "rugger-east", "batter-up");

    expect(transition.state.enemies[0]).toMatchObject({ position: at(3, 3), hp: 4 });
    expect(transition.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "target-pushed", distance: 1, ability: "batter-up" }),
      expect.objectContaining({ type: "collision", damage: 2, ability: "batter-up" }),
    ]));
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
    expect(pushed.state.whaleChargeCancelled).toBe(true);
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
    expect(failedPush.state.whaleChargeCancelled).toBe(false);
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
