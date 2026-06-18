# Afterglow Design System

## Direction

An original, OpenAI-inspired product experience: calm, intelligent, editorial, and precise. It should feel like a quiet experimental surface made by an AI research and product company, not a neon game landing page.

Do not copy OpenAI logos, proprietary typefaces, or exact website compositions. Use the visual principles below with the original “Codex’s Day Off” identity.

## Principles

1. Product before decoration
   - Every visual element should explain state, afford interaction, or reward attention.
   - Avoid ornamental glass cards, generic gradients, and oversized shadows.

2. Quiet base, expressive event
   - The resting interface is warm white, charcoal, gray, and hairline borders.
   - Color appears primarily when a thought is collected.
   - A restrained teal is the only persistent UI accent.

3. Editorial hierarchy
   - Large, tightly tracked headings.
   - Small operational labels in monospace.
   - Short sentences and generous negative space.

4. Honest materials
   - Solid surfaces, subtle grain, thin rules, and modest corner radii.
   - No simulated glassmorphism.

5. Motion with intent
   - Slow ambient movement communicates rest.
   - Fast, colorful movement is reserved for collection feedback.

## Tokens

- Canvas: `#f3f3ee`
- Surface: `#ffffff`
- Ink: `#0d0d0d`
- Muted ink: `#6f6f69`
- Hairline: `rgba(13, 13, 13, 0.14)`
- Night: `#11110f`
- Night ink: `#f4f4ef`
- Accent family: coral, amber, blue, green, violet — used sparingly
- Interface accent: `#10a37f`
- Interface accent soft: `#e7f4ef`
- Radius: 12–18px for panels, 999px only for status chips

## Typography

- Sans: system grotesk stack (`Arial`, `Helvetica Neue`, system UI)
- Mono: system monospace stack
- Headlines: 500 weight, negative tracking
- Body: 400 weight, comfortable line height

## Interaction

- The start control resembles a compact prompt composer.
- Cursor or arrow/WASD input moves the focus point.
- The environment darkens when the 30-second session begins.
- Collected thoughts become restrained line-drawn blooms.
- The ending is rendered as a report, not a celebratory game modal.
- Progress and phase are always explicit: ready → drifting → settling → complete.

## Layout

- Use a 12-column desktop logic and a single-column mobile flow.
- Separate major regions with whitespace before adding rules.
- Keep operational metadata aligned to the perimeter.
- Primary hierarchy: editorial statement → short explanation → one action.

## Motion

- Control transitions: 150–220ms.
- Layout transitions: 280–360ms with `cubic-bezier(0.16, 1, 0.3, 1)`.
- Ambient particles move slowly. Collection feedback may be faster.
- Never use scroll-jacking, parallax, or continuous ornamental UI animation.

## Voice

- Concise, calm, literal.
- Product labels explain state rather than adding atmosphere.
- Poetic language is reserved for the main statement and session result.

## Anti-patterns

- No decorative gradients or glassmorphism.
- No more than one persistent interface accent.
- No heavy shadows or oversized cards.
- No hidden state: progress, controls, and completion should remain legible.
- No score language, streaks, rankings, or artificial urgency.
