"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  getAttackableTargets,
  getPushTargets,
  getValidMoves,
  type Enemy,
  type GameState,
  type PlayerUnit,
  type Position,
  type PushTarget,
} from "@/lib/game";
import { useGameStore, type ActionMode, type CombatLogEntry } from "@/store/gameStore";

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

function directionForStep(from: Position, to: Position) {
  if (to.x > from.x) return "east";
  if (to.x < from.x) return "west";
  if (to.y > from.y) return "south";
  return "north";
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

type PathMarker = {
  order: number;
  step: number;
  direction: "north" | "east" | "south" | "west";
};

function GameHud({ game }: { game: GameState }) {
  const vaultPercent = Math.max(0, Math.min(100, (game.vault.hp / game.vault.maxHp) * 100));

  return (
    <header className="game-hud" aria-label="Mission status">
      <div className="hud-objective">
        <span className="hud-shield"><Shield weight="fill" /></span>
        <div><strong>Protect the Vault</strong><small>Survive 5 turns</small></div>
      </div>
      <div className="hud-turn"><span>Turn</span><strong>{game.turn} / {game.maxTurns}</strong></div>
      <div className="hud-vault">
        <div><span>Vault</span><strong>{Math.max(0, game.vault.hp)} / {game.vault.maxHp}</strong></div>
        <span className="hud-vault-bar"><i style={{ width: `${vaultPercent}%` }} /></span>
      </div>
    </header>
  );
}

function MissionIntro() {
  return (
    <div className="mission-intro" role="status" aria-live="assertive">
      <span>Mission 01</span>
      <h1>Protect the Vault</h1>
      <p>Survive 5 turns</p>
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
  disabled,
  onTile,
}: {
  game: GameState;
  highlights: HighlightState;
  selectedUnitId: string | null;
  actionMode: ActionMode;
  inspectedId: string | null;
  disabled: boolean;
  onTile: (position: Position) => void;
}) {
  const enemyPlan = useGameStore((state) => state.enemyPlan);
  const effects = useGameStore((state) => state.effects);
  const boardRef = useRef<HTMLDivElement>(null);
  const previousRects = useRef(new Map<string, DOMRect>());
  const moveKeys = useMemo(() => new Set(highlights.moves.map(positionKey)), [highlights.moves]);
  const pushIds = useMemo(() => new Set(highlights.pushTargets.map((target) => target.id)), [highlights.pushTargets]);

  const intentData = useMemo(() => {
    const danger = new Set<string>();
    const locked = new Set<string>();
    const paths = new Map<string, PathMarker[]>();
    const destinations = new Map<string, number[]>();
    const orders = new Map<string, number>();
    for (const intent of enemyPlan?.intents ?? []) {
      orders.set(intent.enemyId, intent.order);
      intent.area.forEach((position) => danger.add(positionKey(position)));
      intent.targets.forEach((target) => danger.add(positionKey(target.position)));
      if (intent.target) danger.add(positionKey(intent.target.position));
      if (intent.action === "slam" || intent.special === "ground-slam") intent.area.forEach((position) => locked.add(positionKey(position)));
      let previous = intent.from;
      intent.path.forEach((position, index) => {
        const key = positionKey(position);
        const markers = paths.get(key) ?? [];
        markers.push({ order: intent.order, step: index + 1, direction: directionForStep(previous, position) });
        paths.set(key, markers);
        previous = position;
      });
      const destinationKey = positionKey(intent.destination);
      destinations.set(destinationKey, [...(destinations.get(destinationKey) ?? []), intent.order]);
    }
    return { danger, locked, paths, destinations, orders };
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

  return (
    <div ref={boardRef} className={clsx("game-board-frame", heavyImpact && "is-shaking", vaultThreatened && "is-vault-threatened")} aria-label="Vault District tactical grid">
      <div className="game-board-grid" role="grid" aria-rowcount={BOARD_SIZE} aria-colcount={BOARD_SIZE}>
        {positions.map((position) => {
          const key = positionKey(position);
          const unit = game.units.find((candidate) => candidate.hp > 0 && samePosition(candidate.position, position));
          const enemy = game.enemies.find((candidate) => candidate.hp > 0 && samePosition(candidate.position, position));
          const object = game.objects.find((candidate) => samePosition(candidate.position, position));
          const isVault = samePosition(game.vault.position, position);
          const obstacle = game.obstacles.some((candidate) => samePosition(candidate, position));
          const isBreach = samePosition(game.breach.position, position) && game.breach.status === "incoming";
          const isMove = moveKeys.has(key) && actionMode === "move";
          const isAttack = Boolean(enemy && highlights.attackIds.has(enemy.id));
          const isPush = Boolean((enemy || object) && pushIds.has((enemy ?? object)?.id ?? ""));
          const isDanger = intentData.danger.has(key);
          const pathMarkers = intentData.paths.get(key) ?? [];
          const destinationOrders = intentData.destinations.get(key) ?? [];
          const entityId = unit?.id ?? enemy?.id ?? object?.id ?? (isVault ? game.vault.id : undefined);
          const effect = entityId ? [...effects].reverse().find((candidate) => candidate.targetId === entityId) : undefined;
          const order = enemy ? intentData.orders.get(enemy.id) : undefined;
          const isSelected = unit?.id === selectedUnitId || Boolean(entityId && entityId === inspectedId);

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
                pathMarkers.length > 0 && "is-intent-path",
              )}
              onClick={() => onTile(position)}
              disabled={disabled || game.phase !== "player"}
              aria-label={tileDescription({ position, game, unit, enemy, object, obstacle, isMove, isAttack, isPush, isDanger })}
              aria-selected={isSelected}
              data-coordinate={coordinate(position)}
            >
              <span className="game-tile-coordinate" aria-hidden="true">{coordinate(position)}</span>
              {isDanger ? <Warning className="game-danger-icon" weight="fill" aria-hidden="true" /> : null}
              {pathMarkers.slice(0, 2).map((marker) => (
                <span key={`${marker.order}-${marker.step}`} className={clsx("game-intent-step", `is-${marker.direction}`)} aria-hidden="true">
                  <ArrowFatRight weight="fill" /><small>{marker.order}</small>
                </span>
              ))}
              {destinationOrders.length > 0 ? <span className="game-intent-land">{destinationOrders.join("/")}</span> : null}
              {obstacle ? <SpriteArt kind="obstacle" name="Obstacle" className="game-prop obstacle-prop" /> : null}
              {isBreach && !enemy ? <span className="breach-marker"><Warning weight="fill" /><small>Incoming</small></span> : null}
              {isVault ? (
                <span className={clsx("game-piece vault-piece", vaultThreatened && "is-threatened")} data-game-piece={game.vault.id}>
                  <span className="piece-base" />
                  <SpriteArt kind="vault" name={game.vault.name} className="board-sprite" priority />
                  <span className="piece-health"><i style={{ width: `${Math.max(0, (game.vault.hp / game.vault.maxHp) * 100)}%` }} /></span>
                </span>
              ) : null}
              {unit ? (
                <span className={clsx("game-piece ally-piece", `piece-${unit.role}`, unit.id === selectedUnitId && "is-active")} data-game-piece={unit.id}>
                  <span className="piece-base" />
                  <SpriteArt kind={unit.role} name={unit.name} className="board-sprite" priority />
                  <span className="piece-health"><i style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }} /></span>
                  {unit.shield ? <span className="piece-shield"><Shield weight="fill" />{unit.shield.value}</span> : null}
                </span>
              ) : null}
              {enemy ? (
                <span className={clsx("game-piece enemy-piece", `piece-${enemy.kind}`, enemy.kind === "whale" && "is-whale")} data-game-piece={enemy.id}>
                  <span className="piece-base" />
                  <SpriteArt kind={enemy.kind} name={enemy.name} className="board-sprite" priority />
                  <span className="piece-health"><i style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} /></span>
                  {order ? <span className="enemy-order">{order}</span> : null}
                </span>
              ) : null}
              {object ? <span className="game-piece object-piece" data-game-piece={object.id}><span className="piece-base" /><SpriteArt kind="data-block" name={object.name} className="board-sprite" /></span> : null}
              {effect?.amount ? <span key={effect.id} className="game-damage-popup">−{effect.amount}</span> : null}
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
  hasUndo,
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
  hasUndo: boolean;
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
  const hint = !selected
    ? "Select a hero"
    : selected.hasActed
      ? `${selected.name} is done · select another hero`
      : actionMode === "move"
        ? "Choose a teal tile"
        : actionMode === "attack"
          ? "Choose a cyan enemy"
          : actionMode === "push" || actionMode === "ability"
            ? "Choose a highlighted target"
            : "Move once, then act";
  const lastLog = log.at(-1)?.text;

  return (
    <div className="game-action-zone">
      <div className="game-action-hint" aria-live="polite">
        <span>{hint}</span>
        {lastLog ? <small>{lastLog}</small> : null}
        {hasUndo ? <button type="button" onClick={onUndo} disabled={disabled}><ArrowUUpLeft weight="bold" /> Undo move</button> : null}
      </div>
      <nav className="game-action-bar" aria-label="Battle actions">
        <button type="button" className={clsx("game-action-button action-move", actionMode === "move" && "is-active")} onClick={() => onMode("move")} disabled={disabled || !canMove} aria-keyshortcuts="1">
          <Boot weight="fill" /><span>Move</span><kbd>1</kbd>
        </button>
        <button type="button" className={clsx("game-action-button action-attack", actionMode === "attack" && "is-active")} onClick={() => onMode("attack")} disabled={disabled || !canAct} aria-keyshortcuts="2">
          <Sword weight="fill" /><span>Attack</span><kbd>2</kbd>
        </button>
        {selected?.role === "pusher" ? (
          <button type="button" className={clsx("game-action-button action-push", actionMode === "push" && "is-active")} onClick={() => onMode("push")} disabled={disabled || !canAct}>
            <HandGrabbing weight="fill" /><span>Shove</span><kbd>S</kbd>
          </button>
        ) : null}
        <button type="button" className={clsx("game-action-button action-ability", actionMode === "ability" && "is-active")} onClick={onAbility} disabled={disabled || !canSignature} aria-keyshortcuts="3">
          {selected?.role === "guardian" ? <Shield weight="fill" /> : selected?.role === "pusher" ? <HandFist weight="fill" /> : <Target weight="fill" />}
          <span>{selected?.signatureName ?? "Ability"}</span><kbd>3</kbd>
        </button>
        <button type="button" className="game-action-button action-wait" onClick={onWait} disabled={disabled || !canAct}>
          <Hourglass weight="fill" /><span>Wait</span><kbd>W</kbd>
        </button>
        <button type="button" className="game-end-turn" onClick={onEndTurn} disabled={disabled} aria-keyshortcuts="Space">
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
  const virtualTime = useRef(0);
  const game = useGameStore((state) => state.game);
  const enemyPlan = useGameStore((state) => state.enemyPlan);
  const hydrated = useGameStore((state) => state.hydrated);
  const selectedUnitId = useGameStore((state) => state.selectedUnitId);
  const actionMode = useGameStore((state) => state.actionMode);
  const lastMove = useGameStore((state) => state.lastMove);
  const lastResult = useGameStore((state) => state.lastResult);
  const isResolving = useGameStore((state) => state.isResolving);
  const turnBanner = useGameStore((state) => state.turnBanner);
  const effects = useGameStore((state) => state.effects);
  const log = useGameStore((state) => state.log);
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
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [introVisible, setIntroVisible] = useState(true);

  const selected = game?.units.find((unit) => unit.id === selectedUnitId && unit.hp > 0);
  const controlsLocked = isResolving || introVisible;
  const moves = useMemo(() => game && selected && actionMode === "move" ? getValidMoves(game, selected.id) : [], [actionMode, game, selected]);
  const attackTargets = useMemo(() => {
    if (!game || !selected) return [];
    if (actionMode === "attack") return getAttackableTargets(game, selected.id);
    if (actionMode === "ability" && selected.role === "sniper") return getAttackableTargets(game, selected.id, { deadeye: true });
    return [];
  }, [actionMode, game, selected]);
  const pushTargets = useMemo(() => game && selected && selected.role === "pusher" && (actionMode === "push" || actionMode === "ability") ? getPushTargets(game, selected.id) : [], [actionMode, game, selected]);
  const highlights = useMemo<HighlightState>(() => ({ moves, attackIds: new Set(attackTargets.map((enemy) => enemy.id)), pushTargets }), [attackTargets, moves, pushTargets]);

  useEffect(() => {
    if (!hydrated || initialized.current) return;
    initialized.current = true;
    ensureIdentity();
    startMission();
  }, [ensureIdentity, hydrated, startMission]);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => setIntroVisible(false), 2050);
    return () => window.clearTimeout(timeout);
  }, [hydrated]);

  useEffect(() => {
    if (effects.length === 0) return;
    const timeout = window.setTimeout(clearEffects, 680);
    return () => window.clearTimeout(timeout);
  }, [clearEffects, effects]);

  useEffect(() => {
    if (!game || !lastResult || (game.phase !== "victory" && game.phase !== "defeat")) return;
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
      phase: game.phase,
      turn: game.turn,
      selectedUnitId,
      inspectedId,
      actionMode,
      resolving: isResolving,
      highlights: {
        moves: moves.map(coordinate),
        attacks: attackTargets.map((target) => ({ id: target.id, at: coordinate(target.position) })),
        pushes: pushTargets.map((target) => ({ id: target.id, kind: target.kind, at: coordinate(target.position), canMove: target.canMove })),
      },
      vault: { hp: game.vault.hp, maxHp: game.vault.maxHp, at: coordinate(game.vault.position) },
      units: game.units.map((unit) => ({ id: unit.id, role: unit.role, at: coordinate(unit.position), hp: unit.hp, hasMoved: unit.hasMoved, hasActed: unit.hasActed, signatureAvailable: unit.signatureAvailable })),
      enemies: game.enemies.map((enemy) => ({ id: enemy.id, kind: enemy.kind, at: coordinate(enemy.position), hp: enemy.hp, whaleState: enemy.whaleState })),
      objects: game.objects.map((object) => ({ id: object.id, at: coordinate(object.position) })),
      exactEnemyPlan: enemyPlan?.intents.map((intent) => ({ order: intent.order, enemyId: intent.enemyId, action: intent.action, path: intent.path.map(coordinate), destination: coordinate(intent.destination), target: intent.target?.id ?? null, area: intent.area.map(coordinate), damage: intent.damage, special: intent.special })) ?? [],
    });
    window.advanceTime = (milliseconds) => {
      virtualTime.current += milliseconds;
      if (virtualTime.current >= 2000) setIntroVisible(false);
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [actionMode, attackTargets, enemyPlan, game, inspectedId, introVisible, isResolving, moves, pushTargets, selectedUnitId]);

  const activateAbility = useCallback(() => {
    if (!selected || controlsLocked) return;
    if (selected.role === "guardian") shieldSelected();
    else setActionMode("ability");
  }, [controlsLocked, selected, setActionMode, shieldSelected]);

  const handleTile = useCallback((position: Position) => {
    if (!game || controlsLocked || game.phase !== "player") return;
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
  }, [actionMode, attackSelected, controlsLocked, game, highlights.attackIds, moveSelected, moves, pushSelected, pushTargets, selectUnit, selected]);

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
        setActionMode(null);
        return;
      }
      if (event.repeat || controlsLocked || !game || game.phase !== "player") return;
      if (key === " ") {
        event.preventDefault();
        endTurn();
      } else if (key === "1" && selected && !selected.hasMoved && !selected.hasActed) setActionMode("move");
      else if (key === "2" && selected && !selected.hasActed) setActionMode("attack");
      else if (key === "3" && selected && !selected.hasActed && selected.signatureAvailable && (selected.role !== "sniper" || !selected.hasMoved)) activateAbility();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activateAbility, controlsLocked, endTurn, game, selected, setActionMode]);

  return (
    <div className="game-battle-route">
      <MobileNotice />
      <main className="game-battle-stage">
        {!game ? <div className="game-loading"><Hourglass weight="fill" /> Loading battle…</div> : (
          <>
            <GameHud game={game} />
            <Link href="/" className="battle-title-button" aria-label="Game menu — return to title screen"><List weight="bold" /></Link>
            <section className="game-board-zone" aria-label="Battlefield">
              <Board game={game} highlights={highlights} selectedUnitId={selectedUnitId} actionMode={actionMode} inspectedId={inspectedId} disabled={controlsLocked} onTile={handleTile} />
            </section>
            <SelectedInspector game={game} selectedUnitId={selectedUnitId} inspectedId={inspectedId} />
            <ActionBar
              selected={selected}
              actionMode={actionMode}
              hasUndo={Boolean(lastMove)}
              disabled={controlsLocked || game.phase !== "player"}
              log={log}
              onMode={setActionMode}
              onAbility={activateAbility}
              onWait={waitSelected}
              onUndo={undoMove}
              onEndTurn={endTurn}
            />
          </>
        )}
        {introVisible && game ? <MissionIntro /> : null}
        {turnBanner && !introVisible ? <div className="game-turn-banner" role="status">{turnBanner}</div> : null}
        {isResolving && !introVisible ? <div className="enemy-phase-label"><Hourglass weight="fill" /> Enemy phase</div> : null}
      </main>
    </div>
  );
}
