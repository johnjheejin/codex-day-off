# Designer review — 2026-07-11 round 1

**Date:** 2026-07-11T22:30:00+09:00
**Artifact:** `index.html`
**DESIGN.md:** `DESIGN.md`
**DESIGN.md read at:** 2026-07-11T21:45:00+09:00
**Viewport:** both
**Runtime:** deployed desktop, deployed and local 390×844 mobile

## Summary

- BLOCK: 0
- WARN: 2
- FYI: 2

## Resolved during this review

### [RESOLVED BLOCK] Hidden screens were not synchronized with accessibility state
- **Location:** `index.html:826-840`, `index.html:1400-1463`
- **Rule:** § Components and accessibility — hidden state must remain legible and semantic.
- **Evidence:** Before revision, `.screen.hidden` only changed opacity and pointer events. Runtime inspection showed intro, HUD and result semantics together before play and after completion.
- **Resolution:** Added `aria-hidden`, `inert`, state synchronization, canvas focus on play and result-title focus on completion.

### [RESOLVED WARN] Reduced-motion preference was not honored
- **Location:** `index.html:776-783`, `index.html:962`, `index.html:1555-1572`
- **Rule:** § Motion — motion must communicate intent.
- **Evidence:** Ambient flicker, bloom pulse and rotation continued regardless of user preference.
- **Resolution:** Reduced decorative CSS transitions and froze ambient flicker, pulse and rotation when reduced motion is requested.

### [RESOLVED WARN] Result artwork competed with share information on mobile
- **Location:** `index.html:67-76`
- **Rule:** § Quiet base, expressive event and § Layout — sharing precedes secondary information and remains legible.
- **Evidence:** At 390×844, the bloom cluster crossed the share heading and outlined controls.
- **Resolution:** Lowered only the on-page result canvas to 52% opacity. The exported played scene remains unchanged.

## Remaining issues

### [WARN] Secondary metadata is still small
- **Location:** `index.html:119-123`, `index.html:463-505`, `index.html:749-757`
- **Rule:** § Typography and mobile responsiveness.
- **Evidence:** Hashtags and secondary notes remain 11–12px; critical instructions are 14–16px.
- **Fix suggestion:** Keep these strings secondary and verify physical-device rendering before giving them essential meaning.

### [WARN] Project-facing metadata has drifted
- **Location:** GitHub About description; `afterglow-static-html.zip`
- **Rule:** Product before decoration — public artifacts should describe the product truthfully.
- **Evidence:** GitHub About says 60 seconds while the product is 30 seconds. The ZIP contains a 20,656-byte June 18 `index.html`; the current file is over 55KB.
- **Fix suggestion:** Update the repository description and regenerate the ZIP from the verified commit.

### [FYI] The OmD pilot is operational, not a direct Ponytail adoption
- **Location:** `docs/decisions/0001-oh-my-design-project-pilot.md:13-32`
- **Evidence:** The repository contains four local OmD skills and `DESIGN.md` shims, but no Ponytail or Open Design package or source.
- **Fix suggestion:** Preserve this distinction in project history.

### [FYI] Core visual direction remains distinctive
- **Location:** `index.html:75-213`, `index.html:787-865`
- **Evidence:** Warm editorial canvas, night transition, restrained teal, event-only bloom colors and original horizon mark follow `DESIGN.md` without copying an OpenAI asset.
- **Fix suggestion:** Prefer maintenance and refinement over another visual reset.

## Runtime evidence

- Desktop deployed intro: stable two-column hierarchy and readable prompt composer.
- Mobile 390×844 intro: no horizontal overflow; start control 50×50px.
- Mobile result: scrollable 1022px content inside a 778px result viewport.
- Six share actions: each 335×50px and enabled after image generation.
- LinkedIn dialog: focus lands on close control, preview and three explicit handoff steps fit at 352×659px.
- Revised result: focus lands on `#resultTitle`; canvas opacity is 0.52.
- Story extension: the project-note link is 233×44px at 390×844 and appears after replay, preserving sharing as the first result action.

## Verdict

**PASS** — BLOCK=0 and WARN=2. The remaining warnings concern maintenance metadata and deliberately secondary type.
