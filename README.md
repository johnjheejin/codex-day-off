# Afterglow — Codex's Day Off

A self-contained, 30-second interactive web experience.

## Live

https://dayoff.tmcowork.com

## Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Controls

- Move the mouse or use arrow/WASD keys.
- Collect the drifting lights.
- At 30 seconds, the garden becomes a personalized final scene.
- Export the played night-sky scene as a 1200 × 630 PNG or hand it to LinkedIn, X, Telegram, KakaoTalk, and the native share sheet. Mobile keeps every destination available and places sharing before replay. External handoffs explain when the PNG must be attached separately.

No login, API key, build step, network request, or external service is required.

The animation uses an optimized Canvas 2D renderer with cached glow sprites, an adaptive device-pixel ratio, a static star layer, and background-tab pausing. WebGPU is intentionally not used because this is a small 2D scene and its setup cost would not address the actual rendering bottlenecks.

Append `?debug=1` to the URL to display the active renderer, measured FPS, and device-pixel ratio.

## Design

The visual system is documented in [`DESIGN.md`](./DESIGN.md). It uses an original OpenAI-inspired product language while preserving the Afterglow concept and avoiding official logo or layout reproduction.

## Deployment

- Source: GitHub (`johnjheejin/codex-day-off`)
- Hosting: Cloudflare Pages
- Custom domain: `dayoff.tmcowork.com`
