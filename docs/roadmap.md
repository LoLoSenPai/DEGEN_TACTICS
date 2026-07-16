# Roadmap

The roadmap protects the quality of the tactical core. New content is gated by readability, deterministic verification, and guest accessibility. More maps only matter when they create a new decision, and blockchain features never outrank game feel.

## Current vertical slice - Two Fracture Zone operations

The playable product now uses a focused **Title -> Operations or Training -> Battle -> Results** flow.

### Operation 01 - Protect the Vault

- Authored five-turn survival puzzle on a 7x7 board.
- Guardian, Sniper, and Pusher activation economy.
- Shield Wall, Deadeye, Shove, Batter Up, collision damage, and movable Data Block.
- Deterministic Rugger, Drainer, and two-phase Whale with exact intents.
- Vault/squad defeat precedence, operation-specific scoring, and three medals.

### Operation 02 - Data Extraction

- Unlocks after a Protect the Vault victory through persisted `completedMissionIds`.
- Uses the `extract-object` objective variant: deliver the Data Block to E3 before enemy phase 5 ends.
- Wins immediately on exact delivery and emits extraction/mission-end events from the pure engine.
- Adds extraction route readability, tempo scoring, and Express Transfer, Rig Untouched, and Full Escort medals.
- Reuses the proven battlefield art while validating that the new push-routing puzzle is fun before commissioning another complete arena.

### Current quality gates

- Game-first title screen, optional chapter-based training, operation selection, dynamic battle routes, and mission-aware results.
- A real win/lose/retry/next-operation loop for both objective types.
- Exact previews that match deterministic enemy resolution.
- Animated movement, attacks, shields, impacts, damage, KO, heavy hits, and turn/result transitions.
- Local guest identity, training progress, per-operation best scores, completion unlocks, last result, and safe storage fallback.
- Desktop/tablet battle, phone notice, keyboard support, focus visibility, and reduced motion.
- 80 passing deterministic engine/persistence tests plus lint, strict typecheck, production build, serialized-state browser checks, screenshot inspection, and console review.

## Next content sequence

### 1. Operation 03 - Break the Breach

Build one authored mission around interrupting and exploiting a breach rather than simply increasing enemy count. It should combine the Whale's locked attack with intentional displacement and make the player's learned push knowledge feel powerful.

Required before completion:

- A third distinct objective or mission script expressed in pure mission data.
- A board with a readable tactical premise and at least one canonical solution path.
- Operation-specific intro, HUD copy, scoring, medals, results, tests, and browser victory/defeat passes.
- No permanent stat progression and no random combat outcomes.

### 2. One new enemy

Add a single enemy only if its intent is readable at a glance and creates a new positioning question. Extend domain rules, serializer, AI tests, VFX/sprite states, and player-facing intent language together.

Candidate direction: a unit that anchors, redirects, or protects a lane, rather than another damage-focused chaser.

### 3. Fourth hero

Create one new squad role with a complete pixel-art state set and a mechanically distinct verb. Hacker or support/control remain stronger candidates than another direct attacker.

Definition of done:

- Idle, walk, attack/ability, hit, and death states.
- Basic action, one-charge signature, exact rule text, and deterministic tests.
- Clear interaction with existing enemies and objectives.
- Readable selection state and action preview at the current board scale.

### 4. Three-of-four squad selection

After the fourth hero is proven, allow the player to choose three operators before deployment. Keep this as a compact game screen or pre-battle choice, not a stat-heavy loadout dashboard.

- No gear score, rarity, stat upgrade, or permanent power grind.
- Each authored operation remains solvable by more than one valid trio or clearly communicates a recommended squad.
- Selection persistence is local and never required for the existing default squad flow.

## Later offline depth

- Additional authored operations, each built around a distinct verb, terrain interaction, enemy behavior, or squad composition problem.
- New arena art only after the mission's board geometry and puzzle loop survive gray-box playtests.
- Optional muted-by-default sound effects driven exclusively by `GameEvent` values.
- Local replay only after commands can be serialized and replayed deterministically across engine versions.
- User-controlled motion, contrast, and audio settings plus a documented keyboard grid-navigation model.
- Save export/import and localization once the content schema stabilizes.

## Future online services

### Daily challenge

- Versioned deterministic daily mission definitions.
- Server-authoritative result validation or command-replay verification; never trust a browser-submitted total.
- Anonymous guest submission with rate limits and a later migration path to optional wallet identity.
- Daily/seasonal leaderboards only after privacy, moderation, anti-cheat, and retention policies are defined.
- Fully offline operations and local scores remain available during service outages.

### Optional identity and cosmetics

- Wallet connection remains an optional profile action, never a boot gate.
- Authentication uses a scoped, expiring signed message and never discards guest progress without confirmation.
- Wallet profiles may support cross-device scores, but cannot alter rules or unlock power.
- Optional completion or season badges must have no financial utility, be explicitly initiated, disclose costs, and leave the non-minting play path equivalent.

See the [Solana integration note](../src/lib/solana/README.md) for the intended security and service boundary.

## Production readiness

- Content/version migration tools for missions, objectives, and deterministic replays.
- Performance budgets, error reporting, privacy-safe analytics, deployment runbooks, and target-browser verification.
- One approved pixel-art visual bible across heroes, enemies, structures, props, HUD, and VFX.
- Input, color contrast, screen-reader, reduced-motion, and target-device validation before public release.

## Permanent boundaries

Degen Tactics will not add:

- Wagering, real-SOL betting, casino mechanics, loot boxes purchased with money, or paid random rewards.
- A fungible token, token sale, tokenomics, yield, staking, or speculative economy.
- Play-to-earn rewards or financial incentives tied to wins, rank, time played, or wallet holdings.
- Pay-to-win units, mission power, leaderboard boosts, or required NFT ownership.
- A mandatory wallet for operations or core tactical play.

Optional wallet identity and cosmetic badges must remain separable from the deterministic game engine. If a future feature cannot meet that boundary, it does not belong in this product.
