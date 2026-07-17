import type {
  MissionDefinition,
  MissionSquadRules,
  Position,
  UnitDefinition,
  UnitRole,
} from "./types";
import { getMissionDefinition, isPlayableMissionId } from "./mission";

export const SQUAD_ROLE_ORDER = ["guardian", "sniper", "pusher", "hacker"] as const satisfies readonly UnitRole[];
export const DEFAULT_SQUAD = ["guardian", "sniper", "pusher"] as const satisfies readonly UnitRole[];

export const HERO_BLUEPRINTS: Readonly<Record<UnitRole, Omit<UnitDefinition, "position">>> = {
  guardian: {
    id: "guardian",
    name: "Guardian",
    role: "guardian",
    maxHp: 12,
    moveRange: 2,
    attackDamage: 2,
    attackRange: 1,
    signatureName: "Shield Wall",
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    role: "sniper",
    maxHp: 7,
    moveRange: 3,
    attackDamage: 3,
    attackRange: 3,
    signatureName: "Deadeye",
  },
  pusher: {
    id: "pusher",
    name: "Pusher",
    role: "pusher",
    maxHp: 9,
    moveRange: 2,
    attackDamage: 1,
    attackRange: 1,
    signatureName: "Batter Up",
  },
  hacker: {
    id: "hacker",
    name: "Hacker",
    role: "hacker",
    maxHp: 6,
    moveRange: 3,
    attackDamage: 0,
    attackRange: 3,
    signatureName: "Blackout",
  },
};

const samePosition = (left: Position, right: Position) => left.x === right.x && left.y === right.y;

export const isUnitRole = (value: unknown): value is UnitRole =>
  typeof value === "string" && SQUAD_ROLE_ORDER.includes(value as UnitRole);

export const canonicalizeSquad = (roles: readonly UnitRole[]): UnitRole[] => {
  const selected = new Set(roles);
  return SQUAD_ROLE_ORDER.filter((role) => selected.has(role));
};

const compositionKey = (roles: readonly UnitRole[]) => canonicalizeSquad(roles).join("|");

export const getMissionSquadRules = (definition: MissionDefinition): MissionSquadRules | null =>
  definition.squad ?? null;

export const getDefaultSquad = (definition: MissionDefinition): UnitRole[] =>
  canonicalizeSquad(definition.units.map((unit) => unit.role));

export const getRecommendedSquad = (definition: MissionDefinition): UnitRole[] =>
  definition.squad ? canonicalizeSquad(definition.squad.recommended) : getDefaultSquad(definition);

export const getRequiredSquadRoles = (definition: MissionDefinition): UnitRole[] => {
  const allowed = definition.squad?.allowedCompositions ?? [];
  if (allowed.length === 0) return getDefaultSquad(definition);
  return SQUAD_ROLE_ORDER.filter((role) => allowed.every((composition) => composition.includes(role)));
};

export const isAllowedSquadSelection = (
  definition: MissionDefinition,
  requested: readonly UnitRole[],
): boolean => {
  const rules = definition.squad;
  if (!rules) return compositionKey(requested) === compositionKey(getDefaultSquad(definition));
  const canonical = canonicalizeSquad(requested);
  if (canonical.length !== rules.size || new Set(requested).size !== requested.length) return false;
  const allowed = new Set(rules.allowedCompositions.map(compositionKey));
  return allowed.has(compositionKey(canonical));
};

export const resolveMissionSquad = (
  definition: MissionDefinition,
  requested?: readonly UnitRole[],
): readonly UnitDefinition[] => {
  const roles = requested ? canonicalizeSquad(requested) : getDefaultSquad(definition);
  if (requested && !isAllowedSquadSelection(definition, requested)) {
    throw new Error(`Squad selection is not allowed for ${definition.id}.`);
  }

  if (!definition.squad) return definition.units;

  const units = roles.map((role) => {
    const position = definition.squad?.candidatePositions[role];
    if (!position) throw new Error(`${role} has no authored spawn in ${definition.id}.`);
    const authored = definition.units.find((unit) => unit.role === role);
    return {
      ...(authored ?? HERO_BLUEPRINTS[role]),
      position: { ...position },
    } satisfies UnitDefinition;
  });

  const occupied = [
    ...definition.obstacles,
    definition.vault.position,
    ...definition.enemies.map((enemy) => enemy.position),
    ...definition.objects.map((object) => object.position),
    definition.breach.position,
  ];
  if (
    units.some((unit) => unit.position.x < 0 || unit.position.y < 0 || unit.position.x >= definition.boardSize || unit.position.y >= definition.boardSize)
    ||
    units.some((unit) => occupied.some((position) => samePosition(position, unit.position)))
    || new Set(units.map((unit) => `${unit.position.x},${unit.position.y}`)).size !== units.length
  ) {
    throw new Error(`Squad spawns overlap blocked tiles in ${definition.id}.`);
  }

  return units;
};

export const getSquadHref = (missionId: string): string =>
  `/squad/${encodeURIComponent(missionId)}`;

export const sanitizeSquadSelections = (value: unknown): Record<string, UnitRole[]> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([missionId, roles]) => {
      if (
        !isPlayableMissionId(missionId)
        || !Array.isArray(roles)
        || !roles.every(isUnitRole)
        || !isAllowedSquadSelection(getMissionDefinition(missionId), roles)
      ) return [];
      return [[missionId, canonicalizeSquad(roles)]];
    }),
  );
};
