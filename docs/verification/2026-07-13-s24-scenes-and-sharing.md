# Galaxy S24 scene and sharing verification

- Date: 2026-07-13
- Reference viewport: 360 × 720 CSS pixels
- Diagnostic route: `?preview=result`
- Scope: scene clarity, result scrolling, and all six sharing destinations

## Result

The selected scene now changes the intro surface immediately. Before the correction, the Night Sky intro used the warm-white canvas token, RGB `243, 243, 238` (`#f3f3ee`). After the correction, Night Sky uses RGB `17, 17, 15` (`#11110f`) from the intro onward. Paper Sky continues to use RGB `243, 243, 238` (`#f3f3ee`). The change uses existing design tokens and adds no gradient, image layer, animation, or rendering allocation.

At 360 × 720, the direct result preview produced a 944px-tall scroll area inside a 654px-tall result viewport. Vertical interaction reports `touch-action: pan-y`; horizontal overflow is false. All six share buttons became enabled after the image was prepared. The primary `Share from this device` action occupied y=303–353 in the initial viewport, so sharing is visible before scrolling while the remainder stays reachable in the normal document flow.

## Evidence

| State | Screenshot | What it proves |
| --- | --- | --- |
| Night Sky · before | ![Night Sky selected on the former warm-white intro at 360 by 720](../../assets/verification/2026-07-13/s24-night-intro-before.jpg) | Selected label and surface disagreed; sampled base was RGB 243, 243, 238. |
| Night Sky · after | ![Night Sky intro using the corrected dark scene at 360 by 720](../../assets/verification/2026-07-13/s24-night-intro-after.jpg) | The intro immediately uses the Night surface, RGB 17, 17, 15, with light text and a high-contrast prompt. |
| Paper Sky · after | ![Paper Sky intro using the warm-white scene at 360 by 720](../../assets/verification/2026-07-13/s24-paper-intro-after.jpg) | Paper Sky remains RGB 243, 243, 238 and is visibly different from Night Sky before play begins. |
| Paper Sky · result | ![Paper Sky diagnostic result with the sharing panel visible at 360 by 720](../../assets/verification/2026-07-13/s24-paper-result-share.jpg) | The deterministic preview reaches the result directly and exposes the primary share action plus all six destinations. |

## What was automated

These screenshots and measurements came from a Chrome-compatible automated browser at a Galaxy S24-sized 360 × 720 viewport. This is a layout and browser-behavior approximation, not a claim that the run occurred on physical Galaxy S24 hardware. The automated pass verified:

- both scene surfaces and their RGB base colors;
- result `scrollHeight` 944 and `clientHeight` 654;
- `touch-action: pan-y` on the result surface;
- six enabled share buttons;
- primary share bounds at y=303–353;
- no horizontal overflow;
- deterministic `?preview=result` access without the 30-second play period.
- `Post to LinkedIn` opened the image-preview handoff dialog with three explicit steps, with no external navigation or posting before `Continue`.

## Physical-device check

On the Galaxy S24, repeat the following in both Chrome Beta and Samsung Internet using the normal mobile layout:

1. Open `https://dayoff.tmcowork.com/` and switch between `🌙 Night Sky` and `☀️ Paper Sky`. Confirm that the whole intro surface, text, borders, and prompt panel change immediately.
2. Open `https://dayoff.tmcowork.com/?preview=result`. Confirm that `Share from this device` is visible in the first result viewport.
3. Scroll the result vertically and confirm all six destinations: device share, LinkedIn, X, Telegram, KakaoTalk, and PNG download.
4. Open one destination and confirm its native share sheet or handoff dialog appears; cancel without posting if this is only a verification run.
5. Confirm that no sideways scrolling, frozen touch input, unusual heat, or System UI restart occurs.

If either browser differs from the automated approximation, record the browser version, selected scene, viewport mode, and a screenshot before changing the implementation.
