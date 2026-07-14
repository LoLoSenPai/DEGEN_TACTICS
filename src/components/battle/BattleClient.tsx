"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowFatRight,
  ArrowUUpLeft,
  Boot,
  HandFist,
  HandGrabbing,
  Heart,
  Hourglass,
  List,
  Shield,
  Sword,
  Target,
  Warning,
} from "@phosphor-icons/react";
import {
  BOARD_SIZE,
  PROTECT_THE_VAULT,
  TRAINING_LESSONS,
  getMissionDefinition,
  getAttackableTargets,
  getMovementPath,
  getPlayerMovementPresentationDuration,
  getReducedPlayerMovementPresentationDuration,
  getPushTargets,
  getValidMoves,
  isTrainingMissionId,
  type Enemy,
  type GameState,
  type PlayerUnit,
  type Position,
  type PushTarget,
} from "@/lib/game";
import { useGameStore, type ActionMode, type BattleEffect, type CombatCue, type CombatLogEntry } from "@/store/gameStore";
import { BattleTutorial, type BattleTutorialStep } from "@/components/battle/BattleTutorial";
import { CombatActionFx } from "@/components/battle/CombatActionFx";
import { EnemyIntentPath } from "@/components/battle/EnemyIntentPath";
import { PlayerMovePath } from "@/components/battle/PlayerMovePath";
import {
  PLAYER_SPRITE_SHEETS,
  playerSpriteSheetsAreReady,
  preloadPlayerSpriteSheets,
  type PlayerBattleSpriteMotion,
} from "@/components/battle/playerSpriteSheets";
import {
  initialTutorialStep,
  tutorialAction,
  tutorialCoordinate,
  tutorialRestrictsInput,
} from "@/components/battle/BattleTraining";

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (milliseconds: number) => void;
  }
}

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G"] as const;

const SPRITE_ASSETS = {
  guardian: "/assets/sprites/guardian.png",
  sniper: "/assets/sprites/sniper.png",
  pusher: "/assets/sprites/pusher.png",
  rugger: "/assets/sprites/rugger.png",
  drainer: "/assets/sprites/drainer.png",
  whale: "/assets/sprites/whale.png",
  vault: "/assets/sprites/vault.png",
  "data-block": "/assets/sprites/data-block.png",
  obstacle: "/assets/sprites/obstacle.png",
} as const;

type SpriteKind = keyof typeof SPRITE_ASSETS;

type EnemyBattleSpriteMotion =
  | "idle"
  | "walk"
  | "attack"
  | "heal"
  | "lock"
  | "charge"
  | "hurt"
  | "stagger"
  | "spawn"
  | "death";

type BattleSpriteState<Motion extends string> = {
  motion: Motion;
  effectId: number;
};

let activeBattleClients = 0;

const positionKey = ({ x, y }: Position) => `${x},${y}`;
const samePosition = (left: Position, right: Position) => left.x === right.x && left.y === right.y;
const coordinate = ({ x, y }: Position) => `${COLUMNS[x] ?? "?"}${y + 1}`;

function entityName(game: GameState, id: string) {
  if (id === game.vault.id) return game.vault.name;
  return game.units.find((unit) => unit.id === id)?.name
    ?? game.enemies.find((enemy) => enemy.id === id)?.name
    ?? game.objects.find((object) => object.id === id)?.name
    ?? id;
}

function entityPosition(game: GameState, id: string): Position | null {
  if (id === game.vault.id) return game.vault.position;
  return game.units.find((unit) => unit.id === id)?.position
    ?? game.enemies.find((enemy) => enemy.id === id)?.position
    ?? game.objects.find((object) => object.id === id)?.position
    ?? null;
}

function attackDirectionStyle(game: GameState, entityId: string, effect?: BattleEffect): CSSProperties | undefined {
  if (!effect?.targetId) return undefined;
  const source = entityPosition(game, entityId);
  const target = effect.from ?? entityPosition(game, effect.targetId);
  if (!source || !target) return undefined;
  return {
    "--combat-x": `${Math.sign(target.x - source.x) * 16}%`,
    "--combat-y": `${Math.sign(target.y - source.y) * 12}%`,
  } as CSSProperties;
}

function CombatCallout({ game, cue }: { game: GameState; cue: CombatCue | null }) {
  if (!cue || !["attack", "impact", "death", "shield", "push", "status"].includes(cue.stage)) return null;
  const source = cue.sourceId ? entityName(game, cue.sourceId) : "Enemy";
  const target = cue.targetId ? entityName(game, cue.targetId) : "Squad";
  let kicker = "COMBAT";
  let message = `${source} attacks ${target}`;

  if (cue.stage === "shield") {
    kicker = "ABILITY";
    message = `Shield Wall · ${cue.amount ?? 2} armor applied`;
  } else if (cue.stage === "push") {
    kicker = cue.variant === "batter-up" ? "BATTER UP" : "SHOVE";
    message = `${source} pushes ${target}`;
  } else if (cue.stage === "status") {
    if (cue.statusKind === "drain-heal") {
      kicker = "LIFE DRAIN";
      message = `${source} recovers ${cue.amount ?? 1} HP`;
    } else if (cue.statusKind === "breach-warning") {
      kicker = "BREACH ALERT";
      message = "The marked tile is now impassable";
    } else if (cue.statusKind === "cone-locked") {
      kicker = "CONE LOCKED";
      message = `${cue.area?.length ?? 0} exact tiles will take 4 damage next turn`;
    } else if (cue.statusKind === "charge-cancelled") {
      kicker = "CHARGE BROKEN";
      message = `${target} loses the locked cone`;
    } else if (cue.statusKind === "staggered") {
      kicker = "STAGGERED";
      message = `${target} loses this activation`;
    } else if (cue.statusKind === "push-blocked") {
      kicker = "JAMMED";
      message = `${target} cannot be pushed`;
    } else if (cue.statusKind === "push-stopped") {
      kicker = "PUSH STOPPED";
      message = `${target} moved, then hit an obstacle`;
    } else {
      kicker = "STATUS";
      message = `${source} changes state`;
    }
  } else if (cue.stage === "impact") {
    kicker = cue.absorbed ? "SHIELD HIT" : "IMPACT";
    message = cue.absorbed
      ? `${target} blocks ${cue.absorbed}${cue.amount ? ` · takes ${cue.amount}` : " · no HP lost"}`
      : `${target} takes ${cue.amount ?? 0} damage`;
  } else if (cue.stage === "death") {
    const fatalHits = cue.hits?.filter((hit) => hit.fatal) ?? [];
    if (cue.statusKind === "vault-breached" || cue.targetId === game.vault.id) {
      kicker = "VAULT BREACHED";
      message = "Vault integrity reached zero";
    } else if (fatalHits.length > 1) {
      kicker = "MULTI KO";
      message = `${fatalHits.length} squad targets are down`;
    } else {
      kicker = game.units.some((unit) => unit.id === cue.targetId) ? "HERO KO" : "ENEMY DOWN";
      message = `${target} is down`;
    }
  } else {
    kicker = source.toUpperCase();
    message = cue.variant === "deadeye"
      ? `Deadeye fires on ${target}`
      : cue.variant === "sniper-shot"
        ? `Fires on ${target}`
        : cue.variant === "drain"
          ? `Drains ${target}`
          : cue.variant === "whale-slam"
            ? `Slams the locked area`
            : cue.variant === "guardian-bash"
              ? `Shield-bashes ${target}`
              : `Attacks ${target}`;
  }

  return (
    <div key={cue.id} className={clsx("combat-callout", `is-${cue.stage}`, cue.variant && `variant-${cue.variant}`, cue.statusKind && `status-${cue.statusKind}`, cue.absorbed && "is-blocked", cue.fatal && "is-fatal")} role="status" aria-live="assertive">
      <small>{kicker}</small>
      <strong>{message}</strong>
    </div>
  );
}

function SpriteArt({ kind, name, className, priority = false }: { kind: SpriteKind; name: string; className?: string; priority?: boolean }) {
  return (
    <span className={clsx("sprite-art", `sprite-${kind}`, className)}>
      <Image src={SPRITE_ASSETS[kind]} alt="" fill sizes="130px" priority={priority} className="sprite-image" />
      <span className="sr-only">{name}</span>
    </span>
  );
}

function battleSpriteState(
  effects: readonly BattleEffect[],
  cue: CombatCue | null,
  unitId: string,
  role: PlayerUnit["role"],
): BattleSpriteState<PlayerBattleSpriteMotion> {
  const targetEffects = effects.filter((effect) => effect.targetId === unitId);
  const deathEffect = [...targetEffects].reverse().find((effect) => effect.kind === "death");
  if (deathEffect) return { motion: "death", effectId: deathEffect.id };

  const hurtEffect = [...targetEffects].reverse().find((effect) =>
    ["damage", "heavy", "collision"].includes(effect.kind) && (effect.amount ?? 0) > 0,
  );
  if (hurtEffect) return { motion: "hurt", effectId: hurtEffect.id };

  const abilityEffect = [...effects].reverse().find((effect) =>
    effect.sourceId === unitId
      && (
        role === "guardian" && effect.kind === "shield"
      ),
  );
  const abilityCue = cue?.sourceId === unitId && (
    (role === "guardian" && cue.stage === "shield" && cue.variant === "shield-wall")
    || (role === "pusher" && cue.stage === "push" && (cue.variant === "shove" || cue.variant === "batter-up"))
  );
  if (abilityEffect || abilityCue) return { motion: "ability", effectId: abilityEffect?.id ?? cue?.id ?? 0 };

  const attackEffect = [...effects].reverse().find((effect) => effect.kind === "attack" && effect.sourceId === unitId);
  if (attackEffect || (cue?.stage === "attack" && cue.sourceId === unitId)) {
    return { motion: "attack", effectId: attackEffect?.id ?? cue?.id ?? 0 };
  }

  const moveEffect = [...effects].reverse().find((effect) => effect.kind === "move" && effect.sourceId === unitId);
  if (moveEffect) return { motion: "walk", effectId: moveEffect.id };

  return { motion: "idle", effectId: 0 };
}

function enemyBattleSpriteState(
  effects: readonly BattleEffect[],
  cue: CombatCue | null,
  enemy: Enemy,
): BattleSpriteState<EnemyBattleSpriteMotion> {
  const targetEffects = effects.filter((effect) => effect.targetId === enemy.id);
  const deathEffect = [...targetEffects].reverse().find((effect) => effect.kind === "death");
  if (deathEffect || (cue?.stage === "death" && cue.targetId === enemy.id)) {
    return { motion: "death", effectId: deathEffect?.id ?? cue?.id ?? 0 };
  }

  const hurtEffect = [...targetEffects].reverse().find((effect) =>
    ["damage", "heavy", "collision"].includes(effect.kind) && (effect.amount ?? 0) > 0,
  );
  if (hurtEffect) return { motion: "hurt", effectId: hurtEffect.id };

  const pushedEffect = [...targetEffects].reverse().find((effect) => effect.kind === "push");
  if (pushedEffect) return { motion: "stagger", effectId: pushedEffect.id };

  if (cue?.stage === "spawn" && cue.sourceId === enemy.id) {
    return { motion: "spawn", effectId: cue.id };
  }

  const statusBelongsToEnemy = cue?.stage === "status" && (
    cue.sourceId === enemy.id
    || ((cue.statusKind === "charge-cancelled" || cue.statusKind === "staggered") && cue.targetId === enemy.id)
  );
  if (statusBelongsToEnemy) {
    if (cue.statusKind === "drain-heal") return { motion: "heal", effectId: cue.id };
    if (cue.statusKind === "cone-locked") return { motion: "lock", effectId: cue.id };
    if (cue.statusKind === "charge-cancelled" || cue.statusKind === "staggered") return { motion: "stagger", effectId: cue.id };
    return { motion: "idle", effectId: cue.id };
  }

  const attackEffect = [...effects].reverse().find((effect) => effect.kind === "attack" && effect.sourceId === enemy.id);
  if (attackEffect || (cue?.stage === "attack" && cue.sourceId === enemy.id)) {
    return { motion: "attack", effectId: attackEffect?.id ?? cue?.id ?? 0 };
  }

  const moveEffect = [...effects].reverse().find((effect) => effect.kind === "move" && effect.sourceId === enemy.id);
  if (moveEffect) return { motion: "walk", effectId: moveEffect.id };

  if (enemy.kind === "whale" && enemy.whaleState === "charging") return { motion: "charge", effectId: 0 };
  if (enemy.kind === "whale" && enemy.whaleState === "staggered") return { motion: "stagger", effectId: 0 };
  return { motion: "idle", effectId: 0 };
}

function PlayerBattleSprite({ name, role, state }: { name: string; role: PlayerUnit["role"]; state: BattleSpriteState<PlayerBattleSpriteMotion> }) {
  const frames = state.motion === "death" ? 12 : 8;
  const spriteSheet = PLAYER_SPRITE_SHEETS[role][state.motion];
  return (
    <span
      className={clsx("sprite-art", `sprite-${role}`, "board-sprite", "player-spritecook", `role-${role}`, `is-${state.motion}`)}
      data-sprite-source="spritecook-pixel"
      data-sprite-role={role}
      data-sprite-motion={state.motion}
      data-sprite-effect-id={state.effectId}
      data-sprite-frames={frames}
    >
      <span
        key={`${state.motion}-${state.effectId}`}
        className="player-spritecook-frames"
        style={{ backgroundImage: `url("${spriteSheet}")` }}
        aria-hidden="true"
      />
      <span className="sr-only">{name}</span>
    </span>
  );
}

function EnemyBattleSprite({ enemy, state }: { enemy: Enemy; state: BattleSpriteState<EnemyBattleSpriteMotion> }) {
  return (
    <span
      className={clsx("sprite-art", `sprite-${enemy.kind}`, "board-sprite", "enemy-battle-sprite", `kind-${enemy.kind}`, `is-${state.motion}`)}
      data-sprite-source="authored-pixel-motion"
      data-sprite-kind={enemy.kind}
      data-sprite-motion={state.motion}
      data-sprite-effect-id={state.effectId}
    >
      <Image src={SPRITE_ASSETS[enemy.kind]} alt="" fill sizes="150px" priority className="sprite-image enemy-battle-image" />
      <span className="enemy-motion-accent" aria-hidden="true" />
      <span className="sr-only">{enemy.name}</span>
    </span>
  );
}

type HighlightState = {
  moves: readonly Position[];
  attackIds: ReadonlySet<string>;
  pushTargets: readonly PushTarget[];
};

function missionPresentation(missionId: string) {
  const definition = getMissionDefinition(missionId);
  const lesson = TRAINING_LESSONS.find((candidate) => candidate.missionId === missionId);
  return {
    title: definition.name,
    eyebrow: lesson ? `Training ${lesson.order} / 3` : "Mission 01",
    objective: lesson?.objective ?? "Survive 5 turns",
  };
}

type UnitActivationState = "ready" | "action-ready" | "done" | "ko";

function unitActivationState(unit: PlayerUnit): UnitActivationState {
  if (unit.hp <= 0) return "ko";
  if (unit.hasActed) return "done";
  if (unit.hasMoved) return "action-ready";
  return "ready";
}

function activationLabel(unit: PlayerUnit) {
  const state = unitActivationState(unit);
  if (state === "ready") return "Move + action ready";
  if (state === "action-ready") return "Action remaining";
  if (state === "done") return "Activation complete";
  return "KO";
}

function signaturePresentation(unit: PlayerUnit) {
  const blockedByMovement = unit.role === "sniper" && unit.hasMoved && !unit.hasActed && unit.signatureAvailable;
  const status = !unit.signatureAvailable
    ? "0 / 1 · Spent"
    : blockedByMovement
      ? "Locked · moved"
      : "1 / 1 · Mission charge";

  if (unit.role === "guardian") return {
    status,
    description: "Self and orthogonal allies gain 2 shield. It absorbs one hit during the next enemy phase. The Vault is not protected.",
  };
  if (unit.role === "sniper") return {
    status,
    description: "Deal 4 damage at cardinal range 1–3. Must be used before moving and spends both movement and action.",
  };
  return {
    status,
    description: "Push up to 2 tiles. If an enemy is stopped, it takes 2 collision damage.",
    reusable: "Shove · Reusable · Push 1 tile · 1 collision damage",
  };
}

function GameHud({ game }: { game: GameState }) {
  const vaultPercent = Math.max(0, Math.min(100, (game.vault.hp / game.vault.maxHp) * 100));
  const presentation = missionPresentation(game.missionId);

  return (
    <header className="game-hud" aria-label="Mission status">
      <div className="hud-objective">
        <span className="hud-shield"><Shield weight="fill" /></span>
        <div><strong>{presentation.title}</strong><small>{presentation.eyebrow} · {presentation.objective}</small></div>
      </div>
      <div className="hud-turn"><span>Turn</span><strong>{game.turn} / {game.maxTurns}</strong></div>
      <div className="hud-vault">
        <div><span>Vault</span><strong>{Math.max(0, game.vault.hp)} / {game.vault.maxHp}</strong></div>
        <span className="hud-vault-bar"><i style={{ width: `${vaultPercent}%` }} /></span>
      </div>
    </header>
  );
}

function MissionIntro({ game }: { game: GameState }) {
  const presentation = missionPresentation(game.missionId);
  return (
    <div className="mission-intro" role="status" aria-live="assertive">
      <span>{presentation.eyebrow}</span>
      <h1>{presentation.title}</h1>
      <p>{presentation.objective}</p>
    </div>
  );
}

type ReadoutEntity =
  | { category: "unit"; value: PlayerUnit }
  | { category: "enemy"; value: Enemy }
  | { category: "object"; value: GameState["objects"][number] }
  | { category: "vault"; value: GameState["vault"] };

function resolveReadout(game: GameState, inspectedId: string | null, selectedUnitId: string | null): ReadoutEntity | null {
  const lookup = inspectedId ?? selectedUnitId;
  if (!lookup) return null;
  const unit = game.units.find((candidate) => candidate.id === lookup);
  if (unit) return { category: "unit", value: unit };
  const enemy = game.enemies.find((candidate) => candidate.id === lookup);
  if (enemy) return { category: "enemy", value: enemy };
  const object = game.objects.find((candidate) => candidate.id === lookup);
  if (object) return { category: "object", value: object };
  if (game.vault.id === lookup) return { category: "vault", value: game.vault };
  return null;
}

function SelectedInspector({ game, selectedUnitId, inspectedId }: { game: GameState; selectedUnitId: string | null; inspectedId: string | null }) {
  const enemyPlan = useGameStore((state) => state.enemyPlan);
  const readout = resolveReadout(game, inspectedId, selectedUnitId);
  if (!readout) return null;

  let kind: SpriteKind = "data-block";
  let hp: number | null = null;
  let maxHp: number | null = null;
  let move: number | null = null;
  let damage: number | null = null;
  let subtitle = "Pushable object";
  let signature: ReturnType<typeof signaturePresentation> | null = null;

  if (readout.category === "unit") {
    kind = readout.value.role;
    hp = readout.value.hp;
    maxHp = readout.value.maxHp;
    move = readout.value.moveRange;
    damage = readout.value.attackDamage;
    subtitle = activationLabel(readout.value);
    signature = signaturePresentation(readout.value);
  } else if (readout.category === "enemy") {
    kind = readout.value.kind;
    hp = readout.value.hp;
    maxHp = readout.value.maxHp;
    move = readout.value.moveRange;
    damage = readout.value.attackDamage;
    subtitle = "Hostile";
  } else if (readout.category === "vault") {
    kind = "vault";
    hp = readout.value.hp;
    maxHp = readout.value.maxHp;
    subtitle = "Primary objective";
  }

  const intent = readout.category === "enemy" ? enemyPlan?.intents.find((entry) => entry.enemyId === readout.value.id) : null;
  const hpPercent = hp !== null && maxHp ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;

  return (
    <aside className={clsx("selected-inspector", readout.category === "enemy" && "is-enemy")} aria-label="Selected entity information">
      <div className="inspector-topline"><span>{readout.category === "enemy" ? "Threat" : readout.category === "unit" ? "Selected" : "Object"}</span><b>{coordinate(readout.value.position)}</b></div>
      <div className="inspector-hero">
        <SpriteArt kind={kind} name={readout.value.name} className="inspector-sprite" />
        <div><h2>{readout.value.name}</h2><p>{subtitle}</p></div>
      </div>
      {hp !== null && maxHp !== null ? (
        <div className="inspector-hp"><span><Heart weight="fill" /> {Math.max(0, hp)} / {maxHp}</span><i><b style={{ width: `${hpPercent}%` }} /></i></div>
      ) : null}
      <div className="inspector-stats">
        {move !== null ? <span><Boot weight="fill" /><small>Move</small><strong>{move}</strong></span> : null}
        {damage !== null ? <span><Sword weight="fill" /><small>Damage</small><strong>{damage}</strong></span> : null}
      </div>
      {signature && readout.category === "unit" ? (
        <div className="inspector-ability" data-ability-card={readout.value.signatureName} data-charges-remaining={readout.value.signatureAvailable ? 1 : 0}>
          <div>
            <Shield weight="fill" />
            <strong>{readout.value.signatureName}</strong>
            <span>{signature.status}</span>
          </div>
          <p>{signature.description}</p>
          {signature.reusable ? <small>{signature.reusable}</small> : null}
        </div>
      ) : null}
      {intent ? (
        <div className="inspector-intent">
          <span>Intent #{intent.order}</span>
          <strong>{intent.action}</strong>
          <small>{intent.path.length > 0 ? intent.path.map(coordinate).join(" → ") : "Hold"} · {intent.target ? entityName(game, intent.target.id) : intent.area.length > 0 ? `${intent.area.length} tiles` : "No target"}</small>
        </div>
      ) : null}
    </aside>
  );
}

function SquadReadiness({
  units,
  selectedUnitId,
  disabled,
  onSelect,
}: {
  units: readonly PlayerUnit[];
  selectedUnitId: string | null;
  disabled: boolean;
  onSelect: (unitId: string) => void;
}) {
  const remaining = units.filter((unit) => unit.hp > 0 && !unit.hasActed).length;
  return (
    <aside className="squad-readiness" aria-label="Squad activations" data-ready-count={remaining}>
      <header><span>Squad</span><strong>{remaining} ready</strong></header>
      <div>
        {units.map((unit) => {
          const state = unitActivationState(unit);
          const shortStatus = state === "ready" ? "Ready" : state === "action-ready" ? "Action left" : state === "done" ? "Done" : "KO";
          return (
            <button
              type="button"
              key={unit.id}
              className={clsx("squad-unit", `is-${state}`, unit.id === selectedUnitId && "is-selected")}
              onClick={() => onSelect(unit.id)}
              disabled={disabled || unit.hp <= 0}
              aria-pressed={unit.id === selectedUnitId}
              data-squad-unit={unit.id}
              data-activation-state={state}
            >
              <SpriteArt kind={unit.role} name={unit.name} className="squad-unit-sprite" />
              <span><strong>{unit.name}</strong><small>{shortStatus}</small><i><b style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }} /></i></span>
              <em aria-hidden="true">{state === "ready" ? "◆" : state === "action-ready" ? "!" : state === "done" ? "✓" : "×"}</em>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function EndTurnConfirmation({
  units,
  onReview,
  onConfirm,
  onCancel,
}: {
  units: readonly PlayerUnit[];
  onReview: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="end-turn-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="end-turn-confirmation" role="dialog" aria-modal="true" aria-labelledby="end-turn-title" data-end-turn-confirmation="true">
        <header>
          <Warning weight="fill" aria-hidden="true" />
          <div><span>Unspent activations</span><h2 id="end-turn-title">{units.length} {units.length === 1 ? "hero is" : "heroes are"} still ready</h2></div>
        </header>
        <p>Ending the turn skips every remaining move and action.</p>
        <ul>
          {units.map((unit) => <li key={unit.id}><strong>{unit.name}</strong><span>{unit.hasMoved ? "Action remaining" : "Move + action remaining"}</span></li>)}
        </ul>
        <footer>
          <button type="button" className="end-turn-review" onClick={onReview} autoFocus>Back to squad</button>
          <button type="button" className="end-turn-anyway" onClick={onConfirm}>End turn anyway</button>
        </footer>
      </section>
    </div>
  );
}

function tileDescription({
  position,
  game,
  unit,
  enemy,
  object,
  obstacle,
  isMove,
  isAttack,
  isPush,
  isDanger,
}: {
  position: Position;
  game: GameState;
  unit?: PlayerUnit;
  enemy?: Enemy;
  object?: GameState["objects"][number];
  obstacle: boolean;
  isMove: boolean;
  isAttack: boolean;
  isPush: boolean;
  isDanger: boolean;
}) {
  const details = [coordinate(position)];
  if (unit) details.push(`${unit.name}, ally, ${unit.hp} of ${unit.maxHp} health, ${activationLabel(unit)}`);
  else if (enemy) details.push(`${enemy.name}, ${enemy.kind}, ${enemy.hp} of ${enemy.maxHp} health`);
  else if (object) details.push(`${object.name}, pushable blocker`);
  else if (samePosition(game.vault.position, position)) details.push(`Vault, ${game.vault.hp} of ${game.vault.maxHp} integrity`);
  else if (obstacle) details.push("obstacle");
  else if (samePosition(game.breach.position, position) && game.breach.status === "incoming") details.push("incoming breach, impassable");
  else details.push("floor");
  if (isMove) details.push("legal move");
  if (isAttack) details.push("attackable target");
  if (isPush) details.push("pushable target");
  if (isDanger) details.push("threatened by exact enemy intent");
  return details.join(". ");
}

function Board({
  game,
  highlights,
  selectedUnitId,
  actionMode,
  inspectedId,
  tutorialStep,
  movePreview,
  movePreviewPath,
  disabled,
  onTile,
  onPreviewMove,
}: {
  game: GameState;
  highlights: HighlightState;
  selectedUnitId: string | null;
  actionMode: ActionMode;
  inspectedId: string | null;
  tutorialStep: BattleTutorialStep;
  movePreview: Position | null;
  movePreviewPath: readonly Position[] | null;
  disabled: boolean;
  onTile: (position: Position) => void;
  onPreviewMove: (position: Position | null) => void;
}) {
  const enemyPlan = useGameStore((state) => state.enemyPlan);
  const effects = useGameStore((state) => state.effects);
  const combatCue = useGameStore((state) => state.combatCue);
  const boardRef = useRef<HTMLDivElement>(null);
  const previousRects = useRef(new Map<string, DOMRect>());
  const moveKeys = useMemo(() => new Set(highlights.moves.map(positionKey)), [highlights.moves]);
  const pushIds = useMemo(() => new Set(highlights.pushTargets.map((target) => target.id)), [highlights.pushTargets]);
  const visibleZeroHpIds = useMemo(() => new Set(effects
    .filter((effect) => effect.targetId && ["damage", "heavy", "collision", "death"].includes(effect.kind))
    .map((effect) => effect.targetId)), [effects]);

  const intentData = useMemo(() => {
    const danger = new Set<string>();
    const locked = new Set<string>();
    const destinations = new Map<string, number[]>();
    const orders = new Map<string, number>();
    for (const intent of enemyPlan?.intents ?? []) {
      orders.set(intent.enemyId, intent.order);
      intent.area.forEach((position) => danger.add(positionKey(position)));
      intent.targets.forEach((target) => danger.add(positionKey(target.position)));
      if (intent.target) danger.add(positionKey(intent.target.position));
      if (intent.action === "slam" || intent.special === "ground-slam") intent.area.forEach((position) => locked.add(positionKey(position)));
      const destinationKey = positionKey(intent.destination);
      destinations.set(destinationKey, [...(destinations.get(destinationKey) ?? []), intent.order]);
    }
    return { danger, locked, destinations, orders };
  }, [enemyPlan]);

  const entityFingerprint = [
    ...game.units.map((entity) => `${entity.id}:${positionKey(entity.position)}:${entity.hp}`),
    ...game.enemies.map((entity) => `${entity.id}:${positionKey(entity.position)}:${entity.hp}`),
    ...game.objects.map((entity) => `${entity.id}:${positionKey(entity.position)}`),
  ].join("|");

  useLayoutEffect(() => {
    const root = boardRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextRects = new Map<string, DOMRect>();
    root.querySelectorAll<HTMLElement>("[data-game-piece]").forEach((element) => {
      const id = element.dataset.gamePiece;
      if (!id) return;
      const rect = element.getBoundingClientRect();
      nextRects.set(id, rect);
      const previous = previousRects.current.get(id);
      if (previous && (previous.left !== rect.left || previous.top !== rect.top)) {
        const movement = effects.find((effect) =>
          (effect.kind === "move" && effect.sourceId === id)
          || (effect.kind === "push" && effect.targetId === id),
        );
        const movementPath = movement?.path
          ?? (movement?.from && movement.to ? [movement.from, movement.to] : undefined);
        const pathRects = movementPath?.map((position) =>
          root.querySelector<HTMLElement>(`[data-coordinate="${coordinate(position)}"]`)?.getBoundingClientRect(),
        );
        const hasCompletePath = pathRects && pathRects.length > 1 && pathRects.every(Boolean);
        const keyframes = hasCompletePath
          ? pathRects.map((pathRect, index) => ({
              transform: `translate(${pathRect!.left - rect.left}px, ${pathRect!.top - rect.top}px) scale(${reduceMotion ? "1" : index === 0 ? ".96" : "1"})`,
              offset: index / (pathRects.length - 1),
            }))
          : [
              { transform: `translate(${previous.left - rect.left}px, ${previous.top - rect.top}px) scale(${reduceMotion ? "1" : ".96"})` },
              { transform: "translate(0, 0) scale(1)" },
            ];
        const pathLength = hasCompletePath ? pathRects.length : 2;
        const duration = reduceMotion
          ? getReducedPlayerMovementPresentationDuration(pathLength)
          : getPlayerMovementPresentationDuration(pathLength);
        element.animate(keyframes, {
          duration,
          easing: reduceMotion ? "linear" : movement?.kind === "push" ? "cubic-bezier(.12,.82,.18,1)" : "cubic-bezier(.4,0,.2,1)",
        });
      }
    });
    previousRects.current = nextRects;
  }, [effects, entityFingerprint]);

  const positions = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index): Position => ({ x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE) }));
  const heavyImpact = effects.some((effect) => effect.kind === "heavy");
  const vaultThreatened = intentData.danger.has(positionKey(game.vault.position));
  const tutorialTargetCoordinate = tutorialCoordinate(tutorialStep);
  const tutorialRestricted = tutorialRestrictsInput(tutorialStep);

  return (
    <div
      ref={boardRef}
      className={clsx("game-board-frame", heavyImpact && "is-shaking", vaultThreatened && "is-vault-threatened", tutorialStep === "basics-read-intent" && "is-tutorial-intents")}
      aria-label="Vault District tactical grid"
      data-tutorial-target={tutorialStep === "basics-read-intent" ? tutorialStep : undefined}
    >
      <div className="game-board-grid" role="grid" aria-rowcount={BOARD_SIZE} aria-colcount={BOARD_SIZE}>
        <EnemyIntentPath plan={enemyPlan} />
        {movePreview && movePreviewPath ? <PlayerMovePath positions={movePreviewPath} destination={coordinate(movePreview)} /> : null}
        <CombatActionFx game={game} cue={combatCue} />
        {positions.map((position) => {
          const key = positionKey(position);
          const unit = game.units.find((candidate) => (candidate.hp > 0 || visibleZeroHpIds.has(candidate.id)) && samePosition(candidate.position, position));
          const enemy = game.enemies.find((candidate) => (candidate.hp > 0 || visibleZeroHpIds.has(candidate.id)) && samePosition(candidate.position, position));
          const object = game.objects.find((candidate) => samePosition(candidate.position, position));
          const isVault = samePosition(game.vault.position, position);
          const obstacle = game.obstacles.some((candidate) => samePosition(candidate, position));
          const isBreach = samePosition(game.breach.position, position) && game.breach.status === "incoming";
          const isMove = moveKeys.has(key) && actionMode === "move";
          const isAttack = Boolean(enemy && highlights.attackIds.has(enemy.id));
          const isPush = Boolean((enemy || object) && pushIds.has((enemy ?? object)?.id ?? ""));
          const isDanger = intentData.danger.has(key);
          const destinationOrders = intentData.destinations.get(key) ?? [];
          const entityId = unit?.id ?? enemy?.id ?? object?.id ?? (isVault ? game.vault.id : undefined);
          const targetEffects = entityId ? effects.filter((candidate) => candidate.targetId === entityId) : [];
          const attackEffect = entityId ? effects.find((candidate) => (candidate.kind === "attack" || candidate.kind === "push") && candidate.sourceId === entityId) : undefined;
          const damageEffect = [...targetEffects].reverse().find((candidate) => ["damage", "heavy", "collision"].includes(candidate.kind));
          const shieldEffect = [...targetEffects].reverse().find((candidate) => candidate.kind === "shield" || candidate.kind === "shield-hit");
          const deathEffect = [...targetEffects].reverse().find((candidate) => candidate.kind === "death");
          const healEffect = [...targetEffects].reverse().find((candidate) => candidate.kind === "heal");
          const pushedEffect = [...targetEffects].reverse().find((candidate) => candidate.kind === "push");
          const isHit = Boolean(damageEffect || shieldEffect?.kind === "shield-hit");
          const playerAnimation = unit ? battleSpriteState(effects, combatCue, unit.id, unit.role) : null;
          const enemyAnimation = enemy ? enemyBattleSpriteState(effects, combatCue, enemy) : null;
          const pieceCombatClass = clsx(attackEffect && "is-attacking", isHit && "is-hit", pushedEffect && "is-pushed", shieldEffect && "has-shield-vfx", shieldEffect?.kind === "shield-hit" && "is-shield-hit", deathEffect && "is-dying", healEffect && "is-healing");
          const pieceCombatStyle = entityId ? attackDirectionStyle(game, entityId, attackEffect) : undefined;
          const order = enemy ? intentData.orders.get(enemy.id) : undefined;
          const isSelected = unit?.id === selectedUnitId || Boolean(entityId && entityId === inspectedId);
          const tileCoordinate = coordinate(position);
          const isTutorialFocus = tileCoordinate === tutorialTargetCoordinate;
          const tutorialTileAllowed = isTutorialFocus;

          return (
            <button
              type="button"
              role="gridcell"
              key={key}
              className={clsx(
                "game-tile",
                obstacle && "is-obstacle",
                isVault && "is-vault",
                isBreach && "is-breach",
                isSelected && "is-selected",
                isMove && "is-move",
                isAttack && (actionMode === "attack" || actionMode === "ability") && "is-attack",
                isPush && (actionMode === "push" || actionMode === "ability") && "is-push",
                isDanger && "is-danger",
                intentData.locked.has(key) && "is-locked-danger",
                isTutorialFocus && "is-tutorial-focus",
              )}
              onClick={() => {
                onPreviewMove(null);
                onTile(position);
              }}
              onPointerEnter={() => {
                if (isMove) onPreviewMove(position);
              }}
              onPointerLeave={() => {
                if (movePreview && samePosition(movePreview, position)) onPreviewMove(null);
              }}
              onFocus={() => {
                if (isMove) onPreviewMove(position);
              }}
              onBlur={() => {
                if (movePreview && samePosition(movePreview, position)) onPreviewMove(null);
              }}
              disabled={disabled || game.phase !== "player" || (tutorialRestricted && !tutorialTileAllowed)}
              aria-label={tileDescription({ position, game, unit, enemy, object, obstacle, isMove, isAttack, isPush, isDanger })}
              aria-selected={isSelected}
              data-coordinate={tileCoordinate}
              data-tutorial-target={isTutorialFocus ? tutorialStep ?? undefined : undefined}
            >
              <span className="game-tile-coordinate" aria-hidden="true">{coordinate(position)}</span>
              {isDanger ? <Warning className="game-danger-icon" weight="fill" aria-hidden="true" /> : null}
              {destinationOrders.length > 0 ? <span className="game-intent-land">{destinationOrders.join("/")}</span> : null}
              {obstacle ? <SpriteArt kind="obstacle" name="Obstacle" className="game-prop obstacle-prop" /> : null}
              {isBreach && !enemy ? <span className="breach-marker"><Warning weight="fill" /><small>Incoming</small></span> : null}
              {isVault ? (
                <span className={clsx("game-piece vault-piece", vaultThreatened && "is-threatened", pieceCombatClass)} style={pieceCombatStyle} data-game-piece={game.vault.id}>
                  <span className="piece-base" />
                  <SpriteArt kind="vault" name={game.vault.name} className="board-sprite" priority />
                  <span className="piece-health"><i style={{ width: `${Math.max(0, (game.vault.hp / game.vault.maxHp) * 100)}%` }} /></span>
                </span>
              ) : null}
              {unit ? (
                <span className={clsx("game-piece ally-piece", `piece-${unit.role}`, `is-${unitActivationState(unit)}`, unit.id === selectedUnitId && "is-active", pieceCombatClass)} style={pieceCombatStyle} data-game-piece={unit.id} data-activation-state={unitActivationState(unit)}>
                  <span className="piece-base" />
                  {playerAnimation ? <PlayerBattleSprite name={unit.name} role={unit.role} state={playerAnimation} /> : null}
                  <span className="piece-health"><i style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }} /></span>
                  <span className="piece-activation" aria-hidden="true">{unitActivationState(unit) === "ready" ? "READY" : unitActivationState(unit) === "action-ready" ? "ACTION" : unitActivationState(unit) === "done" ? "✓" : "KO"}</span>
                  {unit.shield ? <><span className="piece-shield-aura" aria-hidden="true" /><span className="piece-shield"><Shield weight="fill" />{unit.shield.value}</span></> : null}
                </span>
              ) : null}
              {enemy ? (
                <span className={clsx("game-piece enemy-piece", `piece-${enemy.kind}`, enemy.kind === "whale" && "is-whale", pieceCombatClass)} style={pieceCombatStyle} data-game-piece={enemy.id}>
                  <span className="piece-base" />
                  {enemyAnimation ? <EnemyBattleSprite enemy={enemy} state={enemyAnimation} /> : null}
                  <span className="piece-health"><i style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} /></span>
                  {order ? <span className="enemy-order">{order}</span> : null}
                </span>
              ) : null}
              {object ? <span className={clsx("game-piece object-piece", pieceCombatClass)} data-game-piece={object.id}><span className="piece-base" /><SpriteArt kind="data-block" name={object.name} className="board-sprite" /></span> : null}
              {damageEffect ? (
                <span key={`impact-${damageEffect.id}`} className={clsx("game-combat-vfx", damageEffect.kind === "heavy" || damageEffect.kind === "collision" ? "is-heavy" : "is-normal")} aria-hidden="true">
                  <Image src={damageEffect.kind === "heavy" || damageEffect.kind === "collision" ? "/assets/vfx/big-hit.gif" : "/assets/vfx/small-hit.gif"} alt="" fill sizes="160px" unoptimized />
                </span>
              ) : null}
              {shieldEffect ? (
                <span key={`shield-${shieldEffect.id}`} className="game-combat-vfx is-shield" aria-hidden="true">
                  <Image src="/assets/vfx/electric-shield.gif" alt="" fill sizes="160px" unoptimized />
                </span>
              ) : null}
              {deathEffect ? (
                <span key={`death-${deathEffect.id}`} className="game-combat-vfx is-death" aria-hidden="true">
                  <Image src="/assets/vfx/anima-death.gif" alt="" fill sizes="180px" unoptimized />
                </span>
              ) : null}
              {damageEffect && (damageEffect.amount ?? 0) > 0 ? <span key={`damage-${damageEffect.id}`} className="game-damage-popup">−{damageEffect.amount} HP</span> : null}
              {shieldEffect?.kind === "shield-hit" && (shieldEffect.absorbed ?? 0) > 0 ? <span key={`block-${shieldEffect.id}`} className="game-block-popup">BLOCK {shieldEffect.absorbed}</span> : null}
              {healEffect && (healEffect.amount ?? 0) > 0 ? <span key={`heal-${healEffect.id}`} className="game-heal-popup">+{healEffect.amount} HP</span> : null}
              {deathEffect ? <span key={`ko-${deathEffect.id}`} className="game-ko-popup">{isVault ? "BREACH" : "KO"}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionBar({
  selected,
  actionMode,
  movePreview,
  movePreviewDistance,
  remainingCount,
  hasUndo,
  tutorialStep,
  disabled,
  log,
  onMode,
  onAbility,
  onWait,
  onUndo,
  onEndTurn,
}: {
  selected?: PlayerUnit;
  actionMode: ActionMode;
  movePreview: Position | null;
  movePreviewDistance: number;
  remainingCount: number;
  hasUndo: boolean;
  tutorialStep: BattleTutorialStep;
  disabled: boolean;
  log: readonly CombatLogEntry[];
  onMode: (mode: ActionMode) => void;
  onAbility: () => void;
  onWait: () => void;
  onUndo: () => void;
  onEndTurn: () => void;
}) {
  const canMove = Boolean(selected && selected.hp > 0 && !selected.hasMoved && !selected.hasActed);
  const canAct = Boolean(selected && selected.hp > 0 && !selected.hasActed);
  const canSignature = Boolean(selected?.signatureAvailable && canAct && (selected.role !== "sniper" || !selected.hasMoved));
  const signatureStatus = !selected
    ? null
    : !selected.signatureAvailable
      ? "0 / 1 · Spent"
      : selected.role === "sniper" && selected.hasMoved
        ? "Locked · moved"
        : "1 / 1 · Charge";
  const tutorialRestricted = tutorialRestrictsInput(tutorialStep);
  const allowedTutorialAction = tutorialAction(tutorialStep);
  const hint = !selected
    ? "Select a hero"
    : selected.hasActed
      ? `${selected.name} is done · select another hero`
      : actionMode === "move"
        ? movePreview
          ? `Move ${selected.name} to ${coordinate(movePreview)} · ${movePreviewDistance} tile${movePreviewDistance === 1 ? "" : "s"}`
          : "Point at a teal tile to preview the route"
        : actionMode === "attack"
          ? "Choose a cyan enemy"
          : actionMode === "push" || actionMode === "ability"
            ? "Choose a highlighted target"
            : selected.role === "guardian"
              ? "Shield Wall lets nearby allies absorb one enemy hit"
              : selected.role === "sniper" && !selected.hasMoved
                ? "Deadeye deals 4 damage, but only before moving"
                : selected.role === "pusher"
                  ? "Shove enemies or the Data Block · blocked enemies take collision damage"
                  : "Move once, then act";
  const lastLog = log.at(-1)?.text;

  return (
    <div className="game-action-zone">
      <div className="game-action-hint" aria-live="polite">
        <span>{hint}</span>
        {lastLog ? <small>{lastLog}</small> : null}
        {hasUndo ? <button type="button" onClick={onUndo} disabled={disabled || tutorialRestricted}><ArrowUUpLeft weight="bold" /> Undo move</button> : null}
      </div>
      <nav className="game-action-bar" aria-label="Battle actions">
        <button type="button" className={clsx("game-action-button action-move", actionMode === "move" && "is-active")} onClick={() => onMode("move")} disabled={disabled || !canMove || tutorialRestricted} aria-keyshortcuts="1">
          <Boot weight="fill" /><span>Move</span><kbd>1</kbd>
        </button>
        <button type="button" className={clsx("game-action-button action-attack", actionMode === "attack" && "is-active", allowedTutorialAction === "attack" && "is-tutorial-focus")} onClick={() => onMode("attack")} disabled={disabled || !canAct || (tutorialRestricted && allowedTutorialAction !== "attack")} aria-keyshortcuts="2" data-tutorial-target={allowedTutorialAction === "attack" ? tutorialStep ?? undefined : undefined}>
          <Sword weight="fill" /><span>Attack</span><kbd>2</kbd>
        </button>
        {selected?.role === "pusher" ? (
          <button type="button" className={clsx("game-action-button action-push", actionMode === "push" && "is-active", allowedTutorialAction === "push" && "is-tutorial-focus")} onClick={() => onMode("push")} disabled={disabled || !canAct || (tutorialRestricted && allowedTutorialAction !== "push")} data-tutorial-target={allowedTutorialAction === "push" ? tutorialStep ?? undefined : undefined}>
            <HandGrabbing weight="fill" /><span>Shove</span><small className="action-resource">Reusable</small><kbd>S</kbd>
          </button>
        ) : null}
        <button type="button" className={clsx("game-action-button action-ability", actionMode === "ability" && "is-active", allowedTutorialAction === "ability" && "is-tutorial-focus")} onClick={onAbility} disabled={disabled || !canSignature || (tutorialRestricted && allowedTutorialAction !== "ability")} aria-keyshortcuts="3" data-tutorial-target={allowedTutorialAction === "ability" ? tutorialStep ?? undefined : undefined}>
          {selected?.role === "guardian" ? <Shield weight="fill" /> : selected?.role === "pusher" ? <HandFist weight="fill" /> : <Target weight="fill" />}
          <span>{selected?.signatureName ?? "Ability"}</span>{signatureStatus ? <small className="action-resource">{signatureStatus}</small> : null}<kbd>3</kbd>
        </button>
        <button type="button" className={clsx("game-action-button action-wait", allowedTutorialAction === "wait" && "is-tutorial-focus")} onClick={onWait} disabled={disabled || !canAct || (tutorialRestricted && allowedTutorialAction !== "wait")} data-tutorial-target={allowedTutorialAction === "wait" ? tutorialStep ?? undefined : undefined}>
          <Hourglass weight="fill" /><span>Wait</span><kbd>W</kbd>
        </button>
        <button type="button" className={clsx("game-end-turn", allowedTutorialAction === "end-turn" && "is-tutorial-focus")} onClick={onEndTurn} disabled={disabled || (tutorialRestricted && allowedTutorialAction !== "end-turn")} aria-keyshortcuts="Space" data-tutorial-target={allowedTutorialAction === "end-turn" ? tutorialStep ?? undefined : undefined}>
          <span>End turn</span><small>{remainingCount > 0 ? `${remainingCount} ${remainingCount === 1 ? "hero" : "heroes"} ready` : "Resolve enemies"}</small><ArrowFatRight weight="fill" />
        </button>
      </nav>
    </div>
  );
}

function MobileNotice() {
  return (
    <main className="game-mobile-notice">
      <div className="mobile-game-mark"><Shield weight="fill" /></div>
      <h1>Battlefield needs more room</h1>
      <p>Use a 1024px-wide screen or rotate a large tablet to keep every move and enemy intent readable.</p>
      <Link href="/" className="mobile-title-link">Back to title</Link>
    </main>
  );
}

export function BattleClient({ requestedMissionId }: { requestedMissionId?: string }) {
  const router = useRouter();
  const initialized = useRef(false);
  const tutorialStarted = useRef<string | null>(null);
  const virtualTime = useRef(0);
  const game = useGameStore((state) => state.game);
  const enemyPlan = useGameStore((state) => state.enemyPlan);
  const hydrated = useGameStore((state) => state.hydrated);
  const selectedUnitId = useGameStore((state) => state.selectedUnitId);
  const actionMode = useGameStore((state) => state.actionMode);
  const lastMove = useGameStore((state) => state.lastMove);
  const lastResult = useGameStore((state) => state.lastResult);
  const isResolving = useGameStore((state) => state.isResolving);
  const isAnimating = useGameStore((state) => state.isAnimating);
  const combatCue = useGameStore((state) => state.combatCue);
  const playbackIndex = useGameStore((state) => state.playbackIndex);
  const queueRemaining = useGameStore((state) => state.queueRemaining);
  const turnBanner = useGameStore((state) => state.turnBanner);
  const effects = useGameStore((state) => state.effects);
  const lastEvents = useGameStore((state) => state.lastEvents);
  const log = useGameStore((state) => state.log);
  const trainingCompleted = useGameStore((state) => state.settings.trainingCompleted);
  const startMission = useGameStore((state) => state.startMission);
  const cancelSession = useGameStore((state) => state.cancelSession);
  const ensureIdentity = useGameStore((state) => state.ensureIdentity);
  const selectUnit = useGameStore((state) => state.selectUnit);
  const setActionMode = useGameStore((state) => state.setActionMode);
  const moveSelected = useGameStore((state) => state.moveSelected);
  const attackSelected = useGameStore((state) => state.attackSelected);
  const shieldSelected = useGameStore((state) => state.shieldSelected);
  const pushSelected = useGameStore((state) => state.pushSelected);
  const waitSelected = useGameStore((state) => state.waitSelected);
  const undoMove = useGameStore((state) => state.undoMove);
  const endTurn = useGameStore((state) => state.endTurn);
  const clearEffects = useGameStore((state) => state.clearEffects);
  const completeTrainingLesson = useGameStore((state) => state.completeTrainingLesson);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [movePreview, setMovePreview] = useState<Position | null>(null);
  const [introVisible, setIntroVisible] = useState(true);
  const [playerSpritesReady, setPlayerSpritesReady] = useState(playerSpriteSheetsAreReady);
  const [tutorialStep, setTutorialStep] = useState<BattleTutorialStep>(null);
  const [endTurnConfirmationOpen, setEndTurnConfirmationOpen] = useState(false);
  const missionId = game?.missionId;
  const isTrainingMission = Boolean(missionId && isTrainingMissionId(missionId));
  const introDuration = isTrainingMission ? 0 : 2050;

  const selected = game?.units.find((unit) => unit.id === selectedUnitId && unit.hp > 0);
  const remainingUnits = useMemo(() => game?.units.filter((unit) => unit.hp > 0 && !unit.hasActed) ?? [], [game]);
  const controlsLocked = !playerSpritesReady || isResolving || isAnimating || (introVisible && !isTrainingMission) || endTurnConfirmationOpen;
  const moves = useMemo(() => game && selected && actionMode === "move" ? getValidMoves(game, selected.id) : [], [actionMode, game, selected]);
  const attackTargets = useMemo(() => {
    if (!game || !selected) return [];
    if (actionMode === "attack") return getAttackableTargets(game, selected.id);
    if (actionMode === "ability" && selected.role === "sniper") return getAttackableTargets(game, selected.id, { deadeye: true });
    return [];
  }, [actionMode, game, selected]);
  const pushTargets = useMemo(() => game && selected && selected.role === "pusher" && (actionMode === "push" || actionMode === "ability") ? getPushTargets(game, selected.id) : [], [actionMode, game, selected]);
  const highlights = useMemo<HighlightState>(() => ({ moves, attackIds: new Set(attackTargets.map((enemy) => enemy.id)), pushTargets }), [attackTargets, moves, pushTargets]);
  const movePreviewPath = useMemo(() => game && selected && movePreview && actionMode === "move"
    ? getMovementPath(game, selected.id, movePreview)
    : null, [actionMode, game, movePreview, selected]);

  useEffect(() => {
    if (actionMode !== "move" || controlsLocked || !selected) setMovePreview(null);
  }, [actionMode, controlsLocked, selected]);

  useEffect(() => {
    let mounted = true;
    void preloadPlayerSpriteSheets().then(() => {
      if (mounted) setPlayerSpritesReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || initialized.current) return;
    initialized.current = true;
    ensureIdentity();
    const missionToStart = requestedMissionId && (requestedMissionId === PROTECT_THE_VAULT.id || isTrainingMissionId(requestedMissionId))
      ? requestedMissionId
      : PROTECT_THE_VAULT.id;
    startMission(missionToStart);
  }, [ensureIdentity, hydrated, requestedMissionId, startMission]);

  useEffect(() => {
    activeBattleClients += 1;
    return () => {
      activeBattleClients = Math.max(0, activeBattleClients - 1);
      window.queueMicrotask(() => {
        if (activeBattleClients === 0) cancelSession();
      });
    };
  }, [cancelSession]);

  useEffect(() => {
    if (!hydrated || !missionId) return;
    if (isTrainingMissionId(missionId)) {
      setIntroVisible(false);
      return;
    }
    setIntroVisible(true);
    const timeout = window.setTimeout(() => setIntroVisible(false), introDuration);
    return () => window.clearTimeout(timeout);
  }, [hydrated, introDuration, missionId]);

  useEffect(() => {
    if (!hydrated || !playerSpritesReady || introVisible || !game || !isTrainingMissionId(game.missionId) || tutorialStarted.current === game.missionId || window.innerWidth < 1024) return;
    tutorialStarted.current = game.missionId;
    setTutorialStep(initialTutorialStep(game.missionId));
  }, [game, hydrated, introVisible, playerSpritesReady]);

  useEffect(() => {
    if (!game || !tutorialStep) return;
    const unitMovedTo = (unitId: string, target: string) => lastEvents.some((event) => event.type === "unit-moved" && event.unitId === unitId && coordinate(event.to) === target);

    if (tutorialStep === "basics-select-guardian" && selectedUnitId === "guardian") {
      setTutorialStep("basics-move-guardian");
    } else if (tutorialStep === "basics-move-guardian" && unitMovedTo("guardian", "D2")) {
      setTutorialStep("basics-choose-attack");
    } else if (tutorialStep === "basics-choose-attack" && actionMode === "attack") {
      setTutorialStep("basics-attack-rugger");
    } else if (tutorialStep === "basics-attack-rugger" && lastEvents.some((event) => event.type === "unit-attacked" && event.enemyId === "rugger-training")) {
      setTutorialStep("basics-read-intent");
    } else if (tutorialStep === "basics-end-turn" && isResolving) {
      setTutorialStep("basics-watch-enemy");
    } else if (tutorialStep === "basics-watch-enemy" && !isResolving && game.phase === "victory" && turnBanner === null) {
      setTutorialStep("basics-hit-explained");
    } else if (tutorialStep === "squad-select-guardian" && selectedUnitId === "guardian") {
      setTutorialStep("squad-move-guardian");
    } else if (tutorialStep === "squad-move-guardian" && unitMovedTo("guardian", "D3")) {
      setTutorialStep("squad-shield-wall");
    } else if (tutorialStep === "squad-shield-wall" && lastEvents.some((event) => event.type === "shield-applied")) {
      setTutorialStep("squad-select-sniper");
    } else if (tutorialStep === "squad-select-sniper" && selectedUnitId === "sniper") {
      setTutorialStep("squad-deadeye");
    } else if (tutorialStep === "squad-deadeye" && actionMode === "ability") {
      setTutorialStep("squad-target-drainer");
    } else if (tutorialStep === "squad-target-drainer" && lastEvents.some((event) => event.type === "unit-attacked" && event.enemyId === "drainer-training" && event.deadeye)) {
      setTutorialStep("squad-end-turn");
    } else if (tutorialStep === "squad-end-turn" && isResolving) {
      setTutorialStep("squad-watch-shield");
    } else if (tutorialStep === "squad-watch-shield" && !isResolving && game.phase === "victory" && turnBanner === null) {
      setTutorialStep("squad-shield-explained");
    } else if (tutorialStep === "push-select-pusher" && selectedUnitId === "pusher") {
      setTutorialStep("push-move-to-block");
    } else if (tutorialStep === "push-move-to-block" && unitMovedTo("pusher", "E6")) {
      setTutorialStep("push-choose-shove-block");
    } else if (tutorialStep === "push-choose-shove-block" && actionMode === "push") {
      setTutorialStep("push-data-block");
    } else if (tutorialStep === "push-data-block" && lastEvents.some((event) => event.type === "target-pushed" && event.targetId === "data-block")) {
      setTutorialStep("push-end-turn-one");
    } else if (tutorialStep === "push-end-turn-one" && !isResolving && game.turn === 2 && turnBanner === null) {
      setTutorialStep("push-breach-warning");
    } else if (tutorialStep === "push-select-collision" && selectedUnitId === "pusher") {
      setTutorialStep("push-move-to-collision");
    } else if (tutorialStep === "push-move-to-collision" && unitMovedTo("pusher", "E5")) {
      setTutorialStep("push-choose-shove-enemy");
    } else if (tutorialStep === "push-choose-shove-enemy" && actionMode === "push") {
      setTutorialStep("push-collision");
    } else if (tutorialStep === "push-collision" && lastEvents.some((event) => event.type === "collision" && event.targetId === "rugger-dummy")) {
      setTutorialStep("push-end-turn-two");
    } else if (tutorialStep === "push-end-turn-two" && !isResolving && game.turn === 3 && turnBanner === null) {
      setTutorialStep("push-whale-arrives");
    } else if (tutorialStep === "push-select-for-whale" && selectedUnitId === "pusher") {
      setTutorialStep("push-wait");
    } else if (tutorialStep === "push-wait" && lastEvents.some((event) => event.type === "unit-waited" && event.unitId === "pusher")) {
      setTutorialStep("push-end-turn-three");
    } else if (tutorialStep === "push-end-turn-three" && isResolving) {
      setTutorialStep("push-watch-charge");
    } else if (tutorialStep === "push-watch-charge" && !isResolving && game.turn === 4 && game.enemies.some((enemy) => enemy.id === "whale-training" && enemy.whaleState === "charging") && turnBanner === null) {
      setTutorialStep("push-locked-cone");
    } else if (tutorialStep === "push-select-charging" && selectedUnitId === "pusher") {
      setTutorialStep("push-move-for-whale");
    } else if (tutorialStep === "push-move-for-whale" && unitMovedTo("pusher", "F5")) {
      setTutorialStep("push-choose-shove-whale");
    } else if (tutorialStep === "push-choose-shove-whale" && actionMode === "push") {
      setTutorialStep("push-cancel-whale");
    } else if (tutorialStep === "push-cancel-whale" && lastEvents.some((event) => event.type === "whale-charge-cancelled" && event.enemyId === "whale-training")) {
      completeTrainingLesson(3);
      setTutorialStep("training-complete");
    }
  }, [actionMode, completeTrainingLesson, game, isResolving, lastEvents, selectedUnitId, turnBanner, tutorialStep]);

  useEffect(() => {
    if (effects.length === 0 || combatCue) return;
    const timeout = window.setTimeout(clearEffects, 680);
    return () => window.clearTimeout(timeout);
  }, [clearEffects, combatCue, effects]);

  useEffect(() => {
    if (!game || isTrainingMissionId(game.missionId) || !lastResult || (game.phase !== "victory" && game.phase !== "defeat")) return;
    const timeout = window.setTimeout(() => router.replace("/results"), 950);
    return () => window.clearTimeout(timeout);
  }, [game, lastResult, router]);

  useEffect(() => {
    if (!game || !inspectedId) return;
    const exists = game.enemies.some((enemy) => enemy.id === inspectedId)
      || game.objects.some((object) => object.id === inspectedId)
      || game.units.some((unit) => unit.id === inspectedId)
      || game.vault.id === inspectedId;
    if (!exists) setInspectedId(null);
  }, [game, inspectedId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !game) return;
    window.render_game_to_text = () => JSON.stringify({
      coordinateSystem: "A1 is top-left. Columns A-G increase right; rows 1-7 increase down.",
      screen: !playerSpritesReady ? "loading-squad" : introVisible && !isTrainingMission ? "mission-intro" : endTurnConfirmationOpen ? "end-turn-confirmation" : "battle",
      missionId: game.missionId,
      phase: game.phase,
      turn: game.turn,
      selectedUnitId,
      inspectedId,
      actionMode,
      resolving: isResolving,
      animating: isAnimating,
      playerSpriteSheetsReady: playerSpritesReady,
      motionPreference: {
        systemReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        semanticGameplayAnimations: true,
      },
      combatPlayback: combatCue ? {
        index: playbackIndex,
        stage: combatCue.stage,
        sourceId: combatCue.sourceId ?? null,
        targetId: combatCue.targetId ?? null,
        amount: combatCue.amount ?? 0,
        absorbed: combatCue.absorbed ?? 0,
        fatal: combatCue.fatal ?? false,
        variant: combatCue.variant ?? "generic",
        statusKind: combatCue.statusKind ?? null,
        from: combatCue.from ? coordinate(combatCue.from) : null,
        to: combatCue.to ? coordinate(combatCue.to) : null,
        area: combatCue.area?.map(coordinate) ?? [],
        hits: combatCue.hits ?? [],
        queueRemaining,
      } : null,
      playerAnimations: Object.fromEntries(game.units.map((unit) => {
        const spriteState = battleSpriteState(effects, combatCue, unit.id, unit.role);
        return [unit.id, {
          source: "spritecook-pixel",
          role: unit.role,
          motion: spriteState.motion,
          effectId: spriteState.effectId,
          frames: spriteState.motion === "death" ? 12 : 8,
        }];
      })),
      enemyAnimations: Object.fromEntries(game.enemies.map((enemy) => {
        const spriteState = enemyBattleSpriteState(effects, combatCue, enemy);
        return [enemy.id, {
          source: "authored-pixel-motion",
          kind: enemy.kind,
          motion: spriteState.motion,
          effectId: spriteState.effectId,
          whaleState: enemy.whaleState ?? null,
        }];
      })),
      sniperAnimation: (() => {
        const sniper = game.units.find((unit) => unit.role === "sniper");
        if (!sniper) return null;
        const spriteState = battleSpriteState(effects, combatCue, sniper.id, sniper.role);
        return {
          source: "spritecook-pixel",
          motion: spriteState.motion,
          effectId: spriteState.effectId,
          frames: spriteState.motion === "death" ? 12 : 8,
        };
      })(),
      movePreview: movePreview && movePreviewPath ? {
        from: coordinate(movePreviewPath[0]),
        to: coordinate(movePreview),
        path: movePreviewPath.map(coordinate),
      } : null,
      highlights: {
        moves: moves.map(coordinate),
        attacks: attackTargets.map((target) => ({ id: target.id, at: coordinate(target.position) })),
        pushes: pushTargets.map((target) => ({ id: target.id, kind: target.kind, at: coordinate(target.position), canMove: target.canMove })),
      },
      vault: { hp: game.vault.hp, maxHp: game.vault.maxHp, at: coordinate(game.vault.position) },
      units: game.units.map((unit) => ({
        id: unit.id,
        role: unit.role,
        at: coordinate(unit.position),
        hp: unit.hp,
        hasMoved: unit.hasMoved,
        hasActed: unit.hasActed,
        activationState: unitActivationState(unit),
        remaining: { move: unit.hp > 0 && !unit.hasMoved && !unit.hasActed, action: unit.hp > 0 && !unit.hasActed },
        signature: {
          name: unit.signatureName,
          remaining: unit.signatureAvailable ? 1 : 0,
          max: 1,
          status: !unit.signatureAvailable ? "spent" : unit.role === "sniper" && unit.hasMoved ? "blocked" : "ready",
          blockedReason: unit.role === "sniper" && unit.hasMoved && unit.signatureAvailable ? "Requires no prior movement" : null,
        },
      })),
      enemies: game.enemies.map((enemy) => ({ id: enemy.id, kind: enemy.kind, at: coordinate(enemy.position), hp: enemy.hp, whaleState: enemy.whaleState })),
      objects: game.objects.map((object) => ({ id: object.id, at: coordinate(object.position) })),
      exactEnemyPlan: enemyPlan?.intents.map((intent) => ({ order: intent.order, enemyId: intent.enemyId, action: intent.action, path: intent.path.map(coordinate), destination: coordinate(intent.destination), target: intent.target?.id ?? null, targets: intent.targets.map((target) => ({ id: target.id, at: coordinate(target.position), expectedDamage: target.expectedDamage })), area: intent.area.map(coordinate), damage: intent.damage, special: intent.special })) ?? [],
      tutorial: {
        running: tutorialStep !== null,
        step: tutorialStep,
        lessonsCompleted: trainingCompleted,
        allowedCoordinate: tutorialCoordinate(tutorialStep),
        allowedAction: tutorialAction(tutorialStep),
      },
      turnReadiness: {
        readyUnitIds: remainingUnits.map((unit) => unit.id),
        untouchedUnitIds: remainingUnits.filter((unit) => !unit.hasMoved).map((unit) => unit.id),
        movedNeedsActionUnitIds: remainingUnits.filter((unit) => unit.hasMoved).map((unit) => unit.id),
        doneUnitIds: game.units.filter((unit) => unit.hp > 0 && unit.hasActed).map((unit) => unit.id),
        count: remainingUnits.length,
        confirmationOpen: endTurnConfirmationOpen,
      },
    });
    window.advanceTime = (milliseconds) => {
      virtualTime.current += milliseconds;
      if (virtualTime.current >= introDuration) setIntroVisible(false);
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [actionMode, attackTargets, combatCue, effects, endTurnConfirmationOpen, enemyPlan, game, inspectedId, introDuration, introVisible, isAnimating, isResolving, isTrainingMission, movePreview, movePreviewPath, moves, playbackIndex, playerSpritesReady, pushTargets, queueRemaining, remainingUnits, selectedUnitId, trainingCompleted, tutorialStep]);

  const continueTutorial = useCallback(() => {
    if (tutorialStep === "basics-intro") setTutorialStep("basics-select-guardian");
    else if (tutorialStep === "basics-read-intent") setTutorialStep("basics-end-turn");
    else if (tutorialStep === "basics-hit-explained") {
      completeTrainingLesson(1);
      setTutorialStep(null);
      setInspectedId(null);
      router.push("/training");
    }
    else if (tutorialStep === "basics-complete") {
      setTutorialStep(null);
      setInspectedId(null);
      router.push("/training");
    } else if (tutorialStep === "squad-intro") setTutorialStep("squad-select-guardian");
    else if (tutorialStep === "squad-shield-explained") {
      completeTrainingLesson(2);
      setTutorialStep(null);
      setInspectedId(null);
      router.push("/training");
    }
    else if (tutorialStep === "squad-complete") {
      setTutorialStep(null);
      setInspectedId(null);
      router.push("/training");
    } else if (tutorialStep === "push-intro") setTutorialStep("push-select-pusher");
    else if (tutorialStep === "push-breach-warning") setTutorialStep("push-select-collision");
    else if (tutorialStep === "push-whale-arrives") setTutorialStep("push-select-for-whale");
    else if (tutorialStep === "push-locked-cone") setTutorialStep("push-select-charging");
    else if (tutorialStep === "training-complete") {
      setTutorialStep(null);
      setInspectedId(null);
      router.push("/training");
    }
  }, [completeTrainingLesson, router, tutorialStep]);

  const skipTutorial = useCallback(() => {
    setTutorialStep(null);
    setInspectedId(null);
    router.push("/training");
  }, [router]);

  const tutorialAllowsTile = useCallback((position: Position) => {
    if (!tutorialRestrictsInput(tutorialStep)) return true;
    return coordinate(position) === tutorialCoordinate(tutorialStep);
  }, [tutorialStep]);

  const activateAbility = useCallback(() => {
    if (!selected || controlsLocked || (tutorialRestrictsInput(tutorialStep) && tutorialAction(tutorialStep) !== "ability")) return;
    if (selected.role === "guardian") shieldSelected();
    else setActionMode("ability");
  }, [controlsLocked, selected, setActionMode, shieldSelected, tutorialStep]);

  const handleTile = useCallback((position: Position) => {
    if (!game || controlsLocked || game.phase !== "player") return;
    if (!tutorialAllowsTile(position)) return;
    const unit = game.units.find((candidate) => candidate.hp > 0 && samePosition(candidate.position, position));
    const enemy = game.enemies.find((candidate) => candidate.hp > 0 && samePosition(candidate.position, position));
    const object = game.objects.find((candidate) => samePosition(candidate.position, position));
    if (unit) {
      setInspectedId(null);
      selectUnit(unit.id);
      return;
    }
    if (actionMode === "move" && moves.some((candidate) => samePosition(candidate, position))) {
      moveSelected(position);
      return;
    }
    if (enemy && (actionMode === "attack" || (actionMode === "ability" && selected?.role === "sniper")) && highlights.attackIds.has(enemy.id)) {
      setInspectedId(enemy.id);
      attackSelected(enemy.id, actionMode === "ability");
      return;
    }
    const pushTarget = [...pushTargets].find((target) => target.id === (enemy?.id ?? object?.id));
    if (pushTarget && selected?.role === "pusher" && (actionMode === "push" || actionMode === "ability")) {
      setInspectedId(pushTarget.id);
      pushSelected(pushTarget.id, actionMode === "ability");
      return;
    }
    setInspectedId(enemy?.id ?? object?.id ?? (samePosition(game.vault.position, position) ? game.vault.id : null));
  }, [actionMode, attackSelected, controlsLocked, game, highlights.attackIds, moveSelected, moves, pushSelected, pushTargets, selectUnit, selected, tutorialAllowsTile]);

  const handleActionMode = useCallback((mode: ActionMode) => {
    if (tutorialRestrictsInput(tutorialStep)) {
      const allowed = tutorialAction(tutorialStep);
      if ((mode === "attack" && allowed !== "attack") || (mode === "push" && allowed !== "push")) return;
      if (mode !== "attack" && mode !== "push") return;
    }
    setActionMode(mode);
  }, [setActionMode, tutorialStep]);

  const requestEndTurn = useCallback(() => {
    if (!game || isResolving || isAnimating || introVisible || game.phase !== "player") return;
    if (isTrainingMissionId(game.missionId) || remainingUnits.length === 0) {
      endTurn();
      return;
    }
    setEndTurnConfirmationOpen(true);
  }, [endTurn, game, introVisible, isAnimating, isResolving, remainingUnits.length]);

  const reviewRemainingUnits = useCallback(() => {
    const nextUnit = remainingUnits[0];
    setEndTurnConfirmationOpen(false);
    if (!nextUnit) return;
    setInspectedId(null);
    selectUnit(nextUnit.id);
  }, [remainingUnits, selectUnit]);

  const confirmEndTurn = useCallback(() => {
    setEndTurnConfirmationOpen(false);
    endTurn();
  }, [endTurn]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))) return;
      const key = event.key.toLowerCase();
      if (key === "f") {
        event.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen().catch(() => undefined);
        return;
      }
      if (key === "escape") {
        if (endTurnConfirmationOpen) {
          event.preventDefault();
          setEndTurnConfirmationOpen(false);
          return;
        }
        if (tutorialRestrictsInput(tutorialStep)) return;
        setMovePreview(null);
        setActionMode(null);
        return;
      }
      if ((key === " " || key === "enter") && target instanceof HTMLButtonElement) return;
      if (event.repeat || controlsLocked || !game || game.phase !== "player") return;
      if (tutorialRestrictsInput(tutorialStep)) {
        const allowed = tutorialAction(tutorialStep);
        if (allowed === "attack" && key === "2" && selected && !selected.hasActed) setActionMode("attack");
        else if (allowed === "ability" && key === "3") activateAbility();
        else if (allowed === "push" && key === "s" && selected?.role === "pusher" && !selected.hasActed) setActionMode("push");
        else if (allowed === "wait" && key === "w" && selected && !selected.hasActed) waitSelected();
        else if (allowed === "end-turn" && key === " ") {
          event.preventDefault();
          requestEndTurn();
        }
        return;
      }
      if (key === " ") {
        event.preventDefault();
        requestEndTurn();
      } else if (key === "1" && selected && !selected.hasMoved && !selected.hasActed) setActionMode("move");
      else if (key === "2" && selected && !selected.hasActed) setActionMode("attack");
      else if (key === "3" && selected && !selected.hasActed && selected.signatureAvailable && (selected.role !== "sniper" || !selected.hasMoved)) activateAbility();
      else if (key === "s" && selected?.role === "pusher" && !selected.hasActed) setActionMode("push");
      else if (key === "w" && selected && !selected.hasActed) waitSelected();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activateAbility, controlsLocked, endTurnConfirmationOpen, game, requestEndTurn, selected, setActionMode, tutorialStep, waitSelected]);

  return (
    <div className="game-battle-route">
      <MobileNotice />
      <main className={clsx("game-battle-stage", tutorialStep && "has-tutorial")} data-player-sprites-ready={playerSpritesReady}>
        {!game ? <div className="game-loading"><Hourglass weight="fill" /> Loading battle…</div> : (
          <>
            <GameHud game={game} />
            <Link href="/" className="battle-title-button" aria-label="Game menu — return to title screen" onClick={cancelSession}><List weight="bold" /></Link>
            <section className="game-board-zone" aria-label="Battlefield">
              <Board game={game} highlights={highlights} selectedUnitId={selectedUnitId} actionMode={actionMode} inspectedId={inspectedId} tutorialStep={tutorialStep} movePreview={movePreview} movePreviewPath={movePreviewPath} disabled={controlsLocked} onTile={handleTile} onPreviewMove={setMovePreview} />
            </section>
            <CombatCallout game={game} cue={combatCue} />
            <SelectedInspector game={game} selectedUnitId={selectedUnitId} inspectedId={inspectedId} />
            {!tutorialStep ? <SquadReadiness units={game.units} selectedUnitId={selectedUnitId} disabled={controlsLocked || game.phase !== "player"} onSelect={(unitId) => { setInspectedId(null); selectUnit(unitId); }} /> : null}
            <ActionBar
              selected={selected}
              actionMode={actionMode}
              movePreview={movePreview}
              movePreviewDistance={Math.max(0, (movePreviewPath?.length ?? 1) - 1)}
              remainingCount={remainingUnits.length}
              hasUndo={Boolean(lastMove)}
              tutorialStep={tutorialStep}
              disabled={controlsLocked || game.phase !== "player"}
              log={log}
              onMode={handleActionMode}
              onAbility={activateAbility}
              onWait={waitSelected}
              onUndo={undoMove}
              onEndTurn={requestEndTurn}
            />
          </>
        )}
        {introVisible && game && !isTrainingMissionId(game.missionId) ? <MissionIntro game={game} /> : null}
        {game && !playerSpritesReady && (!introVisible || isTrainingMission) ? (
          <div className="game-sprite-loading" role="status" aria-live="polite">
            <Hourglass weight="fill" /> Preparing squad animations
          </div>
        ) : null}
        {turnBanner && !introVisible && (!tutorialStep || ["basics-watch-enemy", "squad-watch-shield", "push-watch-charge"].includes(tutorialStep)) ? (
          <div className={clsx("game-turn-banner", tutorialStep && "is-tutorial-watch")} role="status">{turnBanner}</div>
        ) : null}
        {isResolving && !introVisible && !combatCue ? <div className="enemy-phase-label"><Hourglass weight="fill" /> Enemy phase</div> : null}
        {tutorialStep && !introVisible && !isAnimating ? <BattleTutorial key={tutorialStep} step={tutorialStep} onContinue={continueTutorial} onSkip={skipTutorial} /> : null}
        {endTurnConfirmationOpen && game ? <EndTurnConfirmation units={remainingUnits} onReview={reviewRemainingUnits} onConfirm={confirmEndTurn} onCancel={() => setEndTurnConfirmationOpen(false)} /> : null}
      </main>
    </div>
  );
}
