Original prompt: Build Degen Tactics from scratch as a premium-feeling Next.js 15 tactical puzzle vertical slice. Include HQ, mission select, loadout, a deterministic playable 7x7 Protect the Vault mission, results, local persistence, exact enemy intent previews, bespoke CSS/SVG art direction, future Solana documentation, tests, and browser verification. No tokenomics, gambling, Phaser, database, or mandatory wallet.

## 2026-07-10

- Accepted implementation plan locked the per-unit move-then-action economy, one-charge signature abilities, exact enemy plans, two-phase Whale cone, one Data Block, guest-first identity, and desktop/tablet battle target.
- Initialized the manual Next.js 15 scaffold and global design tokens.
- Installed pinned application and test dependencies with pnpm; lockfile generated successfully.
- Completed the branded HQ, campaign map, and fixed-squad briefing routes; their typecheck, lint, and HTTP smoke checks passed.
- Added the battle visual primitives/CSS, Zustand session/persistence integration, and results presentation shell as the integration foundation.
- Completed README, exact game-design rules, art direction and generation prompts, implementation notes, roadmap, and future Solana integration documentation.
- Completed the immutable deterministic engine, authored mission, movement/LOS/push rules, signature charges, exact enemy planning, Whale scripting, outcome timing, scoring, and persistence validation.
- Completed all five routes and the Zustand command layer, including one-step movement undo, event-derived presentation, transient animation state, storage hydration/fallback, and the development text serializer.
- Completed the premium battle HUD and semantic 7×7 DOM grid with layered intent overlays, keyboard/fullscreen controls, reduced motion, 1024px tablet play, and the designed phone notice.
- Passed the pure-engine and persistence suite with 38 deterministic tests.
- Visually inspected HQ, campaign, briefing, battle, Whale telegraph, victory, defeat, 1024px battle, and 390px notice captures.
- Replayed a canonical DOM victory (Vault 10/10, three survivors, three kills, 1475 points, rank S) and a deliberate defeat; verified exact intents, Shield Wall, Deadeye, Shove, Batter Up, Whale interruption/stagger, Wait, undo, Retry reset, direct-results fallback, score persistence/non-regression, and disabled actions.
- Verified the movable Data Block through a real DOM shove from D6 to C6 and confirmed a clean browser session with zero console errors or warnings.
- Fixed the Retry/result-guard navigation race and normalized signed XP preview copy uncovered during end-to-end QA.

## 2026-07-11 — Game-first pivot

- User rejected the campaign/dashboard presentation and narrowed the MVP to title screen → direct battle → victory/defeat.
- Selected the premium pixel-art battle direction and consolidated it with the supplied pixel-strike/tactical-diorama references; saved the final target at `docs/design-reference/pixel-diorama-battle-target.png`.
- Generated a reusable blacksite arena background plus transparent, inspected pixel-art sprites for Guardian, Sniper, Pusher, Rugger, Drainer, Whale, Vault, Data Block, and obstacles.
- Replaced the HQ landing page with a full-screen title menu featuring Play as Guest, disabled Connect Wallet, and functional Options.
- Rebuilt the battle presentation around a dominant full-screen board, minimal edge HUD, contextual inspector, game-style action bar, 2-second mission intro, exact intent overlays, FLIP-style movement, damage/impact feedback, and the existing deterministic rules.
- Dark global palette now replaces the beige document theme. Typecheck and lint pass after the title/battle rewrite.
- Generated and integrated a canonical square `blacksite-board-7x7.png` with all 49 cells baked into the artwork; the semantic DOM grid is now a transparent interaction layer aligned exactly over the authored terrain.
- Generated transparent mechanical HUD/action frame assets and applied them to the objective, turn, Vault, inspector, action bar, and End Turn controls.
- Enlarged the battlefield, removed the boxed CSS-grid treatment, and verified title â†’ battle â†’ Guardian move â†’ Shield Wall â†’ enemy phase â†’ Turn 2 through semantic DOM interactions with serialized state and screenshots.
- Simplified the results route to a full-screen Victory/Defeat presentation with Retry and Title actions only.
- Completed matched-state visual QA against the approved pixel-diorama reference, including full-view, battlefield, and action-bar comparison montages; `design-qa.md` records `final result: passed`.
- Verified 1440×900, 1280×720, 1024×768, and 390×844 captures, including the designed phone notice, with no horizontal overflow or console errors.
- Replayed a deliberate defeat into the redesigned results screen and confirmed score/outcome data, Retry/Title controls, and an empty console error log.
- Final gates after the game-first asset and typography fixes: lint passed with zero warnings, strict typecheck passed, all 38 tests passed, and the Next.js production build generated all 9 static pages.

## 2026-07-12 — Onboarding and sprite registration

- Audited the transparent content bounds of every board sprite. The source files use incompatible square, portrait, and landscape canvases, which made a shared CSS scale impossible.
- Added per-role scale and ground-anchor rules so Guardian, Sniper, Pusher, Ruggers, and Drainer remain inside their cells with consistent visual weight; raised the shared team bases and normalized the Vault, Data Block, Whale, and obstacle registrations.
- Added player-attack damage effects so guided attacks now produce the same event-derived damage popup and heavy-hit hooks as enemy damage.
- Implemented a persisted first-battle interactive tutorial: objective/intents overview, select Guardian D3, move to D2, choose Attack, strike Rugger D1, read exact intents, commit End Turn, watch resolution, then release control on Turn 2.
- Tutorial input policy blocks unrelated tiles, buttons, Space, and Undo without hiding future actions. Skip persists immediately; Options can replay the guide on the next battle.
- Extended `window.render_game_to_text()` with tutorial step, allowed coordinate, and allowed action for deterministic browser QA.
- Added `docs/gpt-image-prompts-batch-01.md` with copy-paste prompts for a normalized Guardian master/idle sheet, a modular enemy-intent path kit, and a three-state action-button master.
- Replayed the complete tutorial, persistence, replay, skip, keyboard blocking, 1280×720, 1024×768, and phone-notice flows with zero captured console errors.
- Final gates passed: lint with zero warnings, strict typecheck, all 38 tests, and the 9-page Next.js production build.
- Re-measured the baked 1254x1254 battlefield at source-pixel level after a reported interaction-layer drift. Replaced the approximate 2.55% inset with the authored rail bounds (x 59-1199, y 54-1183), exact seven-track proportions, and removed hover scaling that expanded tile outlines beyond their rails.
- Added `output/grid-alignment-qa.mjs`, which projects the frozen source rail coordinates into browser space and asserts all eight horizontal/vertical boundaries at 1024x768, 1280x720, 1440x900, and 2048x1245. Maximum measured drift is 0.043 CSS px; diagnostic screenshots and console logs passed.
- Replayed the complete interactive tutorial after grid calibration; D3 selection, D2 movement, D1 attack, enemy resolution, persistence, replay, and skip remain functional with zero captured console errors.
- Post-calibration gates passed: lint with zero warnings, strict typecheck, all 38 tests, and a clean optimized production build of all 9 static pages.

## 2026-07-12 — Incoming generated-asset audit

- Audited the four files under `public/art/incoming` for source dimensions, real alpha, opaque bounds, frame geometry, anchors, and fit with the live board/HUD. All four have genuine transparent RGBA backgrounds, but none is safe to integrate raw.
- Guardian master is 1536x1024 rather than 1024x1024. Its isolated 577x636 silhouette is technically clean and can be recanvased/reanchored, but the helmeted chibi redesign conflicts with the current expressive human squad and needs art-direction approval before replacement.
- Guardian idle is a centered 1024x1024 area containing four ~512x512 poses inside a 1536x1024 file, not the requested 2048x2048 equal-frame sheet. Frames bleed by one pixel, their foot anchors shift 14–15 source pixels, and independent redrawing will create animation shimmer. It is prototype-salvageable only after extraction and registration.
- Teal action buttons are three irregular bands inside a 500x500 file rather than three aligned 1536x512 rows. The frames are extractable and could seed one teal 9-slice button, but do not cover current aspect ratios, disabled/focus/selected states, or blue/violet/gold families.
- Intent kit is 707x353 and cannot tile: its nominal 4x2 slots are unequal, all path connectors stop well before slot edges, capped segments create gaps/double joints, and danger plates obscure the floor. Keep only isolated marker/decal ideas; reject it for exact enemy paths.
- TODO: if the Guardian redesign is accepted, normalize its static master locally. For animation, request one strict transparent 1024x1024 edited frame at a time and assemble/register the sheet in code; do not ask Image Gen to compose the spritesheet.

## 2026-07-12 — Progressive training and exact SVG intents

- Replaced the disconnected per-cell intent arrows with a deterministic SVG overlay built from the exact `EnemyTurnPlan`. It follows the calibrated nonuniform board rails and renders continuous movement routes, corners, directional arrowheads, ordered badges, dashed attack links, target reticles, and exact damage without raster assets.
- Added pure geometry tests for calibrated tile centers, continuous corner paths, target deduplication, and trimmed attack links. Typecheck and the focused Vitest suite pass; the official browser client captured the new routes with serialized intent state and no console error artifact.
- Added three engine-valid first-time training missions that run directly inside the battle route: First Contact (move/attack/intent/commit), Action Economy (independent activations, Shield Wall, line of sight and Deadeye), and Momentum (Wait, Data Block push, enemy-only collision, Whale warning/lock/cancel/stagger).
- Rebuilt onboarding presentation around large centered lesson intros, 1/3 progress, readable imperative-first copy, contextual coach cards, dynamic target spotlights, a dimmed attention layer, responsive 1024px typography, and replay/skip controls. The player is no longer released until all core rules have been performed in real deterministic states.
- Added persisted `trainingCompleted` progress. Partial curricula continue from the next lesson, completion starts a fresh Protect the Vault mission, Options can replay all lessons, Skip Training safely unlocks the final mission, and old boolean tutorial storage falls back to the new curriculum.
- Added four deterministic curriculum engine tests plus a third SVG area-intent test. The complete semantic browser pass now executes every tutorial input, validates exact damage/shield/object/collision/Whale state, reload persistence, replay, skip, and final mission handoff with zero captured console errors.
- Final curriculum gates passed: ESLint with zero warnings, strict TypeScript, all 45 Vitest cases, `git diff --check`, and a clean optimized Next.js 15 production build of all 9 static pages.
- Re-ran the main-battle and deliberate-defeat regressions after training integration; both remained playable with zero captured console errors. Grid registration still measures below 0.05 CSS px of authored rail drift at every supported viewport.

## 2026-07-12 — Readable combat playback and VFX

- Replaced the single-frame enemy-turn commit with a deterministic presentation queue compiled from the already locked `GameEvent` sequence. Enemy movement, attack anticipation, impact, shield absorption, damage, lethal KO, and the next actor now play in order without retargeting or changing the authoritative result.
- Added the same readable beats to player attacks, Deadeye kills, Shield Wall and collision kills. Defeated enemies remain as temporary presentation ghosts through their KO animation, then leave the board.
- Integrated only four lightweight 30 fps effects from CodeManu's Free VFX Asset Pack: normal hit, heavy hit, electric shield and energy death. The 96 MB source folder remains ignored; conservative attribution is documented beside the shipped effects.
- Added combat callouts (`ATTACKS`, exact damage, `BLOCK`, `HERO KO` / `ENEMY DOWN`), persistent shield auras, HP popups, shield-break feedback and event-derived VFX. Reduced-motion mode keeps static explanatory labels while removing animated sprites and lunges.
- Expanded Lessons 1 and 2 with explicit post-action explanations of HP loss, KO/defeat, one-hit shield consumption, absorbed damage and actual HP damage. Watch steps no longer dim the battlefield, and player-action tutorial cards temporarily clear while VFX play.
- Added three pure playback tests. All 48 tests, strict typecheck and ESLint pass. Browser QA captured player attack, enemy attack, normal impact, Shield Wall cast, shield absorption, Deadeye enemy KO, ally KO, final defeat and the complete three-lesson flow with zero console errors.
- Final responsive, grid-alignment and main-battle regressions passed after the VFX integration. The optimized Next.js 15 production build generated all 9 static pages, `git diff --check` is clean, and the local development server was restarted on port 3000.

## Final verification (original slice)

- Passed `pnpm lint` with zero warnings, strict `pnpm typecheck`, all 38 `pnpm test` cases, and the optimized Next.js 15 production build.
- Smoke-tested the production server through HQ → missions → briefing → fresh battle plus direct-results fallback; the production browser console remained at zero errors and zero warnings.
- Inspected the final 1440×900 production battle capture alongside the earlier 1280×720, 1024×768, and 390×844 QA captures; the premium tactical hierarchy, readable exact intents, disabled-state copy, focusable DOM grid, and responsive notice all held.

## 2026-07-13 — Exact movement previews and combat archetypes

- Added a teal SVG movement preview that appears on pointer hover and keyboard focus, follows the exact deterministic BFS route used by the movement command, respects authored board rails and obstacles, and disappears on cancel, blur, mode change, or movement.
- Added destination rings, route nodes, an animated arrowhead, focus-visible tile feedback, and contextual copy such as `Move Guardian to D2 · 2 tiles`. Space and Enter now activate a focused board tile instead of accidentally ending the turn.
- Added role-specific event-derived combat presentation: Guardian shield bash, Sniper shot, Deadeye beam, Pusher Shove/Batter Up, Rugger charge, Drainer siphon and heal, plus an exact-area Whale ground slam.
- Grouped the Whale's simultaneous locked-area damage into one readable windup and one impact while preserving every exact target and damage event. Successful non-collision pushes now receive their own movement beat instead of visually teleporting.
- Extended the text serializer with movement previews, combat variants, exact areas, multi-target hits, and enemy-plan targets for deterministic browser assertions.
- Added pure tests for route calculation, calibrated preview geometry, Whale multi-target playback, and effect grouping. The suite now contains 52 passing tests.
- Replayed the complete three-lesson training, Drainer siphon/heal, Whale charge/slam, main battle, results/defeat, responsive layout, and source-pixel grid registration with zero captured console errors.

## 2026-07-13 — Player-paced training and activation clarity

- Replaced the forced three-lesson tunnel with a dedicated `/training` hub. The three playable chapters now show their purpose, skills, duration, locked/available/completed state and persisted `0/3` progress; completed chapters can be replayed without resetting progress.
- The title screen now separates `Play as Guest` from `Field Training`. Launching the mission before all chapters are complete shows an explicit choice to continue training, play anyway or cancel; playing early preserves the real training progress.
- Each chapter returns to the hub instead of auto-starting the next one. Every interactive coach step offers `Exit lesson`, training intros are shorter, and the former intimidating 10/11/22 microstep counts are presented as four understandable milestones per chapter.
- Added a clickable squad readiness rail and on-board `READY`, `ACTION`, and `DONE` badges. A moved hero remains visibly actionable, completed heroes are muted without hiding HP/status, and End Turn displays the exact number of unfinished activations.
- Added a shared End Turn confirmation for mouse and keyboard. It lists every unfinished hero as `Move + action remaining` or `Action remaining`, can return directly to the first pending hero, and is skipped when every living hero has acted or during authored training commits.
- Expanded selected-hero information with exact one-mission charge state, ability effect and restrictions. Deadeye explains its no-movement lock, Pusher distinguishes reusable Shove from one-charge Batter Up, and spent charges remain visible as `0/1`.
- Raised core battle, inspector, action-hint, tutorial and training-hub text sizes. The 1024px coach now stays above 310px wide with 16px imperative/body text, a visible `NEXT MOVE` rail and clearer chapter progress.
- Added semantic browser coverage for chapter choice/exit/persistence, unfinished-training deployment, activation states, End Turn cancel/confirm, charge spending, reusable actions, Deadeye blocking, zero-warning full activation, and computed 1024px readability. Updated all existing curriculum, combat, results, responsive and grid-registration regressions for the new flow.
- Final gates passed: ESLint with zero warnings, strict TypeScript, all 52 Vitest cases, `git diff --check`, the complete browser suite with zero captured console errors, and a clean Next.js 15 production build including the new training route.
