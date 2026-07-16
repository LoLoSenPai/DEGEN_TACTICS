# Implementation Notes

## Technical baseline

- Next.js `15.5.12`, App Router, React 19, and strict TypeScript.
- Tailwind CSS 4 through `@tailwindcss/postcss`, with canonical CSS variables in `src/styles/tokens.css`.
- Zustand 5 for the client command/state layer and `clsx` for conditional classes.
- Vitest 4 for pure game and persistence tests.
- A semantic 7x7 DOM grid; no canvas engine, Phaser, database, RPC, or wallet runtime.

The package manager is pinned in `package.json`. Application behavior must pass `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. The current suite contains 88 deterministic tests.

## Current product surface

The active product flow is intentionally game-first:

```text
Title
  |-- Continue / Play as Guest --> dynamic Battle --> Results
  |-- Operations ---------------> dynamic Battle --> Results
  `-- Field Training -----------> training Battle --> Training
```

There is no required HQ, campaign map, or loadout step. The old mission and loadout URLs remain only as redirects so saved links do not strand the player.

| Route | Lifecycle behavior |
| --- | --- |
| `/` | Hydrates local progress, shows the title menu, and deploys to the next operation |
| `/operations` | Shows all three operations, including prerequisite, completion, and best score state |
| `/training` | Shows three optional chapters and their local completion state |
| `/battle/[missionId]` | Validates the registry ID, starts that mission fresh, mounts controls/serializer, and rejects a locked operation |
| `/battle/protect-the-vault` | Legacy-compatible battle entry |
| `/results` | Reads `lastResult`, renders operation-specific scoring/medals, retries the same mission, or continues to the next unlocked operation |
| `/missions`, `/loadout/protect-the-vault` | Redirect to `/operations` |

`getBattleHref(missionId)` is the single route builder. Battle presentation and results resolve mission copy through operation metadata rather than branching on a page pathname.

## System boundaries

```text
Route/component event
        |
        v
Zustand command layer ------> UI-only selection / action mode
        |
        v
Pure game command(state, input)
        |------> next immutable GameState
        `------> ordered GameEvent[]
                         |
                         v
                  animation + combat log
```

- `src/app` owns Title, Operations, Training, dynamic Battle, and Results route composition.
- `src/components` owns menu, tutorial, battlefield, animation, and result presentation.
- `src/lib/game` owns types, the mission registry, pathfinding, combat, pushes, objective checks, enemy planning/resolution, scoring, mastery, and storage validation.
- `src/store` owns the active client session, UI modes, commands, event playback, and the small persisted profile/result/progression slice.
- `src/lib/solana` is documentation-only and defines a future integration boundary.

Game rules never depend on React, the router, DOM APIs, animation timing, LocalStorage, or wall-clock time.

## Domain model

`MissionDefinition` and `GameState` carry a discriminated objective union:

```ts
type MissionObjective =
  | Readonly<{
      kind: "survive";
      enemyPhases: number;
    }>
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
```

- **Protect the Vault** uses `{ kind: "survive", enemyPhases: 5 }`.
- **Data Extraction** uses `{ kind: "extract-object", objectId: "data-block", destination: E3 }`.
- **Break the Breach** uses `{ kind: "break-breach", enemyId: "breach-whale", enemyPhases: 5, anvilObjectId: "data-block", anvilDestination: F2 }`.

The objective is cloned into the immutable session state. Objective checks therefore remain deterministic and do not depend on the current URL. The mission registry also supplies starting entities, structure, terrain, turn limit, breach script, and stable IDs.

Other core values are `Tile`, `PlayerUnit`, `Enemy`, `PushableObject`, `Vault`, `EnemyIntent`, `EnemyTurnPlan`, `GameEvent`, `MissionResult`, `ScoreBreakdown`, and `MissionMedal`. Stable entity IDs are part of deterministic ordering and are never regenerated during a session.

### Pure public rules

```ts
createInitialGameState(mission?)
getValidMoves(state, unitId)
getAttackableTargets(state, unitId)
getPushTargets(state, unitId)
moveUnit(state, unitId, destination)
attackEnemy(state, unitId, enemyId, attackKind?)
activateDeadeye(state, unitId, enemyId)
pushTarget(state, unitId, targetId, pushKind)
pushEnemy(state, unitId, enemyId, pushKind)
applyShield(state, unitId)
waitUnit(state, unitId)
calculateEnemyIntent(state, enemyId)
calculateEnemyPlan(state)
resolveEnemyTurn(state, plan)
checkVictoryDefeat(state)
calculateScore(state, outcome)
createMissionResult(state, outcome, reason?)
```

Queries derive data without mutation. Commands return `{ state, events }`. Invalid commands return the original state with no partial rule application.

## Objective resolution

### Survival

After each exact enemy phase, the engine increments `completedEnemyPhases`. Protect the Vault wins when it reaches the configured five phases. Vault destruction or total squad loss is checked first and therefore takes precedence during phase 5.

### Extraction

After a successful Data Block push, the engine compares the configured object ID and final coordinate with the extraction destination. Exact delivery to E3 produces, in order:

```text
target-pushed
object-extracted
mission-ended (victory, data-extracted)
```

Victory is immediate; React does not infer it from tile styling. If enemy phase 5 completes without delivery, the engine returns `extraction-timeout`. Structure destruction and squad elimination retain defeat priority.

### Breach target

Break the Breach begins with an incoming breach and no target in `enemies`; absence before spawn is therefore not success. The Whale spawns at G4 on player Turn 2. Once `breach.status` is `spawned`, removing the exact configured `enemyId` completes the objective immediately with `breach-broken`. If it remains alive after the configured fifth enemy phase, the result is `breach-overrun`.

Both `attackEnemy` and `pushTarget` pass their final immutable state through the same objective-terminal helper. A fatal basic attack, Deadeye, Shove collision, or Batter Up collision therefore appends `mission-ended` after the damage/defeat events instead of waiting for End Turn. The absent target, anvil object ID, and F2 anvil destination are included in the state fingerprint and serializer contract.

## Determinism and exact intents

Enemy intent is a runtime invariant, not decorative UI copy.

1. Create a complete `EnemyTurnPlan` from the current world state.
2. Plan enemies by mission initiative, then stable entity ID.
3. Within pathfinding, expand equal candidates north, east, south, west.
4. Simulate earlier planned moves in a virtual state so later intents account for sequential occupancy.
5. After every successful player command that changes world state, replace the displayed plan with a freshly calculated complete plan.
6. On End Turn, snapshot the displayed plan and pass that exact value to `resolveEnemyTurn`.
7. Resolution follows stored paths, destinations, targets, areas, values, and order. It does not retarget, reroll, or recalculate between actions.

Selection, hover, tutorial copy, and animation progress are UI-only and do not trigger replanning. Identical input states produce byte-equivalent serialized plans.

Protect the Vault adds its breach warning before Turn 2 planning and Whale spawn before Turn 3 planning. Data Extraction's inactive breach slot is placed under an existing obstacle and uses unreachable script turns, so it has no visible breach or Whale event. Break the Breach starts with G4 incoming, spawns its 12-HP Whale before Turn 2 planning, and deterministically produces G4 -> F4 with the west cone E4/D3/D4/D5 when the authored setup is followed.

## Events and animation

Engine events describe movement, attack, damage, shield, push, collision, defeat, spawn, Whale state, extraction, turn change, and mission end. They contain stable entity/tile references and numeric results, never CSS classes or durations.

The store applies player transitions immediately and derives combat log, sprite state, path travel, impacts, shields, damage numbers, KO sequences, and banners from those ordered events. Terminal player attacks and collision pushes persist their result, best score, and completed mission only after their readable impact/death playback finishes; the already-computed engine result never changes. A skipped animation, slow device, or reduced-motion preference cannot change a rule result.

## Client store and persistence

### Transient session

The active `GameState`, enemy plan, selected unit/target, action mode, hover state, highlights, one-step movement undo, event queue, display effects, interaction lock, and timers are memory-only.

Undo is cleared by attack, ability, Wait, End Turn, mission reset, or terminal outcome. It never enters LocalStorage.

### Persisted slice

LocalStorage key: `degen-tactics:v1`.

Persist only:

```ts
type PlayerIdentity = {
  guestId: string;
  walletAddress?: string;
  displayName: string;
};

type PersistedProfile = {
  identity: PlayerIdentity;
  bestScores: Record<string, number>;
  completedMissionIds: string[];
  lastResult?: MissionResult;
  settings: {
    soundMuted: boolean;
    tutorialComplete: boolean;
    trainingCompleted: number;
  };
};
```

The Zustand slice stores these as sibling fields; the grouped type only documents the persistence boundary. Only victories append a mission ID, duplicates are removed, and unlocks follow Protect the Vault -> Data Extraction -> Break the Breach. Existing best scores can also safely migrate into completion progress. A new score replaces a mission best only when higher.

Storage reads use version/schema guards and `try/catch`. Missing, corrupt, incompatible, or unavailable storage produces default guest data without blocking startup. Active battle state is never persisted.

## Development state serializer

Battle exposes `window.render_game_to_text()` in development/test builds. The deterministic JSON string includes:

- Mission ID, board size, phase, turn, and completed enemy phases.
- The objective kind; extraction snapshots include object ID, destination, and delivered state, while breach snapshots include target ID, spawned/defeated state, anvil object, and anvil destination.
- Protected structure coordinate, integrity, and pristine/damaged state.
- Squad state, signature availability, enemies, objects, breach, selection, action mode, highlights, and interaction lock.
- Exact intent order, path, destination, target, damage, area, and special state.
- Terminal outcome when present.

Coordinates use board notation consistently. Arrays are stably ordered; timestamps, DOM IDs, and animation elapsed time are excluded.

## UI implementation rules

- Grid tiles are semantic buttons with descriptive ARIA labels and visible keyboard focus.
- Movement, attack, push, danger, locked area, cargo route, and token overlays remain separate channels.
- Data Extraction renders its destination and route from `game.objective`; it never hard-codes E3 in the component.
- Break the Breach renders its setup route and contextual coaching from `anvilObjectId` and `anvilDestination`; it never hard-codes F2 in presentation code.
- Action controls derive legality from engine selectors. Components do not duplicate range, line-of-sight, charge, extraction, or activation rules.
- Enemy intent cards render stored plan fields directly.
- Results render the stored breakdown and mission metadata. Retry uses the result mission ID; Next Operation uses the authored operation order.
- Below 1024px, battle renders the designed viewport notice instead of a compressed board.
- Connect Wallet remains clearly disabled; future features do not clutter the battle HUD.

## Testing strategy

The current 88-test suite covers:

- Movement, occupancy, bounds, obstacles, shortest paths, and no diagonal traversal.
- Melee/Sniper targeting, line of sight, activation limits, Wait, signatures, and undo invalidation.
- Shields, damage, deaths, collision boundaries, Data Block movement, and Whale interruption.
- Rugger/Drainer targeting, sequential occupancy, stable initiative, and exact-plan equivalence.
- Protect's breach warning, Whale spawn/charge/slam/cancel/stagger, phase-5 timing, and defeat precedence.
- Data Extraction registry/unlock/routing, exact object/destination acceptance, four approach directions, immediate success events, timeout, deterministic intents, scoring, and medals.
- Break the Breach registry/unlock/routing, immutable anvil data, no pre-spawn auto-win, exact Turn-2 spawn and cone, canonical charge break/stagger/anvil kill, blocked-push Seal destruction, fatal attack/collision terminalization, timeout, scoring, and medals.
- Storage fallback, completed-operation migration, unlock persistence, and best-score non-regression.

Browser QA exercises Title -> Operations/Training -> Battle -> Results at desktop/tablet sizes and the phone battle notice. Important flows include direct dynamic mission entry, locked-operation rejection, canonical victory, deliberate defeat, Data Block delivery, the Break the Breach canonical Turn-4 win and blocked-push slam defeat, Retry, next-operation launch, reload persistence, exact serialized state, and console-error review.

## Safe extension points

- Add an authored operation through `MissionDefinition`, registry entry, and `OperationMetadata`; use the objective union rather than branching on route names.
- Add a new objective as a discriminated type with a pure outcome check, events, serializer fields, scoring/mastery policy, and tests before adding UI treatment.
- Add a unit or enemy by extending domain types and pure selectors/resolvers before adding sprite art.
- Add audio by consuming existing `GameEvent` values; audio must never drive transitions.
- Add backend identity or leaderboard services behind the documented boundary without changing guest play or importing wallet code into the engine.

See [game design](game-design.md) for player-facing rules, [art direction](art-direction.md) for visual constraints, and the [roadmap](roadmap.md) for the next authored content steps.
