import { BookingButton } from './BookingButton';
import { icons, images } from '../data/assets';
import { massageServices, type ServiceContent } from '../data/services';
import type { BookingEntryContext } from '../features/booking/domain/types';

const services = massageServices.filter(service => service.id !== 'your-way');
const customService = massageServices.find(service => service.id === 'your-way')!;

function ServiceCard({ service, onBooking }: { service: ServiceContent; onBooking: (entry: BookingEntryContext) => void }) {
  return (
    <article className="service-card">
      <img src={images[service.imageKey]} alt="" loading="lazy" />
      <div className="service-card-shade" />
      <div className="service-card-content">
        <h3>{service.title}</h3>
        <p className="service-subtitle">{service.subtitle}</p>
        <p className="service-description">{service.description}</p>
        <p className="service-meta">From ${service.startingPriceMinor / 100}<img aria-hidden="true" src={icons.dot} width="2" height="2" />60-120 min</p>
        <BookingButton arrow onClick={() => onBooking({ source: 'service-card', serviceId: service.id })} variant="inverse">Customize your session</BookingButton>
      </div>
    </article>
  );
}

export function Services({ onBooking }: { onBooking: (entry: BookingEntryContext) => void }) {
  return (
    <section className="services page-gutter" id="services" aria-labelledby="services-title">
      <div className="services-intro">
        <p className="eyebrow">Massage Experiences</p>
        <h2 id="services-title">Find what your body needs.</h2>
        <p>Start with how you want to feel. We’ll personalize everything else.</p>
      </div>
      <div className="services-cta-row">
        <button className="text-action" onClick={() => onBooking({ source: 'services' })} type="button">Book your session <img alt="" src={icons.arrowDark} width="16" height="16" /></button>
      </div>
      <div className="service-grid">
        {services.map((service) => <ServiceCard key={service.id} onBooking={onBooking} service={service} />)}
        <article className="service-card service-card--wide">
          <img src={images[customService.imageKey]} alt="" loading="lazy" />
          <div className="service-card-shade" />
          <div className="service-card-content">
            <p className="service-overline">Your experience, your way</p>
            <h3>{customService.title}</h3>
            <p className="service-subtitle">{customService.subtitle}</p>
            <p className="service-description">{customService.description}</p>
            <p className="service-meta">From ${customService.startingPriceMinor / 100} <img aria-hidden="true" src={icons.dot} width="2" height="2" />60-120 min</p>
            <BookingButton arrow onClick={() => onBooking({ source: 'service-card', serviceId: customService.id })} variant="inverse">Create Your Experience</BookingButton>
          </div>
        </article>
      </div>
    </section>
  );
}
