# Designer review — 2026-07-13 round 1

**Date:** 2026-07-13T07:58:00+09:00
**Artifact:** `index.html`
**DESIGN.md:** `DESIGN.md`
**DESIGN.md read at:** 2026-07-13T07:57:00+09:00
**Viewport:** both
**Runtime:** 390×844 mobile, 980×2123 desktop-site approximation

## Summary

- BLOCK: 0
- WARN: 1
- FYI: 2

## Issues

### [WARN] Chrome Beta and Samsung Internet still require a safe physical-device confirmation
- **Location:** `index.html:1007-1133`, `index.html:1811-1835`
- **Rule:** § Motion — touch hardware must retain bounded rendering work even in desktop-site mode.
- **Evidence:** Automated checks prove the pixel-budget and frame-policy branches, but the controlled browser does not expose Galaxy S24 thermal state, One UI GPU behavior or Samsung Internet's renderer process.
- **Fix suggestion:** After deployment, perform one normal mobile-mode run in Chrome Beta and Samsung Internet. Do not require desktop-site reproduction of the former crash.

### [FYI] Light and night fields retain the same visual identity
- **Location:** `index.html:59-176`, `index.html:410-445`, `index.html:1193-1210`
- **Rule:** § Quiet base, expressive event and § Interaction.
- **Evidence:** Both fields use the documented canvas, ink, muted, night and event tokens. The appearance control is 44px high, text-first, has hover/focus/active/disabled states and names the destination field.
- **Fix suggestion:** Keep the two-field model; do not add browser-specific theme variants.

### [FYI] Graphics quality is reduced after cost, not before it
- **Location:** `index.html:1081-1133`, `index.html:1811-1835`
- **Rule:** § Motion — preserve intentional feedback while avoiding ornamental cost.
- **Evidence:** Normal touch layout targets 45fps; only touch desktop-site mode uses 30fps. Bloom geometry and event colors are unchanged, while DPR, procedural grain and idle frequency carry the savings.
- **Fix suggestion:** Preserve this degradation order in future renderer experiments.

## Runtime evidence

- 390×844: no horizontal overflow; appearance control is 96×44px; light field and night field both render.
- Light field 30-second completion: result focus, six enabled share controls, 390×844 canvas and scrollable result verified.
- Night field 30-second completion: `#11110f` background, improved secondary-text contrast and six enabled share controls verified.
- 980×2123: canvas remained 980×2123 in the controlled DPR 1 environment with no overflow.
- Simulated S24 desktop-site guard: 0.85× DPR, 1,500,096 pixels, 30fps target.
- Browser console: no errors or warnings.
- The former `feTurbulence` and `mix-blend-mode` layer was removed after it visibly corrupted the light-field screenshot.

## Verdict

**PASS** — BLOCK=0 and WARN=1. Publication is allowed; the remaining warning is a post-deploy physical-device confirmation.
