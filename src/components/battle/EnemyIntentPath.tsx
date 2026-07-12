"use client";

import { useId } from "react";

import type { EnemyTurnPlan } from "@/lib/game";

import styles from "./EnemyIntentPath.module.css";
import {
  BLACKSITE_INTENT_GRID,
  buildEnemyIntentGeometry,
  type IntentGridGeometry,
} from "./EnemyIntentPathGeometry";

export {
  BLACKSITE_INTENT_GRID,
  buildEnemyIntentGeometry,
  type IntentGridGeometry,
  type IntentPathGeometry,
} from "./EnemyIntentPathGeometry";

export interface EnemyIntentPathProps {
  readonly plan: EnemyTurnPlan | null | undefined;
  readonly geometry?: IntentGridGeometry;
  readonly className?: string;
  /**
   * Supply a label only when the visual itself must be announced. When omitted
   * the overlay is decorative and hidden from assistive technology; the battle
   * grid/inspector remain the accessible source of exact intent information.
   */
  readonly ariaLabel?: string;
  readonly showDamage?: boolean;
}

export function EnemyIntentPath({
  plan,
  geometry = BLACKSITE_INTENT_GRID,
  className,
  ariaLabel,
  showDamage = true,
}: EnemyIntentPathProps) {
  const rawId = useId().replaceAll(":", "");
  const outerArrowId = `${rawId}-intent-arrow-outer`;
  const innerArrowId = `${rawId}-intent-arrow-inner`;
  const { metrics, paths } = buildEnemyIntentGeometry(plan, geometry);
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  if (paths.length === 0) return null;

  return (
    <svg
      className={rootClassName}
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      focusable="false"
      pointerEvents="none"
      data-enemy-intent-overlay="true"
    >
      {ariaLabel ? <title>{ariaLabel}</title> : null}
      <defs>
        <marker
          id={outerArrowId}
          markerWidth="46"
          markerHeight="46"
          refX="36"
          refY="23"
          orient="auto"
          markerUnits="userSpaceOnUse"
          viewBox="0 0 46 46"
        >
          <path className={styles.arrowOuter} d="M 1 1 L 45 23 L 1 45 L 9 23 Z" />
        </marker>
        <marker
          id={innerArrowId}
          markerWidth="46"
          markerHeight="46"
          refX="36"
          refY="23"
          orient="auto"
          markerUnits="userSpaceOnUse"
          viewBox="0 0 46 46"
        >
          <path className={styles.arrowInner} d="M 7 9 L 39 23 L 7 37 L 13 23 Z" />
        </marker>
      </defs>

      {paths.map(({ intent, movement, movementPath, orderBadge, targets }) => (
        <g
          key={`${intent.order}-${intent.enemyId}`}
          className={styles.intent}
          data-intent-order={intent.order}
          data-intent-enemy={intent.enemyId}
          data-intent-action={intent.action}
        >
          {movementPath ? (
            <>
              <path
                className={styles.routeOuter}
                d={movementPath}
                markerEnd={`url(#${outerArrowId})`}
              />
              <path
                className={styles.routeInner}
                d={movementPath}
                markerEnd={`url(#${innerArrowId})`}
              />
              <circle
                className={styles.routeStartOuter}
                cx={movement[0].x}
                cy={movement[0].y}
                r={metrics.markerRadius * 0.34}
              />
              <circle
                className={styles.routeStartInner}
                cx={movement[0].x}
                cy={movement[0].y}
                r={metrics.markerRadius * 0.17}
              />
              <g className={styles.orderBadge} transform={`translate(${orderBadge.x} ${orderBadge.y})`}>
                <circle r={metrics.markerRadius * 0.48} />
                <text y={metrics.markerRadius * 0.17}>{intent.order}</text>
              </g>
            </>
          ) : null}

          {targets.map((target) => (
            <g key={`${target.id}-${target.point.x}-${target.point.y}`} data-intent-target={target.id}>
              {target.attackPath ? (
                <>
                  <path className={styles.attackOuter} d={target.attackPath} />
                  <path className={styles.attackInner} d={target.attackPath} />
                </>
              ) : null}
              <g
                className={styles.targetMarker}
                transform={`translate(${target.point.x} ${target.point.y})`}
              >
                <circle className={styles.targetHalo} r={metrics.markerRadius * 1.18} />
                <circle className={styles.targetRing} r={metrics.markerRadius * 0.82} />
                <path
                  className={styles.targetCrosshair}
                  d={`M ${-metrics.markerRadius * 1.32} 0 H ${-metrics.markerRadius * 0.62} M ${metrics.markerRadius * 0.62} 0 H ${metrics.markerRadius * 1.32} M 0 ${-metrics.markerRadius * 1.32} V ${-metrics.markerRadius * 0.62} M 0 ${metrics.markerRadius * 0.62} V ${metrics.markerRadius * 1.32}`}
                />
                <circle className={styles.targetCore} r={metrics.markerRadius * 0.12} />
                {showDamage ? (
                  <text
                    className={styles.damage}
                    x={metrics.markerRadius * 1.12}
                    y={-metrics.markerRadius * 0.9}
                  >
                    {target.expectedDamage > 0 ? `−${target.expectedDamage}` : "BLOCK"}
                  </text>
                ) : null}
              </g>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
