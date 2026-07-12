# Degen Tactics — GPT Image prompts, batch 01

Generate these one at a time. Attach the current battle screenshot to every request. Always download the original PNG result, not a screenshot of the preview.

If ChatGPT cannot respect the exact pixel dimensions, keep the requested aspect ratio and grid arrangement, then send the untouched original file. Codex will normalize the final canvas.

## Prompt 1A — Guardian static animation master

Save as `art/incoming/characters/guardian-master-v1.png`.

```text
Use the attached DEGEN TACTICS battle screenshot only as art direction and character reference. Rebuild the teal Guardian as a clean production game sprite; do not crop it from the screenshot.

Create ONE isolated static master sprite for the Guardian hero.

OUTPUT
- Exact canvas: 1024 × 1024 px
- Real transparent RGBA background, not a checkerboard image
- One character only, full body visible
- No floor, selection ring, team glow, health bar, UI, text or effects
- Fixed ground/foot anchor at x=512, y=820
- Visual character height approximately 700 px
- Visual width no more than 680 px including the shield
- At least 80 px transparent clearance above the head and 80 px on both sides
- Do not crop the shield, feet or silhouette

CHARACTER
- Friendly heroic Guardian with warm brown skin
- Large battered defensive shield, teal and dark gunmetal armor, compact tactical clothing
- Strong readable silhouette, clearly different from red enemies
- Premium modern pixel art viewed from a consistent top-down three-quarter tactical angle
- Crisp deliberate pixel clusters, chunky arcade readability, subtle material wear
- Matte surfaces, restrained teal energy accents, no neon clutter
- Match the proportions and personality of the Guardian in the attached screenshot, but make the production sprite cleaner and more readable

The sprite must remain readable when displayed at roughly 90 px tall on a tactical grid.

Do not add painterly blur, smooth vector edges, beige paper styling, crypto symbols, extra weapons, scenery or a decorative frame.
```

Do not continue to animation until this master has the right face, shield, proportions, anchor and transparency.

## Prompt 1B — Guardian four-frame idle animation

Attach the validated `guardian-master-v1.png` as the primary reference. Save as `art/incoming/characters/guardian-idle-4f-v1.png`.

```text
Use the attached Guardian master sprite as the strict source of truth. Preserve the exact same character design, face, shield, proportions, palette, camera angle and pixel density in every frame.

Create a four-frame IDLE ANIMATION sprite sheet for this Guardian.

OUTPUT
- Exact canvas: 2048 × 2048 px
- Real transparent RGBA background
- 2 columns × 2 rows
- Every frame exactly 1024 × 1024 px
- Frame order: top-left, top-right, bottom-left, bottom-right
- No gaps, separators, labels or background
- Full character visible in every frame
- Fixed foot anchor x=512, y=820 inside every frame
- Never resize, recrop, translate or rotate the whole character between frames
- No floor shadow, team ring, health bar, UI, text or effects

ANIMATION
1. Neutral ready stance
2. Shoulders and shield rise by only 6–10 px while breathing in
3. Return through the neutral midpoint
4. Shoulders and shield settle by only 4–8 px while breathing out

Both feet stay planted at the exact same coordinates. Animate only internal body motion, cloth, shoulders, head and shield. No attack swing, dramatic pose change or camera movement.

Premium modern pixel art, crisp clusters, no interpolation blur. The four frames must form a seamless subtle loop.
```

## Prompt 2 — Modular enemy-intent path kit

Save as `art/incoming/intents/intent-path-kit-v1.png`.

```text
Use the attached DEGEN TACTICS battle screenshot only as an art-direction and scale reference.

Create a production-ready modular ENEMY INTENT PATH sprite sheet for a premium pixel-art sci-fi tactical game.

OUTPUT
- Exact canvas: 2048 × 1024 px
- Real transparent RGBA background, not a checkerboard
- 4 columns × 2 rows
- Every slot exactly 512 × 512 px
- No gaps, borders, labels, numbers, UI mockup, floor or background
- One isolated component per slot
- Canonical movement direction is LEFT TO RIGHT
- All connector lines meet the exact center of the relevant slot edge
- Identical line width, pixel density and glow strength across every component
- Readable when reduced to a 100–150 px board tile

SLOT ORDER — LEFT TO RIGHT

TOP ROW
1. PATH START: begins at the exact tile center and exits through the exact center of the right edge
2. STRAIGHT PATH: enters at the exact center of the left edge and exits at the exact center of the right edge
3. 90-DEGREE CORNER: enters at the exact center of the left edge and exits at the exact center of the bottom edge
4. END ARROW: enters at the exact center of the left edge and ends at tile center with a bold arrowhead pointing right

BOTTOM ROW
1. ATTACK TARGET: enters from the left edge and terminates in an aggressive target reticle at tile center
2. DESTINATION: enters from the left edge and terminates in a red angular landing ring at tile center
3. DANGER TILE: transparent diagonal red hazard hatching contained inside the tile with an angular outline
4. HEAVY DANGER TILE: stronger crimson boss-attack hazard pattern with a heavy angular outline

STYLE
- Premium modern pixel art, dark industrial sci-fi, chunky arcade readability
- Hostile red and hot-crimson tactical projection with a restrained orange-red core
- Hard-edged pixel clusters and subtle emissive bloom, never a smooth vector icon
- Route core approximately 48 px wide inside each 512 px slot; full glow approximately 96 px
- Straight and corner pieces must connect seamlessly after 90-degree rotations

Do not include characters, skulls, words, numbers, crypto symbols or decorative clutter. Transparency everywhere outside the red graphics.
```

## Prompt 3 — Master action button, three states

Save as `art/incoming/buttons/action-button-teal-states-v1.png`.

```text
Use the attached DEGEN TACTICS battle screenshot as an art-direction reference.

Create ONE production-ready three-state sprite sheet for a premium pixel-art tactical game action button.

OUTPUT
- Exact canvas: 1536 × 1536 px
- Real transparent RGBA background
- Three horizontal rows, each exactly 1536 × 512 px
- The SAME button geometry repeated pixel-for-pixel in all three rows
- Row 1: idle state
- Row 2: hover / keyboard-focus state
- Row 3: pressed / active state
- No gaps, separators, labels, text, icon, number, scene or mockup
- Front-facing orthographic UI asset, perfectly horizontal
- Button silhouette occupies approximately x=32–1504 and y=48–464 in each row
- Preserve a large quiet central safe area for dynamic HTML icon and text
- Never crop the frame, shadow or glow

DESIGN
- Heavy dark gunmetal action plate with a wide 3:1 silhouette
- Clipped tactical corners, layered metal construction, bolts, recessed inner plate and subtle wear
- Matte, physical and game-like, never glass
- Restrained teal player-action light integrated into the inner edge and lower strip
- Central panel dark enough for white text and a 48 px icon
- Premium modern pixel art matching the attached dark sci-fi battlefield

STATE DIFFERENCES
- Idle: restrained teal edge light
- Hover/focus: identical geometry, brighter teal perimeter, active corner lamps, subtly lifted inner plate
- Pressed/active: identical geometry, inner plate visibly depressed by approximately 8 px, stronger lower teal light

9-SLICE REQUIREMENT
- Keep every unique corner detail inside the outer 160 px on the left and right
- The middle horizontal section must be visually repeatable and contain no unique ornament
- All three rows align exactly

No neon clutter, glassmorphism, beige dossier styling, crypto logos, SaaS appearance or broad generic gradients.
```

## Recommended order

1. Generate Prompt 1A and validate the Guardian master.
2. Generate Prompt 2 and validate whether the path pieces really connect.
3. Generate Prompt 3 and validate one button before making color variants.
4. Only then generate Prompt 1B and the remaining character animations.
