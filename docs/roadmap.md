# Roadmap

The roadmap protects the quality of the tactical core. New systems are gated by readability, deterministic verification, and guest accessibility; blockchain features never outrank game feel.

## Milestone 0 — Premium vertical slice

The current release target is one authored mission, **Protect the Vault**.

Completion gates:

- HQ, Chapter 01 mission select, squad briefing, battle, and results routes.
- A real five-turn win/lose loop on the 7×7 grid.
- Move-then-act unit activations, undo-before-action, attacks, shields, pushes, collision, Data Block, and the Whale state machine.
- Exact enemy intents that match deterministic resolution.
- Local guest identity, best completed score, last result, and mock leaderboard.
- Coherent custom SVG/CSS art, responsive supporting screens, 1024px battle support, keyboard operation, and reduced-motion behavior.
- Pure rule/persistence tests, canonical victory and defeat browser passes, visual checks at target viewports, and clean lint/type/build gates.
- Complete game, art, implementation, and future-integration documentation.

Anything that weakens one of these gates is deferred, even if it appears below.

## Milestone 1 — Deeper offline tactics

- Tune Protect the Vault from observed player behavior without adding randomness to its intent contract.
- Add a second authored mission, **Signal Breach**, only after it introduces a distinct puzzle verb rather than more enemies on a new board.
- Add one new squad role (Hacker or Medic) with complete silhouette, rules, intent interactions, and tests.
- Add optional muted-by-default sound effects driven exclusively by game events.
- Add a local replay timeline only after commands can be serialized and replayed deterministically across engine versions.
- Improve accessibility with user-controlled motion/contrast settings and a documented grid-navigation model.

## Milestone 2 — Daily challenge service

- Introduce versioned daily mission definitions with a shared deterministic seed/configuration.
- Build server-authoritative result validation or command-replay verification; never trust a browser-submitted total.
- Add anonymous guest submissions with rate limits and a migration path to an authenticated wallet identity.
- Replace the mock leaderboard with daily/seasonal views only after privacy, moderation, anti-cheat, and retention policies are defined.
- Preserve fully offline campaign play and local scores during service outages.

## Milestone 3 — Optional identity and cosmetics

- Add wallet connection as an optional profile action, not a boot gate.
- Add sign-in by a scoped, expiring wallet message and an account-link flow that never discards local guest progress without confirmation.
- Add wallet-based display identity and cross-device score/profile retrieval.
- Explore a compressed NFT completion/season badge only after the badge has no financial utility, the mint is explicitly initiated, costs are shown in advance, and a non-minting path remains equivalent for play.
- Keep game rules, mission access, rankings, and power independent of wallet balance or badge ownership.

See the [Solana integration note](../src/lib/solana/README.md) for the intended security and service boundary.

## Milestone 4 — Content and production readiness

- Author additional chapters as small sets of tested puzzle missions with new terrain and enemy behaviors.
- Add content/version migration tools for missions and deterministic replays.
- Establish performance budgets, error reporting, privacy-safe analytics, save export/import, localization infrastructure, and deployment runbooks.
- Complete production art from one approved visual bible; do not mix unrelated generated or stock asset styles.
- Validate input, color contrast, screen-reader behavior, reduced motion, and target browser/device support before public release.

## Permanent boundaries

Degen Tactics will not add:

- Wagering, real-SOL betting, casino mechanics, loot boxes purchased with money, or paid random rewards.
- A fungible token, token sale, tokenomics, yield, staking, or speculative economy.
- Play-to-earn rewards or financial incentives tied to wins, rank, time played, or wallet holdings.
- Pay-to-win units, mission power, leaderboard boosts, or required NFT ownership.
- A mandatory wallet for campaign or core tactical play.

Optional wallet identity and cosmetic badges must remain separable from the deterministic game engine. If a future feature cannot meet that boundary, it does not belong in this product.
