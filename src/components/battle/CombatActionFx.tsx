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
  if (variant === "shove" || variant === "batter-up") return styles.push;
  return styles.generic;
};

export function CombatActionFx({ game, cue }: { game: GameState; cue: CombatCue | null }) {
  const rawId = useId().replaceAll(":", "");
  if (!cue || !cue.variant || !["attack", "push", "status"].includes(cue.stage)) return null;

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
  const variantClass = traceVariant(cue.variant);
  const arrowId = `${rawId}-combat-arrow`;

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
      {tracePath && cue.variant !== "whale-slam" ? (
        <g>
          <path className={styles.traceOuter} d={tracePath} />
          <path className={styles.traceInner} d={tracePath} markerEnd={cue.stage === "push" ? `url(#${arrowId})` : undefined} />
        </g>
      ) : null}
      {sourcePoint ? <circle className={styles.sourcePulse} cx={sourcePoint.x} cy={sourcePoint.y} r={metrics.markerRadius * 0.72} /> : null}
      {targetPoint && cue.variant !== "whale-slam" ? <circle className={styles.targetPulse} cx={targetPoint.x} cy={targetPoint.y} r={metrics.markerRadius * 0.54} /> : null}
      {cue.variant === "whale-slam" ? areaPoints.map((point, index) => (
        <g key={`${point.x}-${point.y}-${index}`}>
          <circle className={styles.slamOuter} cx={point.x} cy={point.y} r={metrics.markerRadius * 1.55} />
          <path className={styles.slamCrack} d={`M ${point.x - 22} ${point.y - 28} L ${point.x - 5} ${point.y - 6} L ${point.x - 15} ${point.y + 22} M ${point.x + 26} ${point.y - 20} L ${point.x + 6} ${point.y + 2} L ${point.x + 22} ${point.y + 29}`} />
        </g>
      )) : null}
    </svg>
  );
}
