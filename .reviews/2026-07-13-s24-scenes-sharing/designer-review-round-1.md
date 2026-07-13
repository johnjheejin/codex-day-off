# Designer review — S24 scenes and sharing round 1

**Date:** 2026-07-13T07:21:25Z
**Artifact:** `index.html`
**DESIGN.md:** `DESIGN.md`
**DESIGN.md read at:** 2026-07-13T07:21:25Z
**Viewport:** both; focused runtime at 360×720

## Summary

- BLOCK: 0
- WARN: 1
- FYI: 2

## Issues

### [WARN] Scene surface takes longer to settle than the documented layout-motion budget
- **Location:** `index.html:45-57`, `index.html:71-87`
- **Rule:** § Motion — layout transitions should complete in 280–360ms; § Interaction — selecting a scene should preview its surface immediately.
- **Evidence:** the world background/color transition is `1.2s` and the top-bar border transition is `1s`. The scene changes as soon as the control is activated, but the measured Paper surface does not reach its final RGB value until after the long transition.
- **Fix suggestion:** use the documented 320ms layout easing for the scene surface and top-bar border so the distinction reads as an immediate mode change.

### [FYI] Night and Paper now communicate distinct scene identities on the intro
- **Location:** `index.html:45-57`, `index.html:282-298`, `index.html:1214-1225`
- **Rule:** § Interaction and § Components — selected scene state must be visible and accessibly named.
- **Evidence:** at 360×720, Night resolves to `rgb(17, 17, 15)` with light copy while Paper resolves to `rgb(243, 243, 238)` with dark copy. The same control reports the current and destination scene in its accessible label.
- **Fix suggestion:** preserve the full-surface change; do not reduce the distinction back to emoji or label changes alone.

### [FYI] Direct result preview exposes the real sharing flow without bypassing it
- **Location:** `index.html:1095-1099`, `index.html:1637-1688`, `index.html:1959-1964`
- **Rule:** § Layout and § Interaction — sharing leads the result detail and all destinations remain in scroll flow.
- **Evidence:** `?preview=result` seeds twelve deterministic blooms, then calls the shared `showResult()` and `prepareShareImage()` path. At 360×720, all six controls are enabled, the primary action is y=303–353, result scroll height/client height are 944/654, and horizontal overflow is false.
- **Fix suggestion:** keep the preview deterministic and keep production completion routed through the same result renderer.

## Runtime evidence

- Night intro: `rgb(17, 17, 15)` background, `rgb(244, 244, 239)` foreground.
- Paper intro: `rgb(243, 243, 238)` background, `rgb(13, 13, 13)` foreground.
- Paper result: six enabled share buttons, `touch-action: pan-y`, primary share visible before scrolling.
- LinkedIn button: opens the local handoff dialog with image preview, three explicit steps, and no post/navigation until the user continues.

## Verdict

**PASS** — BLOCK=0 and WARN=1. Shorten the scene transition before final QA so the implementation matches the newly explicit “immediate preview” rule.
