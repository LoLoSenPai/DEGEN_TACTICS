"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyShield,
  attackEnemy,
  calculateEnemyPlan,
  createInitialGameState,
  createMissionResult,
  moveUnit,
  pushTarget,
  resolveEnemyTurn,
  activateDeadeye,
  waitUnit,
  type EnemyTurnPlan,
  type GameEvent,
  type GameState,
  type MissionResult,
  type PlayerIdentity,
  type Position,
} from "@/lib/game";

export type ActionMode = "move" | "attack" | "push" | "ability" | null;

export interface CombatLogEntry {
  id: number;
  turn: number;
  tone: "neutral" | "ally" | "enemy" | "warning" | "reward";
  text: string;
}

export interface BattleEffect {
  id: number;
  kind: "damage" | "shield" | "collision" | "heavy";
  targetId?: string;
  amount?: number;
}

interface LastMoveSnapshot {
  state: GameState;
  unitId: string;
}

interface PersistentSettings {
  soundMuted: boolean;
  tutorialComplete: boolean;
}

interface GameStore {
  game: GameState | null;
  enemyPlan: EnemyTurnPlan | null;
  selectedUnitId: string | null;
  actionMode: ActionMode;
  lastMove: LastMoveSnapshot | null;
  log: CombatLogEntry[];
  effects: BattleEffect[];
  isResolving: boolean;
  turnBanner: string | null;
  profile: PlayerIdentity;
  bestScores: Record<string, number>;
  lastResult: MissionResult | null;
  settings: PersistentSettings;
  hydrated: boolean;
  startMission: () => void;
  ensureIdentity: () => void;
  setHydrated: (hydrated: boolean) => void;
  selectUnit: (unitId: string | null) => void;
  setActionMode: (mode: ActionMode) => void;
  moveSelected: (to: Position) => void;
  attackSelected: (enemyId: string, deadeye?: boolean) => void;
  shieldSelected: () => void;
  pushSelected: (targetId: string, batterUp?: boolean) => void;
  waitSelected: () => void;
  undoMove: () => void;
  endTurn: () => void;
  clearEffects: () => void;
  clearResult: () => void;
  setTutorialComplete: (completed: boolean) => void;
}

const initialProfile: PlayerIdentity = {
  guestId: "guest-pending",
  displayName: "GUEST // LOCAL",
};

let logId = 0;
let effectId = 0;
let sessionGeneration = 0;
let bannerTimer: number | null = null;
let resolutionTimer: number | null = null;

function clearSessionTimers() {
  if (bannerTimer !== null) window.clearTimeout(bannerTimer);
  if (resolutionTimer !== null) window.clearTimeout(resolutionTimer);
  bannerTimer = null;
  resolutionTimer = null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isMissionResult(value: unknown): value is MissionResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<MissionResult>;
  const score = result.score;
  if (!score || typeof score !== "object") return false;
  const scoreValues = [
    score.victory,
    score.vaultIntegrity,
    score.enemiesDefeated,
    score.survivingUnits,
    score.flawlessSquad,
    score.untouchedVault,
    score.lostUnits,
    score.total,
  ];
  return typeof result.missionId === "string"
    && (result.outcome === "victory" || result.outcome === "defeat")
    && (result.reason === "vault-destroyed" || result.reason === "squad-eliminated" || result.reason === "survived-five-turns")
    && scoreValues.every(isFiniteNumber)
    && (score.rank === "S" || score.rank === "A" || score.rank === "B" || score.rank === "C")
    && isFiniteNumber(result.vaultHp)
    && isFiniteNumber(result.vaultMaxHp)
    && isFiniteNumber(result.turnsSurvived)
    && isFiniteNumber(result.enemiesDefeated)
    && isFiniteNumber(result.survivingUnits)
    && isFiniteNumber(result.lostUnits)
    && isFiniteNumber(result.xpPreview)
    && typeof result.completed === "boolean";
}

function coord(position: Position) {
  return `${String.fromCharCode(65 + position.x)}${position.y + 1}`;
}

function eventToLog(event: GameEvent, turn: number): CombatLogEntry {
  logId += 1;
  let tone: CombatLogEntry["tone"] = "neutral";
  let text = "Tactical state updated.";

  switch (event.type) {
    case "action-rejected":
      tone = "warning";
      text = event.message;
      break;
    case "unit-moved":
      tone = "ally";
      text = `${event.unitId.toUpperCase()} moved ${coord(event.from)} → ${coord(event.to)}.`;
      break;
    case "unit-waited":
      text = `${event.unitId.toUpperCase()} is holding position.`;
      break;
    case "unit-attacked":
      tone = "ally";
      text = `${event.deadeye ? "DEADEYE" : event.unitId.toUpperCase()} hit ${event.enemyId.toUpperCase()} for ${event.damage}.`;
      break;
    case "shield-applied":
      tone = "ally";
      text = `SHIELD WALL reinforced ${event.unitIds.length} operator${event.unitIds.length === 1 ? "" : "s"}.`;
      break;
    case "target-pushed":
      tone = "ally";
      text = `${event.ability === "batter-up" ? "BATTER UP" : "SHOVE"}: ${event.targetId.toUpperCase()} displaced ${event.distance} tile${event.distance === 1 ? "" : "s"}.`;
      break;
    case "collision":
      tone = "reward";
      text = `${event.targetId.toUpperCase()} took ${event.damage} collision damage.`;
      break;
    case "enemy-defeated":
      tone = "reward";
      text = `${event.enemyId.toUpperCase()} neutralized.`;
      break;
    case "enemy-moved":
      tone = "enemy";
      text = `${event.enemyId.toUpperCase()} advanced to ${coord(event.to)}.`;
      break;
    case "damage":
      tone = event.targetId === "vault" ? "warning" : "enemy";
      text = `${event.targetId.toUpperCase()} took ${event.amount} damage${event.absorbed ? ` (${event.absorbed} shielded)` : ""}.`;
      break;
    case "enemy-healed":
      tone = "enemy";
      text = `${event.enemyId.toUpperCase()} drained ${event.amount} integrity.`;
      break;
    case "whale-cone-locked":
      tone = "warning";
      text = `WHALE locked a ${event.facing.toUpperCase()} slam cone.`;
      break;
    case "whale-charge-cancelled":
      tone = "reward";
      text = "WHALE slam disrupted by forced movement.";
      break;
    case "whale-staggered":
      tone = "reward";
      text = "WHALE is staggered and loses its activation.";
      break;
    case "breach-warning":
      tone = "warning";
      text = `Incoming breach detected at ${coord(event.position)}.`;
      break;
    case "enemy-spawned":
      tone = "warning";
      text = `${event.enemyId.toUpperCase()} entered at ${coord(event.position)}.`;
      break;
    case "turn-started":
      text = `Player phase ${event.turn} / 5 started.`;
      break;
    case "mission-ended":
      tone = event.outcome === "victory" ? "reward" : "warning";
      text = event.outcome === "victory" ? "Fracture window survived. Vault secured." : "Mission integrity lost.";
      break;
  }

  return { id: logId, turn, tone, text };
}

function effectsFromEvents(events: readonly GameEvent[]): BattleEffect[] {
  const effects: BattleEffect[] = [];
  for (const event of events) {
    if (event.type === "damage") {
      effectId += 1;
      effects.push({ id: effectId, kind: event.amount >= 4 ? "heavy" : "damage", targetId: event.targetId, amount: event.amount });
    }
    if (event.type === "collision") {
      effectId += 1;
      effects.push({ id: effectId, kind: "collision", targetId: event.targetId, amount: event.damage });
    }
    if (event.type === "shield-applied") {
      effectId += 1;
      effects.push({ id: effectId, kind: "shield" });
    }
  }
  return effects;
}

function hasRejected(events: readonly GameEvent[]) {
  return events.some((event) => event.type === "action-rejected");
}

function planFor(state: GameState) {
  return state.phase === "player" ? calculateEnemyPlan(state) : null;
}

function appendEvents(log: CombatLogEntry[], events: readonly GameEvent[], turn: number) {
  return [...log, ...events.map((event) => eventToLog(event, turn))].slice(-32);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,
      enemyPlan: null,
      selectedUnitId: null,
      actionMode: null,
      lastMove: null,
      log: [],
      effects: [],
      isResolving: false,
      turnBanner: null,
      profile: initialProfile,
      bestScores: {},
      lastResult: null,
      settings: { soundMuted: true, tutorialComplete: false },
      hydrated: false,

      startMission: () => {
        clearSessionTimers();
        sessionGeneration += 1;
        const generation = sessionGeneration;
        const game = createInitialGameState();
        logId += 1;
        set({
          game,
          enemyPlan: calculateEnemyPlan(game),
          selectedUnitId: null,
          actionMode: null,
          lastMove: null,
          log: [{ id: logId, turn: 1, tone: "neutral", text: "Mission live. Enemy intents are exact." }],
          effects: [],
          isResolving: false,
          turnBanner: "PLAYER PHASE // 01",
          lastResult: null,
        });
        bannerTimer = window.setTimeout(() => {
          if (generation === sessionGeneration) set({ turnBanner: null });
          bannerTimer = null;
        }, 650);
      },

      ensureIdentity: () => {
        if (get().profile.guestId !== "guest-pending") return;
        const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
        const guestId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `guest-${Date.now()}-${suffix}`;
        set({ profile: { guestId, displayName: `GUEST-${suffix}` } });
      },

      setHydrated: (hydrated) => set({ hydrated }),

      selectUnit: (unitId) => {
        const game = get().game;
        if (!game || get().isResolving || game.phase !== "player") return;
        if (unitId && !game.units.some((unit) => unit.id === unitId && unit.hp > 0)) return;
        const unit = game.units.find((candidate) => candidate.id === unitId);
        set({ selectedUnitId: unitId, actionMode: unit && !unit.hasMoved && !unit.hasActed ? "move" : null });
      },

      setActionMode: (actionMode) => {
        if (!get().selectedUnitId || get().isResolving) return;
        set({ actionMode });
      },

      moveSelected: (to) => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving) return;
        const transition = moveUnit(game, selectedUnitId, to);
        const rejected = hasRejected(transition.events);
        set({
          game: transition.state,
          enemyPlan: planFor(transition.state),
          actionMode: rejected ? "move" : null,
          lastMove: rejected ? get().lastMove : { state: game, unitId: selectedUnitId },
          log: appendEvents(log, transition.events, game.turn),
          effects: effectsFromEvents(transition.events),
        });
      },

      attackSelected: (enemyId, deadeye = false) => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving) return;
        const transition = deadeye ? activateDeadeye(game, selectedUnitId, enemyId) : attackEnemy(game, selectedUnitId, enemyId);
        const rejected = hasRejected(transition.events);
        set({
          game: transition.state,
          enemyPlan: planFor(transition.state),
          actionMode: rejected ? get().actionMode : null,
          lastMove: rejected ? get().lastMove : null,
          log: appendEvents(log, transition.events, game.turn),
          effects: effectsFromEvents(transition.events),
        });
      },

      shieldSelected: () => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving) return;
        const transition = applyShield(game, selectedUnitId);
        const rejected = hasRejected(transition.events);
        set({
          game: transition.state,
          enemyPlan: planFor(transition.state),
          actionMode: rejected ? "ability" : null,
          lastMove: rejected ? get().lastMove : null,
          log: appendEvents(log, transition.events, game.turn),
          effects: effectsFromEvents(transition.events),
        });
      },

      pushSelected: (targetId, batterUp = false) => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving) return;
        const transition = pushTarget(game, selectedUnitId, targetId, batterUp ? "batter-up" : "shove");
        const rejected = hasRejected(transition.events);
        set({
          game: transition.state,
          enemyPlan: planFor(transition.state),
          actionMode: rejected ? get().actionMode : null,
          lastMove: rejected ? get().lastMove : null,
          log: appendEvents(log, transition.events, game.turn),
          effects: effectsFromEvents(transition.events),
        });
      },

      waitSelected: () => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving) return;
        const transition = waitUnit(game, selectedUnitId);
        const rejected = hasRejected(transition.events);
        set({
          game: transition.state,
          enemyPlan: planFor(transition.state),
          actionMode: rejected ? get().actionMode : null,
          lastMove: rejected ? get().lastMove : null,
          log: appendEvents(log, transition.events, game.turn),
          effects: [],
        });
      },

      undoMove: () => {
        const snapshot = get().lastMove;
        if (!snapshot || get().isResolving) return;
        logId += 1;
        set({
          game: snapshot.state,
          enemyPlan: calculateEnemyPlan(snapshot.state),
          selectedUnitId: snapshot.unitId,
          actionMode: "move",
          lastMove: null,
          log: [...get().log, { id: logId, turn: snapshot.state.turn, tone: "neutral", text: "Last movement reversed. Enemy plan restored." } as CombatLogEntry].slice(-32),
        });
      },

      endTurn: () => {
        const { game, enemyPlan, log } = get();
        if (!game || game.phase !== "player" || get().isResolving) return;
        const snapshot = enemyPlan ?? calculateEnemyPlan(game);
        const generation = sessionGeneration;
        if (bannerTimer !== null) window.clearTimeout(bannerTimer);
        logId += 1;
        set({
          isResolving: true,
          selectedUnitId: null,
          actionMode: null,
          lastMove: null,
          turnBanner: "ENEMY PHASE",
          log: [...log, { id: logId, turn: game.turn, tone: "warning", text: "Enemy plan committed. Resolving exact intents." } as CombatLogEntry].slice(-32),
        });

        resolutionTimer = window.setTimeout(() => {
          if (generation !== sessionGeneration) return;
          const transition = resolveEnemyTurn(game, snapshot);
          const nextState = transition.state;
          const nextLog = appendEvents(get().log, transition.events, game.turn);
          const terminal = nextState.phase === "victory" || nextState.phase === "defeat";
          let result = get().lastResult;
          let bestScores = get().bestScores;

          if (terminal) {
            result = createMissionResult(nextState, nextState.phase);
            if (result.completed) {
              bestScores = {
                ...bestScores,
                [result.missionId]: Math.max(bestScores[result.missionId] ?? 0, result.score.total),
              };
            }
          }

          set({
            game: nextState,
            enemyPlan: planFor(nextState),
            isResolving: false,
            turnBanner: terminal ? (nextState.phase === "victory" ? "VAULT SECURED" : "MISSION FAILED") : `PLAYER PHASE // ${String(nextState.turn).padStart(2, "0")}`,
            log: nextLog,
            effects: effectsFromEvents(transition.events),
            lastResult: result,
            bestScores,
          });
          resolutionTimer = null;
          bannerTimer = window.setTimeout(() => {
            if (generation === sessionGeneration) set({ turnBanner: null });
            bannerTimer = null;
          }, terminal ? 1000 : 650);
        }, 420);
      },

      clearEffects: () => set({ effects: [] }),
      clearResult: () => set({ lastResult: null }),
      setTutorialComplete: (completed) => set((state) => ({
        settings: {
          ...state.settings,
          tutorialComplete: completed,
        },
      })),
    }),
    {
      name: "degen-tactics:v1",
      version: 1,
      partialize: (state) => ({
        profile: state.profile,
        bestScores: state.bestScores,
        lastResult: state.lastResult,
        settings: state.settings,
      }),
      skipHydration: true,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<GameStore>;
        const persistedSettings = persisted.settings as Partial<PersistentSettings> | undefined;
        const validProfile = persisted.profile && typeof persisted.profile.guestId === "string" && typeof persisted.profile.displayName === "string";
        const validScores = Boolean(
          persisted.bestScores
          && typeof persisted.bestScores === "object"
          && !Array.isArray(persisted.bestScores)
          && Object.values(persisted.bestScores).every((score) => typeof score === "number" && Number.isFinite(score) && score >= 0),
        );
        const validResult = persisted.lastResult == null || isMissionResult(persisted.lastResult);
        return {
          ...currentState,
          profile: validProfile ? persisted.profile! : currentState.profile,
          bestScores: validScores ? persisted.bestScores! : currentState.bestScores,
          lastResult: validResult ? (persisted.lastResult ?? null) : null,
          settings: {
            soundMuted: typeof persistedSettings?.soundMuted === "boolean"
              ? persistedSettings.soundMuted
              : currentState.settings.soundMuted,
            tutorialComplete: typeof persistedSettings?.tutorialComplete === "boolean"
              ? persistedSettings.tutorialComplete
              : currentState.settings.tutorialComplete,
          },
        };
      },
    },
  ),
);
