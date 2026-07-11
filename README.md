# Degen Tactics

**Every move counts.** Degen Tactics is a deterministic, turn-based tactical puzzle for the web. This vertical slice contains one authored five-turn mission: position a three-unit squad, read exact enemy intents, and keep the Vault online.

The MVP is guest-first and runs entirely in the browser. There is no wallet requirement, backend, token, wagering, or play-to-earn system.

## What is included

- A premium game-menu flow: HQ, mission select, briefing, battle, and results.
- A fully interactive 7×7 React/CSS battlefield.
- Guardian, Sniper, and Pusher units with distinct actions and one-charge signature abilities.
- Deterministic Rugger, Drainer, and two-phase Whale behavior.
- Exact enemy movement, target, damage, and area previews before End Turn.
- Local best-score persistence and a deterministic mock leaderboard.
- Keyboard controls, reduced-motion support, and a designed small-screen notice for battle.

## Run locally

Requirements:

- Node.js 20 or newer
- pnpm 10

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Start at HQ, choose **Play Campaign**, open **Protect the Vault**, and start the mission from its briefing.

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

## How to play

Each living squad member may move once and then take one action. Acting completes that unit's activation. Select a unit, use highlighted tiles to move or target, and resolve every unit you need before ending the turn. Enemy intents are promises: the displayed path, destination, target, damage, and affected tiles are the actions that will resolve.

Protect the 10-integrity Vault through enemy phase 5. The mission is lost immediately if the Vault reaches 0 integrity or the entire squad is defeated.

Keyboard shortcuts:

| Key | Action |
| --- | --- |
| `1` | Move mode |
| `2` | Attack mode |
| `3` | Signature/ability mode |
| `Space` | End turn |
| `Esc` | Cancel the current mode/selection |
| `F` | Toggle fullscreen |

Battle is designed for viewports at least 1024px wide. HQ, missions, briefing, and results remain readable on phones; the battle route shows a larger-screen notice below that breakpoint.

## Routes

| Route | Screen |
| --- | --- |
| `/` | HQ and primary game menu |
| `/missions` | Chapter 01 mission path |
| `/loadout/protect-the-vault` | Mission briefing and fixed squad |
| `/battle/protect-the-vault` | Playable tactical mission |
| `/results` | Outcome, score breakdown, and local leaderboard |

Opening the battle route directly creates a fresh mission. Opening results without a saved result returns to mission select.

## Persistence and privacy

Only the guest identity, display name, settings, best completed scores, and last result are stored in LocalStorage under the versioned `degen-tactics:v1` key. Mid-battle state, selections, animations, and timers are not persisted. Invalid or incompatible saved data falls back to safe defaults.

No account is created and no data leaves the browser in this MVP.

## Architecture

```text
src/
  app/                 Next.js App Router screens
  components/          Layout, menu, mission, loadout, battle, and result UI
  lib/game/            Pure rules, mission data, AI, scoring, and storage helpers
  lib/solana/          Future integration boundary (documentation only)
  store/               Zustand command/state layer
  styles/              Shared design tokens
docs/                  Design, art, implementation, and roadmap documents
```

The rules engine is pure and independent from React. Commands return `{ state, events }`; components render state and replay events for presentation. Enemy plans are recalculated after every legal player command and the displayed plan is the same snapshot used for enemy resolution.

During development and automated browser checks, `window.render_game_to_text()` exposes a textual snapshot of the current mission. See [implementation notes](docs/implementation-notes.md) for its contract.

## Documentation

- [Game design and exact rules](docs/game-design.md)
- [Art direction](docs/art-direction.md)
- [Implementation notes](docs/implementation-notes.md)
- [Roadmap](docs/roadmap.md)
- [Future Solana integration](src/lib/solana/README.md)

## Product boundaries

Degen Tactics uses onchain culture as setting vocabulary, not as a financial mechanic. This repository intentionally contains no real-money betting, wagering, token creation, tokenomics, speculative rewards, or play-to-earn behavior. Wallet identity, verified daily scores, and optional non-financial badges are future work and must never become prerequisites for the core game.
