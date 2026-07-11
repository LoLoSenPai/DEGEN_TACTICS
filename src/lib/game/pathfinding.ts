import { BOARD_SIZE, type Direction, type Position } from "./types";

export const CARDINAL_DIRECTIONS: readonly Readonly<{
  direction: Direction;
  delta: Position;
}>[] = [
  { direction: "north", delta: { x: 0, y: -1 } },
  { direction: "east", delta: { x: 1, y: 0 } },
  { direction: "south", delta: { x: 0, y: 1 } },
  { direction: "west", delta: { x: -1, y: 0 } },
];

export const positionKey = ({ x, y }: Position): string => `${x},${y}`;

export const samePosition = (left: Position, right: Position): boolean =>
  left.x === right.x && left.y === right.y;

export const isInBounds = (
  { x, y }: Position,
  boardSize = BOARD_SIZE,
): boolean => x >= 0 && x < boardSize && y >= 0 && y < boardSize;

export const manhattanDistance = (left: Position, right: Position): number =>
  Math.abs(left.x - right.x) + Math.abs(left.y - right.y);

export const addPositions = (left: Position, right: Position): Position => ({
  x: left.x + right.x,
  y: left.y + right.y,
});

export const getCardinalNeighbors = (
  position: Position,
  boardSize = BOARD_SIZE,
): Position[] =>
  CARDINAL_DIRECTIONS.map(({ delta }) => addPositions(position, delta)).filter(
    (candidate) => isInBounds(candidate, boardSize),
  );

export const directionBetween = (
  from: Position,
  to: Position,
): Direction | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy === -1) return "north";
  if (dx === 1 && dy === 0) return "east";
  if (dx === 0 && dy === 1) return "south";
  if (dx === -1 && dy === 0) return "west";
  return null;
};

export const deltaForDirection = (direction: Direction): Position =>
  CARDINAL_DIRECTIONS.find((entry) => entry.direction === direction)?.delta ?? {
    x: 0,
    y: 0,
  };

export const findShortestPath = (
  start: Position,
  goal: Position,
  isBlocked: (position: Position) => boolean,
  boardSize = BOARD_SIZE,
): Position[] | null => {
  if (samePosition(start, goal)) return [];

  const queue: Position[] = [start];
  let cursor = 0;
  const visited = new Set<string>([positionKey(start)]);
  const previous = new Map<string, Position>();

  while (cursor < queue.length) {
    const current = queue[cursor++];
    for (const neighbor of getCardinalNeighbors(current, boardSize)) {
      const key = positionKey(neighbor);
      if (visited.has(key)) continue;
      if (!samePosition(neighbor, goal) && isBlocked(neighbor)) continue;

      visited.add(key);
      previous.set(key, current);

      if (samePosition(neighbor, goal)) {
        const path: Position[] = [neighbor];
        let step = current;
        while (!samePosition(step, start)) {
          path.push(step);
          const parent = previous.get(positionKey(step));
          if (!parent) return null;
          step = parent;
        }
        return path.reverse();
      }

      queue.push(neighbor);
    }
  }

  return null;
};

export const getReachablePositions = (
  start: Position,
  range: number,
  isBlocked: (position: Position) => boolean,
  boardSize = BOARD_SIZE,
): Position[] => {
  const queue: Array<{ position: Position; distance: number }> = [
    { position: start, distance: 0 },
  ];
  let cursor = 0;
  const visited = new Set<string>([positionKey(start)]);
  const reachable: Position[] = [];

  while (cursor < queue.length) {
    const current = queue[cursor++];
    if (current.distance >= range) continue;

    for (const neighbor of getCardinalNeighbors(current.position, boardSize)) {
      const key = positionKey(neighbor);
      if (visited.has(key) || isBlocked(neighbor)) continue;
      visited.add(key);
      reachable.push(neighbor);
      queue.push({ position: neighbor, distance: current.distance + 1 });
    }
  }

  return reachable;
};

export const getConeArea = (
  origin: Position,
  direction: Direction,
  boardSize = BOARD_SIZE,
): Position[] => {
  const forward = deltaForDirection(direction);
  const side =
    direction === "north" || direction === "south"
      ? { x: 1, y: 0 }
      : { x: 0, y: 1 };
  const near = addPositions(origin, forward);
  const farCenter = addPositions(near, forward);
  const candidates = [
    near,
    addPositions(farCenter, { x: -side.x, y: -side.y }),
    farCenter,
    addPositions(farCenter, side),
  ];

  return candidates.filter((candidate) => isInBounds(candidate, boardSize));
};
