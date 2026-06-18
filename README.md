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

No login, API key, build step, network request, or external service is required.

## Design

The visual system is documented in [`DESIGN.md`](./DESIGN.md). It uses an original OpenAI-inspired product language while preserving the Afterglow concept and avoiding official logo or layout reproduction.

## Deployment

- Source: GitHub (`johnjheejin/codex-day-off`)
- Hosting: Cloudflare Pages
- Custom domain: `dayoff.tmcowork.com`
