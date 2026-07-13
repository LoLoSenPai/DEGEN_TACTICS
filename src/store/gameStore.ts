"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyShield,
  attackEnemy,
  calculateEnemyPlan,
  compileEnemyPlayback,
  createInitialGameState,
  createMissionResult,
  getMissionDefinition,
  isTrainingMissionId,
  moveUnit,
  pushTarget,
  resolveEnemyTurn,
  activateDeadeye,
  waitUnit,
  type EnemyTurnPlan,
  type CombatPlaybackBeat,
  type CombatPlaybackStage,
  type GameEvent,
  type GameState,
  type MissionResult,
  type PlayerIdentity,
  type Position,
  type PushKind,
} from "@/lib/game";

export type ActionMode = "move" | "attack" | "push" | "ability" | null;

export type CombatVariant =
  | "guardian-bash"
  | "sniper-shot"
  | "deadeye"
  | "pusher-punch"
  | "shove"
  | "batter-up"
  | "rugger-charge"
  | "drain"
  | "whale-slam"
  | "shield-wall"
  | "generic";

export interface CombatLogEntry {
  id: number;
  turn: number;
  tone: "neutral" | "ally" | "enemy" | "warning" | "reward";
  text: string;
}

export interface BattleEffect {
  id: number;
  kind: "attack" | "damage" | "shield" | "shield-hit" | "collision" | "heavy" | "death" | "push" | "heal";
  sourceId?: string;
  targetId?: string;
  amount?: number;
  absorbed?: number;
  from?: Position;
  to?: Position;
  ability?: PushKind;
}

export interface CombatCue {
  id: number;
  stage: CombatPlaybackStage;
  sourceId?: string;
  targetId?: string;
  amount?: number;
  absorbed?: number;
  fatal?: boolean;
  variant?: CombatVariant;
  from?: Position;
  to?: Position;
  area?: readonly Position[];
  hits?: readonly Readonly<{ targetId: string; amount: number; absorbed: number; fatal: boolean }>[];
}

interface LastMoveSnapshot {
  state: GameState;
  unitId: string;
}

interface PersistentSettings {
  soundMuted: boolean;
  tutorialComplete: boolean;
  trainingCompleted: 0 | 1 | 2 | 3;
}

interface GameStore {
  game: GameState | null;
  enemyPlan: EnemyTurnPlan | null;
  selectedUnitId: string | null;
  actionMode: ActionMode;
  lastMove: LastMoveSnapshot | null;
  log: CombatLogEntry[];
  effects: BattleEffect[];
  lastEvents: readonly GameEvent[];
  isResolving: boolean;
  isAnimating: boolean;
  combatCue: CombatCue | null;
  playbackIndex: number;
  queueRemaining: number;
  turnBanner: string | null;
  profile: PlayerIdentity;
  bestScores: Record<string, number>;
  lastResult: MissionResult | null;
  settings: PersistentSettings;
  hydrated: boolean;
  startMission: (missionId?: string) => void;
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
  completeTrainingLesson: (lesson: 1 | 2 | 3) => void;
}

const initialProfile: PlayerIdentity = {
  guestId: "guest-pending",
  displayName: "GUEST // LOCAL",
};

let logId = 0;
let effectId = 0;
let cueId = 0;
let sessionGeneration = 0;
let bannerTimer: number | null = null;
let resolutionTimer: number | null = null;
let presentationTimers: number[] = [];

function clearSessionTimers() {
  if (bannerTimer !== null) window.clearTimeout(bannerTimer);
  if (resolutionTimer !== null) window.clearTimeout(resolutionTimer);
  bannerTimer = null;
  resolutionTimer = null;
  presentationTimers.forEach((timer) => window.clearTimeout(timer));
  presentationTimers = [];
}

function schedulePresentation(callback: () => void, delay: number) {
  const timer = window.setTimeout(() => {
    presentationTimers = presentationTimers.filter((candidate) => candidate !== timer);
    callback();
  }, delay);
  presentationTimers.push(timer);
  return timer;
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

function nextEffect(effect: Omit<BattleEffect, "id">): BattleEffect {
  effectId += 1;
  return { id: effectId, ...effect };
}

function nextCue(stage: CombatPlaybackStage, data: Omit<CombatCue, "id" | "stage"> = {}): CombatCue {
  cueId += 1;
  return { id: cueId, stage, ...data };
}

function isDefeated(state: GameState, id: string) {
  if (id === state.vault.id) return state.vault.hp <= 0;
  return state.units.some((unit) => unit.id === id && unit.hp <= 0)
    || state.enemies.some((enemy) => enemy.id === id && enemy.hp <= 0);
}

function combatVariantForSource(
  state: GameState,
  sourceId?: string,
  options: { deadeye?: boolean; pushAbility?: PushKind } = {},
): CombatVariant {
  if (options.pushAbility === "batter-up") return "batter-up";
  if (options.pushAbility === "shove") return "shove";
  if (!sourceId) return "generic";
  const unit = state.units.find((candidate) => candidate.id === sourceId);
  if (unit?.role === "guardian") return "guardian-bash";
  if (unit?.role === "sniper") return options.deadeye ? "deadeye" : "sniper-shot";
  if (unit?.role === "pusher") return "pusher-punch";
  const enemy = state.enemies.find((candidate) => candidate.id === sourceId);
  if (enemy?.kind === "rugger") return "rugger-charge";
  if (enemy?.kind === "drainer") return "drain";
  if (enemy?.kind === "whale") return "whale-slam";
  return "generic";
}

function withDefeatedEnemyGhost(previous: GameState, next: GameState, enemyId: string): GameState {
  if (next.enemies.some((enemy) => enemy.id === enemyId)) return next;
  const defeated = previous.enemies.find((enemy) => enemy.id === enemyId);
  return defeated ? { ...next, enemies: [...next.enemies, { ...defeated, hp: 0 }] } : next;
}

function effectsFromEvents(events: readonly GameEvent[], state: GameState): BattleEffect[] {
  const effects: BattleEffect[] = [];
  const defeatedIds = new Set(events
    .filter((event): event is Extract<GameEvent, { type: "enemy-defeated" }> => event.type === "enemy-defeated")
    .map((event) => event.enemyId));
  for (const event of events) {
    if (event.type === "unit-attacked") {
      effects.push(nextEffect({ kind: event.damage >= 4 ? "heavy" : "damage", sourceId: event.unitId, targetId: event.enemyId, amount: event.damage }));
      if (defeatedIds.has(event.enemyId) || isDefeated(state, event.enemyId)) effects.push(nextEffect({ kind: "death", sourceId: event.unitId, targetId: event.enemyId }));
    }
    if (event.type === "damage") {
      effects.push(nextEffect({ kind: event.amount >= 4 ? "heavy" : "damage", sourceId: event.sourceId, targetId: event.targetId, amount: event.amount, absorbed: event.absorbed }));
      if (event.absorbed > 0) effects.push(nextEffect({ kind: "shield-hit", sourceId: event.sourceId, targetId: event.targetId, absorbed: event.absorbed }));
      if (defeatedIds.has(event.targetId) || isDefeated(state, event.targetId)) effects.push(nextEffect({ kind: "death", sourceId: event.sourceId, targetId: event.targetId }));
    }
    if (event.type === "collision") {
      effects.push(nextEffect({ kind: "collision", sourceId: event.sourceId, targetId: event.targetId, amount: event.damage }));
      if (defeatedIds.has(event.targetId) || isDefeated(state, event.targetId)) effects.push(nextEffect({ kind: "death", sourceId: event.sourceId, targetId: event.targetId }));
    }
    if (event.type === "target-pushed") {
      effects.push(nextEffect({
        kind: "push",
        sourceId: event.sourceId,
        targetId: event.targetId,
        from: event.from,
        to: event.to,
        ability: event.ability,
      }));
    }
    if (event.type === "shield-applied") {
      for (const unitId of event.unitIds) effects.push(nextEffect({ kind: "shield", sourceId: event.sourceId, targetId: unitId, amount: event.value }));
    }
  }
  return effects;
}

function effectsForBeat(beat: CombatPlaybackBeat): BattleEffect[] {
  if (beat.stage === "attack") {
    return [nextEffect({ kind: "attack", sourceId: beat.sourceId, targetId: beat.targetId })];
  }
  if (beat.stage === "impact") {
    const hitList = beat.hits ?? [{ targetId: beat.targetId ?? "", amount: beat.amount ?? 0, absorbed: beat.absorbed ?? 0, fatal: Boolean(beat.fatal) }];
    const effects: BattleEffect[] = [];
    for (const hit of hitList) {
      if (!hit.targetId) continue;
      effects.push(nextEffect({
        kind: hit.amount >= 4 ? "heavy" : "damage",
        sourceId: beat.sourceId,
        targetId: hit.targetId,
        amount: hit.amount,
        absorbed: hit.absorbed,
      }));
      if (hit.absorbed > 0) effects.push(nextEffect({ kind: "shield-hit", sourceId: beat.sourceId, targetId: hit.targetId, absorbed: hit.absorbed }));
    }
    return effects;
  }
  if (beat.stage === "death") {
    return [nextEffect({ kind: "death", sourceId: beat.sourceId, targetId: beat.targetId, amount: beat.amount })];
  }
  if (beat.stage === "status" && beat.event.type === "enemy-healed") {
    return [nextEffect({ kind: "heal", sourceId: beat.sourceId, targetId: beat.sourceId, amount: beat.amount })];
  }
  return [];
}

function attackEvent(events: readonly GameEvent[]) {
  return events.find((event): event is Extract<GameEvent, { type: "unit-attacked" }> => event.type === "unit-attacked");
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
      lastEvents: [],
      isResolving: false,
      isAnimating: false,
      combatCue: null,
      playbackIndex: -1,
      queueRemaining: 0,
      turnBanner: null,
      profile: initialProfile,
      bestScores: {},
      lastResult: null,
      settings: { soundMuted: true, tutorialComplete: false, trainingCompleted: 0 },
      hydrated: false,

      startMission: (missionId) => {
        clearSessionTimers();
        sessionGeneration += 1;
        const generation = sessionGeneration;
        const definition = getMissionDefinition(missionId);
        const game = createInitialGameState(definition);
        logId += 1;
        set({
          game,
          enemyPlan: calculateEnemyPlan(game),
          selectedUnitId: null,
          actionMode: null,
          lastMove: null,
          log: [{ id: logId, turn: 1, tone: "neutral", text: `${definition.name} live. Enemy intents are exact.` }],
          effects: [],
          lastEvents: [],
          isResolving: false,
          isAnimating: false,
          combatCue: null,
          playbackIndex: -1,
          queueRemaining: 0,
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
        if (!game || get().isResolving || get().isAnimating || game.phase !== "player") return;
        if (unitId && !game.units.some((unit) => unit.id === unitId && unit.hp > 0)) return;
        const unit = game.units.find((candidate) => candidate.id === unitId);
        set({ selectedUnitId: unitId, actionMode: unit && !unit.hasMoved && !unit.hasActed ? "move" : null });
      },

      setActionMode: (actionMode) => {
        if (!get().selectedUnitId || get().isResolving || get().isAnimating) return;
        set({ actionMode });
      },

      moveSelected: (to) => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving || get().isAnimating) return;
        const transition = moveUnit(game, selectedUnitId, to);
        const rejected = hasRejected(transition.events);
        set({
          game: transition.state,
          enemyPlan: planFor(transition.state),
          actionMode: rejected ? "move" : null,
          lastMove: rejected ? get().lastMove : { state: game, unitId: selectedUnitId },
          log: appendEvents(log, transition.events, game.turn),
          effects: effectsFromEvents(transition.events, transition.state),
          lastEvents: transition.events,
        });
      },

      attackSelected: (enemyId, deadeye = false) => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving || get().isAnimating) return;
        const transition = deadeye ? activateDeadeye(game, selectedUnitId, enemyId) : attackEnemy(game, selectedUnitId, enemyId);
        const rejected = hasRejected(transition.events);
        const attack = attackEvent(transition.events);
        if (rejected || !attack) {
          set({
            game: transition.state,
            enemyPlan: planFor(transition.state),
            actionMode: rejected ? get().actionMode : null,
            lastMove: rejected ? get().lastMove : null,
            log: appendEvents(log, transition.events, game.turn),
            effects: effectsFromEvents(transition.events, transition.state),
            lastEvents: transition.events,
          });
          return;
        }

        const generation = sessionGeneration;
        const fatal = transition.events.some((event) => event.type === "enemy-defeated" && event.enemyId === attack.enemyId)
          || isDefeated(transition.state, attack.enemyId);
        const impactState = fatal ? withDefeatedEnemyGhost(game, transition.state, attack.enemyId) : transition.state;
        const variant = combatVariantForSource(game, attack.unitId, { deadeye });
        const attackingUnit = game.units.find((unit) => unit.id === attack.unitId);
        const attackDuration = attackingUnit?.role === "sniper"
          ? deadeye ? 600 : 520
          : deadeye ? 320 : 230;
        set({
          actionMode: null,
          lastMove: null,
          isAnimating: true,
          effects: [nextEffect({ kind: "attack", sourceId: attack.unitId, targetId: attack.enemyId })],
          combatCue: nextCue("attack", { sourceId: attack.unitId, targetId: attack.enemyId, amount: attack.damage, fatal, variant }),
          lastEvents: [],
        });

        schedulePresentation(() => {
          if (generation !== sessionGeneration) return;
          const impactEffects = effectsFromEvents(transition.events, impactState).filter((effect) => effect.kind !== "death");
          set({
            game: impactState,
            enemyPlan: planFor(transition.state),
            log: appendEvents(log, transition.events, game.turn),
            effects: impactEffects,
            combatCue: nextCue("impact", { sourceId: attack.unitId, targetId: attack.enemyId, amount: attack.damage, fatal, variant }),
          });

          const finish = () => {
            if (generation !== sessionGeneration) return;
            set({ game: transition.state, isAnimating: false, effects: [], combatCue: null, lastEvents: transition.events });
          };

          if (fatal) {
            schedulePresentation(() => {
              if (generation !== sessionGeneration) return;
              set({
                effects: [nextEffect({ kind: "death", sourceId: attack.unitId, targetId: attack.enemyId })],
                combatCue: nextCue("death", { sourceId: attack.unitId, targetId: attack.enemyId, amount: attack.damage, fatal: true, variant }),
              });
              schedulePresentation(finish, 560);
            }, 330);
          } else {
            schedulePresentation(finish, 460);
          }
        }, attackDuration);
      },

      shieldSelected: () => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving || get().isAnimating) return;
        const transition = applyShield(game, selectedUnitId);
        const rejected = hasRejected(transition.events);
        if (rejected) {
          set({
            game: transition.state,
            enemyPlan: planFor(transition.state),
            actionMode: "ability",
            log: appendEvents(log, transition.events, game.turn),
            lastEvents: transition.events,
          });
          return;
        }
        const generation = sessionGeneration;
        set({
          game: transition.state,
          enemyPlan: planFor(transition.state),
          actionMode: null,
          lastMove: null,
          log: appendEvents(log, transition.events, game.turn),
          effects: effectsFromEvents(transition.events, transition.state),
          isAnimating: true,
          combatCue: nextCue("shield", { sourceId: selectedUnitId, amount: 2, variant: "shield-wall" }),
          lastEvents: [],
        });
        schedulePresentation(() => {
          if (generation === sessionGeneration) set({ isAnimating: false, effects: [], combatCue: null, lastEvents: transition.events });
        }, 720);
      },

      pushSelected: (targetId, batterUp = false) => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving || get().isAnimating) return;
        const transition = pushTarget(game, selectedUnitId, targetId, batterUp ? "batter-up" : "shove");
        const rejected = hasRejected(transition.events);
        const effects = effectsFromEvents(transition.events, transition.state);
        const pushed = transition.events.find((event): event is Extract<GameEvent, { type: "target-pushed" }> => event.type === "target-pushed");
        const collision = transition.events.find((event): event is Extract<GameEvent, { type: "collision" }> => event.type === "collision");
        const pushAbility = pushed?.ability ?? collision?.ability ?? (batterUp ? "batter-up" : "shove");
        const variant = combatVariantForSource(game, selectedUnitId, { pushAbility });
        const fatal = transition.events.some((event) => event.type === "enemy-defeated" && event.enemyId === targetId)
          || isDefeated(transition.state, targetId);
        const presentationState = fatal ? withDefeatedEnemyGhost(game, transition.state, targetId) : transition.state;
        const animated = !rejected && effects.length > 0;
        const generation = sessionGeneration;
        set({
          game: presentationState,
          enemyPlan: planFor(transition.state),
          actionMode: rejected ? get().actionMode : null,
          lastMove: rejected ? get().lastMove : null,
          log: appendEvents(log, transition.events, game.turn),
          effects,
          isAnimating: animated,
          combatCue: animated ? nextCue(fatal ? "death" : pushed ? "push" : "impact", {
            sourceId: selectedUnitId,
            targetId,
            amount: collision?.damage,
            fatal,
            variant,
            from: pushed?.from,
            to: pushed?.to,
          }) : null,
          lastEvents: animated ? [] : transition.events,
        });
        if (animated) schedulePresentation(() => {
          if (generation === sessionGeneration) set({ game: transition.state, isAnimating: false, effects: [], combatCue: null, lastEvents: transition.events });
        }, fatal ? 650 : pushed ? 430 : 480);
      },

      waitSelected: () => {
        const { game, selectedUnitId, log } = get();
        if (!game || !selectedUnitId || get().isResolving || get().isAnimating) return;
        const transition = waitUnit(game, selectedUnitId);
        const rejected = hasRejected(transition.events);
        set({
          game: transition.state,
          enemyPlan: planFor(transition.state),
          actionMode: rejected ? get().actionMode : null,
          lastMove: rejected ? get().lastMove : null,
          log: appendEvents(log, transition.events, game.turn),
          effects: [],
          lastEvents: transition.events,
        });
      },

      undoMove: () => {
        const snapshot = get().lastMove;
        if (!snapshot || get().isResolving || get().isAnimating) return;
        logId += 1;
        set({
          game: snapshot.state,
          enemyPlan: calculateEnemyPlan(snapshot.state),
          selectedUnitId: snapshot.unitId,
          actionMode: "move",
          lastMove: null,
          log: [...get().log, { id: logId, turn: snapshot.state.turn, tone: "neutral", text: "Last movement reversed. Enemy plan restored." } as CombatLogEntry].slice(-32),
          lastEvents: [],
        });
      },

      endTurn: () => {
        const { game, enemyPlan, log } = get();
        if (!game || game.phase !== "player" || get().isResolving || get().isAnimating) return;
        const snapshot = enemyPlan ?? calculateEnemyPlan(game);
        const generation = sessionGeneration;
        if (bannerTimer !== null) window.clearTimeout(bannerTimer);
        logId += 1;
        set({
          isResolving: true,
          selectedUnitId: null,
          actionMode: null,
          lastMove: null,
          lastEvents: [],
          effects: [],
          combatCue: null,
          playbackIndex: -1,
          queueRemaining: 0,
          turnBanner: "ENEMY PHASE",
          log: [...log, { id: logId, turn: game.turn, tone: "warning", text: "Enemy plan committed. Resolving exact intents." } as CombatLogEntry].slice(-32),
        });

        resolutionTimer = window.setTimeout(() => {
          if (generation !== sessionGeneration) return;
          const transition = resolveEnemyTurn(game, snapshot);
          const nextState = transition.state;
          const beats = compileEnemyPlayback(game, nextState, transition.events);
          resolutionTimer = null;
          set({ turnBanner: null, queueRemaining: beats.length });

          const finishPlayback = () => {
            if (generation !== sessionGeneration) return;
            const terminal = nextState.phase === "victory" || nextState.phase === "defeat";
            const training = isTrainingMissionId(nextState.missionId);
            let result = get().lastResult;
            let bestScores = get().bestScores;

            if (terminal && !training) {
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
              combatCue: null,
              playbackIndex: beats.length,
              queueRemaining: 0,
              turnBanner: terminal ? (training ? (nextState.phase === "victory" ? "LESSON CLEAR" : "TRY AGAIN") : nextState.phase === "victory" ? "VAULT SECURED" : "MISSION FAILED") : `PLAYER PHASE // ${String(nextState.turn).padStart(2, "0")}`,
              log: appendEvents(get().log, transition.events, game.turn),
              effects: [],
              lastEvents: transition.events,
              lastResult: result,
              bestScores,
            });
            bannerTimer = window.setTimeout(() => {
              if (generation === sessionGeneration) set({ turnBanner: null });
              bannerTimer = null;
            }, terminal ? 1000 : 650);
          };

          const playBeat = (index: number) => {
            if (generation !== sessionGeneration) return;
            const beat = beats[index];
            if (!beat) {
              finishPlayback();
              return;
            }
            const variant = combatVariantForSource(beat.state, beat.sourceId);
            set({
              game: beat.state,
              effects: effectsForBeat(beat),
              combatCue: nextCue(beat.stage, {
                sourceId: beat.sourceId,
                targetId: beat.targetId,
                amount: beat.amount,
                absorbed: beat.absorbed,
                fatal: beat.fatal,
                variant,
                area: beat.area,
                hits: beat.hits,
              }),
              playbackIndex: index,
              queueRemaining: beats.length - index - 1,
              lastEvents: [beat.event],
            });
            schedulePresentation(() => playBeat(index + 1), beat.duration);
          };

          playBeat(0);
        }, 420);
      },

      clearEffects: () => set({ effects: [] }),
      clearResult: () => set({ lastResult: null }),
      setTutorialComplete: (completed) => set((state) => ({
        settings: {
          ...state.settings,
          tutorialComplete: completed,
          trainingCompleted: completed ? 3 : 0,
        },
      })),
      completeTrainingLesson: (lesson) => set((state) => {
        const trainingCompleted = Math.max(state.settings.trainingCompleted, lesson) as 0 | 1 | 2 | 3;
        return {
          settings: {
            ...state.settings,
            trainingCompleted,
            tutorialComplete: trainingCompleted === 3,
          },
        };
      }),
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
        const persistedTraining = typeof persistedSettings?.trainingCompleted === "number"
          && Number.isInteger(persistedSettings.trainingCompleted)
          && persistedSettings.trainingCompleted >= 0
          && persistedSettings.trainingCompleted <= 3
          ? persistedSettings.trainingCompleted as 0 | 1 | 2 | 3
          : 0;
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
            tutorialComplete: persistedTraining === 3,
            trainingCompleted: persistedTraining,
          },
        };
      },
    },
  ),
);
