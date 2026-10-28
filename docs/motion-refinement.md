# Cinematic motion and overlay refinement

This pass extends the installed GSAP / ScrollTrigger / `@gsap/react` system. Photography, typography, brand palette, layout, section order, booking state, and responsive chapter composition remain unchanged. No dependency was added.

## Overlay treatment

The service-card seam came from a copy-level pseudo-element fading to a dark plateau in only 32px, stacked over another image-wide gradient. Standard cards now use one full-width, content-aware shadow with a 180px feather: transparent, then alpha .05 / .20 / .45 / .65 / .70 / .76. The feather follows the actual copy height, so longer text and enlarged type do not move above its readable area. The image-wide layer is empty for these cards. The wide desktop card retains a single horizontal gradient with several gradual stops anchored to its copy width; mobile uses the common vertical feather.

Mobile cinematic shading no longer extends a constant dark fill from the top of each panel to a short 64px cutoff. A localized shadow fades in over 180px above the text and out over 220px below it. Peak strengths are .66 for Arrive, .68 for Exhale, and .64 for Restore. Their copy offsets remain **20svh / 26svh / 14svh**, with focal points **62% / 52% / 34%**. The introductory panel uses a continuous multi-stop gradient. Desktop chapter gradients are retained. The introductory 38px blur filter is replaced with a feathered radial gradient; no new blur is used.

## Hero entrance

`useHomepageMotion` owns one `hero-entrance` timeline, scoped to the homepage. The image stays visible and stable. The timeline overlaps these phases:

| Start | Target | Treatment |
| --- | --- | --- |
| 0.00s | Inner header | .35 → 1 opacity over .35s; interactive throughout |
| 0.10s | Two semantic headline spans | Fade / upward settle, .10s desktop line stagger |
| 0.30s | Supporting paragraph | Fade / upward settle |
| 0.43s | CTA group | Fade / smaller upward settle |
| 0.57s | Trust indicator | Fade / half-distance settle over .50s |

The complete sequence lasts about **1.07s**. Shared reveals use `power2.out`, 20px / .64s desktop and 12px / .50s mobile. No characters are split. Entrance targets are children of the existing hero scroll wrapper; the header target is inside the fixed header. Existing scroll transforms and CTA/arrow interactions retain their ownership.

Hero initialization runs synchronously in `useGSAP` before paint. It waits for neither fonts nor photographs. CSS defaults to visible; failed setup reverts partial animation and restores static styles. Focus/pointer access or early scrolling completes the entrance immediately. Restored positions and history navigation skip it. Media preference changes do not replay a completed entrance.

## Ordinary scroll reveals

`revealOnce` handles meaningful text groups, starting around top 88% of the viewport, with modest text staggers. Already-visible content, completed groups, and directly addressed anchor sections stay visible. Completion clears animation inline styles. Passing an entire group quickly finishes it rather than leaving it hidden.

- Services: eyebrow, title, description; existing CTA row; cards entering together in batches. Card positions are read on entry and sorted top-to-bottom, then right-to-left within desktop rows. Mobile follows reading order.
- Groups & Occasions: eyebrow, heading, description, existing pricing group, travel note, booking action; photo separately.
- Meet Mayi: portrait; editorial heading, tagline, body group, benefits. Separate image/text triggers respect mobile reading order.
- Testimonials: lighter 6px / .45s quote, attribution, and supporting-detail sequence.
- Footer: immediately visible, without individual link animations.

There is no separate closing CTA section in the current page; the existing event booking action receives the shared reveal. No section or content was invented to match an illustrative brief.

## Cinematic chapters and lifecycle

The existing desktop pin, crossfades, 3.3-viewport scroll distance, and scrub remain. Heading, subtitle, and body settle sequentially within that same timeline (.44s duration, .08s stagger, 14px movement); there is no second ScrollTrigger on cinematic text. Static tablet/mobile chapters use once-only text groups with native scrolling.

`src/animations/gsap.ts` is the single plugin-registration point and shared token source. `reveals.ts` provides settings, visual sorting, once-only groups, and static-style restoration. Named media-context callbacks keep batch/focus-created tweens in the correct cleanup scope.

`useGSAP` and `gsap.matchMedia` revert timelines/controllers on unmount or preference changes. Listeners are removed explicitly; guarded font/image readiness callbacks cannot refresh a removed component. Pin-only CSS requires the enhancement's `data-story-pinned` attribute. Static-mode entry clears saved cinematic opacity/visibility/transforms after ScrollTrigger restores its pin state. This prevents hidden panels surviving resize or reduced-motion changes. Completed ordinary groups are remembered in WeakSets and do not replay.

Reduced motion creates no entrance or scroll-reveal controllers. Content appears immediately; pinning is disabled. Animation-setup failure is tested against the static cinematic fallback. Production builds also generate a static `<noscript>` fallback from the same App components. It uses the built image URLs and shared stylesheet, preserving content without maintaining a duplicate copy. Native anchors work; stateful controls are disabled. Its header stays opaque and the unavailable mobile menu toggle is hidden. This fallback is generated by `scripts/prerender-fallback.mjs`; the temporary server renderer stays in the ignored build cache, outside the browser bundle.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run test:contrast
npm run build
npm run test:motion
npm run test:visual
npm run test:browser
npm run test:static # with a production preview running on port 4176
```

Browser scripts accept `PLAYWRIGHT_MODULE_PATH` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for a host browser installation. `MOTION_QA_OUTPUT`, `VISUAL_QA_OUTPUT`, and `BOOKING_QA_OUTPUT` choose artifact locations. `MOTION_QA_SCENARIOS_ONLY=1` runs restoration/accessibility/lifecycle scenarios without repeating the viewport matrix. No browser package was installed in this app.

Motion QA covers 320×568, 375×667, 390×844, 430×932, 768×1024, 844×390 landscape, 1280×800, 1440×900, and 1920×1080. Existing homepage/booking suites retain their larger matrices and 200% text checks. Tests check semantic final visibility, sequence construction, actual card order, cleanup, preference switches, anchors/reloads/history, slow images, keyboard access, and booking focus restoration. Full-page stills capture the reduced-motion equivalent so unrevealed offscreen content is not frozen invisible.

The handoff artifacts contain before/after overlays, desktop/mobile recordings, photo contrast samples, performance probes, and QA results. Local development measurements are observations, not a production speed or frame-rate guarantee. Physical-device Safari verification remains separate work. `test:static` checks the production fallback at 390px and 1440px with JavaScript disabled, comparing every heading, asset availability, panel/card counts, final visibility, overflow, disabled controls, and native anchors. `STATIC_QA_URL` overrides the preview URL.
