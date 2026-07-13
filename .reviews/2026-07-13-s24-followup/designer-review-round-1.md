# Designer review — S24 follow-up round 1

**Date:** 2026-07-13T14:39:50+09:00  
**Artifact:** `index.html`  
**DESIGN.md:** `DESIGN.md`  
**DESIGN.md read at:** 2026-07-13T14:38:00+09:00  
**Viewport:** both; focused runtime at 360×720

## Summary

- BLOCK: 0
- WARN: 1
- FYI: 2

## Issues

### [WARN] Corrected share discovery still needs one physical S24 confirmation
- **Location:** `index.html:455-460`, `index.html:827-891`, `index.html:958-988`, `index.html:1630-1658`
- **Rule:** § Layout — sharing must be visible immediately after completion and the full result must remain vertically scrollable.
- **Evidence:** controlled 360×720 completion places the primary share action at y=297–347, enables all six destinations, reports `scrollWidth=360`, and gives `#result` `touch-action: pan-y`; the controlled browser cannot prove Samsung Internet gesture handling or Chrome Beta URL-bar behavior on the physical phone.
- **Fix suggestion:** after deployment, complete one normal-mobile run on the user's Galaxy S24 and confirm the primary share action appears without scrolling. Do not reproduce the former desktop-site failure.

### [FYI] Scene names now communicate selected play behavior instead of display preference
- **Location:** `index.html:102-129`, `index.html:920-923`, `index.html:1207-1218`
- **Rule:** § Interaction and § Components — the persistent control shows the current named scene and exposes the switch action accessibly.
- **Evidence:** visible labels are `🌙 Night Sky` and `☀️ Paper Sky`; the accessible label states both current and destination scenes, and the control retains 44px height plus hover, focus-visible, active and disabled states.
- **Fix suggestion:** preserve the named-scene model; avoid returning to light/dark preference terminology.

### [FYI] Mobile result priority matches the observed task
- **Location:** `index.html:958-988`
- **Rule:** § Layout — the result should lead from editorial statement to the user's next action, with sharing before stats and replay.
- **Evidence:** actual DOM order is result title → six-share panel → scene result text → stats → replay. This keeps semantics and visual order identical.
- **Fix suggestion:** keep the share panel in DOM order rather than using CSS-only reordering.

## Runtime evidence

- 360×720 Paper Sky: primary share action visible; all six buttons enabled; result scroll height 946px / client height 654px; `scrollTop=0`; no horizontal overflow.
- 360×720 Night Sky: background settles to `rgb(17, 17, 15)` and title/share text to `rgb(244, 244, 239)`; all six choices remain visible in the scroll flow.
- Runtime guard: S24 mobile 45fps / 280,800 pixels; touch desktop-site 30fps / 1,500,096 pixels; 1280×720 desktop 60fps / 2,073,600 pixels.

## Verdict

**PASS** — BLOCK=0 and WARN=1. The remaining warning is a physical-device confirmation, not a code or layout blocker.
