"use client";

import { useId } from "react";

import type { GameState, Position } from "@/lib/game";
import type { CombatCue } from "@/store/gameStore";
import {
  BLACKSITE_INTENT_GRID,
  buildBoardPositionPath,
  metricsForIntentGrid,
  pointForIntentGrid,
} from "./EnemyIntentPathGeometry";
import styles from "./CombatActionFx.module.css";

interface FxPoint {
  readonly x: number;
  readonly y: number;
}

const positionFor = (game: GameState, id?: string): Position | null => {
  if (!id) return null;
  if (id === game.vault.id) return game.vault.position;
  return game.units.find((unit) => unit.id === id)?.position
    ?? game.enemies.find((enemy) => enemy.id === id)?.position
    ?? game.objects.find((object) => object.id === id)?.position
    ?? null;
};

const traceVariant = (variant: CombatCue["variant"]) => {
  if (variant === "sniper-shot") return styles.sniper;
  if (variant === "deadeye") return styles.deadeye;
  if (variant === "drain") return styles.drain;
  if (variant === "whale-slam") return styles.whale;
  if (variant === "guardian-bash") return styles.guardian;
  if (variant === "rugger-charge") return styles.rugger;
  if (variant === "pusher-punch") return styles.pusher;
  if (variant === "shove") return styles.shove;
  if (variant === "batter-up") return styles.batterUp;
  if (variant === "shield-wall") return styles.shieldWall;
  if (variant === "hacker-jam") return styles.hackerJam;
  if (variant === "hacker-blackout") return styles.hackerBlackout;
  return styles.generic;
};

const number = (value: number) => Number(value.toFixed(3)).toString();

const hexagonPath = (center: FxPoint, radius: number) => {
  const points = Array.from({ length: 6 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 3;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
  return `${points.map((point, index) => `${index === 0 ? "M" : "L"} ${number(point.x)} ${number(point.y)}`).join(" ")} Z`;
};

const pointBetween = (from: FxPoint, to: FxPoint, amount: number): FxPoint => ({
  x: from.x + (to.x - from.x) * amount,
  y: from.y + (to.y - from.y) * amount,
});

const chevronPath = (from: FxPoint, to: FxPoint, amount: number, size: number) => {
  const center = pointBetween(from, to, amount);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const direction = { x: dx / distance, y: dy / distance };
  const normal = { x: -direction.y, y: direction.x };
  const tip = {
    x: center.x + direction.x * size,
    y: center.y + direction.y * size,
  };
  const back = {
    x: center.x - direction.x * size * 0.72,
    y: center.y - direction.y * size * 0.72,
  };
  const top = {
    x: back.x + normal.x * size,
    y: back.y + normal.y * size,
  };
  const bottom = {
    x: back.x - normal.x * size,
    y: back.y - normal.y * size,
  };
  return `M ${number(top.x)} ${number(top.y)} L ${number(tip.x)} ${number(tip.y)} L ${number(bottom.x)} ${number(bottom.y)}`;
};

export function CombatActionFx({ game, cue }: { game: GameState; cue: CombatCue | null }) {
  const rawId = useId().replaceAll(":", "");
  if (!cue || !cue.variant || !["attack", "push", "shield", "status"].includes(cue.stage)) return null;
  if (cue.stage === "status" && !["drain-heal", "blackout-cast", "blackout-hold"].includes(cue.statusKind ?? "")) return null;

  const source = cue.stage === "push" ? cue.from ?? positionFor(game, cue.sourceId) : positionFor(game, cue.sourceId);
  const target = cue.stage === "push" ? cue.to ?? positionFor(game, cue.targetId) : positionFor(game, cue.targetId);
  const metrics = metricsForIntentGrid(BLACKSITE_INTENT_GRID);
  const sourcePoint = source ? pointForIntentGrid(source, metrics) : null;
  const targetPoint = target ? pointForIntentGrid(target, metrics) : null;
  const trace = source && target ? buildBoardPositionPath([source, target]) : null;
  const tracePath = cue.variant === "drain" && sourcePoint && targetPoint
    ? `M ${sourcePoint.x} ${sourcePoint.y} Q ${(sourcePoint.x + targetPoint.x) / 2 + metrics.markerRadius * 3.1} ${(sourcePoint.y + targetPoint.y) / 2} ${targetPoint.x} ${targetPoint.y}`
    : trace?.path;
  const areaPoints = (cue.area ?? [])
    .map((position) => pointForIntentGrid(position, metrics))
    .filter((point): point is NonNullable<typeof point> => point !== null);
  const isHackerJam = cue.variant === "hacker-jam";
  const isHackerBlackout = cue.variant === "hacker-blackout" || cue.statusKind === "blackout-hold";
  const variantClass = isHackerBlackout ? styles.hackerBlackout : traceVariant(cue.variant);
  const arrowId = `${rawId}-combat-arrow`;
  const isDeadeye = cue.variant === "deadeye";
  const isSniperShot = cue.variant === "sniper-shot";
  const isShieldWall = cue.variant === "shield-wall";
  const isShove = cue.variant === "shove";
  const isBatterUp = cue.variant === "batter-up";
  const pushChevronSize = metrics.markerRadius * (isBatterUp ? 0.68 : 0.56);

  if (!sourcePoint && areaPoints.length === 0) return null;

  return (
    <svg
      className={`${styles.root} ${variantClass}`}
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      pointerEvents="none"
      data-combat-fx={cue.variant}
      data-combat-stage={cue.stage}
      data-combat-source={cue.sourceId}
      data-combat-target={cue.targetId}
    >
      <defs>
        <marker id={arrowId} markerWidth="34" markerHeight="34" refX="29" refY="17" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 34 34">
          <path className={styles.arrow} d="M 2 3 L 32 17 L 2 31 L 9 17 Z" />
        </marker>
      </defs>
      {tracePath && cue.variant !== "whale-slam" && !isDeadeye && !isShieldWall ? (
        <g>
          <path className={styles.traceOuter} d={tracePath} />
          <path className={styles.traceInner} d={tracePath} markerEnd={cue.stage === "push" ? `url(#${arrowId})` : undefined} />
        </g>
      ) : null}
      {isDeadeye && tracePath && sourcePoint && targetPoint ? (
        <g className={styles.deadeyeSequence}>
          <circle className={styles.deadeyeChargeOuter} cx={sourcePoint.x} cy={sourcePoint.y} r={metrics.markerRadius * 1.02} />
          <circle className={styles.deadeyeChargeInner} cx={sourcePoint.x} cy={sourcePoint.y} r={metrics.markerRadius * 0.58} />
          <path className={styles.deadeyeBeamHalo} d={tracePath} />
          <path className={styles.deadeyeBeamCore} d={tracePath} />
          <path className={styles.deadeyeBeamHot} d={tracePath} />
          <g className={styles.deadeyeReticle}>
            <circle cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 1.02} />
            <circle cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.56} />
            <path d={`M ${targetPoint.x - metrics.markerRadius * 1.5} ${targetPoint.y} H ${targetPoint.x - metrics.markerRadius * 0.72} M ${targetPoint.x + metrics.markerRadius * 0.72} ${targetPoint.y} H ${targetPoint.x + metrics.markerRadius * 1.5} M ${targetPoint.x} ${targetPoint.y - metrics.markerRadius * 1.5} V ${targetPoint.y - metrics.markerRadius * 0.72} M ${targetPoint.x} ${targetPoint.y + metrics.markerRadius * 0.72} V ${targetPoint.y + metrics.markerRadius * 1.5}`} />
          </g>
          <circle className={styles.deadeyeImpactOuter} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.86} />
          <circle className={styles.deadeyeImpactInner} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.42} />
        </g>
      ) : null}
      {isShieldWall && sourcePoint ? (
        <g className={styles.shieldSequence}>
          <path className={styles.shieldAuraOuter} d={hexagonPath(sourcePoint, metrics.markerRadius * 6.15)} />
          <path className={styles.shieldAuraMiddle} d={hexagonPath(sourcePoint, metrics.markerRadius * 3.25)} />
          <path className={styles.shieldCore} d={hexagonPath(sourcePoint, metrics.markerRadius * 1.42)} />
        </g>
      ) : null}
      {(isShove || isBatterUp) && sourcePoint && targetPoint ? (
        <g className={styles.pushSequence}>
          <path className={styles.pushChevron} d={chevronPath(sourcePoint, targetPoint, isBatterUp ? 0.34 : 0.5, pushChevronSize)} />
          {isBatterUp ? <path className={`${styles.pushChevron} ${styles.pushChevronSecond}`} d={chevronPath(sourcePoint, targetPoint, 0.66, pushChevronSize)} /> : null}
          {isBatterUp ? <circle className={styles.batterImpact} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.9} /> : null}
        </g>
      ) : null}
      {isHackerJam && targetPoint ? (
        <g className={styles.hackerJamSequence}>
          <circle className={styles.hackerJamOuter} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 1.12} />
          <circle className={styles.hackerJamInner} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.7} />
          <path className={styles.hackerJamMinus} d={`M ${targetPoint.x - metrics.markerRadius * 0.42} ${targetPoint.y} H ${targetPoint.x + metrics.markerRadius * 0.42}`} />
        </g>
      ) : null}
      {isHackerBlackout && targetPoint ? (
        <g className={styles.hackerBlackoutSequence}>
          <circle className={styles.hackerBlackoutOuter} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 1.32} />
          <circle className={styles.hackerBlackoutInner} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.78} />
          <path className={styles.hackerBlackoutCut} d={`M ${targetPoint.x - metrics.markerRadius * 0.42} ${targetPoint.y - metrics.markerRadius * 0.42} L ${targetPoint.x + metrics.markerRadius * 0.42} ${targetPoint.y + metrics.markerRadius * 0.42} M ${targetPoint.x + metrics.markerRadius * 0.42} ${targetPoint.y - metrics.markerRadius * 0.42} L ${targetPoint.x - metrics.markerRadius * 0.42} ${targetPoint.y + metrics.markerRadius * 0.42}`} />
        </g>
      ) : null}
      {sourcePoint && !isDeadeye && !isShieldWall ? <circle className={styles.sourcePulse} cx={sourcePoint.x} cy={sourcePoint.y} r={metrics.markerRadius * 0.72} /> : null}
      {targetPoint && cue.variant !== "whale-slam" && !isDeadeye && !isShieldWall ? <circle className={styles.targetPulse} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.54} /> : null}
      {isSniperShot && targetPoint ? (
        <g className={styles.sniperSpark}>
          <circle cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.32} />
          <path d={`M ${targetPoint.x - metrics.markerRadius * 0.72} ${targetPoint.y} H ${targetPoint.x + metrics.markerRadius * 0.72} M ${targetPoint.x} ${targetPoint.y - metrics.markerRadius * 0.72} V ${targetPoint.y + metrics.markerRadius * 0.72}`} />
        </g>
      ) : null}
      {cue.variant === "whale-slam" ? areaPoints.map((point, index) => (
        <g key={`${point.x}-${point.y}-${index}`}>
          <circle className={styles.slamOuter} cx={point.x} cy={point.y} r={metrics.markerRadius * 1.55} />
          <path className={styles.slamCrack} d={`M ${point.x - 22} ${point.y - 28} L ${point.x - 5} ${point.y - 6} L ${point.x - 15} ${point.y + 22} M ${point.x + 26} ${point.y - 20} L ${point.x + 6} ${point.y + 2} L ${point.x + 22} ${point.y + 29}`} />
        </g>
      )) : null}
    </svg>
  );
}
