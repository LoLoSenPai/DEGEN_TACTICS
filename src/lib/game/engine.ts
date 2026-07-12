import { DEFAULT_MISSION, getMissionDefinition } from "./mission";
import {
  CARDINAL_DIRECTIONS,
  addPositions,
  deltaForDirection,
  directionBetween,
  findShortestPath,
  getConeArea,
  getReachablePositions,
  isInBounds,
  manhattanDistance,
  positionKey,
  samePosition,
} from "./pathfinding";
import type {
  Direction,
  Enemy,
  EnemyIntent,
  EnemyTurnPlan,
  GameEvent,
  GameState,
  GameTransition,
  IntentTarget,
  MissionDefinition,
  OutcomeCheck,
  PlayerUnit,
  Position,
  PushKind,
  PushTarget,
  PushTargetKind,
} from "./types";

const clonePosition = ({ x, y }: Position): Position => ({ x, y });

const reject = (state: GameState, message: string): GameTransition => ({
  state,
  events: [{ type: "action-rejected", message }],
});

const livingUnits = (state: GameState): PlayerUnit[] =>
  state.units.filter((unit) => unit.hp > 0);

const getUnit = (state: GameState, unitId: string): PlayerUnit | undefined =>
  state.units.find((unit) => unit.id === unitId);

const getEnemy = (state: GameState, enemyId: string): Enemy | undefined =>
  state.enemies.find((enemy) => enemy.id === enemyId && enemy.hp > 0);

const terrainBlocks = (state: GameState, candidate: Position): boolean =>
  state.obstacles.some((position) => samePosition(position, candidate)) ||
  samePosition(state.vault.position, candidate) ||
  (state.breach.status !== "spawned" &&
    samePosition(state.breach.position, candidate));

interface BlockOptions {
  readonly ignoreUnitId?: string;
  readonly ignoreEnemyId?: string;
  readonly ignoreObjectId?: string;
  readonly ignoreUnits?: boolean;
  readonly ignoreVault?: boolean;
}

const isOccupied = (
  state: GameState,
  candidate: Position,
  options: BlockOptions = {},
): boolean =>
  (!options.ignoreVault && terrainBlocks(state, candidate)) ||
  (!options.ignoreUnits &&
    state.units.some(
      (unit) =>
        unit.hp > 0 &&
        unit.id !== options.ignoreUnitId &&
        samePosition(unit.position, candidate),
    )) ||
  state.enemies.some(
    (enemy) =>
      enemy.hp > 0 &&
      enemy.id !== options.ignoreEnemyId &&
      samePosition(enemy.position, candidate),
  ) ||
  state.objects.some(
    (object) =>
      object.id !== options.ignoreObjectId &&
      samePosition(object.position, candidate),
  );

export const createInitialGameState = (
  definition: MissionDefinition = DEFAULT_MISSION,
): GameState => ({
  missionId: definition.id,
  turn: 1,
  maxTurns: definition.maxTurns,
  completedEnemyPhases: 0,
  phase: "player",
  units: definition.units.map((unit) => ({
    ...unit,
    position: clonePosition(unit.position),
    hp: unit.maxHp,
    signatureAvailable: true,
    hasMoved: false,
    hasActed: false,
    shield: null,
  })),
  enemies: definition.enemies.map((enemy) => ({
    ...enemy,
    position: clonePosition(enemy.position),
    hp: enemy.maxHp,
  })),
  objects: definition.objects.map((object) => ({
    ...object,
    position: clonePosition(object.position),
  })),
  vault: {
    ...definition.vault,
    position: clonePosition(definition.vault.position),
    hp: definition.vault.maxHp,
  },
  obstacles: definition.obstacles.map(clonePosition),
  breach: {
    position: clonePosition(definition.breach.position),
    status: definition.breach.warningTurn === 1 ? "incoming" : "dormant",
  },
  defeatedEnemies: 0,
  initialSquadSize: definition.units.length,
  vaultEverDamaged: false,
});

export const getStateFingerprint = (state: GameState): string =>
  JSON.stringify({
    turn: state.turn,
    phase: state.phase,
    completedEnemyPhases: state.completedEnemyPhases,
    units: [...state.units]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((unit) => [
        unit.id,
        unit.position.x,
        unit.position.y,
        unit.hp,
        unit.shield?.value ?? 0,
      ]),
    enemies: [...state.enemies]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((enemy) => [
        enemy.id,
        enemy.position.x,
        enemy.position.y,
        enemy.hp,
        enemy.whaleState ?? null,
        enemy.facing ?? null,
        enemy.lockedArea?.map(positionKey) ?? [],
      ]),
    objects: [...state.objects]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((object) => [object.id, object.position.x, object.position.y]),
    vault: [state.vault.hp, state.vault.position.x, state.vault.position.y],
    breach: [
      state.breach.status,
      state.breach.position.x,
      state.breach.position.y,
    ],
  });

export const getValidMoves = (state: GameState, unitId: string): Position[] => {
  const unit = getUnit(state, unitId);
  if (
    state.phase !== "player" ||
    !unit ||
    unit.hp <= 0 ||
    unit.hasMoved ||
    unit.hasActed
  ) {
    return [];
  }

  return getReachablePositions(unit.position, unit.moveRange, (candidate) =>
    isOccupied(state, candidate, { ignoreUnitId: unit.id }),
  );
};

const hasLineOfSight = (
  state: GameState,
  from: Position,
  to: Position,
): boolean => {
  if (from.x !== to.x && from.y !== to.y) return false;
  const distance = manhattanDistance(from, to);
  if (distance === 0) return false;
  const step: Position = {
    x: Math.sign(to.x - from.x),
    y: Math.sign(to.y - from.y),
  };

  let cursor = addPositions(from, step);
  for (let index = 1; index < distance; index += 1) {
    if (
      state.obstacles.some((position) => samePosition(position, cursor)) ||
      samePosition(state.vault.position, cursor) ||
      state.objects.some((object) => samePosition(object.position, cursor))
    ) {
      return false;
    }
    cursor = addPositions(cursor, step);
  }
  return true;
};

export const getAttackableTargets = (
  state: GameState,
  unitId: string,
  options: Readonly<{ deadeye?: boolean }> = {},
): Enemy[] => {
  const unit = getUnit(state, unitId);
  if (
    state.phase !== "player" ||
    !unit ||
    unit.hp <= 0 ||
    unit.hasActed ||
    (options.deadeye &&
      (unit.role !== "sniper" || unit.hasMoved || !unit.signatureAvailable))
  ) {
    return [];
  }

  return state.enemies.filter((enemy) => {
    if (enemy.hp <= 0) return false;
    const distance = manhattanDistance(unit.position, enemy.position);
    if (unit.role !== "sniper") return distance === 1;
    return (
      distance >= 1 &&
      distance <= unit.attackRange &&
      hasLineOfSight(state, unit.position, enemy.position)
    );
  });
};

export const moveUnit = (
  state: GameState,
  unitId: string,
  to: Position,
): GameTransition => {
  const unit = getUnit(state, unitId);
  if (!unit) return reject(state, "Unit not found.");
  if (!getValidMoves(state, unitId).some((move) => samePosition(move, to))) {
    return reject(state, "That tile is not a valid move.");
  }

  const from = clonePosition(unit.position);
  const nextUnit: PlayerUnit = {
    ...unit,
    position: clonePosition(to),
    hasMoved: true,
  };
  return {
    state: {
      ...state,
      units: state.units.map((candidate) =>
        candidate.id === unitId ? nextUnit : candidate,
      ),
    },
    events: [{ type: "unit-moved", unitId, from, to: clonePosition(to) }],
  };
};

interface EnemyDamageResult {
  readonly state: GameState;
  readonly damage: number;
  readonly defeated: boolean;
}

const damageEnemy = (
  state: GameState,
  enemyId: string,
  amount: number,
): EnemyDamageResult => {
  const enemy = getEnemy(state, enemyId);
  if (!enemy) return { state, damage: 0, defeated: false };
  const damage = Math.min(enemy.hp, Math.max(0, amount));
  const hp = enemy.hp - damage;
  if (hp <= 0) {
    return {
      state: {
        ...state,
        enemies: state.enemies.filter((candidate) => candidate.id !== enemyId),
        defeatedEnemies: state.defeatedEnemies + 1,
      },
      damage,
      defeated: true,
    };
  }

  return {
    state: {
      ...state,
      enemies: state.enemies.map((candidate) =>
        candidate.id === enemyId ? { ...candidate, hp } : candidate,
      ),
    },
    damage,
    defeated: false,
  };
};

const markUnitActed = (
  state: GameState,
  unitId: string,
  changes: Partial<PlayerUnit> = {},
): GameState => ({
  ...state,
  units: state.units.map((unit) =>
    unit.id === unitId ? { ...unit, ...changes, hasActed: true } : unit,
  ),
});

const performPlayerAttack = (
  state: GameState,
  unitId: string,
  enemyId: string,
  deadeye: boolean,
): GameTransition => {
  const unit = getUnit(state, unitId);
  if (!unit) return reject(state, "Unit not found.");
  if (
    !getAttackableTargets(state, unitId, { deadeye }).some(
      (enemy) => enemy.id === enemyId,
    )
  ) {
    return reject(state, "That enemy is not a valid target.");
  }

  const requestedDamage = deadeye ? 4 : unit.attackDamage;
  const result = damageEnemy(state, enemyId, requestedDamage);
  const nextState = markUnitActed(result.state, unitId, {
    ...(deadeye
      ? { signatureAvailable: false, hasMoved: true }
      : undefined),
  });
  const events: GameEvent[] = [
    {
      type: "unit-attacked",
      unitId,
      enemyId,
      damage: result.damage,
      deadeye,
    },
  ];
  if (result.defeated) events.push({ type: "enemy-defeated", enemyId });

  return { state: nextState, events };
};

export const attackEnemy = (
  state: GameState,
  unitId: string,
  enemyId: string,
): GameTransition => performPlayerAttack(state, unitId, enemyId, false);

export const activateDeadeye = (
  state: GameState,
  unitId: string,
  enemyId: string,
): GameTransition => performPlayerAttack(state, unitId, enemyId, true);

export const waitUnit = (
  state: GameState,
  unitId: string,
): GameTransition => {
  const unit = getUnit(state, unitId);
  if (
    state.phase !== "player" ||
    !unit ||
    unit.hp <= 0 ||
    unit.hasActed
  ) {
    return reject(state, "That unit cannot wait now.");
  }
  return {
    state: markUnitActed(state, unitId),
    events: [{ type: "unit-waited", unitId }],
  };
};

export const applyShield = (
  state: GameState,
  unitId: string,
): GameTransition => {
  const source = getUnit(state, unitId);
  if (
    state.phase !== "player" ||
    !source ||
    source.hp <= 0 ||
    source.role !== "guardian" ||
    source.hasActed ||
    !source.signatureAvailable
  ) {
    return reject(state, "Shield Wall is not available.");
  }

  const protectedIds = state.units
    .filter(
      (unit) =>
        unit.hp > 0 && manhattanDistance(source.position, unit.position) <= 1,
    )
    .map((unit) => unit.id);
  const protectedSet = new Set(protectedIds);
  const expiresAfterEnemyPhase = state.completedEnemyPhases + 1;

  return {
    state: {
      ...state,
      units: state.units.map((unit) => {
        if (unit.id === unitId) {
          return {
            ...unit,
            hasActed: true,
            signatureAvailable: false,
            shield: protectedSet.has(unit.id)
              ? { value: 2, expiresAfterEnemyPhase }
              : unit.shield,
          };
        }
        return protectedSet.has(unit.id)
          ? { ...unit, shield: { value: 2, expiresAfterEnemyPhase } }
          : unit;
      }),
    },
    events: [
      {
        type: "shield-applied",
        sourceId: unitId,
        unitIds: protectedIds,
        value: 2,
      },
    ],
  };
};

const findPushTarget = (
  state: GameState,
  targetId: string,
): { kind: PushTargetKind; position: Position } | null => {
  const enemy = getEnemy(state, targetId);
  if (enemy) return { kind: "enemy", position: enemy.position };
  const object = state.objects.find((candidate) => candidate.id === targetId);
  if (object) return { kind: "object", position: object.position };
  return null;
};

const pushDestinationBlocked = (
  state: GameState,
  targetId: string,
  targetKind: PushTargetKind,
  candidate: Position,
): boolean =>
  !isInBounds(candidate) ||
  isOccupied(state, candidate, {
    ignoreEnemyId: targetKind === "enemy" ? targetId : undefined,
    ignoreObjectId: targetKind === "object" ? targetId : undefined,
  });

export const getPushTargets = (
  state: GameState,
  unitId: string,
): PushTarget[] => {
  const unit = getUnit(state, unitId);
  if (
    state.phase !== "player" ||
    !unit ||
    unit.hp <= 0 ||
    unit.role !== "pusher" ||
    unit.hasActed
  ) {
    return [];
  }

  const targets: PushTarget[] = [];
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0 || manhattanDistance(unit.position, enemy.position) !== 1)
      continue;
    const direction = directionBetween(unit.position, enemy.position);
    const destination = direction
      ? addPositions(enemy.position, deltaForDirection(direction))
      : enemy.position;
    targets.push({
      id: enemy.id,
      kind: "enemy",
      position: enemy.position,
      canMove: !pushDestinationBlocked(state, enemy.id, "enemy", destination),
    });
  }
  for (const object of state.objects) {
    if (manhattanDistance(unit.position, object.position) !== 1) continue;
    const direction = directionBetween(unit.position, object.position);
    const destination = direction
      ? addPositions(object.position, deltaForDirection(direction))
      : object.position;
    targets.push({
      id: object.id,
      kind: "object",
      position: object.position,
      canMove: !pushDestinationBlocked(state, object.id, "object", destination),
    });
  }
  return targets;
};

export const pushTarget = (
  state: GameState,
  unitId: string,
  targetId: string,
  ability: PushKind = "shove",
): GameTransition => {
  const unit = getUnit(state, unitId);
  const target = findPushTarget(state, targetId);
  if (
    state.phase !== "player" ||
    !unit ||
    unit.hp <= 0 ||
    unit.role !== "pusher" ||
    unit.hasActed ||
    !target ||
    manhattanDistance(unit.position, target.position) !== 1 ||
    (ability === "batter-up" && !unit.signatureAvailable)
  ) {
    return reject(state, "That push is not available.");
  }

  const direction = directionBetween(unit.position, target.position);
  if (!direction) return reject(state, "Pushes must be orthogonal.");
  const delta = deltaForDirection(direction);
  const maxDistance = ability === "batter-up" ? 2 : 1;
  let destination = clonePosition(target.position);
  let distance = 0;
  let collided = false;

  for (let step = 0; step < maxDistance; step += 1) {
    const candidate = addPositions(destination, delta);
    if (pushDestinationBlocked(state, targetId, target.kind, candidate)) {
      collided = true;
      break;
    }
    destination = candidate;
    distance += 1;
  }

  let nextState = markUnitActed(state, unitId, {
    ...(ability === "batter-up" ? { signatureAvailable: false } : undefined),
  });
  const events: GameEvent[] = [];

  if (distance > 0) {
    if (target.kind === "enemy") {
      nextState = {
        ...nextState,
        enemies: nextState.enemies.map((enemy) =>
          enemy.id === targetId
            ? { ...enemy, position: clonePosition(destination) }
            : enemy,
        ),
      };
    } else {
      nextState = {
        ...nextState,
        objects: nextState.objects.map((object) =>
          object.id === targetId
            ? { ...object, position: clonePosition(destination) }
            : object,
        ),
      };
    }
    events.push({
      type: "target-pushed",
      sourceId: unitId,
      targetId,
      targetKind: target.kind,
      from: clonePosition(target.position),
      to: clonePosition(destination),
      distance,
      ability,
    });
  }

  if (collided) {
    const collisionDamage = ability === "batter-up" ? 2 : 1;
    let actualDamage = 0;
    if (target.kind === "enemy") {
      const result = damageEnemy(nextState, targetId, collisionDamage);
      nextState = result.state;
      actualDamage = result.damage;
      if (result.defeated) events.push({ type: "enemy-defeated", enemyId: targetId });
    }
    events.push({
      type: "collision",
      sourceId: unitId,
      targetId,
      targetKind: target.kind,
      damage: actualDamage,
      ability,
    });
  }

  const movedWhale = nextState.enemies.find(
    (enemy) =>
      enemy.id === targetId &&
      enemy.kind === "whale" &&
      enemy.whaleState === "charging",
  );
  if (distance > 0 && movedWhale) {
    nextState = {
      ...nextState,
      enemies: nextState.enemies.map((enemy) =>
        enemy.id === targetId
          ? {
              ...enemy,
              whaleState: "staggered",
              lockedArea: [],
              facing: undefined,
            }
          : enemy,
      ),
    };
    events.push({ type: "whale-charge-cancelled", enemyId: targetId });
  }

  return { state: nextState, events };
};

export const pushEnemy = (
  state: GameState,
  unitId: string,
  enemyId: string,
  ability: PushKind = "shove",
): GameTransition => {
  if (!getEnemy(state, enemyId)) return reject(state, "Enemy not found.");
  return pushTarget(state, unitId, enemyId, ability);
};

const expectedDamageToUnit = (unit: PlayerUnit, amount: number): number =>
  Math.min(unit.hp, Math.max(0, amount - (unit.shield?.value ?? 0)));

const intentTargetForUnit = (
  unit: PlayerUnit,
  amount: number,
): IntentTarget => ({
  id: unit.id,
  kind: "unit",
  position: clonePosition(unit.position),
  expectedDamage: expectedDamageToUnit(unit, amount),
});

const intentTargetForVault = (
  state: GameState,
  amount: number,
): IntentTarget => ({
  id: state.vault.id,
  kind: "vault",
  position: clonePosition(state.vault.position),
  expectedDamage: Math.min(state.vault.hp, amount),
});

const enemyPathBlocked = (
  state: GameState,
  candidate: Position,
  enemyId: string,
  unitsBlock: boolean,
): boolean =>
  terrainBlocks(state, candidate) ||
  state.enemies.some(
    (enemy) =>
      enemy.hp > 0 &&
      enemy.id !== enemyId &&
      samePosition(enemy.position, candidate),
  ) ||
  state.objects.some((object) => samePosition(object.position, candidate)) ||
  (unitsBlock &&
    state.units.some(
      (unit) => unit.hp > 0 && samePosition(unit.position, candidate),
    ));

const createSingleTargetIntent = (
  enemy: Enemy,
  order: number,
  path: readonly Position[],
  destination: Position,
  target: IntentTarget | undefined,
  special?: "drain",
): EnemyIntent => ({
  enemyId: enemy.id,
  enemyKind: enemy.kind,
  order,
  action: target ? "attack" : path.length > 0 ? "advance" : "idle",
  from: clonePosition(enemy.position),
  path: path.map(clonePosition),
  destination: clonePosition(destination),
  target,
  targets: target ? [target] : [],
  area: [],
  damage: target ? enemy.attackDamage : 0,
  special,
});

const calculateRuggerIntent = (
  state: GameState,
  enemy: Enemy,
  order: number,
): EnemyIntent => {
  const route = findShortestPath(
    enemy.position,
    state.vault.position,
    (candidate) => enemyPathBlocked(state, candidate, enemy.id, false),
  );
  if (!route) return createSingleTargetIntent(enemy, order, [], enemy.position, undefined);

  const movement: Position[] = [];
  let target: IntentTarget | undefined;
  for (const step of route) {
    const blockingUnit = livingUnits(state).find((unit) =>
      samePosition(unit.position, step),
    );
    if (blockingUnit) {
      if (
        manhattanDistance(
          movement.at(-1) ?? enemy.position,
          blockingUnit.position,
        ) === 1
      ) {
        target = intentTargetForUnit(blockingUnit, enemy.attackDamage);
      }
      break;
    }
    if (samePosition(step, state.vault.position)) {
      if (
        manhattanDistance(movement.at(-1) ?? enemy.position, step) === 1
      ) {
        target = intentTargetForVault(state, enemy.attackDamage);
      }
      break;
    }
    if (movement.length >= enemy.moveRange) break;
    movement.push(step);
  }

  const destination = movement.at(-1) ?? enemy.position;
  return createSingleTargetIntent(enemy, order, movement, destination, target);
};

interface DrainerRoute {
  readonly target: PlayerUnit | "vault";
  readonly path: Position[];
}

const calculateDrainerIntent = (
  state: GameState,
  enemy: Enemy,
  order: number,
): EnemyIntent => {
  const candidates = livingUnits(state).sort(
    (left, right) => left.hp - right.hp || left.id.localeCompare(right.id),
  );
  const lowestHp = candidates[0]?.hp;
  const routes: DrainerRoute[] = candidates
    .filter((unit) => unit.hp === lowestHp)
    .flatMap((unit): DrainerRoute[] => {
      const path = findShortestPath(
        enemy.position,
        unit.position,
        (candidate) =>
          enemyPathBlocked(state, candidate, enemy.id, true) &&
          !samePosition(candidate, unit.position),
      );
      return path ? [{ target: unit, path }] : [];
    })
    .sort((left, right) => {
      if (left.target === "vault" || right.target === "vault") return 0;
      return (
        left.path.length - right.path.length ||
        left.target.id.localeCompare(right.target.id)
      );
    });

  let selected = routes[0];
  if (!selected) {
    const vaultPath = findShortestPath(
      enemy.position,
      state.vault.position,
      (candidate) => enemyPathBlocked(state, candidate, enemy.id, true),
    );
    if (vaultPath) selected = { target: "vault", path: vaultPath };
  }
  if (!selected)
    return createSingleTargetIntent(enemy, order, [], enemy.position, undefined, "drain");

  const movement: Position[] = [];
  const targetPosition =
    selected.target === "vault"
      ? state.vault.position
      : selected.target.position;
  for (const step of selected.path) {
    if (samePosition(step, targetPosition) || movement.length >= enemy.moveRange)
      break;
    movement.push(step);
  }
  const destination = movement.at(-1) ?? enemy.position;
  const inRange = manhattanDistance(destination, targetPosition) === 1;
  const target = inRange
    ? selected.target === "vault"
      ? intentTargetForVault(state, enemy.attackDamage)
      : intentTargetForUnit(selected.target, enemy.attackDamage)
    : undefined;

  return createSingleTargetIntent(
    enemy,
    order,
    movement,
    destination,
    target,
    "drain",
  );
};

const chooseWhaleFacing = (
  origin: Position,
  vaultPosition: Position,
  route: readonly Position[],
): Direction => {
  const nextStep = route[0];
  const routedDirection = nextStep
    ? directionBetween(origin, nextStep)
    : directionBetween(origin, vaultPosition);
  if (routedDirection) return routedDirection;

  return [...CARDINAL_DIRECTIONS]
    .sort(
      (left, right) =>
        manhattanDistance(addPositions(origin, left.delta), vaultPosition) -
        manhattanDistance(addPositions(origin, right.delta), vaultPosition),
    )[0].direction;
};

const calculateWhaleIntent = (
  state: GameState,
  enemy: Enemy,
  order: number,
): EnemyIntent => {
  if (enemy.whaleState === "staggered") {
    return {
      enemyId: enemy.id,
      enemyKind: enemy.kind,
      order,
      action: "staggered",
      from: clonePosition(enemy.position),
      path: [],
      destination: clonePosition(enemy.position),
      targets: [],
      area: [],
      damage: 0,
      special: "stagger-skip",
    };
  }

  if (enemy.whaleState === "charging") {
    const area = (enemy.lockedArea ?? []).map(clonePosition);
    const targets: IntentTarget[] = [
      ...livingUnits(state)
        .filter((unit) =>
          area.some((position) => samePosition(position, unit.position)),
        )
        .map((unit) => intentTargetForUnit(unit, enemy.attackDamage)),
      ...(area.some((position) => samePosition(position, state.vault.position))
        ? [intentTargetForVault(state, enemy.attackDamage)]
        : []),
    ];
    return {
      enemyId: enemy.id,
      enemyKind: enemy.kind,
      order,
      action: "slam",
      from: clonePosition(enemy.position),
      path: [],
      destination: clonePosition(enemy.position),
      targets,
      area,
      damage: enemy.attackDamage,
      special: "ground-slam",
      facing: enemy.facing,
    };
  }

  const route =
    findShortestPath(
      enemy.position,
      state.vault.position,
      (candidate) => enemyPathBlocked(state, candidate, enemy.id, true),
    ) ?? [];
  const movement =
    route[0] && !samePosition(route[0], state.vault.position)
      ? [route[0]]
      : [];
  const destination = movement[0] ?? enemy.position;
  const remainingRoute = movement.length > 0 ? route.slice(1) : route;
  const facing = chooseWhaleFacing(
    destination,
    state.vault.position,
    remainingRoute,
  );
  const area = getConeArea(destination, facing);

  return {
    enemyId: enemy.id,
    enemyKind: enemy.kind,
    order,
    action: "charge",
    from: clonePosition(enemy.position),
    path: movement.map(clonePosition),
    destination: clonePosition(destination),
    targets: [],
    area,
    damage: 0,
    special: "lock-cone",
    facing,
  };
};

export const calculateEnemyIntent = (
  state: GameState,
  enemyId: string,
  order?: number,
): EnemyIntent => {
  const enemy = getEnemy(state, enemyId);
  if (!enemy) throw new RangeError(`Enemy ${enemyId} was not found.`);
  const resolvedOrder =
    order ??
    [...state.enemies]
      .filter((candidate) => candidate.hp > 0)
      .sort(
        (left, right) =>
          left.initiative - right.initiative || left.id.localeCompare(right.id),
      )
      .findIndex((candidate) => candidate.id === enemyId) +
      1;

  if (enemy.kind === "rugger")
    return calculateRuggerIntent(state, enemy, resolvedOrder);
  if (enemy.kind === "drainer")
    return calculateDrainerIntent(state, enemy, resolvedOrder);
  return calculateWhaleIntent(state, enemy, resolvedOrder);
};

interface TargetDamageResult {
  readonly state: GameState;
  readonly damage: number;
  readonly absorbed: number;
}

const damageIntentTarget = (
  state: GameState,
  target: IntentTarget,
  amount: number,
): TargetDamageResult => {
  if (target.kind === "vault") {
    const damage = Math.min(state.vault.hp, Math.max(0, amount));
    return {
      state: {
        ...state,
        vault: { ...state.vault, hp: state.vault.hp - damage },
        vaultEverDamaged: state.vaultEverDamaged || damage > 0,
      },
      damage,
      absorbed: 0,
    };
  }

  const unit = getUnit(state, target.id);
  if (!unit || unit.hp <= 0) return { state, damage: 0, absorbed: 0 };
  const absorbed = Math.min(amount, unit.shield?.value ?? 0);
  const damage = Math.min(unit.hp, Math.max(0, amount - absorbed));
  return {
    state: {
      ...state,
      units: state.units.map((candidate) =>
        candidate.id === target.id
          ? { ...candidate, hp: candidate.hp - damage, shield: null }
          : candidate,
      ),
    },
    damage,
    absorbed,
  };
};

const applyEnemyIntent = (
  state: GameState,
  intent: EnemyIntent,
  emitEvents: boolean,
): GameTransition => {
  const enemy = getEnemy(state, intent.enemyId);
  if (!enemy) return { state, events: [] };
  const events: GameEvent[] = [];
  let nextState = state;

  if (!samePosition(enemy.position, intent.destination)) {
    nextState = {
      ...nextState,
      enemies: nextState.enemies.map((candidate) =>
        candidate.id === enemy.id
          ? { ...candidate, position: clonePosition(intent.destination) }
          : candidate,
      ),
    };
    if (emitEvents) {
      events.push({
        type: "enemy-moved",
        enemyId: enemy.id,
        from: clonePosition(enemy.position),
        to: clonePosition(intent.destination),
        path: intent.path.map(clonePosition),
      });
    }
  }

  if (intent.action === "attack" && intent.target) {
    const result = damageIntentTarget(nextState, intent.target, intent.damage);
    nextState = result.state;
    if (emitEvents) {
      events.push({
        type: "damage",
        sourceId: enemy.id,
        targetId: intent.target.id,
        amount: result.damage,
        absorbed: result.absorbed,
      });
    }

    if (enemy.kind === "drainer" && result.damage > 0) {
      let healed = 0;
      nextState = {
        ...nextState,
        enemies: nextState.enemies.map((candidate) => {
          if (candidate.id !== enemy.id) return candidate;
          const hp = Math.min(candidate.maxHp, candidate.hp + 1);
          healed = hp - candidate.hp;
          return { ...candidate, hp };
        }),
      };
      if (emitEvents && healed > 0)
        events.push({ type: "enemy-healed", enemyId: enemy.id, amount: healed });
    }
  }

  if (intent.action === "charge" && intent.facing) {
    nextState = {
      ...nextState,
      enemies: nextState.enemies.map((candidate) =>
        candidate.id === enemy.id
          ? {
              ...candidate,
              whaleState: "charging",
              lockedArea: intent.area.map(clonePosition),
              facing: intent.facing,
            }
          : candidate,
      ),
    };
    if (emitEvents)
      events.push({
        type: "whale-cone-locked",
        enemyId: enemy.id,
        area: intent.area.map(clonePosition),
        facing: intent.facing,
      });
  }

  if (intent.action === "slam") {
    for (const target of intent.targets) {
      const result = damageIntentTarget(nextState, target, intent.damage);
      nextState = result.state;
      if (emitEvents)
        events.push({
          type: "damage",
          sourceId: enemy.id,
          targetId: target.id,
          amount: result.damage,
          absorbed: result.absorbed,
        });
    }
    nextState = {
      ...nextState,
      enemies: nextState.enemies.map((candidate) =>
        candidate.id === enemy.id
          ? {
              ...candidate,
              whaleState: "ready",
              lockedArea: [],
              facing: undefined,
            }
          : candidate,
      ),
    };
  }

  if (intent.action === "staggered") {
    nextState = {
      ...nextState,
      enemies: nextState.enemies.map((candidate) =>
        candidate.id === enemy.id
          ? {
              ...candidate,
              whaleState: "ready",
              lockedArea: [],
              facing: undefined,
            }
          : candidate,
      ),
    };
    if (emitEvents) events.push({ type: "whale-staggered", enemyId: enemy.id });
  }

  return { state: nextState, events };
};

export const checkVictoryDefeat = (
  state: GameState,
): OutcomeCheck => {
  if (state.vault.hp <= 0)
    return { outcome: "defeat", reason: "vault-destroyed" };
  if (livingUnits(state).length === 0)
    return { outcome: "defeat", reason: "squad-eliminated" };
  if (
    state.phase === "victory" ||
    state.completedEnemyPhases >= state.maxTurns
  ) {
    return { outcome: "victory", reason: "survived-five-turns" };
  }
  if (state.phase === "defeat")
    return { outcome: "defeat", reason: state.outcomeReason ?? "vault-destroyed" };
  return { outcome: null, reason: null };
};

export const calculateEnemyPlan = (state: GameState): EnemyTurnPlan => {
  const fingerprint = getStateFingerprint(state);
  if (state.phase !== "player") return { turn: state.turn, fingerprint, intents: [] };
  const orderedEnemies = [...state.enemies]
    .filter((enemy) => enemy.hp > 0)
    .sort(
      (left, right) =>
        left.initiative - right.initiative || left.id.localeCompare(right.id),
    );
  const intents: EnemyIntent[] = [];
  let shadow = state;

  for (const enemy of orderedEnemies) {
    if (!getEnemy(shadow, enemy.id)) continue;
    const intent = calculateEnemyIntent(shadow, enemy.id, intents.length + 1);
    intents.push(intent);
    shadow = applyEnemyIntent(shadow, intent, false).state;
    if (checkVictoryDefeat(shadow).outcome === "defeat") break;
  }

  return { turn: state.turn, fingerprint, intents };
};

const getMissionForState = (state: GameState): MissionDefinition => {
  return getMissionDefinition(state.missionId);
};

export const resolveEnemyTurn = (
  state: GameState,
  plan: EnemyTurnPlan = calculateEnemyPlan(state),
): GameTransition => {
  if (state.phase !== "player")
    return reject(state, "The enemy phase cannot start now.");
  if (
    plan.turn !== state.turn ||
    plan.fingerprint !== getStateFingerprint(state)
  ) {
    return reject(state, "Enemy intent is stale and must be recalculated.");
  }

  let nextState: GameState = { ...state, phase: "enemy" };
  const events: GameEvent[] = [];
  for (const intent of plan.intents) {
    const transition = applyEnemyIntent(nextState, intent, true);
    nextState = transition.state;
    events.push(...transition.events);
    const immediateOutcome = checkVictoryDefeat(nextState);
    if (immediateOutcome.outcome === "defeat" && immediateOutcome.reason) {
      nextState = {
        ...nextState,
        phase: "defeat",
        outcomeReason: immediateOutcome.reason,
      };
      events.push({
        type: "mission-ended",
        outcome: "defeat",
        reason: immediateOutcome.reason,
      });
      return { state: nextState, events };
    }
  }

  const completedEnemyPhases = state.completedEnemyPhases + 1;
  nextState = {
    ...nextState,
    completedEnemyPhases,
    units: nextState.units.map((unit) => ({
      ...unit,
      shield:
        unit.shield &&
        unit.shield.expiresAfterEnemyPhase <= completedEnemyPhases
          ? null
          : unit.shield,
    })),
  };

  const endOutcome = checkVictoryDefeat(nextState);
  if (endOutcome.outcome && endOutcome.reason) {
    nextState = {
      ...nextState,
      phase: endOutcome.outcome,
      outcomeReason: endOutcome.reason,
    };
    events.push({
      type: "mission-ended",
      outcome: endOutcome.outcome,
      reason: endOutcome.reason,
    });
    return { state: nextState, events };
  }

  const mission = getMissionForState(nextState);
  const turn = state.turn + 1;
  let breach = nextState.breach;
  let enemies = nextState.enemies;

  if (turn === mission.breach.warningTurn) {
    breach = { ...breach, status: "incoming" };
    events.push({
      type: "breach-warning",
      position: clonePosition(breach.position),
    });
  }
  if (turn === mission.breach.spawnTurn) {
    breach = { ...breach, status: "spawned" };
    if (!enemies.some((enemy) => enemy.id === mission.breach.enemy.id)) {
      const definition = mission.breach.enemy;
      enemies = [
        ...enemies,
        {
          ...definition,
          position: clonePosition(definition.position),
          hp: definition.maxHp,
          whaleState: "ready",
          lockedArea: [],
        },
      ];
      events.push({
        type: "enemy-spawned",
        enemyId: definition.id,
        position: clonePosition(definition.position),
      });
    }
  }

  nextState = {
    ...nextState,
    turn,
    phase: "player",
    breach,
    enemies,
    units: nextState.units.map((unit) => ({
      ...unit,
      hasMoved: false,
      hasActed: false,
    })),
  };
  events.push({ type: "turn-started", turn });
  return { state: nextState, events };
};
