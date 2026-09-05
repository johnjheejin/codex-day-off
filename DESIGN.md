# Afterglow Design System

## Direction

An original interactive artwork: calm, intelligent, editorial, and precise. The invitation should feel like opening a small illustrated book. The controls remain clear and familiar, while the title and line sculpture give Afterglow its own identity.

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
   - A small introduction leads into the expressive main title. Avoid giving both sentences the same typographic weight.
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
- Display: self-hosted Newsreader Display, optical size 72, weight 400; Georgia/Times/serif fallback. Use it for the main invitation, the result title, and pause/share dialog titles. A small `Nothing due` heading and occasional collection message may use it too. Its curves pair with the line bloom; buttons, instructions, numbers, and captions retain clear sans/mono styles.
- Mono: system monospace stack
- Headlines: display titles use weight 400 with moderate negative tracking; action headings use the sans stack at 400–500
- Intro title: `Close the tabs.` is a smaller sans prelude, followed by the full-contrast `Open the / sky.` display. Indent the second display line by roughly .7–.8em. Use .91–.94 line height and moderate negative tracking; do not collide the descenders or use a gray duplicate headline for emphasis.
- Body: 400 weight, comfortable line height

## Interaction

- The start control is a labelled `Begin day off` button with a forward arrow. Place `30 seconds. Nothing to ship.` beside it. Do not enclose the action in a chat composer or rely on an arrow-only button.
- Cursor or arrow/WASD input moves the focus point.
- The focus has two slow, counter-rotating rings with orbiting glints. Pointer travel gently tilts them; reduced motion holds the orbits still without changing collection range.
- On touch devices, pressing and dragging directly steers the focus point; the play surface must suppress browser panning while the gesture is active.
- The experience has two named play scenes rather than a light/dark display preference: selecting `🌙 Night Sky` immediately previews the night surface from the intro onward, while `☀️ Paper Sky` immediately previews the warm-white surface. The persistent scene control shows the current scene with its sun or moon emoji; its accessible label also names the scene it will switch to.
- Collected thoughts become restrained line-drawn blooms.
- The visible focus's direction, pace, curvature, and brief rests shape each bloom. Curves affect petals and curl, travel elongates the form, and a pause gives it a fuller shape. Faster movement earns no advantage. Keep the collected color and composition.
- Nearby blooms gently lean toward the focus, then return. Only the nearest four blooms on touch devices or six on desktop receive input at once. Use shared curves and object transforms; do not rebuild geometry as the pointer moves. Reduced motion disables the leaning.
- In Paper Sky, loose thoughts are pale colored wire crystals with a small tinted glow. Do not invert their glow to black. The focus has a soft teal glow and muted gray linework.
- The intro gives the original line bloom enough space to be the main visual object. It can be turned directly with a pointer or keyboard; this is object manipulation, not camera parallax.
- The opening has three roles: a quiet prelude, a serif invitation, and the line bloom. Remove generic promotional eyebrows. Supporting copy explains how the user's hands shape the blooms.
- Blooms settle near their collection point with space to remain legible. Nearby blooms connect with quiet lines, gradually forming a constellation.
- Sound is on by default, with audio unlocked only by a user gesture such as Begin day off. An explicit mute is remembered locally. Collection notes are short, locally synthesized, and limited in polyphony. Pause and hidden-page states stop audio and rendering.
- The player can pause using a visible control, Space, or Escape. Time resumes from the same point. Only meaningful events are announced to assistive technology; the countdown is not a live region.
- The ending uses an editorial closing layout, without diagnostic or internal report labels.
- After collection ends, leave the completed sky unobscured for 1.6 seconds while its last blooms open. A `Keep this sky` control or Escape opens the result immediately. Reduced motion goes straight to the result. Hidden-page time does not consume this moment; do not add flowers or rearrange the composition for the ending.
- The timer and progress line communicate duration. Do not add technical lifecycle labels.
- The result becomes a downloadable PNG that can be handed to social apps. Desktop uses 1200×630; touch devices and narrow mobile layouts preserve the completed play viewport's aspect ratio, with a compact perimeter HUD. Mobile export is bounded to 1.5 million pixels and a 1920px long edge.
- The exported image preserves the played scene: the user’s bloom positions, selected `Night Sky` or `Paper Sky`, and in-session perimeter HUD. It should not switch to a separate promotional-card composition.
- Flower shapes scale uniformly in every export. Mobile result and handoff previews keep the portrait image uncropped, and later rotation of the result page does not change the saved image's aspect ratio.
- WebGL, the Canvas fallback, and the exported PNG use the same flower curves and pose, preserving gesture-shaped forms after a GPU failure.
- Results show the actual exported image with an Explore sky action. The live view has Touch the sky and Turn in 3D modes, a Reset control, and a clear return action. Direct dragging or arrow keys rotate the shared three-dimensional flower group; touching nearby flowers gently bends them. Keep the original artwork and export unchanged while exploring, with a separate temporary view pose. The title and controls must leave room for the persistent top bar on small phones. The result background recedes enough to keep text readable.
- Results show a single artwork preview. Hide the duplicate live canvas behind the result text, then restore it when the user views the sky. Use actual thought/color totals as a small colophon; do not infer pace, mood, or achievement from the number collected. Result copy works in both Night Sky and Paper Sky, including an empty sky.
- Put image sharing and PNG download next to each other, ahead of the four social app choices. Those secondary choices use quiet text rows. Keep visual and keyboard order aligned.
- Social buttons provide the image and prepared copy where browser capabilities allow; limitations are stated honestly.
- If a browser cannot share image files, show the image and explicit download/caption steps before taking action. Do not silently replace image sharing with a link-only share or a surprise download. Cancellation of the native share sheet remains quiet.
- Provide a readable, selectable caption and link. Report copying success only when copying succeeded; otherwise keep the text available for manual copying. Copying inside a modal must use its active content tree.
- External social handoffs pause before navigation. The handoff names what is downloaded or copied and tells the user exactly what to attach or paste in the destination app.
- Native device sharing may pass the image directly. URL-based LinkedIn, X, and Telegram handoffs must never imply that a local image was attached automatically.

## Layout

- Use a 12-column desktop logic and a single-column mobile flow.
- The intro uses a single column on portrait tablets as well as phones. Keep the begin button in the initial viewport where practical, including 320×568. A narrow caption must not strand the interaction arrow on a line of its own.
- On result screens, sharing appears before the colophon and replay. On mobile, place an uncropped portrait thumbnail beside the compact title, then the share panel. Keep the primary device action in the initial viewport and all six destinations available in the scroll flow.
- Result content must remain vertically scrollable on every viewport when its full height exceeds the available screen.
- Separate major regions with whitespace before adding rules.
- Keep operational metadata aligned to the perimeter.
- Primary hierarchy: editorial statement → short explanation → one action.

## Motion

- Control transitions: 150–220ms.
- Layout transitions: 280–360ms with `cubic-bezier(0.16, 1, 0.3, 1)`.
- Ambient particles move slowly. Collection feedback may be faster.
- Never use scroll-jacking, parallax, or continuous ornamental UI animation.
- Play begins at 60fps on every device. Measured display cadence and sustained CPU/GPU work determine the target, up to 90 or 120fps when the screen and available headroom support it. Do not cap frame rate merely because the device accepts touch or requests a desktop viewport.
- Reduce internal resolution before lowering play frame rate under sustained load. Use several measurement windows and gradual recovery to avoid oscillating quality. The ambient intro remains at or below 12fps; direct manipulation is capped at 60fps. Results, a paused game, and a reduced-motion intro render only when something changes. A live sky draws at up to 60fps during direct input and its brief settling response, then stops. Reduced motion disables sway while retaining deliberate 3D rotation. Hidden pages stop rendering.
- Canvas resolution follows a bounded pixel budget rather than viewport width alone. Repeated resize events are debounced and must not allocate full-size buffers continuously.
- Keep a single full-size live drawing surface. Three.js uses restrained three-dimensional line blooms and instanced loose thoughts without fullscreen postprocessing, MSAA, shadows, or texture-based effects. The Canvas fallback preserves play state after GPU failure.
- The display face is a single local Latin WOFF2 of about 22KB with `font-display: swap`. No font CDN request or additional render loop is needed, and the fallback must fit the same title area.
- PNG text reuses the local display face with a bounded 400ms wait before using its fallback. Keep the scene and perimeter HUD; put hashtags in the prepared caption rather than across the artwork footer.
- Full-screen procedural grain and blend effects are not used. The star field provides texture without a separate full-viewport compositing layer.

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
- Share and pause dialogs continue the selected paper/night surface. Use a small plain-language prelude, a serif title, readable instructions, and a clear primary action. Share guides show the original uncropped image, explicit numbered steps, and a destination-specific action. Their contents remain scrollable on short screens.
- Status chips are not used in the product UI.
- The scene control is a text-first 44px minimum button in the persistent top bar. Its visible sun/moon emoji and `Paper Sky / Night Sky` label name the current scene; its accessible label names both the current scene and the switch action.

## Anti-patterns

- No decorative gradients or glassmorphism.
- No more than one persistent interface accent.
- No heavy shadows or oversized cards.
- No hidden state: progress, controls, and completion should remain legible.
- No score language, streaks, rankings, or artificial urgency.
- No implementation labels such as experimental interface, build number, ready, drifting, settling, or complete.
- Do not infer device performance from CSS width alone; desktop-site mode on a phone must retain the mobile rendering budget.
