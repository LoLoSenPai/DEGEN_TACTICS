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
  readonly area?: readonly Position[];
  readonly hits?: readonly Readonly<{
    targetId: string;
    amount: number;
    absorbed: number;
    fatal: boolean;
  }>[];
}

const copyEnemyFromFinalState = (
  state: GameState,
  finalState: GameState,
  enemyId: string,
): GameState => {
  if (state.enemies.some((enemy) => enemy.id === enemyId)) return state;
  const spawned = finalState.enemies.find((enemy) => enemy.id === enemyId);
  return spawned ? { ...state, enemies: [...state.enemies, spawned] } : state;
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
      beats.push({ stage: "move", state: visualState, event, duration: 300, sourceId: event.enemyId });
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
          duration: 440,
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
        for (const hit of hits.filter((candidate) => candidate.fatal)) {
          beats.push({
            stage: "death",
            state: visualState,
            event,
            duration: 560,
            sourceId: event.sourceId,
            targetId: hit.targetId,
            amount: hit.amount,
            absorbed: hit.absorbed,
            fatal: true,
            area,
            hits,
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
        duration: sourceEnemy?.kind === "drainer" ? 330 : 260,
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
        beats.push({
          stage: "death",
          state: visualState,
          event,
          duration: 560,
          sourceId: event.sourceId,
          targetId: event.targetId,
          amount: event.amount,
          absorbed: event.absorbed,
          fatal: true,
        });
      }
      continue;
    }

    if (event.type === "enemy-healed") {
      visualState = applyPresentationEvent(visualState, event, finalState);
      beats.push({ stage: "status", state: visualState, event, duration: 360, sourceId: event.enemyId, amount: event.amount });
      continue;
    }

    if (event.type === "enemy-spawned") {
      visualState = applyPresentationEvent(visualState, event, finalState);
      beats.push({ stage: "spawn", state: visualState, event, duration: 440, sourceId: event.enemyId });
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
      });
    }
  }

  return beats;
};
