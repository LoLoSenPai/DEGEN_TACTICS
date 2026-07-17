# Roadmap

The roadmap protects the quality of the tactical core. New content is gated by readability, deterministic verification, and guest accessibility. More maps only matter when they create a new decision, and blockchain features never outrank game feel.

## Current vertical slice - Three Fracture Zone operations

The playable product now uses a focused **Title -> Squad -> Battle -> Results** flow, with Operations and Training as optional branches.

### Operation 01 - Protect the Vault

- Authored five-turn survival puzzle on a 7x7 board.
- Choose any three of Guardian, Sniper, Pusher, and Hacker; the original trio remains recommended.
- Shield Wall, Deadeye, Shove, Batter Up, collision damage, and movable Data Block.
- Deterministic Rugger, Drainer, and two-phase Whale with exact intents.
- Vault/squad defeat precedence, operation-specific scoring, and three medals.

### Operation 02 - Data Extraction

- Unlocks after a Protect the Vault victory through persisted `completedMissionIds`.
- Uses the `extract-object` objective variant: deliver the Data Block to E3 before enemy phase 5 ends.
- Wins immediately on exact delivery and emits extraction/mission-end events from the pure engine.
- Places a stationary 6-HP Lane Sentinel on E3. Its exact amber Interception Grid redirects direct attacks against the aligned E2 Rugger, while push/collision remains a bypass and positional counter.
- Requires the Pusher and recommends Sniper / Pusher / Hacker; Jam and Blackout are verified in the complete extraction solution.
- Adds extraction route readability, tempo scoring, and Express Transfer, Rig Untouched, and Full Escort medals.
- Reuses the proven battlefield art while validating that the new push-routing puzzle is fun before commissioning another complete arena.

### Operation 03 - Break the Breach

- Unlocks after a Data Extraction victory through persisted `completedMissionIds`.
- Uses the `break-breach` objective variant: prepare the Data Block at F2, interrupt the spawned Whale's locked cone, and destroy that exact target before enemy phase 5 ends.
- Turns one existing object into both setup puzzle and collision anvil. A blocked push does damage but leaves the charge active; the following slam destroys the 4-integrity Seal Generator.
- Adds immediate attack/collision terminal outcomes, boss tempo scoring, and Charge Broken, Breach Window, and Full Squad medals.
- Reuses the exact-intent, Whale, Pusher, combat-playback, persistence, and results systems without adding randomness or permanent power.
- Keeps Guardian / Sniper / Pusher required until a Hacker boss route is deliberately balanced and verified.

### Current quality gates

- Game-first title screen, full-screen squad deployment, three core training chapters plus optional System Override specialist training, operation selection, dynamic battle routes, and mission-aware results.
- A real win/lose/retry/next-operation loop for all three objective types.
- Exact previews that match deterministic enemy resolution.
- Animated movement, attacks, shields, impacts, damage, KO, heavy hits, and turn/result transitions.
- Local guest identity, training progress, per-operation squad choice and best scores, completion unlocks, last result, and safe storage fallback.
- Desktop/tablet battle, phone notice, keyboard support, focus visibility, and reduced motion.
- 116 passing deterministic engine/presentation/asset-registry/persistence tests plus lint, strict typecheck, production build, serialized-state browser checks, screenshot inspection, and console review as release gates.

## Next content sequence

### Completed - One new enemy

The Lane Sentinel now anchors Data Extraction rather than adding another damage-focused chaser. Its clear cardinal support grid redirects direct player attacks from an aligned hostile into the nearest Sentinel; terrain, the protected structure, and the Data Block stop the link, while combatants do not. Push and collision bypass it.

The engine exposes an exact `guard` / `intercept-grid` intent and ordered interception/fortification events. Presentation pairs a quiet amber grid with a dominant tether, `GUARD` badge, actual-receiver attack preview, inspector copy, and deterministic serializer fields.

Its approved SpriteCook set is now live: one canonical pixel master plus grouped idle, hit, custom guard, and 12-frame death sheets. All battle sheets share the title/direct-entry predecode gate, so the first intercepted hit cannot disappear on a cold cache.

### Completed - Fourth hero

The fourth role is now the Hacker: a 6-HP, Move-3 enemy-plan controller with no normal attack. Reusable Jam reduces the target's next exact activation damage by 2, minimum 0, without changing its route or target. One-charge Blackout replaces that activation with a stationary zero-damage `HOLD` and disables Lane Sentinel interception while pending.

The optional two-turn **System Override** lab teaches both verbs after the three core onboarding chapters. Core completion remains `trainingCompleted >= 3`; value 4 records specialist certification. Browser QA completed the chapter at 1440px and 1024px, verified the phone notice, and captured zero console errors.

The approved SpriteCook set uses master `c0608002-9691-4b1b-b6fe-ad812cbc48df` plus one grouped run, `c373c196-3c3f-4ca9-9fa2-2405fda93e55`, for `idle`, `walk`, `jam`, `blackout`, `hurt`, and `death`. The pass cost 114 credits, left 454, and brings the shared battle preload registry to 28 sheets.

The Hacker now joins campaign deployment where the authored puzzle supports it. Protect the Vault allows any trio; Data Extraction requires Pusher and recommends Sniper / Pusher / Hacker; Break the Breach keeps the proven Guardian / Sniper / Pusher trio locked until its boss route is rebalanced.

### Completed - Three-of-four squad selection

The full-screen `/squad/[missionId]` hangar now lets the player choose three operators before deployment. Large animated pieces, three formation slots, compact exact ability copy, authored recommendations, and required-role messaging keep the screen game-like rather than turning it into a stat-heavy loadout dashboard.

- No gear score, rarity, stat upgrade, or permanent power grind.
- Protect the Vault permits all four choose-three combinations; Data Extraction requires Pusher; Break the Breach explicitly locks its currently proven trio.
- Selection persists locally per mission, survives reload, and is reused by Retry. Invalid or outdated combinations fall back safely.

### Next - Composition balance and a new authored decision

- Run novice playtests across the legal Protect and Data Extraction trios, then adjust recommendation copy or mission rules without adding permanent power.
- Unlock Hacker for Break the Breach only after a deterministic alternate boss solution meets the same readability and scoring bar.
- Build the next operation around a genuinely new terrain, enemy, or composition decision rather than adding a cosmetic map reskin.

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
