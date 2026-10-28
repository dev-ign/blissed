import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ExperienceStory } from './components/experience/ExperienceStory';
import { Services } from './components/Services';
import { Events } from './components/Events';
import { About } from './components/About';
import { Testimonial } from './components/Testimonial';
import { Footer } from './components/Footer';
import type { BookingEntryContext } from './features/booking/domain/types';
import { useHomepageMotion } from './hooks/useHomepageMotion';
import { bookingPreviewEnabled } from './features/booking/preview';

const BookingDialog = lazy(() => import('./features/booking/components/BookingDialog'));

export default function App() {
  const pageRoot = useRef<HTMLDivElement>(null);
  useHomepageMotion(pageRoot);
  const [bookingNotice, setBookingNotice] = useState(false);
  const [bookingEntry, setBookingEntry] = useState<BookingEntryContext | null>(null);
  const bookingTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === 'reload' || !window.location.hash) return;

    // The target and ScrollTrigger pin spacer appear after initial hash navigation.
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (!target) return;
      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      root.style.scrollBehavior = previousBehavior;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleBookingIntent = (entry: BookingEntryContext) => {
    if (!bookingPreviewEnabled) { setBookingNotice(true); return; }
    bookingTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setBookingEntry(entry);
  };

  useEffect(() => {
    if (!bookingNotice) return;
    const timeout = window.setTimeout(() => setBookingNotice(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [bookingNotice]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div ref={pageRoot}>
      <Header onBooking={handleBookingIntent} />
      <main id="main">
        <Hero onBooking={handleBookingIntent} />
        <ExperienceStory />
        <Services onBooking={handleBookingIntent} />
        <Events onBooking={handleBookingIntent} />
        <About />
        <Testimonial />
      </main>
      <Footer />
      </div>
      {bookingEntry && <Suspense fallback={<div className="booking-notice" role="status">Opening your booking preview…</div>}><BookingDialog entry={bookingEntry} onClose={() => setBookingEntry(null)} returnFocus={bookingTrigger.current} /></Suspense>}
      {bookingNotice && <div className="booking-notice" role="status">The booking preview is currently unavailable. Please try again later.</div>}
    </>
  );
}
