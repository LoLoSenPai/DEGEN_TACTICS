import type { EnemyIntent, EnemyTurnPlan, Position } from "@/lib/game";

export interface IntentGridGeometry {
  /** Relative widths of the authored board columns. */
  readonly columnTracks: readonly number[];
  /** Relative heights of the authored board rows. */
  readonly rowTracks: readonly number[];
}

/**
 * Source-rail geometry for blacksite-board-7x7.png. Keeping these values here
 * makes SVG tile centres follow the calibrated DOM grid instead of assuming
 * that generated board artwork has perfectly uniform cells.
 */
export const BLACKSITE_INTENT_GRID: IntentGridGeometry = {
  columnTracks: [163, 163, 163, 162, 163, 163, 163],
  rowTracks: [161, 162, 161, 161, 161, 162, 161],
} as const;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface IntentPathGeometry {
  readonly intent: EnemyIntent;
  readonly movement: readonly Point[];
  readonly movementPath: string | null;
  readonly orderBadge: Point;
  readonly targets: readonly Readonly<{
    id: string;
    point: Point;
    attackPath: string | null;
    expectedDamage: number;
  }>[];
}

export interface IntentGridMetrics {
  readonly width: number;
  readonly height: number;
  readonly centersX: readonly number[];
  readonly centersY: readonly number[];
  readonly markerRadius: number;
}

export interface BoardPositionPathGeometry {
  readonly metrics: IntentGridMetrics;
  readonly points: readonly Point[];
  readonly path: string | null;
}

const samePosition = (left: Position, right: Position) =>
  left.x === right.x && left.y === right.y;

const total = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0);

const axisCenters = (tracks: readonly number[]) => {
  let cursor = 0;
  return tracks.map((track) => {
    const center = cursor + track / 2;
    cursor += track;
    return center;
  });
};

const normalizeTracks = (tracks: readonly number[], fallbackLength: number) => {
  if (
    tracks.length === fallbackLength
    && tracks.every((track) => Number.isFinite(track) && track > 0)
  ) return tracks;

  return Array.from({ length: fallbackLength }, () => 1);
};

export const metricsForIntentGrid = (geometry: IntentGridGeometry): IntentGridMetrics => {
  const boardSize = Math.max(
    geometry.columnTracks.length,
    geometry.rowTracks.length,
    1,
  );
  const columns = normalizeTracks(geometry.columnTracks, boardSize);
  const rows = normalizeTracks(geometry.rowTracks, boardSize);
  const smallestTrack = Math.min(...columns, ...rows);

  return {
    width: total(columns),
    height: total(rows),
    centersX: axisCenters(columns),
    centersY: axisCenters(rows),
    markerRadius: smallestTrack * 0.16,
  };
};

export const pointForIntentGrid = (position: Position, metrics: IntentGridMetrics): Point | null => {
  const x = metrics.centersX[position.x];
  const y = metrics.centersY[position.y];
  if (x === undefined || y === undefined) return null;
  return { x, y };
};

const number = (value: number) => Number(value.toFixed(3)).toString();

export const pathFromIntentPoints = (points: readonly Point[]) => {
  if (points.length < 2) return null;
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${number(point.x)} ${number(point.y)}`)
    .join(" ");
};

export const buildBoardPositionPath = (
  positions: readonly Position[],
  geometry: IntentGridGeometry = BLACKSITE_INTENT_GRID,
): BoardPositionPathGeometry => {
  const metrics = metricsForIntentGrid(geometry);
  const points = positions
    .map((position) => pointForIntentGrid(position, metrics))
    .filter((point): point is Point => point !== null);
  return {
    metrics,
    points,
    path: points.length === positions.length ? pathFromIntentPoints(points) : null,
  };
};

const lerp = (from: Point, to: Point, amount: number): Point => ({
  x: from.x + (to.x - from.x) * amount,
  y: from.y + (to.y - from.y) * amount,
});

const trimmedAttackPath = (
  from: Point,
  to: Point,
  markerRadius: number,
) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return null;

  const startGap = Math.min(markerRadius * 0.72, distance * 0.16);
  const endGap = Math.min(markerRadius * 1.45, distance * 0.28);
  const unitX = dx / distance;
  const unitY = dy / distance;

  return pathFromIntentPoints([
    { x: from.x + unitX * startGap, y: from.y + unitY * startGap },
    { x: to.x - unitX * endGap, y: to.y - unitY * endGap },
  ]);
};

const distinctTargets = (intent: EnemyIntent) => {
  const targets = intent.target ? [intent.target, ...intent.targets] : [...intent.targets];
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.id}:${target.position.x},${target.position.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Pure geometry helper exported for deterministic unit/visual QA. */
export const buildEnemyIntentGeometry = (
  plan: EnemyTurnPlan | null | undefined,
  geometry: IntentGridGeometry = BLACKSITE_INTENT_GRID,
): Readonly<{ metrics: IntentGridMetrics; paths: readonly IntentPathGeometry[] }> => {
  const metrics = metricsForIntentGrid(geometry);
  const paths = [...(plan?.intents ?? [])]
    .sort((left, right) => left.order - right.order || left.enemyId.localeCompare(right.enemyId))
    .flatMap((intent): IntentPathGeometry[] => {
      const positions = [intent.from, ...intent.path];
      if (!samePosition(positions.at(-1) ?? intent.from, intent.destination)) {
        positions.push(intent.destination);
      }
      const movement = positions
        .map((position) => pointForIntentGrid(position, metrics))
        .filter((point): point is Point => point !== null);
      const destination = pointForIntentGrid(intent.destination, metrics);
      const origin = pointForIntentGrid(intent.from, metrics);
      if (!destination || !origin) return [];

      const firstStep = movement[1];
      const orderBadge = firstStep
        ? lerp(movement[0], firstStep, 0.42)
        : { x: origin.x + metrics.markerRadius, y: origin.y - metrics.markerRadius };
      const targets = distinctTargets(intent).flatMap((target) => {
        const point = pointForIntentGrid(target.position, metrics);
        if (!point) return [];
        return [{
          id: target.id,
          point,
          attackPath: intent.area.length > 0 ? null : trimmedAttackPath(destination, point, metrics.markerRadius),
          expectedDamage: target.expectedDamage,
        }];
      });

      return [{
        intent,
        movement,
        movementPath: pathFromIntentPoints(movement),
        orderBadge,
        targets,
      }];
    });

  return { metrics, paths };
};
