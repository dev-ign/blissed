import { BookingButton } from './BookingButton';
import { images } from '../data/assets';
import type { BookingEntryContext } from '../features/booking/domain/types';

export function Events({ onBooking }: { onBooking: (entry: BookingEntryContext) => void }) {
  return (
    <section className="events page-gutter" id="events" aria-labelledby="events-title">
      <div className="events-content">
        <p className="eyebrow">For Groups &amp; Occasions</p>
        <h2 id="events-title">Massage for Events</h2>
        <p className="events-description">Chair massage for corporate wellness days, celebrations, and private events — a memorable, restorative touch for your guests or team.</p>
        <div className="event-prices" aria-label="Event massage prices">
          <div><strong>$120/hr</strong><span>2-hr minimum</span></div>
          <div><strong>$115/hr</strong><span>3–4 hours</span></div>
          <div><strong>$110/hr</strong><span>5+ hours</span></div>
        </div>
        <p className="travel-note">Travel fee applies beyond 5 miles.</p>
        <BookingButton size="large" onClick={() => onBooking({ source: 'events' })}>Request Event Availability</BookingButton>
      </div>
      <div className="events-image">
        <img alt="Massage therapy at a community event" src={images.event} loading="lazy" />
        <span aria-hidden="true" className="event-photo-label">Photo Placeholder</span>
      </div>
    </section>
  );
}
