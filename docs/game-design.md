# Game Design: Fracture Zone Operations

## Design intent

Degen Tactics is a short, deterministic tactical puzzle. Its tension comes from choosing positions and trades with complete information, not from hidden rolls. The opening operations teach three core verbs - block, shoot, and push - through authored boards and short training chapters; the optional specialist lab adds exact enemy-plan control.

Core pillars:

1. **Intent is a promise.** Before End Turn, the player can inspect every enemy path, destination, target, damage value, and attack area. Resolution must match it exactly.
2. **Every activation matters.** Each squad member has one move and one action; acting commits that unit for the turn.
3. **Position is a weapon.** Lanes, blockers, collision pushes, cargo routing, and the Whale's locked area are as important as raw damage.
4. **Small authored operations.** Each 7x7 mission introduces a distinct tactical problem without randomness, hit chances, critical hits, or damage ranges.

## Player journey

The player lands on the Title screen and can deploy immediately as a guest. Operations exposes the three authored missions and their local completion state. Field Training is player-controlled and split into three core chapters plus optional Chapter 4, **System Override**, so it teaches the rules without blocking the game behind one long tutorial. Completing chapters 1-3 satisfies onboarding; chapter 4 is a specialist certification and never gates campaign play.

The current sequence is:

1. **Protect the Vault** - learn activation economy, exact intents, lane control, and the Whale interruption.
2. **Data Extraction** - use the same squad rules to route a pushable objective through a hostile board.
3. **Break the Breach** - prepare a collision anvil, interrupt a lethal locked cone, and focus down a staggered boss.

Completing Operation 01 adds `protect-the-vault` to local completion progress and unlocks Operation 02. Completing Operation 02 unlocks Operation 03. No operation grants permanent stat power.

## Shared board rules

- Boards have 7 columns (`A-G`) and 7 rows (`1-7`), with `A1` at the top-left.
- Movement and melee adjacency are orthogonal. Diagonal movement and attacks are never legal.
- Movement range uses breadth-first search. Equal path choices expand in north, east, south, west order.
- Board edges, obstacles, the protected structure, all combatants, and the Data Block block player movement.
- A unit may choose to remain on its tile and act.
- Obstacles, the protected structure, and the Data Block block Sniper and Hacker line of sight. Player units and enemies do not.
- Occupancy changes are applied before recalculating intents, so a moved squad member can deliberately block a lane.

## Player turn and activation economy

Every living squad member starts a player turn ready, with one movement allowance and one action.

1. The unit may move once, up to its Move value, or skip movement.
2. It may then use a basic attack, ability, signature ability, or Wait.
3. Taking any action ends that unit's activation. An activated unit cannot move or act again that turn.
4. End Turn is always available; unused unit activations are forfeited after a confirmation warning.

Undo restores only the most recent legal movement. It is available until an attack, ability, Wait, or End Turn occurs. Undo never rewinds an action, damage, a charge, or an enemy phase.

### Squad

| Unit | Role | HP | Move | Basic action | Signature |
| --- | --- | ---: | ---: | --- | --- |
| Guardian | Frontline / protector | 12 | 2 | Strike: adjacent target, 2 damage | Shield Wall: one mission charge |
| Sniper | Ranged damage | 7 | 3 | Shot: cardinal range 1-3, 3 damage | Deadeye: one mission charge |
| Pusher | Position control | 9 | 2 | Strike: adjacent target, 1 damage | Batter Up: one mission charge |
| Hacker | Plan control / disruption | 6 | 3 | Jam: reusable, cardinal range 1-3 | Blackout: one mission charge |

#### Guardian - Shield Wall

- Targets the Guardian and living allies on the four orthogonally adjacent tiles.
- Grants each affected unit a 2-point shield for the next enemy phase.
- The shield reduces the next incoming hit by up to 2, is consumed by that hit, and does not carry past that enemy phase.
- Shield Wall never shields the protected structure and has one charge for the mission.

#### Sniper - Deadeye

- Uses the same cardinal range and line-of-sight rules as Shot.
- Deals 4 damage.
- Can be used only before the Sniper has moved in the current turn.
- Consumes both movement and action, completes the activation, and has one charge for the mission.

#### Pusher - Shove and Batter Up

- A push targets an orthogonally adjacent enemy or the Data Block and moves it directly away from the Pusher.
- **Shove** is reusable and attempts to move the target one tile. If an enemy is immediately blocked, that enemy takes 1 collision damage.
- **Batter Up** has one mission charge and attempts to move the target up to two tiles. It moves through each free tile in order; if an enemy is stopped before completing the push, that enemy takes 2 collision damage.
- Board edges, obstacles, the protected structure, combatants, the reserved breach, and the Data Block block a pushed enemy. Only the pushed enemy can take collision damage. The blocker, structure, allied units, and other enemies never take collision damage.
- The Data Block has no HP. It can move through free tiles, blocks movement and Sniper line of sight in its new position, and takes or deals no damage when a push is blocked.
- Successfully displacing a charging Whale cancels its locked cone and marks it staggered for its next activation. A blocked push that only causes collision damage does not interrupt the charge.

#### Hacker - Jam and Blackout

- The Hacker has no normal damaging attack. Both control actions use cardinal range 1-3 and the same line-of-sight blockers as the Sniper; combatants do not block the signal.
- **Jam** is reusable. It reduces the target enemy's damage on its next exact ordered activation by 2, to a minimum of 0. Its stored path, destination, target, area, support relationship, and activation order do not change.
- **Blackout** has one mission charge. It replaces the target's next exact ordered activation with a stationary `HOLD`: no movement, target, area, damage, healing, or support effect.
- A Blacked-out Lane Sentinel cannot intercept attacks during that pending activation, so its Interception Grid disappears immediately from the recalculated exact plan.
- The Hacker may move before Jam or Blackout. Either action ends the Hacker's activation and clears movement undo.
- Disruption is consumed only after the affected enemy reaches its exact initiative slot. Blackout against a charging Whale consumes that activation, clears its locked cone, and returns it to Ready.

The Hacker is currently available only in System Override. Campaign operations still deploy the proven Guardian, Sniper, and Pusher trio; the next product step is a compact choose-three-from-four deployment flow.

## Field Training

The training menu exposes progress before launch and lets the player stop after any chapter:

1. **First Contact** - move, attack, and read exact enemy intents.
2. **Squad Turns** - activate the full squad and time one-charge signatures.
3. **Push Control** - Shove, Batter Up, collision damage, Data Block movement, and Whale interruption.
4. **System Override (optional specialist)** - Jam a Rugger's exact strike, then Blackout a Lane Sentinel and exploit the disabled grid with the Sniper.

System Override is a two-turn lab rather than a campaign operation. The authored setup places Sniper at A2, Rugger at D1, Hacker at D3, Sentinel at G2, and a Training Relay at D6. On Turn 1, Jam preserves the Rugger's D1-to-D2 route and Hacker target but changes damage from 3 to 1. On Turn 2, Blackout converts the Sentinel intent to `HOLD`; the former grid no longer intercepts the Sniper shot. Completing the second enemy phase validates the specialist chapter.

## Mission 01: Protect the Vault

**Location:** Fracture Zone - Vault District
**Objective:** Complete enemy phase 5 with the Vault still online.
**Defeat:** The Vault reaches 0 integrity, or all three squad units are defeated.

### Initial map

```text
    A B C D E F G
1   . . . R . . .
2   . D . . . . .
3   . . # G # . .
4   . . . V . . W
5   . N # . # . .
6   . . . B . P R
7   . . . . . . .
```

| Mark | Entity | Coordinate |
| --- | --- | --- |
| `G` | Guardian | D3 |
| `N` | Sniper | B5 |
| `P` | Pusher | F6 |
| `R` | Rugger | D1 and G6 |
| `D` | Drainer | B2 |
| `V` | Vault | D4 |
| `B` | Data Block | D6 |
| `#` | Obstacle | C3, E3, C5, E5 |
| `W` | Reserved Whale breach | G4 |

The `W` mark is explanatory only: G4 starts as a normal free tile. It becomes an incoming, impassable breach tile at the start of player turn 2 and the Whale spawns there at the start of player turn 3.

### Mission timing

- The mission opens in player turn 1 with a complete enemy plan already visible.
- End Turn resolves the currently displayed plan in initiative order. A completed enemy phase increments `turnsSurvived`.
- At the start of turn 2, G4 gains an incoming breach warning and cannot be entered.
- At the start of turn 3, the warning is replaced by the Whale at G4 before the new enemy plan is calculated.
- Surviving enemy phase 5 wins, unless that phase first destroys the Vault or defeats the final squad member. Defeat takes precedence over victory.
- Eliminating every current enemy early does not end the mission; survival through phase 5 is still required.

## Mission 02: Data Extraction

**Location:** Fracture Zone - Recovery Yard
**Unlock:** Complete Protect the Vault.
**Objective:** Push the `data-block` onto the extraction zone at E3. Delivery wins immediately.
**Defeat:** The Extraction Rig reaches 0 integrity, all three squad units are defeated, or enemy phase 5 ends before delivery.

### Initial map

```text
    A B C D E F G
1   . . . . . . .
2   # . # . R G #
3   . . . . S I .
4   . . . # . . .
5   . N B # . . .
6   . . P . . . .
7   . . . . . . .
```

| Mark | Entity | Coordinate |
| --- | --- | --- |
| `G` | Guardian | F2 |
| `N` | Sniper | B5 |
| `P` | Pusher | C6 |
| `R` | Rig Breaker (Rugger) | E2 |
| `S` | Lane Sentinel, 6 HP; standing on the extraction zone | E3 |
| `I` | Extraction Rig, 10 integrity | F3 |
| `B` | Data Block | C5 |
| `X` | Extraction zone beneath the Lane Sentinel | E3 |
| `#` | Obstacle | A2, C2, G2, D4, D5 |

This operation has no active Whale breach. The Rig Breaker uses the Rugger rules from Operation 01. The stationary Lane Sentinel replaces the former Data Leech and begins directly on the cargo destination, turning interception into the operation's opening positional problem.

### Puzzle spine and timing

The readable cargo route is deliberately short, but the Sentinel must be handled before the destination can receive cargo:

1. Break the amber Interception Grid by defeating or displacing the Lane Sentinel on E3.
2. Push the Data Block north from C5 to C4.
3. Push it north again from C4 to C3.
4. Reposition the Pusher to B3 and use Batter Up to send the block east through D3 onto E3.

Enemy pressure determines when the squad can safely execute those steps; the sequence above describes the authored route, not a requirement to ignore attacks, shields, or lane blocking. A one-tile final Shove also succeeds if the block is already adjacent to E3 and the Pusher is correctly aligned.

The extraction check is exact: only the configured `data-block` at E3 completes the objective. The engine emits `object-extracted` followed by `mission-ended`, and the run enters victory without waiting for another enemy phase. If the objective is still incomplete after enemy phase 5, the result is `extraction-timeout`. Structure or squad defeat takes priority at the phase boundary.

### Canonical solution

1. **Turn 1 - Break the grid:** Guardian uses Shield Wall. Sniper moves B5 to B3 and shoots the Sentinel from 6 to 3 HP. Pusher Shoves the Data Block from C5 to C4. In the enemy phase, the Rugger attacks Guardian at F2; Shield absorbs 2 and Guardian falls from 12 to 11 HP. The Sentinel fortifies its exact support link.
2. **Turn 2 - Clear the lane:** Sniper defeats the Sentinel before Guardian attacks, so Guardian's 2 damage reaches the Rugger instead of being intercepted. Pusher moves C6 to C5 and Shoves the Block from C4 to C3. The Rugger leaves Guardian at 8 HP.
3. **Turn 3 - Turn the corner:** Guardian reduces the Rugger to 2 HP. Sniper moves B3 to A3 and Waits; Pusher moves C5 to B4 and Waits. The Rugger leaves Guardian at 5 HP.
4. **Turn 4 - Extract:** Guardian defeats the Rugger, Sniper Waits, and Pusher moves B4 to B3. Batter Up sends the Block C3 to D3 to E3 and completes delivery immediately.

This line finishes with Rig 10/10, Guardian 5/12, Sniper 7/7, Pusher 9/9, two defeated enemies, and three completed enemy phases. It earns all three medals and scores 1,300 for rank S.

## Mission 03: Break the Breach

**Location:** Fracture Zone - Seal Chamber 7
**Unlock:** Complete Data Extraction.
**Objective:** Break the Whale's locked charge, then destroy the spawned `breach-whale` by player Turn 5.
**Defeat:** The 4-integrity Seal Generator reaches 0, all three squad units are defeated, or enemy phase 5 ends while the Whale remains alive.

### Initial map

```text
    A B C D E F G
1   . . . . . . .
2   . # . . . . #
3   . N . G . B .
4   . . # S . . W
5   . . # . # P #
6   . . . . . . .
7   . . . . . . .
```

| Mark | Entity | Coordinate |
| --- | --- | --- |
| `G` | Guardian | D3 |
| `N` | Sniper | B3 |
| `P` | Pusher | F5 |
| `S` | Seal Generator, 4 integrity | D4 |
| `B` | Data Block / collision anvil | F3 |
| `W` | Incoming `breach-whale`, 12 HP | G4 |
| `#` | Obstacle | B2, G2, C4, C5, E5, G5 |

G4 is already an incoming, impassable breach on player Turn 1. The Whale spawns there at the start of player Turn 2. Its first plan moves G4 to F4, faces west, and locks E4 plus D3, D4, and D5. Because D4 is in the exact area and the Seal has 4 integrity, one unresolved slam ends the operation.

The objective stores both the target and the authored setup data: `enemyId: "breach-whale"`, `enemyPhases: 5`, `anvilObjectId: "data-block"`, and `anvilDestination: F2`. The absent pre-spawn target never counts as defeated. Once the breach has spawned, defeating that exact target by an attack or collision ends the mission immediately with `breach-broken`; leaving it alive through enemy phase 5 ends with `breach-overrun`.

### Canonical solution

1. **Turn 1 - Build the anvil:** move Pusher F5 to F4 and Shove the Data Block from F3 to F2. Reposition Guardian to E3 and Sniper to C3.
2. **Turn 2 - Set the trap:** return Pusher to F5. The Whale advances G4 to F4 and locks its west-facing cone.
3. **Turn 3 - Break the charge:** Shove the charging Whale north from F4 to the now-free F3. Forced movement cancels the cone and makes it lose its activation. Guardian and Sniper deal 5 damage.
4. **Turn 4 - Use the anvil:** move Pusher to F4 and use Batter Up. The Data Block at F2 stops the Whale for 2 collision damage; Guardian and Sniper deal the remaining 5. The fatal attack emits `enemy-defeated` followed by `mission-ended` and wins immediately.

If the player leaves the Data Block on F3, the Turn-3 push is blocked. It deals collision damage but does not displace the charging Whale, so the cone remains locked. The following exact 4-damage slam destroys the Seal Generator and produces immediate defeat. This failure is the operation's central readable lesson: collision damage alone does not interrupt a charge.

## Enemies and deterministic planning

Enemies act by mission-defined initiative, then stable entity ID. Planning uses deterministic pathfinding and simulates earlier planned actions so later paths account for destinations already reserved by earlier enemies.

| Enemy | HP | Move | Damage | Initiative | Behavior |
| --- | ---: | ---: | ---: | ---: | --- |
| Rugger | 6 | 2 | 3 | 10 | Advances down a deterministic structure lane; attacks a squad member blocking that lane when adjacent |
| Drainer | 4 | 3 | 2 | 20 | Hunts the living unit with the lowest current HP; falls back to the protected structure when no unit is reachable |
| Lane Sentinel | 6 | 0 | 0 | 20 | Holds position and redirects direct player attacks against hostiles aligned with its cardinal support grid |
| Whale | 10; 12 in Break the Breach | 1 | 4 | 30 | Alternates a telegraphed cone lock with a later slam |

### Rugger

- Computes a shortest route toward the protected structure with north, east, south, west tie expansion. For lane planning, player-occupied tiles are considered traversable so a squad member can be identified as the blocker on the chosen route.
- Advances along that route until its Move allowance is spent or the next step contains a player unit. It stops before the first player blocker and attacks that unit when adjacent.
- Static blockers and already planned enemy destinations are respected.

### Drainer

- Chooses the living squad unit with the lowest current HP.
- Equal-HP candidates are ordered by reachable path length, then stable entity ID.
- If no squad target is reachable, it routes toward the protected structure.
- After dealing at least 1 actual damage, it heals 1 HP without exceeding its maximum. A fully shielded hit causes no healing.

### Lane Sentinel

- Holds its tile and projects a clear cardinal support grid north, east, south, and west.
- Terrain, the protected structure, and the Data Block stop a ray. Combatants do not block it.
- A direct player attack against another living hostile on a clear ray redirects all of that attack's damage to the Sentinel. Damage never overflows back to the intended target when the Sentinel has less remaining HP.
- Direct attacks against the Sentinel resolve normally. Shove, Batter Up, and collision damage bypass interception.
- The relationship is derived from the current board every time state changes. Displacing either enemy or inserting a terrain/object blocker can break the link without a hidden status timer.
- If more than one Sentinel can intercept, choose the nearest one, then lower initiative, then stable entity ID.
- Its exact enemy intent is `guard` with special state `intercept-grid`, zero damage, the complete cardinal area, and explicit guarded target IDs. Resolution emits `sentinel-fortified`; a redirected player attack emits `attack-intercepted` before `unit-attacked` and any resulting `enemy-defeated` event against the actual Sentinel.

### Whale

The Whale is a one-tile enemy with a multi-tile ground attack. Its state machine is explicit:

1. **Ready:** move up to one tile, choose a cardinal facing, and lock a cone.
2. **Charging:** on its next activation, strike exactly the locked tiles for 4 damage, then return to Ready.
3. **Staggered:** skip its next activation, clear the stagger, and return to Ready.

The cone contains the tile one step forward plus the three-tile-wide rank two steps forward. Obstacles do not block the ground slam. The preview identifies every affected in-bounds tile while Charging.

In Protect the Vault's normal turn-3 spawn, the Whale moves from G4 to F4, faces west, and locks E4 plus D3, D4, and D5. Break the Breach uses the same exact route and cone one turn earlier, with a 12-HP boss and a one-hit Seal Generator. Moving a charging Whale with Shove or Batter Up clears the cone and changes its state to Staggered. Collision without displacement does not.

## Enemy intent contract

Each displayed intent contains:

- Resolution order and enemy identity.
- Planned path and destination.
- Target identity, when the action has a single target.
- Exact damage.
- Every affected tile for an area attack.
- Explicit guarded targets for a support intent.
- Any active disruption, original action, and exact damage reduction.
- Special state such as breach, charge, slam, stagger, or `intercept-grid`.

The complete turn plan is recalculated after every successful world-state-changing player command. UI-only selection and hover changes do not alter it. End Turn snapshots that plan; enemy resolution consumes it without retargeting or rerolling. If identical game states are provided, serialized plans must be byte-equivalent.

## Damage, defeat, and cleanup

- Damage is integer and deterministic; there are no hit chances, critical hits, armor rolls, or damage ranges.
- Shields are applied before HP damage. `actualDamage` is the amount that reaches HP.
- An entity at 0 HP is defeated and no longer blocks, moves, attacks, or receives future turns.
- Enemy attacks can damage their planned squad target or the mission's protected structure. Collision damage follows the stricter push rules above.
- Lane Sentinel interception changes only the receiver of a direct player attack. The actual Sentinel receives the full deterministic hit, with no overflow; forced movement and collision retain their normal targets.
- Jam and Blackout are consumed after the disrupted enemy's exact ordered activation, even when the resulting damage is 0 or the action is `HOLD`.
- The Vault and Extraction Rig start at 10 integrity; the Break the Breach Seal Generator starts at 4. Track whether the active structure ever lost integrity separately for scoring and medals.
- Temporary shields expire after the enemy phase for which they were granted.

## Outcome, scoring, and mastery

Score is calculated once a run reaches a terminal result. Failed missions are always rank C.

### Protect the Vault scoring

| Component | Score |
| --- | ---: |
| Mission victory | +500 |
| Vault integrity | +100 per remaining quartile |
| Enemy defeated | +75 each |
| Living squad member | +50 each |
| Entire squad survives | +100 |
| Vault never lost integrity | +100 |
| Lost squad member | -50 each |

Remaining integrity quartiles are `ceil(currentIntegrity / maxIntegrity * 4)`, producing 0-4 tiers. Protect the Vault medals are **Vault Untouched**, **Full Squad**, and **Charge Broken**.

### Data Extraction scoring

Data Extraction preserves the shared victory, enemy, squad, untouched-structure, casualty, and rank rules, with two operation-specific adjustments:

- Extraction Rig integrity is worth +25 per remaining quartile, up to +100.
- A victorious run receives +100 for every unused enemy phase: `(5 - completedEnemyPhases) * 100`.

Its medals are:

- **Express Transfer:** extract by player Turn 4 (`completedEnemyPhases <= 3`).
- **Rig Untouched:** finish without damaging the Extraction Rig.
- **Full Escort:** keep every operator alive.

The canonical Turn-4 victory defeats the Sentinel and Rugger, preserves Rig 10/10 and all three operators, completes three enemy phases, and scores 1,300 for rank S.

### Break the Breach scoring

Break the Breach keeps the shared +500 victory, +75 per enemy, +50 per survivor, +100 full-squad, +100 untouched-structure, and -50 casualty rules, with two boss-operation adjustments:

- Seal Generator integrity is worth +50 per remaining quartile, up to +200.
- A victory receives +50 for every unused enemy phase: `(5 - completedEnemyPhases) * 50`.

The canonical Turn-4 victory with an untouched Seal and full squad scores 1,225 for rank S. An otherwise perfect Turn-5 victory scores 1,175 for rank A.

Its medals are:

- **Charge Broken:** displace the Whale while its cone is locked.
- **Breach Window:** destroy the Whale by player Turn 4 (`completedEnemyPhases <= 3`).
- **Full Squad:** keep every operator alive.

| Rank | Requirement |
| --- | --- |
| S | 1200 or more |
| A | 900-1199 |
| B | 650-899 |
| C | Below 650, or any failed mission |

XP preview is `floor(score / 10)` and is not persisted as progression. Season points are unavailable. Only completed runs update the operation's local best score and completion unlock; abandoned and failed sessions do not.

## Player-facing readability

- Teal fill marks valid movement.
- Cyan outline marks attack range and targets.
- Gold arrows mark pushes and the extraction route.
- A quiet amber cardinal grid, a dominant amber tether, and a `GUARD` badge identify Sentinel support. This is support information, not red danger.
- Hacker targets use a distinct signal outline and name the exact before/after plan: reduced damage for Jam or `HOLD` for Blackout.
- Red hatching marks danger; a heavier pulse marks a locked Whale strike.
- Purple identifies the protected structure or mission-special zone.
- Color is always paired with shape, outline, pattern, label, icon, or motion.
- Contextual training and hints teach the next useful verb without leaving a long tutorial modal on screen.

## Deliberate non-goals

This slice has no procedural missions, randomness, inventory, permanent stat upgrades, audio, replay playback, mid-mission save, online leaderboard, wallet requirement, token, wagering, or real-money reward. These exclusions keep the authored tactical loop legible and testable.
