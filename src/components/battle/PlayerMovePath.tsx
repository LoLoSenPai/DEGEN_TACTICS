"use client";

import { useId } from "react";

import type { Position } from "@/lib/game";
import {
  BLACKSITE_INTENT_GRID,
  buildBoardPositionPath,
  type IntentGridGeometry,
} from "./EnemyIntentPathGeometry";
import styles from "./PlayerMovePath.module.css";

export function PlayerMovePath({
  positions,
  destination,
  geometry = BLACKSITE_INTENT_GRID,
}: {
  positions: readonly Position[];
  destination: string;
  geometry?: IntentGridGeometry;
}) {
  const rawId = useId().replaceAll(":", "");
  const outerArrowId = `${rawId}-move-arrow-outer`;
  const innerArrowId = `${rawId}-move-arrow-inner`;
  const { metrics, points, path } = buildBoardPositionPath(positions, geometry);
  const start = points[0];
  const end = points.at(-1);
  if (!path || !start || !end) return null;

  return (
    <svg
      className={styles.root}
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      pointerEvents="none"
      data-move-preview-overlay="true"
      data-move-preview-target={destination}
      data-move-preview-path={positions.map(({ x, y }) => `${String.fromCharCode(65 + x)}${y + 1}`).join(">")}
    >
      <defs>
        <marker id={outerArrowId} markerWidth="46" markerHeight="46" refX="39" refY="23" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 46 46">
          <path className={styles.arrowOuter} d="M 1 1 L 45 23 L 1 45 L 10 23 Z" />
        </marker>
        <marker id={innerArrowId} markerWidth="46" markerHeight="46" refX="39" refY="23" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 46 46">
          <path className={styles.arrowInner} d="M 7 9 L 39 23 L 7 37 L 14 23 Z" />
        </marker>
      </defs>
      <path className={styles.routeOuter} d={path} markerEnd={`url(#${outerArrowId})`} />
      <path className={styles.routeInner} d={path} markerEnd={`url(#${innerArrowId})`} />
      <circle className={styles.startOuter} cx={start.x} cy={start.y} r={metrics.markerRadius * 0.35} />
      <circle className={styles.startInner} cx={start.x} cy={start.y} r={metrics.markerRadius * 0.16} />
      {points.slice(1, -1).map((point, index) => (
        <circle key={`${point.x}-${point.y}-${index}`} className={styles.step} cx={point.x} cy={point.y} r={metrics.markerRadius * 0.16} />
      ))}
      <circle className={styles.destinationHalo} cx={end.x} cy={end.y} r={metrics.markerRadius * 0.72} />
      <circle className={styles.destinationRing} cx={end.x} cy={end.y} r={metrics.markerRadius * 0.45} />
    </svg>
  );
}
