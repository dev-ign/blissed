# Booking preview — Phase 1

This is a frontend prototype. It never reserves an appointment, collects payment, sends messages, or stores a draft outside the open dialog. The completion view always says the appointment has **not** been reserved.

## Running the preview

`npm run dev` enables the preview by default. `VITE_BOOKING_PREVIEW=false` disables it even in development. Production builds disable the prototype unless `VITE_BOOKING_PREVIEW=true` is explicitly supplied at build time. With the flag off, all existing booking actions retain the coming-soon notice. The flag is a product gate, not a security boundary; all data and logic in this phase are mock.

The attachment supplied the written brief but no reference screenshots. The interface uses the existing Blissed typography, color palette, photography, and breakpoints. Desktop uses a centered modal; widths below 768px use the full viewport with a scrollable content region and persistent actions.

## Ownership and architecture

- `src/data/services.ts` owns the five existing service names, descriptions, image keys, and published starting prices. The homepage and booking UI share this content.
- `features/booking/domain/types.ts` owns semantic step definitions, normalized provider types, draft types, and a typed no-op analytics boundary. No customer data is included in analytics events. Mock completion emits neither `booking_confirmed` nor `booking_handoff`.
- `domain/bookingRules.ts` owns initial state and pure reducer transitions. `validation.ts` owns field schemas, step validation, and navigation prerequisites. `pricing.ts` calculates itemized prices in integer minor units and returns an unknown total when any required price is unconfirmed.
- `data/bookingConfig.ts` explicitly contains demo durations, enhancements, prices, and timezone. Existing starting prices are not interpreted as exact duration prices.
- `providers/MockBookingGateway.ts` implements the normalized async gateway, with abort signals and deterministic availability, coverage, and failure scenarios. The UI does not contain Square IDs or credentials.
- `hooks/useBookingFlow.ts` coordinates validation, transitions, async coverage checks, preview submission, duplicate-submit protection, and error recovery. Availability uses an abortable request keyed only by scheduling inputs.
- The dialog is lazy-loaded. `BookingSummary`, `FormField`, `CalendarPicker`, and the seven step/completion views keep presentation separate from domain transitions.

The flow remains in memory. A new general entry starts without selections; each service card passes a stable `serviceId`, selects that service and its first valid demo duration, and begins at the experience step. A valid `durationId` can optionally be passed too. No service is matched by visible text. Event CTAs open the individual-session preview with an explicit note that group scheduling is separate.

## Dependencies and invalidation

Changing service resets duration to the new service’s first valid choice, removes unsupported enhancements with a visible announcement, clears incompatible pressure preferences, and clears the appointment slot. Duration, enhancement, scheduling address, date, and scenario changes clear the slot. Address changes also clear coverage validation. Customer details, session requests, and arrival instructions preserve the slot. Backward navigation preserves valid data and remains available if a time has expired. Forward jumps require every prerequisite step to remain valid.

Enhancement rules support service restrictions, mutual incompatibility, required selections, and quantity limits. Optional enhancements can be skipped. Preview submission validates the whole draft and requeries availability, rejects a stale query/slot, and uses an idempotency key. Failure leaves the draft intact and offers another time selection.

## Demo configuration

- Use fictional details. ZIP `00001` is eligible, `00002` is ineligible, and all other ZIPs return unknown coverage. These are test codes, not real coverage claims.
- Exact durations are unverified. Demo choices are 60/90/120 minutes for The Reset, Deep Restore, and Blissed Your Way; 60/90 for Active Recovery and Prenatal Comfort.
- Aromatherapy ($12), warm stones ($20 and 15 extra minutes), and an unscented ritual (no demo charge) are **unconfirmed demo enhancements**. Aromatherapy and an unscented ritual are mutually exclusive. Aromatherapy/stones are restricted to the demo service configuration.
- The demo timezone is `America/New_York`. Availability is a deterministic 90-day schedule with Sundays closed, past dates/times excluded, and slots constrained by the selected total duration. These are not actual business hours.
- “Explore preview scenarios” in Date & Time switches among typical, fully booked, and connection-error states. Loading is modeled asynchronously.
- Duration prices and travel fees remain unknown. Review therefore shows **Price to be confirmed** rather than treating a starting price as a quote. No taxes, real fees, or cancellation policies are invented.

## Accessibility and responsive behavior

The native modal dialog supplies background inertness, with explicit Tab/Shift+Tab wrapping, Escape handling, scroll locking, and trigger focus restoration. Significant progress gets an accessible discard confirmation. Steps announce progress and focus their heading. Forms use labels, autocomplete, associated error messages, and a live validation summary. Choices use native radios/checkboxes with visible keyboard focus.

Desktop calendars use a month grid; mobile uses a horizontally scrollable date strip. Calendar arrow keys, Home/End, Page Up/Down, month controls, selected dates, today, disabled dates, and normalized timezone-aware slots are supported. Reduced motion disables transitions. Text can wrap and grow at 200% enlargement. Mobile text fields use 16px text to avoid automatic input zoom. A visual-viewport hook reduces the dialog height and hides secondary progress/summary chrome when an onscreen keyboard is detected; pinch zoom retains native behavior.

The six small WebP booking images are derivatives of the existing photos, totaling approximately 127KB. They do not replace homepage imagery. Booking JS/CSS is loaded on demand. No runtime or testing packages were added.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

`lint` uses the existing TypeScript compiler’s unused-code, unreachable-code, unused-label, and strict checks; this project does not install ESLint. Unit tests compile the independent domain into a temporary directory and use Node’s built-in test runner.

The browser QA script uses an available Playwright installation and a running development server:

```sh
# Optional paths for a host-provided Playwright and Chromium installation.
PLAYWRIGHT_MODULE_PATH=/absolute/path/to/playwright \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chromium \
npm run test:browser
```

Without those overrides, it resolves `playwright` normally. `BOOKING_QA_URL` overrides localhost:5173 and `BOOKING_QA_OUTPUT` chooses the screenshot/report directory. The suite covers all six steps and completion at 320×568, 360×800, 375×667, 390×844, 393×852, 412×915, 430×932, 768×1024, 1280×800, and 1440×900, plus contextual entry, editing, invalidation, empty/error availability, keyboard interaction, focus trapping, discard/reopen, and enlarged text. No external service is called.

## Configuration still needed from Mayi

Confirm exact durations and prices per service; enhancement offerings, compatibility, pricing, and added time; service coverage, travel fees, and setup buffers; timezone, business hours, staff, and availability; applicable pressure/preferences; event booking routing; intake/privacy notices; booking/cancellation/deposit/payment policies; and the production booking destination. Existing homepage placeholders remain unchanged.

## Future Square integration

Implement a server-side adapter behind `BookingGateway`; do not put credentials in the browser. Verify current account capabilities, scopes, subscriptions, staff/location settings, catalog variation/version mappings, and booking-policy support against official Square documentation at integration time. Preserve normalized domain IDs and map them server-side to provider IDs. Revalidate slots and authoritative pricing, handle conflicts without losing the draft, and use idempotency for actual booking creation. Only a successful authoritative result may display a real confirmation or emit `booking_confirmed`.

The current view deliberately accepts only a preview result. Enabling real reservations requires a separately reviewed live success/error flow, server-side validation, confirmed business configuration, and production security/privacy work. Payments, backend persistence, accounts, notifications, and medical intake are not implemented.
