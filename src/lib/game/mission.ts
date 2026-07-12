import { BOARD_SIZE, type MissionDefinition, type Position } from "./types";

export const position = (x: number, y: number): Position => ({ x, y });

export const PROTECT_THE_VAULT = {
  id: "protect-the-vault",
  name: "Protect the Vault",
  boardSize: BOARD_SIZE,
  maxTurns: 5,
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
  name: "Action Economy",
  boardSize: BOARD_SIZE,
  maxTurns: 1,
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
  name: "Momentum",
  boardSize: BOARD_SIZE,
  maxTurns: 5,
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

export const DEFAULT_MISSION = PROTECT_THE_VAULT;

export const MISSION_REGISTRY = {
  [PROTECT_THE_VAULT.id]: PROTECT_THE_VAULT,
  [TRAINING_BASICS.id]: TRAINING_BASICS,
  [TRAINING_SQUAD.id]: TRAINING_SQUAD,
  [TRAINING_MOMENTUM.id]: TRAINING_MOMENTUM,
} as const satisfies Readonly<Record<string, MissionDefinition>>;

export type MissionId = keyof typeof MISSION_REGISTRY;
export type TrainingMissionId =
  | typeof TRAINING_BASICS.id
  | typeof TRAINING_SQUAD.id
  | typeof TRAINING_MOMENTUM.id;

export interface TrainingLessonMetadata {
  readonly order: 1 | 2 | 3;
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
    title: "Action Economy",
    objective: "Activate the squad and time one-charge signatures.",
  },
  {
    order: 3,
    missionId: TRAINING_MOMENTUM.id,
    title: "Momentum",
    objective: "Push objects, cause collisions, and interrupt a locked attack.",
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
