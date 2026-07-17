# Implementation Notes

## Technical baseline

- Next.js `15.5.12`, App Router, React 19, and strict TypeScript.
- Tailwind CSS 4 through `@tailwindcss/postcss`, with canonical CSS variables in `src/styles/tokens.css`.
- Zustand 5 for the client command/state layer and `clsx` for conditional classes.
- Vitest 4 for pure game and persistence tests.
- A semantic 7x7 DOM grid; no canvas engine, Phaser, database, RPC, or wallet runtime.

The package manager is pinned in `package.json`. Application behavior must pass `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. The current 116-test deterministic suite covers the pure engine, mission content, squad validation, presentation, scoring, mastery, disruption, shipped animation geometry, sprite-load fallback, and persistence boundary.

## Current product surface

The active product flow is intentionally game-first:

```text
Title
  |-- Continue / Play as Guest --> Squad --> dynamic Battle --> Results
  |-- Operations ---------------> Squad --> dynamic Battle --> Results
  `-- Field Training -----------> training Battle --> Training
```

There is no required HQ, campaign map, or loadout step. The old mission and loadout URLs remain only as redirects so saved links do not strand the player.

| Route | Lifecycle behavior |
| --- | --- |
| `/` | Hydrates local progress, shows the title menu, and deploys to the next operation |
| `/operations` | Shows all three operations, including prerequisite, completion, and best score state |
| `/training` | Shows three core chapters, optional System Override specialist training, and local completion state |
| `/squad/[missionId]` | Validates unlock state and renders the operation's full-screen choose-three deployment |
| `/battle/[missionId]` | Validates the registry ID, starts that mission fresh, mounts controls/serializer, and rejects a locked operation |
| `/battle/protect-the-vault` | Legacy-compatible battle entry |
| `/results` | Reads `lastResult`, renders operation-specific scoring/medals, retries the same mission, or continues to the next unlocked operation |
| `/missions`, `/loadout/protect-the-vault` | Redirect to `/operations` |

`getSquadHref(missionId)` builds deployment links and `getBattleHref(missionId)` builds battle links. Battle presentation and results resolve mission copy through operation metadata rather than branching on a page pathname.

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

`MissionDefinition` carries immutable squad rules and, together with `GameState`, a discriminated objective union. Squad rules define allowed three-role combinations, a recommended trio, required roles, and authored spawn candidates; `resolveMissionSquad` validates and orders the requested roles deterministically before state creation.

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
createInitialGameState(mission?, squadRoles?)
getValidMoves(state, unitId)
getAttackableTargets(state, unitId)
getPushTargets(state, unitId)
getHackableTargets(state, unitId)
getSentinelGuardArea(state, sentinelId)
getEnemyInterceptor(state, targetEnemyId)
moveUnit(state, unitId, destination)
attackEnemy(state, unitId, enemyId, attackKind?)
activateDeadeye(state, unitId, enemyId)
pushTarget(state, unitId, targetId, pushKind)
pushEnemy(state, unitId, enemyId, pushKind)
applyShield(state, unitId)
jamEnemy(state, unitId, enemyId)
blackoutEnemy(state, unitId, enemyId)
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

Protect the Vault adds its breach warning before Turn 2 planning and Whale spawn before Turn 3 planning. Data Extraction's inactive breach slot is placed under an existing obstacle and uses unreachable script turns, so it has no visible breach or Whale event. Its Rugger begins at E2 and the stationary 6-HP Lane Sentinel begins at E3 with initiative 20, move 0, and damage 0. Break the Breach starts with G4 incoming, spawns its 12-HP Whale before Turn 2 planning, and deterministically produces G4 -> F4 with the west cone E4/D3/D4/D5 when the authored setup is followed.

### Lane Sentinel interception

`getSentinelGuardArea` derives four cardinal rays from current immutable state. Obstacles/terrain, the protected structure, and pushable objects stop the ray before their occupied tile; player units and enemies do not. `getEnemyInterceptor` filters living Sentinels that can see the intended hostile, then chooses by Manhattan distance, initiative, and stable ID.

`attackEnemy` and Deadeye use that selector only for direct player attacks. When interception applies, the transition emits `attack-intercepted`, redirects the entire requested damage to the Sentinel, and then emits `unit-attacked` plus an optional `enemy-defeated` against that actual receiver. There is no overflow to the intended target. Attacking a Sentinel directly is unchanged, and `pushTarget` deliberately bypasses interception so forced movement and collision remain positional counters.

Sentinel planning returns an exact zero-damage intent with `action: "guard"`, `special: "intercept-grid"`, the complete support `area`, `guardedEnemyIds`, and stable `supportTargets`. Resolution uses that same snapshot and emits `sentinel-fortified`; it does not create a hidden persistent buff. A later player transition derives the next grid and interception relationship from the new board.

### Hacker disruption

The Hacker is a 6-HP, Move-3 specialist with no normal attack. `getHackableTargets` applies cardinal range 1-3 with the same line-of-sight blockers as the Sniper: terrain, the protected structure, and pushable objects stop a ray, while combatants do not.

`jamEnemy` stores a `jam` disruption on the target, consumes the Hacker action, and immediately recalculates the complete plan. Planning preserves the target enemy's exact route, destination, target, area, support relationship, and order while reducing its next activation damage by 2 with a floor of 0. `blackoutEnemy` consumes its one mission charge and replaces the target's next exact activation with `action: "hold"`, empty path/area, no target, zero damage, and no support. A disrupted Sentinel is excluded from interception immediately, so the previewed grid and actual receiver change together.

Both effects are part of the state fingerprint and are removed only after the affected enemy reaches its stored initiative slot in shadow planning or real resolution. This keeps later enemy occupancy deterministic. Blackout against a charging Whale consumes the slam activation, clears the cone, and returns the Whale to Ready. Jam against a Drainer can reduce damage to 0, in which case no healing occurs.

The optional `training-override` mission proves the contract in two turns: Jam rewrites the Rugger's D1-to-D2 strike from 3 damage to 1 without retargeting, then Blackout turns the Lane Sentinel into `HOLD` so the Sniper can attack through its former grid. The three core tutorial chapters remain the campaign onboarding threshold.

## Events and animation

Engine events describe movement, attack, damage, shield, push, collision, disruption, defeat, spawn, Whale state, Sentinel interception/fortification, extraction, turn change, and mission end. They contain stable entity/tile references and numeric results, never CSS classes or durations.

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
  squadSelections: Record<string, UnitRole[]>;
  lastResult?: MissionResult;
  settings: {
    soundMuted: boolean;
    tutorialComplete: boolean;
    trainingCompleted: number;
  };
};
```

The Zustand slice stores these as sibling fields; the grouped type only documents the persistence boundary. `squadSelections` stores only valid mission IDs and canonicalized legal three-role combinations; stale, duplicate, unknown, or mission-forbidden values are discarded. Only victories append a mission ID, duplicates are removed, and unlocks follow Protect the Vault -> Data Extraction -> Break the Breach. Existing best scores can also safely migrate into completion progress. A new score replaces a mission best only when higher.

Storage reads use version/schema guards and `try/catch`. Missing, corrupt, incompatible, or unavailable storage produces default guest data without blocking startup. Active battle state is never persisted.

Deployment writes the chosen trio before starting the session. Mission reset and Results Retry resolve that stored mission-specific trio, so a player can immediately replay the same tactical composition.

`settings.trainingCompleted` accepts integers from 0 through 4. Values 0-3 represent the completed prefix of the core chapters; 4 records the optional System Override specialist certification. `tutorialComplete` becomes true once the core threshold reaches 3 and does not require chapter 4.

## Development state serializer

Battle exposes `window.render_game_to_text()` in development/test builds. The deterministic JSON string includes:

- Mission ID, board size, phase, turn, and completed enemy phases.
- The objective kind; extraction snapshots include object ID, destination, and delivered state, while breach snapshots include target ID, spawned/defeated state, anvil object, and anvil destination.
- Protected structure coordinate, integrity, and pristine/damaged state.
- Squad state, signature availability, enemies and their disruption, objects, breach, selection, action mode, highlights, and interaction lock.
- Exact intent order, path, destination, target, damage, area, guarded enemy IDs, support targets, disruption modifier, original action, and special state.
- Hacker target previews, including exact before/after damage or the resulting `HOLD` activation.
- Terminal outcome when present.

Coordinates use board notation consistently. Arrays are stably ordered; timestamps, DOM IDs, and animation elapsed time are excluded.

## UI implementation rules

- Grid tiles are semantic buttons with descriptive ARIA labels and visible keyboard focus.
- Squad selection uses semantic operator cards and three formation slots; authored required/unavailable roles are explained before Deploy rather than failing in battle.
- Movement, attack, push, danger, locked area, cargo route, and token overlays remain separate channels.
- Sentinel support uses a quiet amber cardinal grid plus a stronger amber source-to-target tether and `GUARD` badge. It never enters the red danger-tile set.
- Hovering a direct attack against a guarded hostile previews the actual receiver and damage as `INTERCEPT -> SENTINEL`; the shot and impact playback land on that same Sentinel.
- Jam and Blackout previews are derived from the pure transitions and their recalculated plans. The UI names reduced damage versus `HOLD`; it never estimates those outcomes independently.
- Data Extraction renders its destination and route from `game.objective`; it never hard-codes E3 in the component.
- Break the Breach renders its setup route and contextual coaching from `anvilObjectId` and `anvilDestination`; it never hard-codes F2 in presentation code.
- Action controls derive legality from engine selectors. Components do not duplicate range, line-of-sight, charge, extraction, or activation rules.
- Enemy intent cards render stored plan fields directly.
- Results render the stored breakdown and mission metadata. Retry uses the result mission ID; Next Operation uses the authored operation order.
- Below 1024px, battle renders the designed viewport notice instead of a compressed board.
- Connect Wallet remains clearly disabled; future features do not clutter the battle HUD.

## Testing strategy

The current 116-test deterministic suite covers:

- Movement, occupancy, bounds, obstacles, shortest paths, and no diagonal traversal.
- Melee/Sniper targeting, line of sight, activation limits, Wait, signatures, and undo invalidation.
- Shields, damage, deaths, collision boundaries, Data Block movement, and Whale interruption.
- Rugger/Drainer targeting, Sentinel area/blockers/interception/tie-breakers, sequential occupancy, stable initiative, and exact-plan equivalence.
- Hacker stats and targeting, movement/action economy, Jam damage floors and byte-equivalent plans, Blackout `HOLD`, Sentinel bypass, disruption consumption, Drainer zero-damage healing prevention, and Whale charge/slam interactions.
- Protect's breach warning, Whale spawn/charge/slam/cancel/stagger, phase-5 timing, and defeat precedence.
- Data Extraction registry/unlock/routing, the E2 Rugger/E3 Sentinel setup, direct-attack redirection and push bypass, exact object/destination acceptance, four approach directions, immediate success events, timeout, deterministic intents, scoring, and medals.
- Break the Breach registry/unlock/routing, immutable anvil data, no pre-spawn auto-win, exact Turn-2 spawn and cone, canonical charge break/stagger/anvil kill, blocked-push Seal destruction, fatal attack/collision terminalization, timeout, scoring, and medals.
- Storage fallback, completed-operation migration, unlock persistence, and best-score non-regression.
- Default/recommended squads, required-role constraints, duplicate/unknown/forbidden rejection, deterministic spawn positions, and persisted squad sanitization.

Browser QA exercises Title -> Squad/Operations/Training -> Battle -> Results at desktop/tablet sizes and the phone battle notice. Important flows include squad swapping and reload persistence, required/locked roles, direct dynamic mission entry, locked-operation rejection, canonical victory, deliberate defeat, Data Block delivery, the Break the Breach canonical Turn-4 win and blocked-push slam defeat, Retry with the same lineup, next-operation deployment, exact serialized state, and console-error review. The recommended Sniper / Pusher / Hacker squad completed Data Extraction on Turn 4 through the real DOM with Jam and Blackout affecting the exact plans as previewed.

## SpriteCook asset status

The live board piece is the SpriteCook pixel master at `public/assets/sprites/sentinel.png`. Runtime animation uses four transparent horizontal sheets under `public/assets/sprites/spritecook`: `idle`, `hurt`, and custom `guard` contain eight native 180x180 frames; `death` contains twelve. The `intercept-grid` status cue selects `guard`, damage selects `hurt`, and a fatal event holds the complete death sheet before entity removal. The immobile, zero-damage support enemy intentionally has no walk or attack sheet.

The Hacker master is SpriteCook asset `c0608002-9691-4b1b-b6fe-ad812cbc48df`, delivered at 166x166. One grouped run, `c373c196-3c3f-4ca9-9fa2-2405fda93e55`, produced six transparent sheets with native 180x180 frames: `idle`, `walk`, custom `jam`, custom `blackout`, `hurt`, and `death`. The master plus single grouped batch cost 114 credits and left a balance of 454; no per-animation generation loop was used.

`battleSpritePreloader.ts` combines the 24 four-hero sheets and four Sentinel sheets into one shared 28-sheet decode cache. Title entry preloads opportunistically; direct battle entry keeps controls locked until every URL has either decoded or reported failure, preventing a first-use animation from replacing idle with an unavailable background. A failed sheet uses the shipped static character master for that state rather than hiding the piece or locking the game forever. The Sentinel's existing eight-frame idle remains active under reduced-motion because it communicates the enemy's live semantic state; decorative chassis motion can still stop, and other combat states retain readable poses. Exact guard cells, tethers, disruption badges, and receiver previews remain state-driven SVG/CSS overlays and are never baked into the raster art. This fix reused the shipped sheet: no SpriteCook request ran and no credits were spent.

## Safe extension points

- Add an authored operation through `MissionDefinition`, registry entry, and `OperationMetadata`; use the objective union rather than branching on route names.
- Add a new objective as a discriminated type with a pure outcome check, events, serializer fields, scoring/mastery policy, and tests before adding UI treatment.
- Add a unit or enemy by extending domain types and pure selectors/resolvers before adding sprite art.
- Add audio by consuming existing `GameEvent` values; audio must never drive transitions.
- Add backend identity or leaderboard services behind the documented boundary without changing guest play or importing wallet code into the engine.

See [game design](game-design.md) for player-facing rules, [art direction](art-direction.md) for visual constraints, and the [roadmap](roadmap.md) for the next authored content steps.
