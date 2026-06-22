# Designer review — round 4

**Date:** 2026-06-22T00:00:00+09:00
**Artifact:** `index.html`
**DESIGN.md:** `DESIGN.md`
**DESIGN.md read at:** 2026-06-22T00:00:00+09:00
**Viewport:** both
**Prior report:** `.reviews/designer-review-round-3.md`

## Summary

- BLOCK: 0
- WARN: 0
- FYI: 1

## Prior findings

- **RESOLVED** — Mobile sharing is no longer pushed behind replay or trapped by vertically centered overflow.
- **RESOLVED** — Critical mobile share labels are 14px and all share controls are 52px high.
- **RESOLVED** — Runtime browser verification completed at 390×844.

## Issues

### [FYI] Export intentionally adapts the live aspect ratio
- **Location:** `index.html:1077-1191`
- **Rule:** § Interaction — exported image preserves the played scene
- **Evidence:** Stars and bloom coordinates are normalized from the live viewport into 1200×630, while the same night field, perimeter HUD, timer, counter, progress line, and instructional copy are redrawn at export resolution.
- **Fix suggestion:** Preserve this scene-based export instead of returning to a separate promotional-card composition.

## Runtime evidence

- 390×844 viewport: share panel begins at y=480 and is visible without scrolling.
- All six share destinations render at 335×52px.
- LinkedIn handoff dialog is visible and contains the PNG preview, three explicit steps, and the destination action.
- Generated preview visibly uses the played night-sky scene rather than the former editorial card.

## Verdict

**PASS** — BLOCK=0 and WARN=0.
