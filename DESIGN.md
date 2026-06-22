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
- Night muted: `rgba(244, 244, 239, 0.64)`
- Night faint: `rgba(244, 244, 239, 0.4)`
- Body ink: `#3e3e39`
- Secondary ink: `#85857e`
- Hover ink: `#30302d`
- Event coral: `#ff6f61`
- Event amber: `#f3a712`
- Event blue: `#5b8def`
- Event green: `#3aa981`
- Event violet: `#9b7ede`
- Interface accent: `#10a37f`
- Interface accent soft: `#e7f4ef`
- Modal overlay: `rgba(17, 17, 15, 0.72)`
- Dialog shadow: `0 12px 32px rgba(0, 0, 0, 0.18)`
- Radius: 12–18px for panels, 999px only for status chips

## Spacing

- Core scale: `4`, `8`, `12`, `16`, `20`, `24`, `32`, `48`, `64`, `96`
- Component padding should use the core scale.
- Fluid page gutters may use `clamp()` between `20px` and `64px`.

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
- The ending uses an editorial closing layout, without diagnostic or internal report labels.
- The timer and progress line communicate duration. Do not add technical lifecycle labels.
- The result becomes a downloadable 1200×630 image that can be handed to social apps.
- The exported image preserves the played scene: the user’s bloom positions, night field, and in-session perimeter HUD. It should not switch to a separate promotional-card composition.
- Social buttons provide the image and prepared copy where browser capabilities allow; limitations are stated honestly.
- External social handoffs pause before navigation. The handoff names what is downloaded or copied and tells the user exactly what to attach or paste in the destination app.
- Native device sharing may pass the image directly. URL-based LinkedIn, X, and Telegram handoffs must never imply that a local image was attached automatically.

## Layout

- Use a 12-column desktop logic and a single-column mobile flow.
- On mobile, sharing appears before replay and remains fully available; do not reduce the destination choices or hide them below a centered overflow trap.
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
- Use “loose thoughts” consistently for collectible objects. Avoid telemetry terms such as signal, queue, state, build, and session ID.
- Theme line: “Thirty seconds. Nothing to ship.”
- Prefer short interface sentences and balanced lines. Rewrite copy before accepting a one-word final line.

## Identity

- Primary wordmark: “Afterglow”
- Descriptor: “Codex’s Day Off”
- Symbol: an original setting-sun/horizon mark. Do not imitate the OpenAI knot or use the official OpenAI/Codex logo.

## Components

- Primary controls: minimum 44×44px, default/hover/focus-visible/active/disabled states required.
- Focus-visible: 2px solid current foreground with 3px offset.
- Social controls: text-first, 44px minimum height, outlined on dark surfaces.
- Share handoff dialogs: editorial white surface, explicit numbered steps, image preview, and one destination-specific primary action.
- Status chips are not used in the product UI.

## Anti-patterns

- No decorative gradients or glassmorphism.
- No more than one persistent interface accent.
- No heavy shadows or oversized cards.
- No hidden state: progress, controls, and completion should remain legible.
- No score language, streaks, rankings, or artificial urgency.
- No implementation labels such as experimental interface, build number, ready, drifting, settling, or complete.
