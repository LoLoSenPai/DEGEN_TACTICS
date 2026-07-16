import type { Enemy, GameEvent, GameState, Position } from "./types";

export type CombatPlaybackStage =
  | "move"
  | "attack"
  | "impact"
  | "death"
  | "shield"
  | "push"
  | "spawn"
  | "status";

export type CombatPlaybackStatusKind =
  | "breach-warning"
  | "cone-locked"
  | "intercept-grid"
  | "charge-cancelled"
  | "staggered"
  | "drain-heal"
  | "jam-cleared"
  | "blackout-hold"
  | "blackout-cast"
  | "push-blocked"
  | "push-stopped"
  | "vault-breached";

export interface CombatPlaybackBeat {
  readonly stage: CombatPlaybackStage;
  readonly state: GameState;
  readonly event: GameEvent;
  readonly duration: number;
  readonly sourceId?: string;
  readonly targetId?: string;
  readonly amount?: number;
  readonly absorbed?: number;
  readonly fatal?: boolean;
  readonly statusKind?: CombatPlaybackStatusKind;
  readonly area?: readonly Position[];
  readonly hits?: readonly Readonly<{
    targetId: string;
    amount: number;
    absorbed: number;
    fatal: boolean;
  }>[];
}

export const getPlayerMovementPresentationDuration = (pathLength: number): number => {
  const steps = Math.max(1, pathLength - 1);
  return 400 + Math.max(0, steps - 1) * 220;
};

export const getReducedPlayerMovementPresentationDuration = (pathLength: number): number => {
  const steps = Math.max(1, pathLength - 1);
  return 280 + Math.max(0, steps - 1) * 150;
};

const copyEnemyFromFinalState = (
  state: GameState,
  finalState: GameState,
  enemyId: string,
): GameState => {
  if (state.enemies.some((enemy) => enemy.id === enemyId)) return state;
  const spawned = finalState.enemies.find((enemy) => enemy.id === enemyId);
  return spawned ? { ...state, enemies: [...state.enemies, spawned] } : state;
};

const movePushedTarget = (
  state: GameState,
  event: Extract<GameEvent, { type: "target-pushed" }>,
): GameState => event.targetKind === "enemy"
  ? {
      ...state,
      enemies: state.enemies.map((enemy) =>
        enemy.id === event.targetId ? { ...enemy, position: event.to } : enemy,
      ),
    }
  : {
      ...state,
      objects: state.objects.map((object) =>
        object.id === event.targetId ? { ...object, position: event.to } : object,
      ),
    };

const applyCollisionEvent = (
  state: GameState,
  event: Extract<GameEvent, { type: "collision" }>,
): GameState => event.targetKind === "enemy"
  ? {
      ...state,
      enemies: state.enemies.map((enemy) =>
        enemy.id === event.targetId ? { ...enemy, hp: Math.max(0, enemy.hp - event.damage) } : enemy,
      ),
    }
  : state;

const copyWhaleStatusFromFinalState = (
  state: GameState,
  finalState: GameState,
  enemyId: string,
): GameState => {
  const finalEnemy = finalState.enemies.find((enemy) => enemy.id === enemyId);
  if (!finalEnemy) return state;
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.id === enemyId
        ? {
            ...enemy,
            whaleState: finalEnemy.whaleState,
            lockedArea: finalEnemy.lockedArea,
            facing: finalEnemy.facing,
          }
        : enemy,
    ),
  };
};

export const getCombatantHp = (state: GameState, id: string): number | null => {
  if (id === state.vault.id) return state.vault.hp;
  return state.units.find((unit) => unit.id === id)?.hp
    ?? state.enemies.find((enemy) => enemy.id === id)?.hp
    ?? null;
};

export const applyPresentationEvent = (
  state: GameState,
  event: GameEvent,
  finalState: GameState,
): GameState => {
  switch (event.type) {
    case "enemy-moved":
      return {
        ...state,
        enemies: state.enemies.map((enemy) =>
          enemy.id === event.enemyId ? { ...enemy, position: event.to } : enemy,
        ),
      };
    case "damage":
      if (event.targetId === state.vault.id) {
        return {
          ...state,
          vault: { ...state.vault, hp: Math.max(0, state.vault.hp - event.amount) },
          vaultEverDamaged: state.vaultEverDamaged || event.amount > 0,
        };
      }
      return {
        ...state,
        units: state.units.map((unit) =>
          unit.id === event.targetId
            ? { ...unit, hp: Math.max(0, unit.hp - event.amount), shield: null }
            : unit,
        ),
      };
    case "enemy-healed":
      return {
        ...state,
        enemies: state.enemies.map((enemy) =>
          enemy.id === event.enemyId
            ? { ...enemy, hp: Math.min(enemy.maxHp, enemy.hp + event.amount) }
            : enemy,
        ),
      };
    case "whale-cone-locked":
      return {
        ...state,
        enemies: state.enemies.map((enemy): Enemy =>
          enemy.id === event.enemyId
            ? {
                ...enemy,
                whaleState: "charging",
                lockedArea: event.area,
                facing: event.facing,
              }
            : enemy,
        ),
      };
    case "enemy-spawned":
      return copyEnemyFromFinalState(state, finalState, event.enemyId);
    case "breach-warning":
      return { ...state, breach: finalState.breach };
    case "enemy-disruption-resolved":
      return {
        ...state,
        enemies: state.enemies.map((enemy) => enemy.id === event.enemyId
          ? {
              ...enemy,
              disruption: undefined,
              ...(event.kind === "blackout" && enemy.kind === "whale"
                ? { whaleState: "ready" as const, lockedArea: [], facing: undefined }
                : undefined),
            }
          : enemy),
      };
    default:
      return state;
  }
};

export const compileEnemyPlayback = (
  initialState: GameState,
  finalState: GameState,
  events: readonly GameEvent[],
): readonly CombatPlaybackBeat[] => {
  const beats: CombatPlaybackBeat[] = [];
  let visualState: GameState = { ...initialState, phase: "enemy" };

  for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
    const event = events[eventIndex];
    if (event.type === "enemy-moved") {
      visualState = applyPresentationEvent(visualState, event, finalState);
      const movementSteps = Math.max(1, event.path.length);
      beats.push({
        stage: "move",
        state: visualState,
        event,
        duration: Math.max(320, movementSteps * 180),
        sourceId: event.enemyId,
      });
      continue;
    }

    if (event.type === "damage") {
      const sourceEnemy = visualState.enemies.find((enemy) => enemy.id === event.sourceId);
      if (sourceEnemy?.kind === "whale") {
        const slamEvents: Array<Extract<GameEvent, { type: "damage" }>> = [];
        let scanIndex = eventIndex;
        while (scanIndex < events.length) {
          const candidate = events[scanIndex];
          if (candidate.type !== "damage" || candidate.sourceId !== event.sourceId) break;
          slamEvents.push(candidate);
          scanIndex += 1;
        }

        const beforeSlam = visualState;
        const hits: Array<{ targetId: string; amount: number; absorbed: number; fatal: boolean }> = [];
        for (const slamEvent of slamEvents) {
          const hpBefore = getCombatantHp(visualState, slamEvent.targetId);
          const fatal = hpBefore !== null && hpBefore > 0 && slamEvent.amount >= hpBefore;
          hits.push({ targetId: slamEvent.targetId, amount: slamEvent.amount, absorbed: slamEvent.absorbed, fatal });
          visualState = applyPresentationEvent(visualState, slamEvent, finalState);
        }
        const area = sourceEnemy.lockedArea ?? [];
        beats.push({
          stage: "attack",
          state: beforeSlam,
          event,
          duration: 720,
          sourceId: event.sourceId,
          targetId: hits[0]?.targetId,
          amount: event.amount,
          area,
          hits,
        });
        beats.push({
          stage: "impact",
          state: visualState,
          event,
          duration: 560,
          sourceId: event.sourceId,
          targetId: hits[0]?.targetId,
          amount: event.amount,
          area,
          hits,
        });
        const fatalHits = hits.filter((candidate) => candidate.fatal);
        if (fatalHits.length > 0) {
          const vaultBreached = fatalHits.some((hit) => hit.targetId === visualState.vault.id);
          beats.push({
            stage: "death",
            state: visualState,
            event,
            duration: vaultBreached ? 900 : 760,
            sourceId: event.sourceId,
            targetId: fatalHits[0].targetId,
            amount: fatalHits[0].amount,
            absorbed: fatalHits[0].absorbed,
            fatal: true,
            area,
            hits: fatalHits,
            statusKind: vaultBreached ? "vault-breached" : undefined,
          });
        }
        eventIndex = scanIndex - 1;
        continue;
      }

      const hpBefore = getCombatantHp(visualState, event.targetId);
      const fatal = hpBefore !== null && hpBefore > 0 && event.amount >= hpBefore;
      beats.push({
        stage: "attack",
        state: visualState,
        event,
        duration: sourceEnemy?.kind === "drainer" ? 600 : 520,
        sourceId: event.sourceId,
        targetId: event.targetId,
        amount: event.amount,
        absorbed: event.absorbed,
        fatal,
      });
      visualState = applyPresentationEvent(visualState, event, finalState);
      beats.push({
        stage: "impact",
        state: visualState,
        event,
        duration: fatal ? 330 : 460,
        sourceId: event.sourceId,
        targetId: event.targetId,
        amount: event.amount,
        absorbed: event.absorbed,
        fatal,
      });
      if (fatal) {
        const playerDeath = visualState.units.some((unit) => unit.id === event.targetId);
        const vaultBreached = event.targetId === visualState.vault.id;
        beats.push({
          stage: "death",
          state: visualState,
          event,
          duration: vaultBreached ? 900 : playerDeath ? 760 : 560,
          sourceId: event.sourceId,
          targetId: event.targetId,
          amount: event.amount,
          absorbed: event.absorbed,
          fatal: true,
          statusKind: vaultBreached ? "vault-breached" : undefined,
        });
      }
      continue;
    }

    if (event.type === "enemy-healed") {
      visualState = applyPresentationEvent(visualState, event, finalState);
      beats.push({ stage: "status", state: visualState, event, duration: 520, sourceId: event.enemyId, amount: event.amount, statusKind: "drain-heal" });
      continue;
    }

    if (event.type === "enemy-disruption-resolved") {
      beats.push({
        stage: "status",
        state: visualState,
        event,
        duration: event.kind === "blackout" ? 760 : 440,
        sourceId: event.enemyId,
        targetId: event.enemyId,
        statusKind: event.kind === "blackout" ? "blackout-hold" : "jam-cleared",
      });
      visualState = applyPresentationEvent(visualState, event, finalState);
      continue;
    }

    if (event.type === "sentinel-fortified") {
      beats.push({
        stage: "status",
        state: visualState,
        event,
        duration: 520,
        sourceId: event.enemyId,
        targetId: event.guardedEnemyIds[0],
        area: event.area,
        statusKind: "intercept-grid",
      });
      continue;
    }

    if (event.type === "enemy-spawned") {
      visualState = applyPresentationEvent(visualState, event, finalState);
      beats.push({ stage: "spawn", state: visualState, event, duration: 440, sourceId: event.enemyId });
      continue;
    }

    if (event.type === "whale-staggered") {
      beats.push({
        stage: "status",
        state: visualState,
        event,
        duration: 820,
        sourceId: event.enemyId,
        targetId: event.enemyId,
        statusKind: "staggered",
      });
      visualState = copyWhaleStatusFromFinalState(visualState, finalState, event.enemyId);
      continue;
    }

    if (event.type === "whale-cone-locked" || event.type === "breach-warning") {
      visualState = applyPresentationEvent(visualState, event, finalState);
      beats.push({
        stage: "status",
        state: visualState,
        event,
        duration: 360,
        sourceId: event.type === "whale-cone-locked" ? event.enemyId : undefined,
        area: event.type === "whale-cone-locked" ? event.area : undefined,
        statusKind: event.type === "whale-cone-locked" ? "cone-locked" : "breach-warning",
      });
    }
  }

  return beats;
};

export const compilePushPlayback = (
  initialState: GameState,
  finalState: GameState,
  events: readonly GameEvent[],
): readonly CombatPlaybackBeat[] => {
  const pushed = events.find((event): event is Extract<GameEvent, { type: "target-pushed" }> => event.type === "target-pushed");
  const collision = events.find((event): event is Extract<GameEvent, { type: "collision" }> => event.type === "collision");
  const cancelled = events.find((event): event is Extract<GameEvent, { type: "whale-charge-cancelled" }> => event.type === "whale-charge-cancelled");
  const staggered = events.find((event): event is Extract<GameEvent, { type: "whale-staggered" }> => event.type === "whale-staggered");
  const actionEvent = pushed ?? collision;
  if (!actionEvent) return [];

  const beats: CombatPlaybackBeat[] = [];
  let visualState = initialState;
  const sourceId = actionEvent.sourceId;
  const targetId = actionEvent.targetId;
  const ability = actionEvent.ability;

  beats.push({
    stage: "push",
    state: visualState,
    event: actionEvent,
    duration: ability === "batter-up" ? 580 : 520,
    sourceId,
    targetId,
  });

  if (pushed) {
    visualState = movePushedTarget(visualState, pushed);
    beats.push({
      stage: "move",
      state: visualState,
      event: pushed,
      duration: Math.max(300, pushed.distance * 180),
      sourceId,
      targetId,
    });
  }

  if (collision && collision.damage > 0) {
    const targetHp = initialState.enemies.find((enemy) => enemy.id === targetId)?.hp ?? null;
    const fatal = targetHp !== null && targetHp > 0 && collision.damage >= targetHp;
    visualState = applyCollisionEvent(visualState, collision);
    beats.push({
      stage: "impact",
      state: visualState,
      event: collision,
      duration: fatal ? 360 : 460,
      sourceId,
      targetId,
      amount: collision.damage,
      fatal,
    });
    if (fatal) {
      beats.push({
        stage: "death",
        state: visualState,
        event: collision,
        duration: 760,
        sourceId,
        targetId,
        amount: collision.damage,
        fatal: true,
      });
    }
  } else if (collision) {
    beats.push({
      stage: "status",
      state: visualState,
      event: collision,
      duration: 360,
      sourceId,
      targetId,
      statusKind: pushed ? "push-stopped" : "push-blocked",
    });
  }

  if (cancelled || staggered) {
    const statusEvent = cancelled ?? staggered!;
    visualState = copyWhaleStatusFromFinalState(visualState, finalState, statusEvent.enemyId);
    beats.push({
      stage: "status",
      state: visualState,
      event: statusEvent,
      duration: 560,
      sourceId,
      targetId: statusEvent.enemyId,
      statusKind: cancelled ? "charge-cancelled" : "staggered",
    });
  }

  return beats;
};
