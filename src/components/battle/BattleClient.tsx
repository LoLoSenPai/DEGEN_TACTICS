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
  TRAINING_MOMENTUM,
  TRAINING_SQUAD,
  getMissionDefinition,
  getAttackableTargets,
  getMovementPath,
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
  initialTutorialStep,
  trainingMissionForProgress,
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
  } else if (cue.stage === "status" && cue.variant === "drain") {
    kicker = "LIFE DRAIN";
    message = `${source} recovers ${cue.amount ?? 1} HP`;
  } else if (cue.stage === "impact") {
    kicker = cue.absorbed ? "SHIELD HIT" : "IMPACT";
    message = cue.absorbed
      ? `${target} blocks ${cue.absorbed}${cue.amount ? ` · takes ${cue.amount}` : " · no HP lost"}`
      : `${target} takes ${cue.amount ?? 0} damage`;
  } else if (cue.stage === "death") {
    kicker = game.units.some((unit) => unit.id === cue.targetId) ? "HERO KO" : "ENEMY DOWN";
    message = `${target} is down`;
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
    <div key={cue.id} className={clsx("combat-callout", `is-${cue.stage}`, cue.variant && `variant-${cue.variant}`, cue.absorbed && "is-blocked", cue.fatal && "is-fatal")} role="status" aria-live="assertive">
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
  let signature: string | null = null;

  if (readout.category === "unit") {
    kind = readout.value.role;
    hp = readout.value.hp;
    maxHp = readout.value.maxHp;
    move = readout.value.moveRange;
    damage = readout.value.attackDamage;
    subtitle = readout.value.hasActed ? "Activation complete" : readout.value.hasMoved ? "Action ready" : "Ready";
    signature = `${readout.value.signatureName} · ${readout.value.signatureAvailable ? "Ready" : "Spent"}`;
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
      {signature ? <div className="inspector-signature"><Shield weight="fill" /><span>{signature}</span></div> : null}
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
  if (unit) details.push(`${unit.name}, ally, ${unit.hp} of ${unit.maxHp} health`);
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
    const nextRects = new Map<string, DOMRect>();
    root.querySelectorAll<HTMLElement>("[data-game-piece]").forEach((element) => {
      const id = element.dataset.gamePiece;
      if (!id) return;
      const rect = element.getBoundingClientRect();
      nextRects.set(id, rect);
      const previous = previousRects.current.get(id);
      if (previous && (previous.left !== rect.left || previous.top !== rect.top)) {
        element.animate([
          { transform: `translate(${previous.left - rect.left}px, ${previous.top - rect.top}px) scale(.96)` },
          { transform: "translate(0, 0) scale(1)" },
        ], { duration: 230, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
    previousRects.current = nextRects;
  }, [entityFingerprint]);

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
          const isHit = Boolean(damageEffect || shieldEffect?.kind === "shield-hit");
          const pieceCombatClass = clsx(attackEffect && "is-attacking", isHit && "is-hit", shieldEffect && "has-shield-vfx", shieldEffect?.kind === "shield-hit" && "is-shield-hit", deathEffect && "is-dying", healEffect && "is-healing");
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
                <span className={clsx("game-piece ally-piece", `piece-${unit.role}`, unit.id === selectedUnitId && "is-active", pieceCombatClass)} style={pieceCombatStyle} data-game-piece={unit.id}>
                  <span className="piece-base" />
                  <SpriteArt kind={unit.role} name={unit.name} className="board-sprite" priority />
                  <span className="piece-health"><i style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }} /></span>
                  {unit.shield ? <><span className="piece-shield-aura" aria-hidden="true" /><span className="piece-shield"><Shield weight="fill" />{unit.shield.value}</span></> : null}
                </span>
              ) : null}
              {enemy ? (
                <span className={clsx("game-piece enemy-piece", `piece-${enemy.kind}`, enemy.kind === "whale" && "is-whale", pieceCombatClass)} style={pieceCombatStyle} data-game-piece={enemy.id}>
                  <span className="piece-base" />
                  <SpriteArt kind={enemy.kind} name={enemy.name} className="board-sprite" priority />
                  <span className="piece-health"><i style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} /></span>
                  {order ? <span className="enemy-order">{order}</span> : null}
                </span>
              ) : null}
              {object ? <span className="game-piece object-piece" data-game-piece={object.id}><span className="piece-base" /><SpriteArt kind="data-block" name={object.name} className="board-sprite" /></span> : null}
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
              {deathEffect ? <span key={`ko-${deathEffect.id}`} className="game-ko-popup">KO</span> : null}
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
            <HandGrabbing weight="fill" /><span>Shove</span><kbd>S</kbd>
          </button>
        ) : null}
        <button type="button" className={clsx("game-action-button action-ability", actionMode === "ability" && "is-active", allowedTutorialAction === "ability" && "is-tutorial-focus")} onClick={onAbility} disabled={disabled || !canSignature || (tutorialRestricted && allowedTutorialAction !== "ability")} aria-keyshortcuts="3" data-tutorial-target={allowedTutorialAction === "ability" ? tutorialStep ?? undefined : undefined}>
          {selected?.role === "guardian" ? <Shield weight="fill" /> : selected?.role === "pusher" ? <HandFist weight="fill" /> : <Target weight="fill" />}
          <span>{selected?.signatureName ?? "Ability"}</span><kbd>3</kbd>
        </button>
        <button type="button" className={clsx("game-action-button action-wait", allowedTutorialAction === "wait" && "is-tutorial-focus")} onClick={onWait} disabled={disabled || !canAct || (tutorialRestricted && allowedTutorialAction !== "wait")} data-tutorial-target={allowedTutorialAction === "wait" ? tutorialStep ?? undefined : undefined}>
          <Hourglass weight="fill" /><span>Wait</span><kbd>W</kbd>
        </button>
        <button type="button" className={clsx("game-end-turn", allowedTutorialAction === "end-turn" && "is-tutorial-focus")} onClick={onEndTurn} disabled={disabled || (tutorialRestricted && allowedTutorialAction !== "end-turn")} aria-keyshortcuts="Space" data-tutorial-target={allowedTutorialAction === "end-turn" ? tutorialStep ?? undefined : undefined}>
          <span>End turn</span><ArrowFatRight weight="fill" />
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

export function BattleClient() {
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
  const setTutorialComplete = useGameStore((state) => state.setTutorialComplete);
  const completeTrainingLesson = useGameStore((state) => state.completeTrainingLesson);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [movePreview, setMovePreview] = useState<Position | null>(null);
  const [introVisible, setIntroVisible] = useState(true);
  const [tutorialStep, setTutorialStep] = useState<BattleTutorialStep>(null);
  const missionId = game?.missionId;

  const selected = game?.units.find((unit) => unit.id === selectedUnitId && unit.hp > 0);
  const controlsLocked = isResolving || isAnimating || introVisible;
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
    if (!hydrated || initialized.current) return;
    initialized.current = true;
    ensureIdentity();
    startMission(trainingMissionForProgress(trainingCompleted) ?? PROTECT_THE_VAULT.id);
  }, [ensureIdentity, hydrated, startMission, trainingCompleted]);

  useEffect(() => {
    if (!hydrated || !missionId) return;
    setIntroVisible(true);
    const timeout = window.setTimeout(() => setIntroVisible(false), 2050);
    return () => window.clearTimeout(timeout);
  }, [hydrated, missionId]);

  useEffect(() => {
    if (!hydrated || introVisible || !game || !isTrainingMissionId(game.missionId) || tutorialStarted.current === game.missionId || window.innerWidth < 1024) return;
    tutorialStarted.current = game.missionId;
    setTutorialStep(initialTutorialStep(game.missionId));
  }, [game, hydrated, introVisible]);

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
    if (effects.length === 0) return;
    const timeout = window.setTimeout(clearEffects, 680);
    return () => window.clearTimeout(timeout);
  }, [clearEffects, effects]);

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
      screen: introVisible ? "mission-intro" : "battle",
      missionId: game.missionId,
      phase: game.phase,
      turn: game.turn,
      selectedUnitId,
      inspectedId,
      actionMode,
      resolving: isResolving,
      animating: isAnimating,
      combatPlayback: combatCue ? {
        index: playbackIndex,
        stage: combatCue.stage,
        sourceId: combatCue.sourceId ?? null,
        targetId: combatCue.targetId ?? null,
        amount: combatCue.amount ?? 0,
        absorbed: combatCue.absorbed ?? 0,
        fatal: combatCue.fatal ?? false,
        variant: combatCue.variant ?? "generic",
        from: combatCue.from ? coordinate(combatCue.from) : null,
        to: combatCue.to ? coordinate(combatCue.to) : null,
        area: combatCue.area?.map(coordinate) ?? [],
        hits: combatCue.hits ?? [],
        queueRemaining,
      } : null,
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
      units: game.units.map((unit) => ({ id: unit.id, role: unit.role, at: coordinate(unit.position), hp: unit.hp, hasMoved: unit.hasMoved, hasActed: unit.hasActed, signatureAvailable: unit.signatureAvailable })),
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
    });
    window.advanceTime = (milliseconds) => {
      virtualTime.current += milliseconds;
      if (virtualTime.current >= 2000) setIntroVisible(false);
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [actionMode, attackTargets, combatCue, enemyPlan, game, inspectedId, introVisible, isAnimating, isResolving, movePreview, movePreviewPath, moves, playbackIndex, pushTargets, queueRemaining, selectedUnitId, trainingCompleted, tutorialStep]);

  const continueTutorial = useCallback(() => {
    if (tutorialStep === "basics-intro") setTutorialStep("basics-select-guardian");
    else if (tutorialStep === "basics-read-intent") setTutorialStep("basics-end-turn");
    else if (tutorialStep === "basics-hit-explained") {
      completeTrainingLesson(1);
      setTutorialStep("basics-complete");
    }
    else if (tutorialStep === "basics-complete") {
      setTutorialStep(null);
      setInspectedId(null);
      startMission(TRAINING_SQUAD.id);
    } else if (tutorialStep === "squad-intro") setTutorialStep("squad-select-guardian");
    else if (tutorialStep === "squad-shield-explained") {
      completeTrainingLesson(2);
      setTutorialStep("squad-complete");
    }
    else if (tutorialStep === "squad-complete") {
      setTutorialStep(null);
      setInspectedId(null);
      startMission(TRAINING_MOMENTUM.id);
    } else if (tutorialStep === "push-intro") setTutorialStep("push-select-pusher");
    else if (tutorialStep === "push-breach-warning") setTutorialStep("push-select-collision");
    else if (tutorialStep === "push-whale-arrives") setTutorialStep("push-select-for-whale");
    else if (tutorialStep === "push-locked-cone") setTutorialStep("push-select-charging");
    else if (tutorialStep === "training-complete") {
      setTutorialStep(null);
      setInspectedId(null);
      startMission(PROTECT_THE_VAULT.id);
    }
  }, [completeTrainingLesson, startMission, tutorialStep]);

  const skipTutorial = useCallback(() => {
    setTutorialComplete(true);
    setTutorialStep(null);
    setInspectedId(null);
    startMission(PROTECT_THE_VAULT.id);
  }, [setTutorialComplete, startMission]);

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
          endTurn();
        }
        return;
      }
      if (key === " ") {
        event.preventDefault();
        endTurn();
      } else if (key === "1" && selected && !selected.hasMoved && !selected.hasActed) setActionMode("move");
      else if (key === "2" && selected && !selected.hasActed) setActionMode("attack");
      else if (key === "3" && selected && !selected.hasActed && selected.signatureAvailable && (selected.role !== "sniper" || !selected.hasMoved)) activateAbility();
      else if (key === "s" && selected?.role === "pusher" && !selected.hasActed) setActionMode("push");
      else if (key === "w" && selected && !selected.hasActed) waitSelected();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activateAbility, controlsLocked, endTurn, game, selected, setActionMode, tutorialStep, waitSelected]);

  return (
    <div className="game-battle-route">
      <MobileNotice />
      <main className={clsx("game-battle-stage", tutorialStep && "has-tutorial")}>
        {!game ? <div className="game-loading"><Hourglass weight="fill" /> Loading battle…</div> : (
          <>
            <GameHud game={game} />
            <Link href="/" className="battle-title-button" aria-label="Game menu — return to title screen"><List weight="bold" /></Link>
            <section className="game-board-zone" aria-label="Battlefield">
              <Board game={game} highlights={highlights} selectedUnitId={selectedUnitId} actionMode={actionMode} inspectedId={inspectedId} tutorialStep={tutorialStep} movePreview={movePreview} movePreviewPath={movePreviewPath} disabled={controlsLocked} onTile={handleTile} onPreviewMove={setMovePreview} />
            </section>
            <CombatCallout game={game} cue={combatCue} />
            <SelectedInspector game={game} selectedUnitId={selectedUnitId} inspectedId={inspectedId} />
            <ActionBar
              selected={selected}
              actionMode={actionMode}
              movePreview={movePreview}
              movePreviewDistance={Math.max(0, (movePreviewPath?.length ?? 1) - 1)}
              hasUndo={Boolean(lastMove)}
              tutorialStep={tutorialStep}
              disabled={controlsLocked || game.phase !== "player"}
              log={log}
              onMode={handleActionMode}
              onAbility={activateAbility}
              onWait={waitSelected}
              onUndo={undoMove}
              onEndTurn={endTurn}
            />
          </>
        )}
        {introVisible && game ? <MissionIntro game={game} /> : null}
        {turnBanner && !introVisible ? <div className={clsx("game-turn-banner", ["basics-watch-enemy", "squad-watch-shield", "push-watch-charge"].includes(tutorialStep ?? "") && "is-tutorial-watch")} role="status">{turnBanner}</div> : null}
        {isResolving && !introVisible && !combatCue ? <div className="enemy-phase-label"><Hourglass weight="fill" /> Enemy phase</div> : null}
        {tutorialStep && !introVisible && !isAnimating ? <BattleTutorial key={tutorialStep} step={tutorialStep} onContinue={continueTutorial} onSkip={skipTutorial} /> : null}
      </main>
    </div>
  );
}
