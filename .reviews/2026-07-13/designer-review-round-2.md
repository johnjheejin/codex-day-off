# Designer review — 2026-07-13 round 2

**Date:** 2026-07-13T12:33:16+09:00  
**Artifact:** `index.html`  
**DESIGN.md:** `DESIGN.md`  
**DESIGN.md read at:** 2026-07-13T12:31:00+09:00  
**Viewport:** both  
**Prior report:** `.reviews/2026-07-13/designer-review-round-1.md`

## Summary

- BLOCK: 0
- WARN: 1
- FYI: 2

## Prior findings

- **UNRESOLVED — physical-device confirmation:** automated budgets still cannot report Galaxy S24 heat, One UI renderer behavior, or Samsung Internet stability.
- **RESOLVED — field identity:** fresh night and light result captures preserve the same bloom geometry, event colors, hierarchy, and share choices.
- **RESOLVED — quality-first degradation:** runtime guard checks still return 45fps normal touch, 30fps touch desktop-site, and a 1,500,096-pixel desktop-site canvas.

## Issues

### [WARN] Chrome Beta and Samsung Internet require one safe physical-device pass
- **Location:** `index.html:1007-1133`, `index.html:1811-1835`
- **Rule:** § Motion — touch hardware must retain bounded rendering work even in desktop-site mode.
- **Evidence:** the controlled 390×844 run proves layout, state, completion and the intended runtime branch, but cannot expose thermal or System UI state.
- **Fix suggestion:** after deployment, perform one complete run in normal mobile mode in Chrome Beta and Samsung Internet. Do not make desktop-site crash reproduction a release requirement.

### [FYI] Result hierarchy now starts from the editorial statement
- **Location:** `index.html:447-463`
- **Rule:** § Layout — primary hierarchy is editorial statement → short explanation → one action.
- **Evidence:** `align-items: start` keeps the result title and share detail aligned at the top in a 1280×720 viewport; the former end alignment pushed the title below the first-frame reading order.
- **Fix suggestion:** preserve top alignment while the right column remains taller than the title column.

### [FYI] Mobile keeps all sharing destinations in a scrollable single-column flow
- **Location:** `index.html:825-879`, `index.html:945-977`
- **Rule:** § Layout — mobile sharing remains fully available and precedes stats and replay.
- **Evidence:** 390×844 completion shows six enabled 50px-tall share controls, no horizontal overflow, then stats and replay.
- **Fix suggestion:** retain the current order and do not collapse destinations behind an overflow menu.

## Runtime evidence

- Desktop 1280×720: corrected result title and share panel begin in the same visual band; internal result scrolling remains available.
- Mobile 390×844: initial, play, night result and light result captured; `scrollWidth` remains 390px.
- Runtime guard: 45fps / 280,800 pixels for normal touch; 30fps / 1,500,096 pixels for touch desktop-site; 60fps / 2,073,600 pixels for 1280×720 desktop.
- All primary controls retain default, hover, focus-visible, active and disabled states where applicable; minimum touch targets remain 44px.

## Verdict

**PASS** — BLOCK=0 and WARN=1. The remaining warning requires a physical phone, not another layout revision.
