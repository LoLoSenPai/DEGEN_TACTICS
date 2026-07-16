# Degen Tactics

**Every move counts.** Degen Tactics is a deterministic, turn-based tactical puzzle for the web. It opens like a game: title screen, one clear deployment action, a full-screen battlefield, then a victory or defeat debrief.

The current vertical slice contains three authored 7x7 operations:

- **Protect the Vault:** survive five enemy phases while defending the district core.
- **Data Extraction:** break a Lane Sentinel's interception grid, then push the Data Block onto E3 before the extraction window closes.
- **Break the Breach:** prepare an anvil, interrupt the Whale's locked slam, then destroy it before the Seal Generator falls.

The MVP is guest-first and runs entirely in the browser. There is no wallet requirement, backend, token, wagering, or play-to-earn system.

## What is included

- A game-first flow: **Title -> Operations or Training -> Battle -> Results**.
- A direct **Play as Guest / Continue** action that deploys into the next operation.
- Three core field-training chapters covering movement, actions, signatures, collision pushes, exact intents, and the Whale interruption, plus the optional **System Override** specialist chapter.
- A visually authored 7x7 DOM battlefield with four SpriteCook-animated pixel heroes and the Lane Sentinel, readable movement routes, attacks, shields, disruption, impacts, deaths, and enemy danger.
- Guardian, Sniper, Pusher, and Hacker units with distinct tactical verbs. The Hacker is currently proven in the training lab and is not yet part of the three-operator campaign squad.
- Deterministic Rugger, Drainer, Lane Sentinel, and two-phase Whale behavior.
- Exact enemy movement, target, damage, and area previews before End Turn.
- Three objective types in the pure engine: fixed-horizon survival, object extraction, and breach-target destruction.
- Per-operation best scores, mission medals, completed-operation unlocks, and a saved last result.
- Keyboard controls, reduced-motion support, and a designed small-screen notice for battle.

## Run locally

Requirements:

- Node.js 20 or newer
- pnpm 10

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Choose **Play as Guest** to deploy, **Operations** to choose an unlocked mission, or **Field Training** for the optional tutorial chapters.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint with zero warnings allowed |
| `pnpm typecheck` | Run TypeScript without emitting files |
| `pnpm test` | Run the Vitest suite once |
| `pnpm test:watch` | Run Vitest in watch mode |

Before handing off a change, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The deterministic engine, presentation, asset-registry, and persistence suite currently contains 110 passing tests covering movement, combat, pushes, disruption, objective timing, exact intents, interception, scoring, shipped animation geometry, sprite-load fallback, and storage fallback.

## How to play

Each living squad member may move once and then take one action. Acting completes that unit's activation. Select a unit, use the highlighted tiles to move or target, and resolve every unit you need before ending the turn. The game warns before forfeiting unused activations.

Enemy intents are promises: the displayed path, destination, target, damage, and affected tiles are the actions that will resolve.

The optional Hacker lab adds deterministic enemy-plan control. **Jam** is reusable at cardinal range 1-3 and reduces the target's next exact activation damage by 2, to a minimum of 0, without changing its route or target. **Blackout** has one mission charge and replaces that exact activation with a stationary, zero-damage `HOLD`, including disabling a Lane Sentinel's interception for that activation. The Hacker has no normal attack.

- In **Protect the Vault**, keep the 10-integrity Vault online through enemy phase 5.
- In **Data Extraction**, clear the stationary Lane Sentinel from E3, then use Shove and Batter Up to deliver the Data Block. Its amber Interception Grid redirects direct attacks against an aligned hostile into the Sentinel; pushes and collision damage bypass the link. Delivery wins immediately, while failing to deliver by the end of enemy phase 5 loses the operation.
- In **Break the Breach**, move the Data Block from F3 to F2 before the Whale arrives, displace its locked charge, then use the Block as an anvil to finish the 12-HP boss. The 4-integrity Seal Generator cannot survive one slam.
- Any operation is lost immediately if its protected structure reaches 0 integrity or the entire squad is defeated.

Keyboard shortcuts:

| Key | Action |
| --- | --- |
| `1` | Move mode |
| `2` | Attack mode; Hacker Jam |
| `3` | Signature/ability mode; Hacker Blackout |
| `S` | Pusher Shove mode |
| `W` | Wait |
| `Space` | End turn |
| `Esc` | Cancel the current mode/selection |
| `F` | Toggle fullscreen |

Battle is designed for viewports at least 1024px wide. Title, Operations, Training, and Results remain readable on phones; battle shows a larger-screen notice below that breakpoint.

## Routes

| Route | Screen |
| --- | --- |
| `/` | Title screen and primary game menu |
| `/operations` | Three-operation selection and local completion status |
| `/training` | Three core tutorial chapters plus optional System Override specialist training |
| `/battle/[missionId]` | Dynamic battle entry for an authored mission |
| `/battle/protect-the-vault` | Legacy-compatible direct battle entry |
| `/results` | Mission-specific outcome, score, medals, Retry, and next operation |

Opening a valid battle route directly creates a fresh mission. Locked operations are rejected until their prerequisite appears in `completedMissionIds`. Opening Results without a saved result returns to Operations. The old `/missions` and `/loadout/protect-the-vault` URLs redirect to `/operations`.

## Persistence and privacy

Only the guest identity, display name, settings, completed training count, `completedMissionIds`, best completed score per operation, and last result are stored in LocalStorage under the versioned `degen-tactics:v1` key. Mid-battle state, selections, animations, timers, and undo history are not persisted. Invalid or incompatible saved data falls back to safe defaults.

Only victories enter `completedMissionIds` and unlock the next operation. A best score never regresses. No account is created and no data leaves the browser in this MVP.

Training progression distinguishes onboarding from specialist certification: completing chapters 1-3 marks the core tutorial complete, while a stored value of 4 additionally records completion of System Override. The fourth chapter never blocks campaign deployment.

## Architecture

```text
src/
  app/                 Title, Operations, Training, dynamic Battle, and Results routes
  components/          Game menu, training, battle, and result presentation
  lib/game/            Pure rules, mission data, AI, scoring, mastery, and storage helpers
  lib/solana/          Future integration boundary (documentation only)
  store/               Zustand command/state and versioned local progression
  styles/              Shared design tokens
docs/                  Design, art, implementation, and roadmap documents
```

The rules engine is pure and independent from React. Commands return `{ state, events }`; components render state and replay events for presentation. Enemy plans are recalculated after every legal player command and the displayed plan is the same snapshot used for enemy resolution.

During development and automated browser checks, `window.render_game_to_text()` exposes a textual snapshot of the active operation, including its objective and exact intents. See [implementation notes](docs/implementation-notes.md) for the contract.

## Documentation

- [Game design and exact rules](docs/game-design.md)
- [Art direction](docs/art-direction.md)
- [Implementation notes](docs/implementation-notes.md)
- [Roadmap](docs/roadmap.md)
- [Future Solana integration](src/lib/solana/README.md)

## Product boundaries

Degen Tactics uses onchain culture as setting vocabulary, not as a financial mechanic. This repository intentionally contains no real-money betting, wagering, token creation, tokenomics, speculative rewards, or play-to-earn behavior. Wallet identity, verified daily scores, and optional non-financial badges are future work and must never become prerequisites for the core game.
