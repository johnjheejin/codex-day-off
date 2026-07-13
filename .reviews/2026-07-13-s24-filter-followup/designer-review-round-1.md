# Designer review — S24 cosmetic-filter follow-up round 1

**Date:** 2026-07-13T09:12:10Z
**Artifact:** `index.html`
**DESIGN.md:** `DESIGN.md`
**DESIGN.md read at:** 2026-07-13T09:12:10Z
**Viewport:** both; focused runtime at 360×720

## Summary

- BLOCK: 0
- WARN: 1
- FYI: 2

## Issues

### [WARN] The filter-safe result still needs a physical-browser confirmation
- **Location:** `index.html:970-984`, `index.html:1638-1670`; `docs/verification/2026-07-13-s24-scenes-and-sharing.md:45-55`
- **Rule:** § Layout — sharing must appear before stats and replay with all six destinations in the mobile scroll flow; § Anti-patterns — no hidden state.
- **Evidence:** the automated 360×720 pass shows the labelled handoff region and six enabled controls, but the original defect only reproduced on a physical Galaxy S24. The new namespace removes the generic social-widget hooks implicated by both physical captures, yet device-level Chrome Beta and Samsung Internet confirmation remains pending until deployment.
- **Fix suggestion:** after deployment, open the cache-busted `?preview=result` URL in both physical browsers and preserve a screenshot if the six destinations remain visible.

### [FYI] Product-specific naming preserves the design while reducing cosmetic-filter risk
- **Location:** `index.html:549-618`, `index.html:970-1014`, `index.html:1956-1958`
- **Rule:** § Product before decoration; § Interaction — social controls provide honest handoffs; § Layout — sharing leads result detail.
- **Evidence:** the visible composition, copy, token usage, destination order, and interaction stay unchanged. Only generic DOM hooks were replaced by the `afterglow-handoff*` namespace, while the semantic section still precedes result metadata.
- **Fix suggestion:** keep this product-specific namespace for future handoff controls and avoid reintroducing generic `share-*`, `#share…`, or `data-share` hooks.

### [FYI] The resilience fallback is bounded and does not add ambient work
- **Location:** `index.html:1638-1653`, `index.html:1666-1670`
- **Rule:** § Motion — no continuous ornamental UI animation; § Performance — mobile rendering work must remain bounded.
- **Evidence:** visibility is checked once after result reveal and, only when hidden, once more after 250ms. It does not create an observer, animation loop, canvas allocation, or repeated layout work during play.
- **Fix suggestion:** retain the one-shot boundary; do not convert it into a polling loop.

## Runtime evidence

- Night result at 360×720: handoff region top 236px, height 338px, `display: block`, `visibility: visible`.
- Six handoff buttons are enabled; the primary action occupies y=303–353.
- Result remains vertically scrollable (`scrollHeight` 944, `clientHeight` 654) with no horizontal overflow.
- LinkedIn opens the local image-preview dialog with three explicit steps and no external navigation before confirmation.
- Console: no warnings or errors.

## Verdict

**PASS** — BLOCK=0 and WARN=1. The implementation matches the Afterglow system; physical S24 confirmation is the remaining operational check after deployment.
