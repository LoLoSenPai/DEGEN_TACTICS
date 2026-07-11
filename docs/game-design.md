# Game Design: Protect the Vault

## Design intent

Degen Tactics is a short, deterministic tactical puzzle. Its tension comes from choosing positions and trades with complete information, not from hidden rolls. The first mission is designed around three verbs—block, shoot, and push—and should teach them through the board rather than through a long tutorial.

Core pillars:

1. **Intent is a promise.** Before End Turn, the player can inspect every enemy path, destination, target, damage value, and attack area. Resolution must match it exactly.
2. **Every activation matters.** Each squad member has one move and one action; acting commits that unit for the turn.
3. **Position is a weapon.** Lanes, blockers, collision pushes, and the Whale's locked area are as important as raw damage.
4. **Five-turn clarity.** The mission has a fixed survival horizon and no random spawns, hit chances, critical hits, or damage ranges.

## Mission 01: Protect the Vault

**Location:** Chapter 01, Fracture Zone — Vault District  
**Objective:** Complete enemy phase 5 with the Vault still online.  
**Defeat:** The Vault reaches 0 integrity, or all three squad units are defeated.  
**Board:** 7 columns (`A–G`) by 7 rows (`1–7`), with `A1` at the top-left.

### Initial map

```text
    A B C D E F G
1   · · · R · · ·
2   · D · · · · ·
3   · · # G # · ·
4   · · · V · · W
5   · N # · # · ·
6   · · · B · P R
7   · · · · · · ·
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

## Board rules

- Movement and melee adjacency are orthogonal. Diagonal movement and attacks are never legal.
- Movement range uses breadth-first search. Equal path choices expand in north, east, south, west order.
- Board edges, obstacles, the Vault, the reserved breach, all combatants, and the Data Block block player movement.
- A unit may choose to remain on its tile and act.
- Obstacles, the Vault, and the Data Block block Sniper line of sight. Player units and enemies do not.
- Occupancy changes are applied before recalculating intents, so a moved squad member can deliberately block a lane.

## Player turn and activation economy

Every living squad member starts a player turn ready, with one movement allowance and one action.

1. The unit may move once, up to its Move value, or skip movement.
2. It may then use a basic attack, ability, signature ability, or Wait.
3. Taking any action ends that unit's activation. An activated unit cannot move or act again that turn.
4. End Turn is always available; unused unit activations are forfeited.

Undo restores only the most recent legal movement. It is available until an attack, ability, Wait, or End Turn occurs. Undo never rewinds an action, damage, a charge, or an enemy phase.

### Squad

| Unit | Role | HP | Move | Basic action | Signature |
| --- | --- | ---: | ---: | --- | --- |
| Guardian | Frontline / protector | 12 | 2 | Strike: adjacent target, 2 damage | Shield Wall: one mission charge |
| Sniper | Ranged damage | 7 | 3 | Shot: cardinal range 1–3, 3 damage | Deadeye: one mission charge |
| Pusher | Position control | 9 | 2 | Strike: adjacent target, 1 damage | Batter Up: one mission charge |

#### Guardian — Shield Wall

- Targets the Guardian and living allies on the four orthogonally adjacent tiles.
- Grants each affected unit a 2-point shield for the next enemy phase.
- The shield reduces the next incoming hit by up to 2, is consumed by that hit, and does not carry past that enemy phase.
- Shield Wall never shields the Vault and has one charge for the mission.

#### Sniper — Deadeye

- Uses the same cardinal range and line-of-sight rules as Shot.
- Deals 4 damage.
- Can be used only before the Sniper has moved in the current turn.
- Consumes both movement and action, completes the activation, and has one charge for the mission.

#### Pusher — Shove and Batter Up

- A push targets an orthogonally adjacent enemy or the Data Block and moves it directly away from the Pusher.
- **Shove** is reusable and attempts to move the target one tile. If an enemy is immediately blocked, that enemy takes 1 collision damage.
- **Batter Up** has one mission charge and attempts to move the target up to two tiles. It moves through each free tile in order; if an enemy is stopped before completing the push, that enemy takes 2 collision damage.
- Board edges, obstacles, the Vault, combatants, the reserved breach, and the Data Block block a pushed enemy. Only the pushed enemy can take collision damage. The blocker, Vault, allied units, and other enemies never take collision damage.
- The Data Block has no HP. It can move through free tiles, blocks movement and Sniper line of sight in its new position, and takes/deals no damage when a push is blocked.
- Successfully displacing a charging Whale cancels its locked cone and marks it staggered for its next activation. A blocked push that only causes collision damage does not interrupt the charge.

## Enemies and deterministic planning

Enemies act by mission-defined initiative, then stable entity ID. Planning uses deterministic pathfinding and simulates earlier planned actions so later paths account for the destinations already reserved by earlier enemies.

| Enemy | HP | Move | Damage | Initiative | Behavior |
| --- | ---: | ---: | ---: | ---: | --- |
| Rugger | 6 | 2 | 3 | 10 | Advances down a deterministic Vault lane; attacks a squad member blocking that lane when adjacent |
| Drainer | 4 | 3 | 2 | 20 | Hunts the living unit with the lowest current HP; falls back to the Vault when no unit is reachable |
| Whale | 10 | 1 | 4 | 30 | Alternates a telegraphed cone lock with a later slam |

Both Ruggers have initiative 10, so `rugger-east` resolves before `rugger-north` by stable-ID ordering. The IDs are an engine guarantee, not player-facing flavor text.

### Rugger

- Computes a shortest route toward the Vault with north, east, south, west tie expansion. For lane planning, player-occupied tiles are considered traversable so a squad member can be identified as the blocker on the chosen route.
- Advances along that route until its Move allowance is spent or the next step contains a player unit. It stops before the first player blocker and attacks that unit when adjacent.
- Static blockers and already planned enemy destinations are respected.

### Drainer

- Chooses the living squad unit with the lowest current HP.
- Equal-HP candidates are ordered by reachable path length, then stable entity ID.
- If no squad target is reachable, it routes toward the Vault.
- After dealing at least 1 actual damage, it heals 1 HP without exceeding its maximum. A fully shielded hit causes no healing.

### Whale

The Whale is a one-tile enemy with a multi-tile ground attack. Its state machine is explicit:

1. **Ready:** move up to one tile, choose a cardinal facing, and lock a cone.
2. **Charging:** on its next activation, strike exactly the locked tiles for 4 damage, then return to Ready.
3. **Staggered:** skip its next activation, clear the stagger, and return to Ready.

The cone contains the tile one step forward plus the three-tile-wide rank two steps forward. For a north-facing Whale, for example, it is `N1` plus `NW2`, `N2`, and `NE2`, clipped at the board edge. Obstacles do not block the ground slam. The preview identifies every affected in-bounds tile while Charging.

While Ready, the Whale takes up to one step toward the Vault using the same north, east, south, west deterministic path order. After moving, it faces along the first remaining cardinal step toward the Vault. If no complete route is available, it chooses the cardinal direction that minimizes Manhattan distance to the Vault, with north, east, south, west as the tie order. In the normal turn-3 spawn, the Whale moves from G4 to F4, faces west, and locks E4 plus D3, D4, and D5.

Moving a charging Whale with Shove or Batter Up clears the cone and changes its state to Staggered. Collision without displacement does not.

## Enemy intent contract

Each displayed intent contains:

- Resolution order and enemy identity.
- Planned path and destination.
- Target identity, when the action has a single target.
- Exact damage.
- Every affected tile for an area attack.
- Special state such as breach, charge, slam, or stagger.

The complete turn plan is recalculated after every successful world-state-changing player command. UI-only selection and hover changes do not alter it. End Turn snapshots that plan; enemy resolution consumes it without retargeting or rerolling. If identical game states are provided, serialized plans must be byte-equivalent.

## Damage, defeat, and cleanup

- Damage is integer and deterministic; there are no hit chances, critical hits, armor rolls, or damage ranges.
- Shields are applied before HP damage. `actualDamage` is the amount that reaches HP.
- An entity at 0 HP is defeated and no longer blocks, moves, attacks, or receives future turns.
- Enemy attacks can damage their planned squad target or the Vault. Collision damage follows the stricter push rules above.
- Vault integrity starts at 10. Track whether it ever lost integrity separately for the pristine-Vault bonus.
- Temporary shields expire after the enemy phase for which they were granted.

## Outcome and scoring

Score is calculated once a run reaches a terminal result.

| Component | Score |
| --- | ---: |
| Mission victory | +500 |
| Vault integrity | +100 per remaining quartile |
| Enemy defeated | +75 each |
| Living squad member | +50 each |
| Entire squad survives | +100 |
| Vault never lost integrity | +100 |
| Lost squad member | −50 each |

Remaining Vault quartiles are `ceil(currentIntegrity / maxIntegrity × 4)`, producing 0–4 tiers. With a 10-integrity Vault, the bands are 0, 1–2, 3–5, 6–7, and 8–10 integrity.

| Rank | Requirement |
| --- | --- |
| S | 1200 or more |
| A | 900–1199 |
| B | 650–899 |
| C | Below 650, or any failed mission |

There is no overtime modifier because the mission always terminates at or before phase 5. XP preview is `floor(score / 10)` and is not persisted as progression. Season points are unavailable. Only terminal runs can update the local best score; abandoned and in-progress sessions cannot.

## Player-facing readability

- Teal fill marks valid movement.
- Cyan outline marks attack range/targets.
- Gold arrows mark push interactions and direction.
- Red hatching marks danger; a heavier pulse marks a locked Whale strike.
- The violet Vault treatment remains visible beneath overlays.
- Color is always paired with shape, outline, pattern, label, or icon.
- Contextual hints teach the next useful verb: select, move, attack, push, inspect danger, or end turn.

## Deliberate non-goals

This slice has no procedural missions, randomness, inventory, unit customization, audio, replay playback, mid-mission save, online leaderboard, wallet requirement, token, wagering, or real-money reward. These exclusions keep the authored tactical loop legible and testable.
