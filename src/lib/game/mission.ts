import { BOARD_SIZE, type MissionDefinition, type Position } from "./types";

export const position = (x: number, y: number): Position => ({ x, y });

export const PROTECT_THE_VAULT: MissionDefinition = {
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
};

export const DEFAULT_MISSION = PROTECT_THE_VAULT;
