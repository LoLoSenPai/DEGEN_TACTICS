import { BOARD_SIZE, type MissionDefinition, type Position } from "./types";

export const position = (x: number, y: number): Position => ({ x, y });

export const PROTECT_THE_VAULT = {
  id: "protect-the-vault",
  name: "Protect the Vault",
  boardSize: BOARD_SIZE,
  maxTurns: 5,
  objective: { kind: "survive", enemyPhases: 5 },
  obstacles: [position(2, 2), position(4, 2), position(2, 4), position(4, 4)],
  vault: {
    id: "vault",
    name: "The Vault",
    position: position(3, 3),
    maxHp: 10,
  },
  units: [
    {
      id: "guardian",
      name: "Guardian",
      role: "guardian",
      position: position(3, 2),
      maxHp: 12,
      moveRange: 2,
      attackDamage: 2,
      attackRange: 1,
      signatureName: "Shield Wall",
    },
    {
      id: "sniper",
      name: "Sniper",
      role: "sniper",
      position: position(1, 4),
      maxHp: 7,
      moveRange: 3,
      attackDamage: 3,
      attackRange: 3,
      signatureName: "Deadeye",
    },
    {
      id: "pusher",
      name: "Pusher",
      role: "pusher",
      position: position(5, 5),
      maxHp: 9,
      moveRange: 2,
      attackDamage: 1,
      attackRange: 1,
      signatureName: "Batter Up",
    },
  ],
  squad: {
    size: 3,
    candidatePositions: {
      guardian: position(3, 2),
      sniper: position(1, 4),
      pusher: position(5, 5),
      hacker: position(4, 5),
    },
    recommended: ["guardian", "sniper", "pusher"],
    allowedCompositions: [
      ["guardian", "sniper", "pusher"],
      ["guardian", "sniper", "hacker"],
      ["guardian", "pusher", "hacker"],
      ["sniper", "pusher", "hacker"],
    ],
  },
  enemies: [
    {
      id: "rugger-north",
      name: "Rugger North",
      kind: "rugger",
      position: position(3, 0),
      maxHp: 6,
      moveRange: 2,
      attackDamage: 3,
      initiative: 10,
    },
    {
      id: "rugger-east",
      name: "Rugger East",
      kind: "rugger",
      position: position(6, 5),
      maxHp: 6,
      moveRange: 2,
      attackDamage: 3,
      initiative: 10,
    },
    {
      id: "drainer",
      name: "Drainer",
      kind: "drainer",
      position: position(1, 1),
      maxHp: 4,
      moveRange: 3,
      attackDamage: 2,
      initiative: 20,
    },
  ],
  objects: [
    {
      id: "data-block",
      name: "Data Block",
      position: position(3, 5),
    },
  ],
  breach: {
    position: position(6, 3),
    warningTurn: 2,
    spawnTurn: 3,
    enemy: {
      id: "whale",
      name: "The Whale",
      kind: "whale",
      position: position(6, 3),
      maxHp: 10,
      moveRange: 1,
      attackDamage: 4,
      initiative: 30,
    },
  },
} as const satisfies MissionDefinition;

export const TRAINING_BASICS = {
  id: "training-basics",
  name: "First Contact",
  boardSize: BOARD_SIZE,
  maxTurns: 1,
  objective: { kind: "survive", enemyPhases: 1 },
  obstacles: [],
  vault: {
    id: "vault",
    name: "Training Vault",
    position: position(3, 5),
    maxHp: 10,
  },
  units: [
    {
      id: "guardian",
      name: "Guardian",
      role: "guardian",
      position: position(3, 3),
      maxHp: 12,
      moveRange: 2,
      attackDamage: 2,
      attackRange: 1,
      signatureName: "Shield Wall",
    },
  ],
  enemies: [
    {
      id: "rugger-training",
      name: "Training Rugger",
      kind: "rugger",
      position: position(3, 0),
      maxHp: 6,
      moveRange: 2,
      attackDamage: 3,
      initiative: 10,
    },
  ],
  objects: [],
  breach: {
    position: position(6, 6),
    warningTurn: 99,
    spawnTurn: 100,
    enemy: {
      id: "whale-training-unused",
      name: "The Whale",
      kind: "whale",
      position: position(6, 6),
      maxHp: 10,
      moveRange: 1,
      attackDamage: 4,
      initiative: 30,
    },
  },
} as const satisfies MissionDefinition;

export const TRAINING_SQUAD = {
  id: "training-squad",
  name: "Squad Turns",
  boardSize: BOARD_SIZE,
  maxTurns: 1,
  objective: { kind: "survive", enemyPhases: 1 },
  obstacles: [],
  vault: {
    id: "vault",
    name: "Training Vault",
    position: position(3, 5),
    maxHp: 10,
  },
  units: [
    {
      id: "guardian",
      name: "Guardian",
      role: "guardian",
      position: position(3, 3),
      maxHp: 12,
      moveRange: 2,
      attackDamage: 2,
      attackRange: 1,
      signatureName: "Shield Wall",
    },
    {
      id: "sniper",
      name: "Sniper",
      role: "sniper",
      position: position(2, 2),
      maxHp: 7,
      moveRange: 3,
      attackDamage: 3,
      attackRange: 3,
      signatureName: "Deadeye",
    },
  ],
  enemies: [
    {
      id: "rugger-training",
      name: "Training Rugger",
      kind: "rugger",
      position: position(3, 0),
      maxHp: 6,
      moveRange: 2,
      attackDamage: 3,
      initiative: 10,
    },
    {
      id: "drainer-training",
      name: "Training Drainer",
      kind: "drainer",
      position: position(2, 0),
      maxHp: 4,
      moveRange: 3,
      attackDamage: 2,
      initiative: 20,
    },
  ],
  objects: [],
  breach: {
    position: position(6, 6),
    warningTurn: 99,
    spawnTurn: 100,
    enemy: {
      id: "whale-training-unused",
      name: "The Whale",
      kind: "whale",
      position: position(6, 6),
      maxHp: 10,
      moveRange: 1,
      attackDamage: 4,
      initiative: 30,
    },
  },
} as const satisfies MissionDefinition;

export const TRAINING_MOMENTUM = {
  id: "training-momentum",
  name: "Push Control",
  boardSize: BOARD_SIZE,
  maxTurns: 5,
  objective: { kind: "survive", enemyPhases: 5 },
  obstacles: [position(4, 2)],
  vault: {
    id: "vault",
    name: "Training Vault",
    position: position(3, 2),
    maxHp: 10,
  },
  units: [
    {
      id: "pusher",
      name: "Pusher",
      role: "pusher",
      position: position(5, 5),
      maxHp: 9,
      moveRange: 2,
      attackDamage: 1,
      attackRange: 1,
      signatureName: "Batter Up",
    },
  ],
  enemies: [
    {
      id: "rugger-dummy",
      name: "Collision Dummy",
      kind: "rugger",
      position: position(4, 3),
      maxHp: 1,
      moveRange: 0,
      attackDamage: 0,
      initiative: 10,
    },
  ],
  objects: [
    {
      id: "data-block",
      name: "Data Block",
      position: position(3, 5),
    },
  ],
  breach: {
    position: position(6, 3),
    warningTurn: 2,
    spawnTurn: 3,
    enemy: {
      id: "whale-training",
      name: "The Whale",
      kind: "whale",
      position: position(6, 3),
      maxHp: 10,
      moveRange: 1,
      attackDamage: 4,
      initiative: 30,
    },
  },
} as const satisfies MissionDefinition;

export const TRAINING_OVERRIDE = {
  id: "training-override",
  name: "System Override",
  boardSize: BOARD_SIZE,
  maxTurns: 2,
  objective: { kind: "survive", enemyPhases: 2 },
  obstacles: [],
  vault: {
    id: "training-relay",
    name: "Training Relay",
    position: position(3, 5),
    maxHp: 10,
  },
  units: [
    {
      id: "hacker",
      name: "Hacker",
      role: "hacker",
      position: position(3, 2),
      maxHp: 6,
      moveRange: 3,
      attackDamage: 0,
      attackRange: 3,
      signatureName: "Blackout",
    },
    {
      id: "sniper",
      name: "Sniper",
      role: "sniper",
      position: position(0, 1),
      maxHp: 7,
      moveRange: 3,
      attackDamage: 3,
      attackRange: 3,
      signatureName: "Deadeye",
    },
  ],
  enemies: [
    {
      id: "rugger-override",
      name: "Training Rugger",
      kind: "rugger",
      position: position(3, 0),
      maxHp: 6,
      moveRange: 2,
      attackDamage: 3,
      initiative: 10,
    },
    {
      id: "sentinel-override",
      name: "Lane Sentinel",
      kind: "sentinel",
      position: position(6, 1),
      maxHp: 6,
      moveRange: 0,
      attackDamage: 0,
      initiative: 20,
    },
  ],
  objects: [],
  breach: {
    position: position(6, 6),
    warningTurn: 99,
    spawnTurn: 100,
    enemy: {
      id: "whale-training-override-unused",
      name: "The Whale",
      kind: "whale",
      position: position(6, 6),
      maxHp: 10,
      moveRange: 1,
      attackDamage: 4,
      initiative: 30,
    },
  },
} as const satisfies MissionDefinition;

export const DATA_EXTRACTION = {
  id: "data-extraction",
  name: "Data Extraction",
  boardSize: BOARD_SIZE,
  maxTurns: 5,
  objective: {
    kind: "extract-object",
    objectId: "data-block",
    destination: position(4, 2),
  },
  obstacles: [
    position(0, 1),
    position(2, 1),
    position(6, 1),
    position(3, 3),
    position(3, 4),
  ],
  vault: {
    id: "extraction-rig",
    name: "Extraction Rig",
    position: position(5, 2),
    maxHp: 10,
  },
  units: [
    {
      id: "guardian",
      name: "Guardian",
      role: "guardian",
      position: position(5, 1),
      maxHp: 12,
      moveRange: 2,
      attackDamage: 2,
      attackRange: 1,
      signatureName: "Shield Wall",
    },
    {
      id: "sniper",
      name: "Sniper",
      role: "sniper",
      position: position(1, 4),
      maxHp: 7,
      moveRange: 3,
      attackDamage: 3,
      attackRange: 3,
      signatureName: "Deadeye",
    },
    {
      id: "pusher",
      name: "Pusher",
      role: "pusher",
      position: position(2, 5),
      maxHp: 9,
      moveRange: 2,
      attackDamage: 1,
      attackRange: 1,
      signatureName: "Batter Up",
    },
  ],
  squad: {
    size: 3,
    candidatePositions: {
      guardian: position(5, 1),
      sniper: position(1, 4),
      pusher: position(2, 5),
      hacker: position(4, 5),
    },
    recommended: ["sniper", "pusher", "hacker"],
    allowedCompositions: [
      ["guardian", "sniper", "pusher"],
      ["guardian", "pusher", "hacker"],
      ["sniper", "pusher", "hacker"],
    ],
  },
  enemies: [
    {
      id: "rugger-extraction",
      name: "Rig Breaker",
      kind: "rugger",
      position: position(4, 1),
      maxHp: 6,
      moveRange: 2,
      attackDamage: 3,
      initiative: 10,
    },
    {
      id: "sentinel-extraction",
      name: "Lane Sentinel",
      kind: "sentinel",
      position: position(4, 2),
      maxHp: 6,
      moveRange: 0,
      attackDamage: 0,
      initiative: 20,
    },
  ],
  objects: [
    {
      id: "data-block",
      name: "Data Block",
      position: position(2, 4),
    },
  ],
  // The common rules engine keeps one scripted breach slot. On this operation
  // it sits under an existing barricade and never activates.
  breach: {
    position: position(3, 3),
    warningTurn: 99,
    spawnTurn: 100,
    enemy: {
      id: "whale-extraction-unused",
      name: "The Whale",
      kind: "whale",
      position: position(3, 3),
      maxHp: 10,
      moveRange: 1,
      attackDamage: 4,
      initiative: 30,
    },
  },
} as const satisfies MissionDefinition;

export const BREAK_THE_BREACH = {
  id: "break-the-breach",
  name: "Break the Breach",
  boardSize: BOARD_SIZE,
  maxTurns: 5,
  objective: {
    kind: "break-breach",
    enemyId: "breach-whale",
    enemyPhases: 5,
    anvilObjectId: "data-block",
    anvilDestination: position(5, 1),
  },
  obstacles: [
    position(1, 1),
    position(6, 1),
    position(2, 3),
    position(2, 4),
    position(4, 4),
    position(6, 4),
  ],
  vault: {
    id: "seal-generator",
    name: "Seal Generator",
    position: position(3, 3),
    maxHp: 4,
  },
  units: [
    {
      id: "guardian",
      name: "Guardian",
      role: "guardian",
      position: position(3, 2),
      maxHp: 12,
      moveRange: 2,
      attackDamage: 2,
      attackRange: 1,
      signatureName: "Shield Wall",
    },
    {
      id: "sniper",
      name: "Sniper",
      role: "sniper",
      position: position(1, 2),
      maxHp: 7,
      moveRange: 3,
      attackDamage: 3,
      attackRange: 3,
      signatureName: "Deadeye",
    },
    {
      id: "pusher",
      name: "Pusher",
      role: "pusher",
      position: position(5, 4),
      maxHp: 9,
      moveRange: 2,
      attackDamage: 1,
      attackRange: 1,
      signatureName: "Batter Up",
    },
  ],
  squad: {
    size: 3,
    candidatePositions: {
      guardian: position(3, 2),
      sniper: position(1, 2),
      pusher: position(5, 4),
      hacker: position(4, 5),
    },
    recommended: ["guardian", "sniper", "pusher"],
    allowedCompositions: [
      ["guardian", "sniper", "pusher"],
    ],
  },
  enemies: [],
  objects: [
    {
      id: "data-block",
      name: "Data Block",
      position: position(5, 2),
    },
  ],
  breach: {
    position: position(6, 3),
    warningTurn: 1,
    spawnTurn: 2,
    enemy: {
      id: "breach-whale",
      name: "Breach Whale",
      kind: "whale",
      position: position(6, 3),
      maxHp: 12,
      moveRange: 1,
      attackDamage: 4,
      initiative: 30,
    },
  },
} as const satisfies MissionDefinition;

export const DEFAULT_MISSION = PROTECT_THE_VAULT;

export const MISSION_REGISTRY = {
  [PROTECT_THE_VAULT.id]: PROTECT_THE_VAULT,
  [DATA_EXTRACTION.id]: DATA_EXTRACTION,
  [BREAK_THE_BREACH.id]: BREAK_THE_BREACH,
  [TRAINING_BASICS.id]: TRAINING_BASICS,
  [TRAINING_SQUAD.id]: TRAINING_SQUAD,
  [TRAINING_MOMENTUM.id]: TRAINING_MOMENTUM,
  [TRAINING_OVERRIDE.id]: TRAINING_OVERRIDE,
} as const satisfies Readonly<Record<string, MissionDefinition>>;

export type MissionId = keyof typeof MISSION_REGISTRY;

export interface OperationMetadata {
  readonly id:
    | typeof PROTECT_THE_VAULT.id
    | typeof DATA_EXTRACTION.id
    | typeof BREAK_THE_BREACH.id;
  readonly order: 1 | 2 | 3;
  readonly eyebrow: string;
  readonly title: string;
  readonly shortObjective: string;
  readonly integrityLabel: string;
  readonly unlockAfter?: typeof PROTECT_THE_VAULT.id | typeof DATA_EXTRACTION.id;
  readonly victoryTitle: string;
  readonly victoryMessage: string;
  readonly defeatTitle: string;
  readonly defeatMessage: string;
}

export const PLAYABLE_OPERATIONS = [
  {
    id: PROTECT_THE_VAULT.id,
    order: 1,
    eyebrow: "Operation 01",
    title: PROTECT_THE_VAULT.name,
    shortObjective: "Survive 5 turns",
    integrityLabel: "Vault",
    unlockAfter: undefined,
    victoryTitle: "Vault Secured",
    victoryMessage: "The Vault held. The district is still ours.",
    defeatTitle: "Mission Failed",
    defeatMessage: "The line broke. Get back in there.",
  },
  {
    id: DATA_EXTRACTION.id,
    order: 2,
    eyebrow: "Operation 02",
    title: DATA_EXTRACTION.name,
    shortObjective: "Push the Data Block onto the extraction zone",
    integrityLabel: "Extraction Rig",
    unlockAfter: PROTECT_THE_VAULT.id,
    victoryTitle: "Package Recovered",
    victoryMessage: "The Data Block made it out.",
    defeatTitle: "Extraction Failed",
    defeatMessage: "The package never reached the zone.",
  },
  {
    id: BREAK_THE_BREACH.id,
    order: 3,
    eyebrow: "Operation 03",
    title: BREAK_THE_BREACH.name,
    shortObjective: "Break the Whale's charge, then destroy it",
    integrityLabel: "Seal Generator",
    unlockAfter: DATA_EXTRACTION.id,
    victoryTitle: "Breach Broken",
    victoryMessage: "The Whale is down. The fracture is sealed.",
    defeatTitle: "Breach Overrun",
    defeatMessage: "The Seal collapsed before the Whale was neutralized.",
  },
] as const satisfies readonly OperationMetadata[];

export type PlayableMissionId = (typeof PLAYABLE_OPERATIONS)[number]["id"];

export const isMissionId = (missionId: string): missionId is MissionId =>
  Object.prototype.hasOwnProperty.call(MISSION_REGISTRY, missionId);

export const isPlayableMissionId = (
  missionId: string,
): missionId is PlayableMissionId =>
  PLAYABLE_OPERATIONS.some((operation) => operation.id === missionId);

export const getOperationMetadata = (
  missionId: string,
): OperationMetadata | null =>
  PLAYABLE_OPERATIONS.find((operation) => operation.id === missionId) ?? null;

export const isOperationUnlocked = (
  missionId: PlayableMissionId,
  completedMissionIds: readonly string[],
): boolean => {
  const operation = getOperationMetadata(missionId);
  return Boolean(operation && (!operation.unlockAfter || completedMissionIds.includes(operation.unlockAfter)));
};

export const getNextOperationId = (
  completedMissionIds: readonly string[],
): PlayableMissionId => {
  const nextOperation = PLAYABLE_OPERATIONS.find(
    (operation) =>
      !completedMissionIds.includes(operation.id)
      && isOperationUnlocked(operation.id, completedMissionIds),
  );
  return nextOperation?.id ?? BREAK_THE_BREACH.id;
};

export const getFollowingOperationId = (
  missionId: string,
): PlayableMissionId | null => {
  const index = PLAYABLE_OPERATIONS.findIndex((operation) => operation.id === missionId);
  return index >= 0 ? (PLAYABLE_OPERATIONS[index + 1]?.id ?? null) : null;
};

export const getBattleHref = (missionId: string): string =>
  `/battle/${encodeURIComponent(missionId)}`;
export type TrainingMissionId =
  | typeof TRAINING_BASICS.id
  | typeof TRAINING_SQUAD.id
  | typeof TRAINING_MOMENTUM.id
  | typeof TRAINING_OVERRIDE.id;

export interface TrainingLessonMetadata {
  readonly order: 1 | 2 | 3 | 4;
  readonly missionId: TrainingMissionId;
  readonly title: string;
  readonly objective: string;
}

export const TRAINING_LESSONS = [
  {
    order: 1,
    missionId: TRAINING_BASICS.id,
    title: "First Contact",
    objective: "Move, attack, and read exact enemy intents.",
  },
  {
    order: 2,
    missionId: TRAINING_SQUAD.id,
    title: "Squad Turns",
    objective: "Activate the squad and time one-charge signatures.",
  },
  {
    order: 3,
    missionId: TRAINING_MOMENTUM.id,
    title: "Push Control",
    objective: "Push objects, cause collisions, and interrupt a locked attack.",
  },
  {
    order: 4,
    missionId: TRAINING_OVERRIDE.id,
    title: "System Override",
    objective: "Rewrite one exact intent, then shut down an enemy activation.",
  },
] as const satisfies readonly TrainingLessonMetadata[];

const TRAINING_MISSION_IDS = new Set<string>(
  TRAINING_LESSONS.map((lesson) => lesson.missionId),
);

export const isTrainingMissionId = (
  missionId: string,
): missionId is TrainingMissionId => TRAINING_MISSION_IDS.has(missionId);

export const getMissionDefinition = (
  missionId: string = DEFAULT_MISSION.id,
): MissionDefinition =>
  MISSION_REGISTRY[missionId as MissionId] ?? DEFAULT_MISSION;
