# Blissed by Mayi homepage

React, TypeScript, Tailwind CSS, and GSAP implementation of the [Figma homepage frame](https://www.figma.com/design/GMl3I61QSt6ZFhzKqKnCQB/Blissed-Therapy?node-id=23-29).

```bash
npm install
npm run dev
```

Run `npm run build` for a production build and `npm run preview` to test it locally. Booking buttons open the same clearly labeled six-step mock preview in development and production, including Vercel. Only an explicit `VITE_BOOKING_PREVIEW=false` build-time flag disables access; no real appointments, payments, or confirmations are created. See [booking preview documentation](docs/booking-preview.md) for configuration, architecture, tests, and future integration requirements.

The desktop layout follows the 1440px Figma frame. Supplied photos are imported from the project root because they match the Figma fills pixel for pixel. Additional Figma assets are stored in `public/assets/figma`.

The Experience section uses one GSAP ScrollTrigger timeline to pin a full-screen canvas while its four scenes crossfade. Below 900px, or when reduced motion is requested, the scenes appear in normal document flow.
# blissed
