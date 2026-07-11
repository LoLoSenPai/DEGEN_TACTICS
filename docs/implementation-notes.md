# Implementation Notes

## Technical baseline

- Next.js `15.5.12`, App Router, React 19, and strict TypeScript.
- Tailwind CSS 4 through `@tailwindcss/postcss`, with canonical CSS variables in `src/styles/tokens.css`.
- Zustand 5 for the client command/state layer and `clsx` for conditional classes.
- Vitest 4 for pure game and persistence tests.
- A semantic 7×7 DOM grid; no canvas, Phaser, database, RPC, or wallet runtime.

The package manager is pinned in `package.json`. Application behavior must pass `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

## System boundaries

```text
Route/component event
        │
        ▼
Zustand command layer ──────► UI-only selection / action mode
        │
        ▼
Pure game command(state, input)
        │
        ├────────► next immutable GameState
        └────────► ordered GameEvent[]
                         │
                         ▼
                  animation + combat log
```

- `src/app` owns route entry points and page composition.
- `src/components` owns rendering and interaction grouped by layout, menu, missions, loadout, battle, and results.
- `src/lib/game` owns types, authored mission definitions, pathfinding, combat, pushes, enemy planning/resolution, scoring, selectors, and storage validation.
- `src/store` owns the active client session, UI modes, commands, event playback queue, and the small persisted profile/result slice.
- `src/lib/solana` is documentation-only in the MVP and defines a future integration boundary.

Game rules must never depend on React, the router, DOM APIs, animation timing, LocalStorage, or wall-clock time.

## Route lifecycle

| Route | Lifecycle behavior |
| --- | --- |
| `/` | Reads the hydrated local profile/best score and renders HQ; all future actions explain their disabled state |
| `/missions` | Renders the authored chapter path and routes the playable node to its briefing |
| `/loadout/protect-the-vault` | Shows the fixed squad and calls `startMission` before routing to battle |
| `/battle/protect-the-vault` | Ensures direct navigation receives a fresh mission, mounts keyboard controls and the text serializer, and locks commands during enemy playback |
| `/results` | Reads `lastResult`; redirects to missions when absent; Retry resets before opening battle |

HQ, missions, briefing, and results are server-safe shells with client islands only where persistence or interaction requires them. Battle is client-driven because the entire session is transient.

## Domain model

The engine models immutable values for:

- `MissionDefinition`: board dimensions, terrain, starting entities, initiative, turn limit, and scripted breach/Whale events.
- `GameState`: mission ID, phase, turn, turns survived, entities, ability charges, damage history, and outcome. The current exact plan is stored beside it in the client command layer so End Turn can snapshot it explicitly.
- `Tile` and coordinates: board/terrain data without component styling.
- `PlayerUnit`, `Enemy`, `PushableObject`, and `Vault`: stable IDs, position, health/status, and per-turn activation data.
- `EnemyIntent` and `EnemyTurnPlan`: the exact ordered future resolution.
- `GameEvent`: presentation-neutral facts emitted by a transition.
- `MissionResult` and `ScoreBreakdown`: terminal outcome and independently inspectable score components.

Stable entity IDs are part of deterministic ordering and must not be regenerated during a session.

### Pure public rules

The game package exposes these behavior-level functions:

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

Queries return derived data without mutation. Commands return `{ state, events }`. Invalid commands return the original state with no gameplay events or use a typed invalid result; they never partially apply a rule.

## Determinism and exact intents

Enemy intent is a runtime invariant, not decorative UI copy.

1. Create a complete `EnemyTurnPlan` from the current world state.
2. Plan enemies by mission initiative, then stable entity ID.
3. Within pathfinding, expand equal candidates north, east, south, west.
4. Simulate earlier planned moves in a virtual state so later intents account for sequential occupancy.
5. After every successful player command that changes world state, replace the displayed plan with a freshly calculated complete plan.
6. On End Turn, snapshot the displayed plan and pass that exact value to `resolveEnemyTurn`.
7. Resolution follows its stored paths, destinations, targets, areas, values, and order. It does not retarget, reroll, or recalculate between actions.

Selection, hover, panel toggles, and animation progress are UI-only and do not trigger replanning. Given byte-equivalent input state, plan serialization is byte-equivalent.

Scripted mission events happen at a defined boundary before the player receives control: the breach marker at turn 2 and Whale spawn at turn 3 are added before that turn's visible plan is created.

## Events and animation

Engine events describe facts such as movement, attack, damage, shield, push, collision, defeat, spawn, Whale lock/slam/stagger, turn change, and mission end. They contain stable entity/tile references and final numeric values; they contain no CSS class names or durations.

The store applies player-command transitions immediately and derives both the combat log and short-lived display effects from the same ordered events. End Turn snapshots the plan, locks interaction, presents the phase transition, and then applies the pure enemy transition; the battle UI presents its resulting movement/damage/impact feedback without recalculating rules. Animation cleanup cancels outstanding presentation timers on route change/unmount. Reduced-motion mode shortens presentation but preserves event order.

This separation prevents a skipped animation, slow device, or reduced-motion preference from changing game rules.

## Client store and persistence

### Transient session slice

The active mission, current enemy plan, selected unit/target, action mode, hover state, valid highlights, most recent movement undo, event-derived display effects, interaction lock, and timers are memory-only.

Undo stores the state needed to restore one movement. The token is cleared by attack, ability, Wait, End Turn, mission reset, or terminal outcome. It never enters LocalStorage.

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
  lastResult?: MissionResult;
  settings: {
    soundMuted: boolean;
  };
};
```

The actual Zustand slice stores `profile`, `bestScores`, `lastResult`, and `settings` as sibling fields; the type above groups them only to show the persistence boundary. Sound is not implemented in this slice and defaults muted, leaving a stable future preference. Do not persist the active `GameState`, enemy plan, selection, undo, queue, timeouts, or animation flags.

Storage reads are guarded by schema/version checks and `try/catch`. Missing, corrupt, incompatible, or unavailable storage produces default guest data without blocking the app. A score only replaces the mission best when a terminal run is higher. Rehydration is explicitly tracked so server HTML does not render browser-only values and cause a mismatch.

## Development state serializer

Battle exposes `window.render_game_to_text()` in development/test builds. It returns a deterministic string intended for browser automation and human diagnostics, not a player-facing save format.

The snapshot includes:

- Mission ID, board size, current phase/turn, and turns survived.
- Vault coordinate, integrity, and pristine/damaged state.
- Every squad unit in stable-ID order: coordinate, HP, shield, moved/acted/alive state, and remaining signature charge.
- Every enemy in plan order/stable-ID order: type, coordinate, HP, and Whale state where applicable.
- Data Block and breach coordinates.
- Selected unit/target, selected action mode, valid move/attack/push tiles, and interaction lock.
- Exact intent order, path, destination, target, damage, area tiles, and special state.
- Terminal outcome when present.

Coordinates use board notation (`D4`) or a documented zero-based pair consistently. Arrays are stably ordered; do not include timestamps, DOM-generated IDs, animation elapsed time, or other nondeterministic values. Browser tests should compare semantic fields rather than use this helper to mutate the game.

## UI implementation rules

- Grid tiles are semantic buttons with descriptive ARIA labels and visible keyboard focus.
- Overlays are separate visual channels. Movement fill, danger pattern, range outline, push arrow, and token can coexist.
- Enemy danger remains visible throughout the player phase; a locked Whale zone gets highest overlay emphasis.
- Action controls derive legality from engine selectors. Components must not duplicate range, line-of-sight, charge, or activation rules.
- Enemy intent cards render stored plan fields directly. Never infer a target from current component state.
- The results screen renders the stored `ScoreBreakdown`; it does not recompute ad hoc totals in JSX.
- Below 1024px, battle renders the designed viewport notice and does not mount a compressed interactive board.
- Disabled Daily Challenge, Leaderboard, Connect Wallet, Replay, Next Mission, and Mint Season Badge controls remain labeled and non-operative.

## Testing strategy

### Pure tests

- Movement: range, occupancy, bounds, obstacles, deterministic shortest paths, and no diagonal traversal.
- Targeting: melee adjacency, Sniper cardinal range, and line-of-sight blockers/non-blockers.
- Activation: move/action limits, Wait, signature charges, Deadeye restriction, and undo invalidation.
- Combat and pushes: shields/expiry, deaths, collision boundaries, Data Block movement, Whale displacement versus blocked collision.
- AI: Rugger lane blocking, Drainer target ties/healing/fallback, sequential occupancy, and stable initiative.
- Intent contract: identical states produce identical plans; resolution matches previewed paths, target, areas, and values.
- Mission script: breach warning, Whale spawn/charge/slam/cancel/stagger, phase-5 victory, and defeat precedence.
- Scoring/storage: integrity tiers, rank boundaries, bonuses/penalties, failed rank, invalid storage fallback, and best-score non-regression.

### Browser and visual checks

Exercise HQ → missions → briefing → battle → results at 1440×900, 1280×720, and 1024×768, then verify the battle notice at 390×844. Cover a canonical victory and deliberate defeat, inspect screenshots at every route, review `render_game_to_text()` after meaningful commands, and check the browser console.

Interaction coverage includes selection, movement, undo, basic attacks, all three signatures, Shove, Batter Up, Data Block push, Wait, End Turn, Whale telegraph/interruption, result persistence, reload, Retry reset, direct-results fallback, keyboard shortcuts, focus visibility, and reduced motion.

## Safe extension points

- Add a mission by supplying a new authored `MissionDefinition` and route metadata; do not branch core rules on page path.
- Add a unit/enemy by extending the discriminated domain types and pure selectors/resolvers before adding UI art.
- Add audio by consuming existing `GameEvent` values; audio must never drive transitions.
- Add a backend identity/leaderboard layer behind the documented boundary without changing guest play or importing wallet code into the engine.

See [game design](game-design.md) for exact player-facing rules, [art direction](art-direction.md) for visual constraints, and the [roadmap](roadmap.md) for intentionally deferred work.
