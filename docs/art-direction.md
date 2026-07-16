# Art Direction

## North star

Degen Tactics should read as a handcrafted indie tactics game before it reads as anything related to crypto. The visual language is dark, compact, physical, and operational: matte command surfaces, miniature-like combatants, a legible tactical board, and a restrained signal-color system.

Keywords: **premium indie tactics**, **dark signal bunker**, **restrained neon**, **miniature silhouettes**, **high-information clarity**, **cinematic stillness**.

Avoid generic Web3 dashboards, casino motifs, token imagery, Solana-logo wallpaper, glass cards, rainbow gradients, faux-terminal clutter, anime/3D/stock-art mixtures, or decoration without a gameplay job.

## Palette

The canonical colors live in `src/styles/tokens.css`.

| Token | Value | Use |
| --- | --- | --- |
| `--void` | `#070A0E` | Page background and deepest negative space |
| `--surface-0` | `#0B1016` | Primary shell |
| `--surface-1` | `#101821` | Panels and board frame |
| `--surface-2` | `#17222C` | Raised controls and selected information |
| `--surface-3` | `#1D2A35` | Hover/active neutral surface |
| `--line` | `#2A3945` | Default separators |
| `--line-bright` | `#405362` | Emphasized edges |
| `--ink` | `#EEF3F2` | Primary text |
| `--ink-soft` | `#B7C3C7` | Secondary text |
| `--muted` | `#7F919B` | Metadata and unavailable information |
| `--teal` | `#42D6B3` | Allies, protection, valid movement |
| `--teal-soft` | `#1B8F7B` | Quiet ally/movement fill |
| `--cyan` | `#59BFFF` | Sniper, range, focus, information |
| `--gold` | `#F2C75C` | Pusher, force, rewards, primary emphasis |
| `--red` | `#FF626B` | Enemy, damage, immediate danger |
| `--red-deep` | `#8B2F3B` | Danger hatching and enemy depth |
| `--violet` | `#9A7CFF` | Vault, mission-special state |
| `--purple` | `#C173FF` | Drainer/leech accent and rare secondary special |

Signal colors are semantic and scarce. Do not color a panel merely to make it feel more “game-like.” Warm off-white carries most information; slate establishes hierarchy; a signal color answers a tactical question.

### Color pairings

- Teal is paired with filled reachable tiles and ally geometry.
- Cyan is paired with a thin range outline or reticle.
- Gold is paired with a directional arrow/wedge.
- Lane Sentinel support uses a warm amber derived from gold: a quiet cardinal grid plus one dominant source-to-target tether and a labeled shield badge. It must never read as red damage danger.
- Red is paired with diagonal hatching; a locked Whale strike adds a heavy border and pulse.
- Violet is paired with the Vault's concentric core geometry.

No critical state may depend on hue alone.

## Form, composition, and type

- Panels are solid matte surfaces with one-pixel structure, clipped tactical corners where hierarchy benefits, and restrained deep shadows.
- The background uses one authored violet ambient vignette and a low-contrast 40px grid texture. Do not add independent gradients to every card.
- The 7×7 board is the battle screen's visual anchor. Side panels support it rather than competing with it.
- Corners are mostly tight; round pills are reserved for compact statuses and HP pips, not every control.
- Use comfortable rhythm based on 4/8px increments. Dense battle metadata may be compact, but body copy never becomes ornamental microtype.
- Body text uses the system sans stack. Headings gain character through weight, uppercase setting, and deliberate tracking rather than a novelty font. Coordinates, values, and intent order may use the system monospace stack.
- English copy is direct and tactical: “Vault threatened,” “Cone locked,” and “Unit committed,” not invented protocol jargon.

## Logo and symbol system

The logo should be an original compact vault/squad mark constructed from simple SVG geometry. Its silhouette must remain recognizable at favicon scale and must not resemble a cryptocurrency logo, military faction from an existing game, or NFT collection badge. The wordmark is typeset, not image-generated.

Important actions use custom line-and-fill SVG symbols with a shared grid, stroke weight, and corner language. Temporary general-purpose UI icons should remain visually subordinate.

## Squad visual language

Allies are miniature-like tokens contained by a circular or clipped-hex base. A teal outer allegiance ring unifies the squad; a role color and central glyph distinguish each unit. Their pose is readable from silhouette before fine detail.

| Unit | Shape language | Role signal |
| --- | --- | --- |
| Guardian | Broad shield arc, squared shoulders, stable vertical core | Teal, thick outer ring, protective chevron |
| Sniper | Narrow forward axis, long sight line, offset reticle | Cyan, thin ring, precision notch |
| Pusher | Low wedge, forward mass, ram/hammer glyph | Gold, directional fins, force arrow |
| Hacker | Slim asymmetric controller, forearm jammer console, folded antenna fins | Electric cyan/cobalt, interrupted signal notch |

HP is presented with countable pips or a clearly labeled bar. Shield adds a temporary outer arc rather than recoloring the entire unit. Selected units receive a controlled halo and strong base outline; completed units lose intensity but remain readable.

## Enemy visual language

Enemies use angular, broken silhouettes and a red allegiance treatment. They should feel like hostile processes and heavy machinery, not literal coins or internet memes.

| Enemy | Shape language | Read at board scale |
| --- | --- | --- |
| Rugger | Hooked shard, forward lean, torn trailing edge | Fast red wedge with a blunt striking face |
| Drainer | Needle/proboscis, hollow center, asymmetric tendrils | Purple-red diamond with a visible siphon line |
| Lane Sentinel | Stationary armored signal pylon, split shield face, four restrained projector fins | Amber-linked defensive anchor, clearly immobile and distinct from the cubic Data Block |
| Whale | Wide armored mass, low black-red shell, small hot core | Oversized silhouette that visually breaks its single-cell frame |

The Whale still occupies exactly one grid tile. Its art may overhang the cell without obscuring coordinates, adjacent tokens, or target overlays. Charge state uses a braced pose and expanding ground marks; the locked cone remains a board overlay, never baked into the creature art.

## Battlefield hierarchy

Render information from quietest to loudest:

1. Base tile and subtle grid structure.
2. Terrain, obstacle, breach, and Vault identity.
3. Reachable movement fill.
4. Quiet Sentinel support-grid cells.
5. Persistent enemy-danger hatching.
6. Attack/selection outlines and locked-cone emphasis.
7. Planned paths, destinations, push arrows, and dominant Sentinel tethers.
8. Unit/enemy tokens, `GUARD`/disruption badges, and readable HP/status.
9. Short-lived hit flashes, damage values, and turn banners.

When states overlap, preserve both meanings with different visual channels—for example teal fill under red hatching, or a cyan outline around a danger-patterned tile. The locked Whale zone wins emphasis but must not hide a unit standing inside it.

### Terrain treatments

- **Normal:** near-black inset plate with minimal surface noise.
- **Blast Barricade:** one-cell X-braced gunmetal gate with two tall pylons, bolted floor feet, amber hazard stripes, and tiny red lock lamps. It must read as fixed terrain at a glance, block movement and line of sight, and never share the Data Block's cubic silhouette or team-colored glow.
- **Vault:** violet concentric core, stable central mark, integrity ring, and a restrained threatened pulse.
- **Incoming breach:** broken red perimeter and inward ticks; clearly impassable.
- **Data Block:** compact neutral cube/canister with directional seams; distinct from a destructible combatant.

## HUD and interaction rules

- Every panel has one job and one primary reading order.
- Primary buttons use clear contrast and a mechanical press state. Secondary actions do not imitate primary emphasis.
- Disabled future features include a visible “Coming Soon” label or explanatory copy; they never look accidentally broken.
- Enemy intents show order, path/destination, target or area, damage, and special state without requiring hover.
- A guarded target always carries a visible `GUARD` badge. Attack preview names the actual Sentinel receiver before commitment; support cells remain amber and never join red danger hatching.
- Jam preview names the exact damage reduction without changing the enemy path; Blackout replaces the affected intent with a clearly labeled `HOLD` and removes disabled support geometry.
- Use one centered chapter card only for a lesson intro or debrief, then return control immediately. During play, contextual prompts stay short, spotlight the exact tile/control, and never become a long blocking tutorial sequence.
- Tooltip content names the effect, legal target, charge state, and commitment cost.
- Keyboard focus is a visible cyan outline with sufficient offset. Touch/click targets remain at least 40px where layout allows.
- At widths below 1024px, the battle is replaced by a composed larger-screen message. Never crush the three-column battle HUD into an unreadable phone layout.

## Motion and game feel

Motion communicates state change; it does not run continuously for spectacle.

| Moment | Duration / behavior |
| --- | --- |
| Hover and button press | 100–160ms; small luminance/position response |
| Unit movement | 180–250ms per resolved move; clean ease-out |
| Enemy phase | Actions play sequentially with brief readable pauses |
| Damage | Fast contact flash and rising value; heavy hits add a short, low-amplitude board shake |
| Vault threatened | Slow restrained pulse while threat exists |
| Turn change | Approximately 600ms banner, then clears interaction space |
| Victory / defeat | Short authored reveal; no looping confetti or prolonged lockout |
| Panel changes | Opacity plus a few pixels of travel; no large sliding dashboard cards |

Controls lock while enemy events are replayed. Timers are cancelled when their screen unmounts. The pure game state resolves independently of animation, so presentation cannot change outcomes. Under `prefers-reduced-motion: reduce`, suppress decorative travel/shake/pulse while retaining a distinct static frame for every essential combat state.

## Asset production rules

The live game combines SpriteCook pixel characters with authored CSS/SVG tactical overlays. Those overlays communicate exact rules and are not substitutes for character art. Any new asset must pass these checks:

- Original silhouette and symbols; no recognizable existing-game factions or characters.
- Consistent three-quarter/orthographic camera, value range, rim light, and material treatment.
- No typography, logos, UI frames, coins, token symbols, or watermark inside generated art.
- Transparent or easily masked background for unit assets.
- Readable first at board-token size; fine detail is optional.
- One approved batch/style reference before producing all characters.

### Asset backlog

Priority 1:

- Final SVG logo and favicon variants.
- Refined Rugger, Drainer, and Whale board silhouettes; the animated Guardian, Sniper, Pusher, Hacker, and Lane Sentinel sets are complete.
- Shared action/status icon sheet: move, attack, shield, deadeye, push, collision, charge, stagger, jam, and blackout.
- Vault, obstacle, Data Block, and breach tile details.

Priority 2:

- Consistent briefing portraits derived from the board silhouettes.
- HQ squad-versus-threat diorama.
- Fracture Zone mission-map landmarks and chapter key art.
- S/A/B/C result emblems and restrained victory/defeat motifs.

Priority 3:

- Additional biome tile kits, future unit silhouettes, cosmetic-only profile frames, and optional non-financial season badge art.

## Future image-generation prompts

Use the shared style prefix below for every raster exploration, then append one subject prompt. Generate a contact sheet first and manually select a single direction before asset production.

**Shared style prefix**

> Original dark tactical science-fiction miniature for a premium indie strategy game; orthographic three-quarter view; matte graphite armor; restrained teal, cyan, gold, red, and violet signal lights; strong readable silhouette; precise hard-surface shapes; subtle screen-printed texture; warm off-white edge light; near-black value structure; no text, no logo, no cryptocurrency symbol, no coin, no casino imagery, no existing IP, no anime, no photoreal human, no glossy toy render, no busy background.

**Guardian exploration**

> Broad compact protector miniature, layered shield arc integrated into squared armor, stable planted stance, teal allegiance ring and a single protective chevron, designed to read at 64 pixels, isolated on transparent background.

**Sniper exploration**

> Lean precision miniature with a long directional sight line and offset shoulder optic, cyan reticle accents, narrow forward silhouette, no realistic firearm branding, designed to read at 64 pixels, isolated on transparent background.

**Pusher exploration**

> Low center-of-gravity control-unit miniature, forward ram and mechanical bracing arms, gold force-arrow accents, visibly built for displacement rather than shooting, designed to read at 64 pixels, isolated on transparent background.

**Hacker production record**

> Slim compact systems-control operative in orthographic three-quarter isometric view; warm brown skin, short silver undercut, asymmetric warm-off-white cropped tech jacket over matte graphite armor, restrained electric-cyan and cobalt accents, two short folded backpack antenna fins, and a readable forearm jammer console; stable planted board-piece anchor; transparent background; no gun, shield, projectile, beam, aura, text, or baked visual effects.

The approved 166x166 master is SpriteCook asset `c0608002-9691-4b1b-b6fe-ad812cbc48df`. One grouped isometric run, `c373c196-3c3f-4ca9-9fa2-2405fda93e55`, produced six transparent native-180x180-frame sheets: `idle`, `walk`, custom `jam`, custom `blackout`, `hurt`, and `death`. The complete Hacker pass cost 114 credits and left 454. Tactical range, exact damage reduction, `HOLD`, and disabled support remain authored SVG/CSS overlays rather than baked effects.

**Enemy family exploration**

> Cohesive hostile-process silhouette sheet containing a hooked red Rugger shard, a hollow purple-red Drainer needle, a stationary amber-projector Lane Sentinel, and a massive black-red armored Whale with a small hot core; shared angular construction and enemy allegiance marks; each clearly distinct at 64 pixels; isolated on neutral dark background.

**Lane Sentinel production record**

> Stationary hostile interception pylon for a dark tactical science-fiction game; compact low-and-wide non-cubic silhouette, matte graphite armored body, split kite-shield front plate, four short amber projector fins, narrow amber aperture, restrained red enemy accents, and four planted clamp feet; readable at board scale; stable isometric ground anchor; transparent background; no weapon, projectile, grid, tether, aura, text, or baked visual effects.

The approved SpriteCook result is live at `public/assets/sprites/sentinel.png`, with native 180-pixel-frame sheets for `idle`, `hurt`, `death`, and the custom `guard` state under `public/assets/sprites/spritecook`. One master request and one grouped character-animation run cost 74 credits total with no rejected retries. The Sentinel has no walk or attack sheet because its deterministic rules make it stationary and non-damaging; the board continues to draw exact guard cells and tethers separately.

**HQ diorama exploration**

> Wide 16:9 command-bunker diorama: three small squad miniatures guarding a violet digital Vault core while distant angular threats approach across a fractured seven-by-seven-like floor; cinematic negative space for menu controls on the left; restrained illumination; environment only, no text or UI.

**Fracture Zone map exploration**

> Top-down stylized tactical district map made of matte slate plates and broken signal routes, one violet Vault District node, a future locked signal breach, sparse teal and red routing marks, screen-print texture, clear negative space, no text, no logo, no realistic geography.

Raster concepts are references, not automatic production assets. Rebuild critical symbols and board markers as controlled SVG/CSS wherever crisp scaling and state changes matter.
