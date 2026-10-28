# Blissed visual refinement

This pass retains approved copy, original photography, section order, mobile editorial centering, service-card alignment, footer hierarchy, chapter focal points/copy coordinates, and the booking domain/provider architecture. No dependency, new font family, backend integration, or production booking enablement was added.

## Logo-derived palette

The opaque botanical pixels in `Logo-mayi.png` were counted directly, excluding transparency, antialiasing, and dark shadow pixels. The most frequent fills are:

| Role | Exact logo fill | Opaque pixel count | White contrast | Actual warm foreground `#FFFEFA` |
| --- | --- | --- | --- | --- |
| Primary | `#116E6A` | 32,267 | 6.065:1 | 6.010:1 |
| Hover | `#0F635F` | 23,781 | 7.070:1 | 7.006:1 |
| Pressed | `#0E5855` | 13,365 | 8.249:1 | 8.174:1 |

The primary is the dominant logo tone; the two darker, already-present logo fills provide accessible interaction variants. Every action foreground exceeds 4.5:1. Existing deeper section greens are retained rather than replacing all green surfaces with the action color.

Semantic colors live in the existing `@theme` in `src/styles.css`: brand primary/hover/active/subtle, action foreground, primary/secondary/muted text, primary/elevated/subtle surfaces, subtle/control borders, focus, warm accent, on-dark copy, and disabled states. Booking aliases reference these same tokens.

The control border has 3.335:1 contrast against the elevated surface; disabled action text has 4.778:1 against its background. Focus uses a botanical outer outline with a warm-white inner ring, preserving visibility on both light and dark surfaces. Disabled controls have explicit foreground, background/border treatment, and native disabled behavior, rather than reduced opacity alone.

## Typography and hero

- Cormorant Garamond remains the editorial face; Manrope remains functional/body typography; Playfair and Allura retain their existing accent roles. No family was replaced or added.
- The hero uses a fluid 64–88px display scale on desktop, 44–56px on narrow phones, semibold roman text, retained bold italic emphasis, slightly tighter tracking, and 1.04 leading. Both approved headline sentences remain unchanged. At 320px, the two intended lines now fit without the earlier four-line break.
- The headline uses a soft botanical charcoal. Wellness retains a deeper warm accent, while Routine uses the darker logo fill to preserve contrast over the widest photo crop. Supporting copy uses controlled reading width, more comfortable leading, and sufficient contrast over the photo.
- A conservative tablet veil protects text where the image crop places darker foliage behind the copy. The Google review information has a warm, compact pill surface for consistent readability.
- Section/panel/card/body/support/label tokens establish hierarchy without blanket heading overrides. About tracking is tightened, section heading rhythm is aligned, and small booking supporting labels are made more legible.
- Manrope 600 is used for medium-weight actions/navigation. Unused 300/800 stylesheet imports were removed; the family is unchanged.

## Actions and navigation

`BookingButton` has semantic primary, secondary, and inverse variants, plus small/default/large sizing. These share the 9999px radius and 44/48/54px minimum target tokens. Modal actions consume the same radius, size, brand, focus, and interaction tokens. Selection cards, calendar dates, time tiles, fields, and icon controls retain their functional shapes.

Primary hover/pressed feedback uses tonal changes rather than lifting/scaling the button. Desktop navigation has a thin underline reveal with no width or layout shift. Existing URL hashes provide the persistent active state; this is deliberately not a new scroll-spy system. Mobile navigation uses visible active/focus/pressed styling without requiring hover. Explore Services remains an obvious underlined action with a restrained 3px arrow movement; reduced motion removes that movement.

## Spacing and imagery

The existing gutters and breakpoints are retained. Service introductions, CTA rows, body leading, and section padding use a small shared spacing vocabulary. About aligns to the main desktop content grid and loses unnecessary top/bottom space. Mobile editorial content remains centered; service cards and the footer keep their established alignment.

Hero, static story sections, testimonials, and service cards use content-aware minimum heights so enlarged text can grow safely. Their normal compositions retain the established dimensions. The desktop ScrollTrigger architecture is unchanged, including its static reduced-motion alternative.

Photo text uses integrated gradients rather than visible rounded text boxes. Desktop chapter gradients are lighter where the original negative space already supports contrast; tighter tablet crops and mobile copy receive stronger localized shading where necessary. Service-card shading follows the actual content, leaving the upper photography clearer. Arrive, Exhale, and Restore retain their independent mobile focal positions (`62%`, `52%`, `34%`) and copy offsets (`20svh`, `26svh`, `14svh`).

## Verification

Run:

```sh
npm run typecheck
npm run lint
npm test
npm run test:contrast
npm run build
```

The existing browser suite (`npm run test:browser`) now includes landscape tablet and 1920px desktop, and verifies action radii/targets. `npm run test:visual` covers the whole homepage, navigation states, mobile alignment exceptions, chapter positions, content clipping, overflow, and text enlargement.

Both browser scripts accept `PLAYWRIGHT_MODULE_PATH` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for a host-provided browser installation. `VISUAL_QA_OUTPUT` chooses homepage artifacts; `BOOKING_QA_OUTPUT` chooses booking artifacts. No Playwright dependency was installed into this app.

The visual matrix is 320×568, 360×800, 375×667, 390×844, 393×852, 430×932, 768×1024, 1024×768, 1280×800, 1440×900, and 1920×1080. Existing 412px booking coverage is also retained. Both homepage and booking are tested with simulated 200% text at 320px, 390px, and 1440px.

The semantic contrast script checks 20 color pairs using the WCAG sRGB luminance formula. A separate rendered-photo audit captures text and text-free backgrounds and samples solid glyph interiors across all eleven requested viewport sizes, with additional checks of the animated desktop chapter states. These checks are useful evidence, not a substitute for a full assistive-technology audit.

## Intentionally outside scope

Actual service/pricing/policy confirmation, homepage review/testimonial/contact/legal placeholders, source-image compression, and live Square integration remain separate work. No additional CTA, section, or content claim was invented. Physical iOS/Safari/autofill/screen-reader verification remains recommended. The referenced desktop screenshot and screen recording were unavailable locally; the working app and pre-change captures were used as the visual baseline.
