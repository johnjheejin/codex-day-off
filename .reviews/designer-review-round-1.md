# Designer review — round 1

**Date:** 2026-06-21T00:00:00+09:00
**Artifact:** `index.html`
**DESIGN.md:** `DESIGN.md`
**DESIGN.md read at:** 2026-06-21T00:00:00+09:00
**Viewport:** both

## Summary

- BLOCK: 1
- WARN: 7
- FYI: 1

## Issues

### [BLOCK] Keyboard focus state is missing on primary controls
- **Location:** `index.html:230-244`, `index.html:510`
- **Rule:** § Component states — focus is mandatory
- **Evidence:** `.start` defines default, hover, and active styles but no `:focus-visible` style.
- **Fix suggestion:** Add a high-contrast focus outline with offset for all buttons and share controls.

### [WARN] Operational state labels do not support the day-off narrative
- **Location:** `index.html:460-461`, `index.html:625`, `index.html:641`, `index.html:703`
- **Rule:** § Voice — product labels should explain state; poetic language belongs to the experience
- **Evidence:** `Experimental interface · Day off build 02`, `Ready`, `Drifting`, `Settling`, and `Complete` describe implementation state rather than the meaning of Codex taking time off.
- **Fix suggestion:** Remove the lifecycle chip. Replace the build label with a stable thematic line such as “Thirty seconds with nothing to ship.”

### [WARN] Generic “signals” vocabulary weakens the concept
- **Location:** `index.html:481`, `index.html:489`, `index.html:506`, `index.html:626`, `index.html:662`
- **Rule:** § Voice — concise and literal, with restrained metaphor
- **Evidence:** `signals` and `released from the queue` frame the interaction as telemetry rather than unfinished thoughts becoming a constellation.
- **Fix suggestion:** Use one narrative noun consistently: “loose thoughts” or “unfinished thoughts.”

### [WARN] Current mark is not a distinctive Afterglow identity
- **Location:** `index.html:84-112`, `index.html:459`
- **Rule:** § Direction — preserve the original “Codex’s Day Off” identity without copying OpenAI assets
- **Evidence:** Three overlapping outlined circles are visually ambiguous and sit beside the word “Codex,” while “Afterglow” is absent from the persistent wordmark.
- **Fix suggestion:** Create an original horizon/sun emblem and make “Afterglow” the primary wordmark with “Codex’s Day Off” as the descriptor.

### [WARN] Result screen contains internal/reporting language
- **Location:** `index.html:499-504`, `index.html:641-643`
- **Rule:** § Voice — calm, literal, concise
- **Evidence:** `Session complete`, `Afterglow report`, and a generated `Session 123456` identifier feel like diagnostics.
- **Fix suggestion:** Replace with a human closing statement and a direct description of the image the user made.

### [WARN] No shareable artifact exists after the experience
- **Location:** `index.html:496-512`
- **Rule:** § Product before decoration — every reward should support a user action
- **Evidence:** The user creates a visual result but can only restart; there is no image export or social handoff.
- **Fix suggestion:** Generate a 1200×630 result card and provide native image sharing plus LinkedIn, X, Telegram, and KakaoTalk handoffs with prefilled copy and hashtags.

### [WARN] Direct color values exceed the documented token contract
- **Location:** `index.html:129`, `index.html:204`, `index.html:225`, `index.html:236`, `index.html:243`, `index.html:248`, and canvas drawing code
- **Rule:** § Tokens — product colors should come from the design contract
- **Evidence:** Multiple grays and white variants are used directly without named tokens.
- **Fix suggestion:** Expand DESIGN.md with missing text/night tokens and bind CSS/canvas colors to named constants.

### [WARN] Mobile microcopy falls below the recommended readable size
- **Location:** `index.html:249`, `index.html:265`, `index.html:335`, `index.html:397`, `index.html:417`, `index.html:432`
- **Rule:** § Mobile responsiveness — text below 14px requires caution
- **Evidence:** Several operational labels render at 8–10px.
- **Fix suggestion:** Keep metadata at 11–12px minimum and hide nonessential instructions on narrow screens.

### [FYI] Visual color budget is intentionally event-driven
- **Location:** `index.html:532`, `index.html:756-796`
- **Rule:** § Quiet base, expressive event
- **Evidence:** Five saturated colors appear only in collected thoughts and moving lights, not persistent controls.
- **Fix suggestion:** Preserve this exception but keep persistent interface color limited to teal.

## Verdict

**BLOCK** — 1 accessibility blocker and 7 recommended revisions. Resolve the focus state before publication and address the vocabulary, identity, sharing, and result-screen issues in the same revision.
