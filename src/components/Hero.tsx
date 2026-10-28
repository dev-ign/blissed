import { useRef } from 'react';
import { BookingButton } from './BookingButton';
import { icons, images } from '../data/assets';
import { useHeroScroll } from '../hooks/useHeroScroll';
import type { BookingEntryContext } from '../features/booking/domain/types';

type Props = { onBooking: (entry: BookingEntryContext) => void };

export function Hero({ onBooking }: Props) {
  const root = useRef<HTMLElement>(null);
  useHeroScroll(root);
  return (
    <section className="hero" id="home" aria-labelledby="hero-title" ref={root}>
      <img className="hero-image" src={images.hero} alt="Spa still life with a lit candle, stones, towels, and plants beside water" fetchPriority="high" />
      <div className="hero-content page-gutter">
        <h1 id="hero-title">
          <span>Adding <em className="hero-wellness">Wellness.</em></span>
          <span>To Your <em className="hero-routine">Routine.</em></span>
        </h1>
        <p className="hero-description">Personalized massage therapy designed around your body, your comfort, and what you need today. From deep relaxation to relief from everyday tension.</p>
        <div className="hero-actions">
          <BookingButton size="large" onClick={() => onBooking({ source: 'hero' })}>Book Your Massage</BookingButton>
          <a href="#services"><span>Explore Services</span><span aria-hidden="true">→</span></a>
        </div>
        <div className="google-review" aria-label="Rated 4.5 out of 5 based on more than 400 Google reviews">
          <img className="google-mark" src={images.google} alt="" width="39" height="39" />
          <div>
            <div className="review-rating">
              <span className="review-stars" aria-hidden="true">
                {[0, 1, 2, 3].map((index) => <img src={icons.star} key={index} alt="" width="16" height="16" />)}
                <img src={icons.halfStar} alt="" width="16" height="16" />
              </span>
              <strong>4.5</strong>
            </div>
            <span className="review-caption">400+ reviews on Google</span>
          </div>
        </div>
      </div>
    </section>
  );
}
