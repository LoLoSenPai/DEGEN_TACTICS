export const BOARD_SIZE = 7 as const;

export type Position = Readonly<{ x: number; y: number }>;
export type Direction = "north" | "east" | "south" | "west";
export type GamePhase = "player" | "enemy" | "victory" | "defeat";
export type UnitRole = "guardian" | "sniper" | "pusher" | "hacker";
export type EnemyKind = "rugger" | "drainer" | "whale" | "sentinel";
export type EnemyDisruptionKind = "jam" | "blackout";
export type PushKind = "shove" | "batter-up";
export type PushTargetKind = "enemy" | "object";
export type MissionOutcome = "victory" | "defeat";
export type MissionOutcomeReason =
  | "vault-destroyed"
  | "squad-eliminated"
  | "survived-five-turns"
  | "data-extracted"
  | "extraction-timeout"
  | "breach-broken"
  | "breach-overrun";

export type MissionObjective =
  | Readonly<{ kind: "survive"; enemyPhases: number }>
  | Readonly<{
      kind: "extract-object";
      objectId: string;
      destination: Position;
    }>
  | Readonly<{
      kind: "break-breach";
      enemyId: string;
      enemyPhases: number;
      anvilObjectId: string;
      anvilDestination: Position;
    }>;

export interface Tile {
  readonly position: Position;
  readonly kind: "floor" | "obstacle" | "vault" | "breach";
}

export interface UnitDefinition {
  readonly id: string;
  readonly name: string;
  readonly role: UnitRole;
  readonly position: Position;
  readonly maxHp: number;
  readonly moveRange: number;
  readonly attackDamage: number;
  readonly attackRange: number;
  readonly signatureName: string;
}

export interface MissionSquadRules {
  readonly size: 3;
  readonly candidatePositions: Readonly<Partial<Record<UnitRole, Position>>>;
  readonly recommended: readonly UnitRole[];
  readonly allowedCompositions: readonly (readonly UnitRole[])[];
}

export interface EnemyDefinition {
  readonly id: string;
  readonly name: string;
  readonly kind: EnemyKind;
  readonly position: Position;
  readonly maxHp: number;
  readonly moveRange: number;
  readonly attackDamage: number;
  readonly initiative: number;
}

export interface PushableObjectDefinition {
  readonly id: string;
  readonly name: string;
  readonly position: Position;
}

export interface MissionDefinition {
  readonly id: string;
  readonly name: string;
  readonly boardSize: typeof BOARD_SIZE;
  readonly maxTurns: number;
  readonly objective: MissionObjective;
  readonly obstacles: readonly Position[];
  readonly vault: Readonly<{
    id: string;
    name: string;
    position: Position;
    maxHp: number;
  }>;
  readonly units: readonly UnitDefinition[];
  readonly squad?: MissionSquadRules;
  readonly enemies: readonly EnemyDefinition[];
  readonly objects: readonly PushableObjectDefinition[];
  readonly breach: Readonly<{
    position: Position;
    warningTurn: number;
    spawnTurn: number;
    enemy: EnemyDefinition;
  }>;
}

export interface ShieldStatus {
  readonly value: number;
  readonly expiresAfterEnemyPhase: number;
}

export interface PlayerUnit {
  readonly id: string;
  readonly name: string;
  readonly role: UnitRole;
  readonly position: Position;
  readonly hp: number;
  readonly maxHp: number;
  readonly moveRange: number;
  readonly attackDamage: number;
  readonly attackRange: number;
  readonly signatureName: string;
  readonly signatureAvailable: boolean;
  readonly hasMoved: boolean;
  readonly hasActed: boolean;
  readonly shield: ShieldStatus | null;
}

export interface Enemy {
  readonly id: string;
  readonly name: string;
  readonly kind: EnemyKind;
  readonly position: Position;
  readonly hp: number;
  readonly maxHp: number;
  readonly moveRange: number;
  readonly attackDamage: number;
  readonly initiative: number;
  readonly whaleState?: "ready" | "charging" | "staggered";
  readonly lockedArea?: readonly Position[];
  readonly facing?: Direction;
  readonly disruption?: Readonly<{
    kind: EnemyDisruptionKind;
    sourceUnitId: string;
  }>;
}

export interface PushableObject {
  readonly id: string;
  readonly name: string;
  readonly position: Position;
}

export interface Vault {
  readonly id: string;
  readonly name: string;
  readonly position: Position;
  readonly hp: number;
  readonly maxHp: number;
}

export interface BreachState {
  readonly position: Position;
  readonly status: "dormant" | "incoming" | "spawned";
}

export interface GameState {
  readonly missionId: string;
  readonly turn: number;
  readonly maxTurns: number;
  readonly objective: MissionObjective;
  readonly completedEnemyPhases: number;
  readonly phase: GamePhase;
  readonly units: readonly PlayerUnit[];
  readonly enemies: readonly Enemy[];
  readonly objects: readonly PushableObject[];
  readonly vault: Vault;
  readonly obstacles: readonly Position[];
  readonly breach: BreachState;
  readonly defeatedEnemies: number;
  readonly initialSquadSize: number;
  readonly vaultEverDamaged: boolean;
  readonly whaleChargeCancelled: boolean;
  readonly outcomeReason?: MissionOutcomeReason;
}

export type IntentTarget = Readonly<{
  id: string;
  kind: "unit" | "vault";
  position: Position;
  expectedDamage: number;
}>;

export type EnemySupportEffect = "intercept-direct-attack";

export type EnemySupportTarget = Readonly<{
  id: string;
  kind: "enemy";
  position: Position;
  effect: EnemySupportEffect;
}>;

export type EnemyIntentAction =
  | "advance"
  | "attack"
  | "charge"
  | "slam"
  | "staggered"
  | "guard"
  | "idle"
  | "hold";

export interface EnemyIntent {
  readonly enemyId: string;
  readonly enemyKind: EnemyKind;
  readonly order: number;
  readonly action: EnemyIntentAction;
  readonly from: Position;
  readonly path: readonly Position[];
  readonly destination: Position;
  readonly target?: IntentTarget;
  readonly targets: readonly IntentTarget[];
  readonly area: readonly Position[];
  readonly damage: number;
  readonly special?: "drain" | "lock-cone" | "ground-slam" | "stagger-skip" | "intercept-grid" | "system-shutdown";
  readonly disruption?: EnemyDisruptionKind;
  readonly damageReduction?: number;
  readonly originalAction?: Exclude<EnemyIntentAction, "hold">;
  readonly guardedEnemyIds?: readonly string[];
  readonly supportTargets?: readonly EnemySupportTarget[];
  readonly facing?: Direction;
}

export interface EnemyTurnPlan {
  readonly turn: number;
  readonly fingerprint: string;
  readonly intents: readonly EnemyIntent[];
}

export type GameEvent =
  | Readonly<{ type: "action-rejected"; message: string }>
  | Readonly<{ type: "unit-moved"; unitId: string; from: Position; to: Position }>
  | Readonly<{ type: "unit-waited"; unitId: string }>
  | Readonly<{ type: "unit-attacked"; unitId: string; enemyId: string; damage: number; deadeye: boolean }>
  | Readonly<{ type: "shield-applied"; sourceId: string; unitIds: readonly string[]; value: number }>
  | Readonly<{ type: "target-pushed"; sourceId: string; targetId: string; targetKind: PushTargetKind; from: Position; to: Position; distance: number; ability: PushKind }>
  | Readonly<{ type: "collision"; sourceId: string; targetId: string; targetKind: PushTargetKind; damage: number; ability: PushKind }>
  | Readonly<{ type: "enemy-defeated"; enemyId: string }>
  | Readonly<{ type: "enemy-moved"; enemyId: string; from: Position; to: Position; path: readonly Position[] }>
  | Readonly<{ type: "damage"; sourceId: string; targetId: string; amount: number; absorbed: number }>
  | Readonly<{ type: "enemy-healed"; enemyId: string; amount: number }>
  | Readonly<{ type: "attack-intercepted"; unitId: string; intendedEnemyId: string; interceptorId: string; damage: number }>
  | Readonly<{ type: "enemy-disrupted"; unitId: string; enemyId: string; kind: EnemyDisruptionKind; damageReduction: number }>
  | Readonly<{ type: "enemy-disruption-resolved"; enemyId: string; kind: EnemyDisruptionKind }>
  | Readonly<{ type: "sentinel-fortified"; enemyId: string; area: readonly Position[]; guardedEnemyIds: readonly string[] }>
  | Readonly<{ type: "whale-cone-locked"; enemyId: string; area: readonly Position[]; facing: Direction }>
  | Readonly<{ type: "whale-charge-cancelled"; enemyId: string }>
  | Readonly<{ type: "whale-staggered"; enemyId: string }>
  | Readonly<{ type: "breach-warning"; position: Position }>
  | Readonly<{ type: "enemy-spawned"; enemyId: string; position: Position }>
  | Readonly<{ type: "object-extracted"; objectId: string; position: Position }>
  | Readonly<{ type: "turn-started"; turn: number }>
  | Readonly<{ type: "mission-ended"; outcome: MissionOutcome; reason: NonNullable<GameState["outcomeReason"]> }>;

export interface GameTransition {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

export interface PushTarget {
  readonly id: string;
  readonly kind: PushTargetKind;
  readonly position: Position;
  readonly canMove: boolean;
}

export interface OutcomeCheck {
  readonly outcome: MissionOutcome | null;
  readonly reason: GameState["outcomeReason"] | null;
}

export interface ScoreBreakdown {
  readonly victory: number;
  readonly vaultIntegrity: number;
  readonly enemiesDefeated: number;
  readonly survivingUnits: number;
  readonly flawlessSquad: number;
  readonly untouchedVault: number;
  readonly tempo: number;
  readonly lostUnits: number;
  readonly total: number;
  readonly rank: "S" | "A" | "B" | "C";
}

export type MissionMedalId =
  | "vault-untouched"
  | "full-squad"
  | "charge-broken"
  | "express-transfer"
  | "rig-untouched"
  | "breach-window";

export interface MissionMedal {
  readonly id: MissionMedalId;
  readonly name: string;
  readonly description: string;
  readonly earned: boolean;
}

export interface RankGoal {
  readonly nextRank: "S" | "A" | "B" | null;
  readonly targetScore: number | null;
  readonly pointsNeeded: number;
  readonly requiresVictory: boolean;
}

export interface MissionResult {
  readonly missionId: string;
  readonly outcome: MissionOutcome;
  readonly reason: NonNullable<GameState["outcomeReason"]>;
  readonly score: ScoreBreakdown;
  readonly vaultHp: number;
  readonly vaultMaxHp: number;
  readonly turnsSurvived: number;
  readonly enemiesDefeated: number;
  readonly survivingUnits: number;
  readonly lostUnits: number;
  readonly xpPreview: number;
  readonly completed: boolean;
  readonly medals: readonly MissionMedal[];
}

export interface PlayerIdentity {
  readonly guestId: string;
  readonly walletAddress?: string;
  readonly displayName: string;
}
