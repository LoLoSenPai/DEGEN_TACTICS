# Degen Tactics — Design QA

**Artifacts**

- Source visual truth: `C:\Users\loicd\Documents\DEGEN_TACTICS\docs\design-reference\pixel-diorama-battle-target.png`
- Rendered implementation: `C:\Users\loicd\Documents\DEGEN_TACTICS\output\dom-game-qa\03-move-range.png`
- Full-view comparison: `C:\Users\loicd\Documents\DEGEN_TACTICS\output\design-qa\pass-3-full-selected.png`
- Focused battlefield comparison: `C:\Users\loicd\Documents\DEGEN_TACTICS\output\design-qa\pass-3-board-selected.png`
- Focused action-bar comparison: `C:\Users\loicd\Documents\DEGEN_TACTICS\output\design-qa\pass-3-action-bar-selected.png`
- Viewport: 1440×900
- State: Turn 1, Guardian selected, Move active, exact enemy intents visible.

**Full-view comparison evidence**

The implementation now preserves the target hierarchy: objective/turn/Vault status at the top, authored battlefield as the dominant visual, contextual unit readout only while selected, and a large game-style action tray at the bottom. The implementation intentionally omits the target's permanent side rosters because the locked product direction calls for a minimal HUD and contextual selected-unit information. The square board is also intentional: it uses the later user-approved exact 7×7 terrain asset rather than imitating the reference's perspective with a CSS grid.

**Focused-region comparison evidence**

- Battlefield: all 49 cells are baked into `public/assets/battle/blacksite-board-7x7.png`; the DOM layer is transparent and aligned over the artwork. Real generated transparent sprites, bases, health bars, move highlights, danger arrows, Vault treatment, obstacles, and Data Block preserve the tactical readability of the source.
- Action bar: generated mechanical frame assets now replace the former generic toolbar surface. Move, Attack, Shield Wall, Wait, and End Turn have distinct iconography, semantic colors, strong selected/disabled states, and large labels comparable to the visual target.
- Typography/HUD: Bangers and Barlow Condensed now resolve from the root font variables. The title, turn counter, Vault HP, action labels, and result headline use the intended display hierarchy instead of browser fallback text.

**Findings**

- No actionable P0, P1, or P2 visual mismatch remains for the approved direction.
- Intentional difference: enemy paths use large cardinal arrows instead of the source's curved dotted path so the exact ordered movement remains legible on the deterministic DOM grid.
- Intentional difference: the title button is a compact game-menu icon instead of a browser-style back arrow.

**Required fidelity surfaces**

- Fonts and typography: passed. The invalid custom-property inheritance that reduced display headings to 16px was fixed by moving Next font variables to the root element and using non-Tailwind-reserved game font tokens.
- Spacing and layout rhythm: passed at 1440×900, 1280×720, and 1024×768. The board fills the available vertical play area and the action tray slightly overlaps its lower staging area without hiding cells.
- Colors and visual tokens: passed. Matte navy/black surfaces, teal allies/movement, red enemies/danger, violet Vault, and gold push/end-turn states are coherent and do not read as glassmorphism or SaaS UI.
- Image quality and asset fidelity: passed. The terrain, HUD frames, units, enemies, Vault, obstacle, and Data Block are raster game assets with correct transparency and no placeholder boxes or CSS-drawn characters.
- Copy and content: passed. Gameplay copy is concise and English-only; disabled wallet messaging is explicit but de-emphasized.
- Icons and affordances: passed. Phosphor game/action icons are consistent, aligned, and paired with text labels and keyboard shortcuts.
- Accessibility and responsive behavior: passed. Semantic tile buttons, visible keyboard focus, ARIA labels, reduced-motion handling, and the designed sub-1024px battle notice remain intact.

**Comparison history**

1. Pass 1 — blocked.
   - Earlier findings: the board read as a small CSS widget on a wallpaper; the title wordmark and HUD headings rendered at 16px; action controls looked like an admin toolbar; hover filled an entire tile gray; intent markers were small/debug-like; two minor title sprites looked like detached stickers.
   - Fixes: generated the exact 7×7 board and transparent HUD/action frames; converted the DOM board to transparent hitboxes; enlarged the board and HUD; fixed the font-token inheritance; framed and color-coded action buttons; enlarged intent arrows; removed the tile fill on hover; replaced the back arrow with a game-menu icon; removed the detached title sprites.
   - Post-fix evidence: `output\dom-game-qa\01-title.png`, `output\dom-game-qa\02-battle.png`, and `output\design-qa\pass-2-full.png`.
2. Pass 2 — blocked.
   - Earlier findings: the default unselected state made the action bar look overly dim, and its screenshot did not match the selected Guardian state in the source visual.
   - Fixes: compared the same interaction state, strengthened semantic action colors and frames, and captured Guardian + Move active.
   - Post-fix evidence: `output\design-qa\pass-3-full-selected.png`, `output\design-qa\pass-3-board-selected.png`, and `output\design-qa\pass-3-action-bar-selected.png`.
3. Pass 3 — passed.
   - No actionable P0/P1/P2 issue remained in the matched selected-unit state.

**Browser and interaction evidence**

- Primary flow tested: Title → Play as Guest → mission intro → select Guardian D3 → Move → D2 → Shield Wall → End Turn → Turn 2.
- Serialized state confirms Turn 2, Vault 10/10, Guardian shield charge spent, and exact ordered intents.
- Deliberate defeat tested through `/results`; final URL, Defeat heading, score, Vault HP, turns, kills, and losses rendered correctly.
- Console/page errors: none in `output\dom-game-qa\errors.json` and `output\playwright\results-flow-qa\summary.json`.
- Responsive evidence: `output\responsive-qa\02-battle-1280x720.png`, `output\responsive-qa\03-battle-1024x768.png`, `output\responsive-qa\04-title-390x844.png`, and `output\responsive-qa\05-battle-notice-390x844.png`; no horizontal overflow or console errors.

**Follow-up polish**

- P3: add future authored board biomes by generating additional exact 7×7 empty terrain assets against the same alignment contract; no engine or interaction-layer rewrite is required.

final result: passed
