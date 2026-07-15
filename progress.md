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

## 2026-07-13 — SpriteCook Guardian animation prototype

- Audited the raw `spritecook` exports without modifying them. Idle, attack and hurt are coherent 8-frame 640×640 transparent sequences at 125 ms per frame; death is 12 frames / 1.5 s. Foot registration stays within four source pixels, but every animated WebP loops forever and the realistic silhouette differs sharply from the current pixel-art roster.
- Converted runtime derivatives into four single-image 320 px-per-frame WebP strips under `public/assets/sprites/spritecook` (about 1.9 MB total instead of 4.9 MB of animated WebP). The attack strip is recovered from the WebP-only export; all source files remain untouched.
- Added a battle-only `GuardianBattleSprite` with CSS-controlled idle, shield-bash, hurt and death playback. Motion priority is death → real HP damage → attack → idle; a fully absorbed shield hit does not incorrectly play hurt. Existing static Guardian art remains in portraits and squad cards for an isolated A/B prototype.
- Added dedicated scale, ground anchor, smoothing and contrast treatment so the detailed Guardian stays inside one authored cell at 1440, 1280 and 1024 widths. `prefers-reduced-motion` now shows meaningful static attack/hurt/death poses instead of running the frame animations.
- Extended player Guardian attack anticipation to 620 ms and its KO beat to 920 ms so the supplied sequences are readable. Removed a competing 680 ms fallback cleanup during active combat cues; the deterministic playback queue is now the sole owner of effect lifetime, fixing the premature-disappearance bug found by browser QA.
- Moved the energy-death accent behind the dying piece and reduced its size/opacity, keeping the generated fall visible instead of covering it with VFX.
- Extended `render_game_to_text()` with exact Guardian animation source, motion and effect id. Semantic QA verified all four real gameplay states, changing frame positions, a late death pose at ~733 ms, intact tutorial/main-battle flows, 1024 play, and zero captured console errors. The full three-chapter browser curriculum also still passes.
- Final gates passed: ESLint with zero warnings, strict TypeScript, all 52 Vitest cases (including the 920 ms Guardian KO contract), `git diff --check`, and a clean optimized Next.js 15 production build of all routes.

## 2026-07-13 — Pixel Sniper animation direction

- Locked gameplay pieces to modern pixel art. The realistic Guardian SpriteCook override is no longer used on the board; the original pixel Guardian is active again while the raw user exports remain preserved.
- Normalized the existing Sniper identity into a fixed 256×256 transparent character master and imported it into SpriteCook. A rejected oversized `/animate` request spent zero credits.
- Used one `/characters` batch for an 8-frame idle plus an 8-frame custom rifle shot. SpriteCook charged 34 credits instead of the 40-credit standalone ceiling; both outputs completed with binary transparency, an exact shared `y=243` foot baseline, and uncropped weapons.
- Integrated the two returned PNG strips only on the battle piece. Portraits and squad readouts keep the static canonical art. Normal shots now hold their windup for 520 ms and Deadeye for 600 ms so the generated recoil can finish before the deterministic impact.
- Restored standard Guardian attack/death timings, retained the combat-cue effect cleanup fix and behind-piece death VFX, and exposed `sniperAnimation` through `render_game_to_text()`.
- Focused semantic QA passed at 1440×900, reduced motion, and 1024×768: idle/attack frames advance, the attack uses the rifle sheet, the fixed animation canvas stays registered to its tile, reduced motion freezes a readable firing frame, damage/action state remain exact, and captured console errors are empty.
- Full Sniper/Drainer combat and all three training chapters pass again, including Deadeye kill timing. A decorative locked-chapter image that could intercept the first chapter button during entry now ignores pointer input; the bundled web-game client confirms the hub opens Chapter 1 normally.
- Final gates pass after the pixel animation integration: ESLint with zero warnings, strict TypeScript, all 52 Vitest cases, `git diff --check`, full training/browser regressions with empty console logs, and a clean optimized Next.js 15 production build. The local development server is running again on port 3000.

## 2026-07-13 — Complete pixel squad animation set

- Kept the existing Guardian and Pusher identities, recanvased both to transparent 256×256 masters, and matched the Sniper's 224 px useful height and `y=244` ground anchor before uploading them to SpriteCook.
- Used exactly three `/characters` batches and no standalone animation calls: Sniper `walk + hurt + death`; Guardian `idle + walk + attack + hurt + death + Shield Wall`; Pusher `idle + walk + attack + hurt + death + Batter Up`.
- All 15 requested outputs completed without failures. The batches consumed 60 + 102 + 102 = 264 credits instead of the 336-credit undiscounted ceiling; the recorded SpriteCook balance is 662.
- Downloaded the raw horizontal PNG spritesheets, verified their 244×244 frame geometry, transparency, frame count, visible bounds and ground registration, and saved every stable asset/run id plus runtime hash in `spritecook-assets.json`.
- Added a uniform nearest-neighbor safe-margin transform to the six runtime Pusher sheets because a few oversized gauntlet/debris pixels touched the source canvas edge. Raw generated copies remain in `output/spritecook-squad-animation`.
- Replaced the Sniper-only component with one shared pixel squad renderer. Guardian, Sniper and Pusher now expose real `idle`, `walk`, `attack`, `ability`, `hurt` and 12-frame `death` states; Deadeye reuses the rifle attack while Shield Wall and Batter Up use their custom batch outputs.
- Player movement now emits a transient deterministic movement effect, locks controls for the route duration, drives the walk sheet, and animates through every BFS waypoint instead of cutting diagonally across a corner. Undo uses the reversed path and the same presentation contract.
- Extended ally KO beats to 760 ms so the 12-frame death sequence remains visible, retained the event-derived hit/KO callouts, and exposed all three states through `playerAnimations` while keeping the Sniper serializer alias for existing QA.
- Semantic browser QA exercised every idle/walk/attack/ability/hurt/death state through real game commands, including the Pusher's two-segment bent route and all three deterministic deaths. Frame progression, correct sheet selection, 12-frame KO metadata, reduced motion, 1024×768 registration and console logs all pass.
- The final visual pass reduced the legacy death accent and moved the tile-level KO label above the body, then lets the 12-frame fall finish early enough to hold the final pose before removal.
- Final gates passed: ESLint with zero warnings, strict TypeScript, all 52 Vitest cases, `git diff --check`, and the optimized Next.js 15 build. The full three-chapter tutorial and a fresh bundled web-game client pass both completed with empty console-error artifacts after a clean dev-server restart.

## 2026-07-14 — Enemy motion and combat-readability pass

- SpriteCook preflight found the configured OAuth refresh token invalid after the Codex crash (`invalid_grant`). No generation call was made and no credits were spent; the recorded balance therefore remains 662 until the connector is reauthenticated and checked again.
- Added explicit enemy presentation states for idle, exact-path walk, attack, drain/heal, Whale charge, pushed/staggered, hurt, spawn and death. The current authored pixel pieces now use restrained role-specific procedural motion while the renderer is ready to receive future SpriteCook sheets without changing combat rules.
- Enemy movement beats now carry the engine-authored path into the existing FLIP renderer and spend 180 ms per traversed tile, so corners follow their exact preview instead of sliding diagonally to the final destination.
- Pushed enemies and the Data Block now reuse their event `from`/`to` coordinates for smooth displacement, with a separate settle reaction for the block.
- Extended Rugger, Drainer and Whale windups to readable 520/600/720 ms beats and enemy KO holds to 760 ms. Reduced-motion mode keeps distinct static hurt, charge and death poses.
- Exposed `enemyAnimations` plus movement `from`/`to` through `window.render_game_to_text()` for browser assertions.
- Focused strict typecheck, ESLint and presentation/movement tests pass after this first motion integration.

## 2026-07-14 — Combat choreography and training completion

- Replaced immediate push state swaps with an event-derived playback queue: one Pusher windup, exact target displacement, collision impact, readable KO hold, then charge-cancel/stagger status. The Data Block now distinguishes a fully jammed push from a partial Batter Up move that stops at an obstacle.
- Added typed combat statuses and callouts for breach warnings, locked cones, charge breaks, staggered activations, Drainer healing, blocked pushes and Vault breaches. Fatal Whale area hits share one simultaneous death beat, and Vault destruction is no longer mislabeled as an enemy KO.
- Preserved the engine-authored enemy paths through presentation. Ruggers, Drainers and the Whale now expose explicit idle, walk, attack, hurt, heal, lock, charge, stagger, spawn and death states; the authored pixel pieces use role-specific procedural motion until SpriteCook can be reauthenticated.
- Reworked training into honest four-phase chapter progress, clearer novice copy and direct chapter completion. Training starts immediately without the generic mission intro, the opening turn banner no longer covers the coach, Shield Wall explains its exact two-point one-hit protection, and leaving early warns that the chapter restarts.
- Added session cancellation on battle exit so pending timers cannot write a result or best score after an abandoned enemy phase. Reduced-motion mode now cancels both CSS animation and programmatic WAAPI movement.
- Extended deterministic coverage to 60 tests, including exact movement duration, push movement/collision ordering, partial object pushes, grouped Whale fatalities, Vault breach classification and the Whale losing its staggered activation.
- Replayed all three training chapters, activation warnings, 1024px readability, reduced motion, Drainer siphon/heal, Whale slam, deliberate defeat and a perfect canonical victory through semantic browser interactions with zero captured console errors. The verified win ends at Vault 10/10, all three heroes alive, 3 kills, 1,475 points and rank S.
- Final gates pass: ESLint with zero warnings, strict TypeScript, all 60 Vitest cases, `git diff --check`, and the optimized Next.js 15.5.12 production build of all routes.
- SpriteCook OAuth remains expired after the Codex crash. No generation call was made and no credits were spent in this pass; future enemy sheets should be generated as three `/characters` batches after reauthentication.

## 2026-07-14 — Cold-cache sprite playback and readable walking

- Reproduced the first-play disappearance with a deliberately delayed SpriteCook sheet. The active keyed frame layer replaced idle before its CSS-only background had downloaded or decoded, while the same animation worked on its second use from cache.
- Centralized all 17 unique player animation sheets in one typed registry. The title screen now preloads them opportunistically, and a direct battle entry loads plus decodes the same files before enabling any board, action-bar or keyboard command. A compact in-game preparation state covers the direct-entry wait and cannot be hidden by the turn banner.
- Kept animation keys so attacks and abilities still restart on frame one, but moved the exact sheet URL onto the rendered frame layer so the preloader and renderer cannot drift apart.
- Replaced the nearly instant one-tile FLIP with a shared timing contract: 400 ms for the first tile and 220 ms per additional tile, a progressive `cubic-bezier(.4,0,.2,1)` curve, a synchronized walk cycle and a short store-side settle margin. Undo uses the same reversed-path timing.
- Cold-cache browser QA delayed `guardian-walk.png` by 901 ms. Before decode the serializer reported `loading-squad`, board and End Turn controls were disabled, and a forced click was ignored. The first real walk remained visible at 27/85/202 ms with movement progress `0.007 / 0.051 / 0.429`, finished on D2 in idle, and produced zero console or page errors.
- Added registry/file-presence and movement-timing tests. Final gates pass with ESLint, strict TypeScript, 62 Vitest cases and the optimized Next.js 15.5.12 build. No SpriteCook generation call was made and no credits were spent.

## 2026-07-14 — Windows reduced-motion semantic animation fix

- Traced the remaining machine-specific disappearance and teleport reports to Windows client-area animations being disabled. Chromium consequently exposed `prefers-reduced-motion: reduce`; the previous accessibility rules collapsed every CSS animation and skipped the programmatic FLIP movement, while headless QA had defaulted to `no-preference`.
- Narrowed reduced-motion handling to decorative camera shake, ambient pulses and heavy VFX. Essential state communication now remains animated: squad idle/walk/attack/hurt/death frames, enemy semantic motion and tile-to-tile displacement all continue to play.
- Added a shorter reduced-motion movement contract (280 ms for the first tile, 150 ms per additional tile) with linear easing, while retaining the normal 400/220 ms curve. The text serializer now reports the detected system preference and that semantic gameplay animation is enabled.
- Replayed the real title-to-battle flow in normal, emulated Windows-reduced and system-default modes. Reduced mode kept the eight-frame idle running and produced 18 distinct intermediate walk positions across 27 animation-frame samples; normal mode produced 25. All three scenarios ended on the correct tile with zero console or page errors.
- Re-ran the bundled web-game client and visually inspected the tutorial battle capture. Final gates pass: ESLint, strict TypeScript, all 62 Vitest cases, `git diff --check`, and the optimized Next.js 15.5.12 build. The development server is running again on port 3000. No SpriteCook generation call was made and no credits were spent.

## 2026-07-15 — Battle menu, retry and authored hero signatures

- Restored the SpriteCook connector and generated exactly one new custom Sniper Deadeye animation. The transparent 1952×244 strip contains eight stable 244×244 frames, keeps the rifle uncropped and shares the squad ground line. It cost 20 credits; the recorded balance is now 642. No other generation request was made.
- Deadeye now uses its own SpriteCook sheet and a longer 760 ms presentation beat instead of reusing the normal rifle shot. Its board FX adds a violet charge, exact target lock, white/cyan/violet beam and two impact rings; the basic shot remains a short dotted cyan trace with a small target spark.
- Shield Wall now casts a source-centered three-layer hexagonal field with a shield emblem. Shove uses the regular Pusher strike motion and one short impulse chevron, while Batter Up keeps its dedicated ability sheet, heavier trace, two chevrons and impact ring. All SVG geometry derives from the exact event source and target positions.
- Added a visible `Menu` control plus keyboard `Esc` and `R` access. The pause menu can resume, restart or leave; destructive actions require confirmation and keyboard focus remains trapped inside the active dialog. Retry cancels pending CSS/WAAPI playback, resets selections, previews, cues, tutorial coach and FLIP history, and recreates the deterministic mission state without losing completed training progress.
- Preserved semantic combat information in Windows reduced-motion mode: ability SVGs become static, readable signs and impact accents receive a non-animated fallback instead of disappearing. The serializer now exposes each hero's current shield value for robust browser assertions.
- Fresh browser scenarios compared the normal Sniper shot against Deadeye, verified Shield Wall in reduced motion, exercised Batter Up collision damage, opened/closed the pause menu and retried a moved mission. Exact damage, charges, sprite sheets, shields, initial-state restoration and console logs all pass. The bundled web-game client was rerun and its final battle capture inspected.
- Final gates pass: ESLint with zero warnings, strict TypeScript, all 62 Vitest cases, `git diff --check`, and the optimized Next.js 15.5.12 production build. The development server is running again on port 3000.
