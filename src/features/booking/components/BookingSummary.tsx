import { bookingImages } from '../data/bookingImages';
import { formatDate, formatTime } from '../domain/dates';
import { calculatePricing, money } from '../domain/pricing';
import { totalDuration } from '../domain/bookingRules';
import type { BookingCatalog, BookingDraft, BookingStep } from '../domain/types';

type Props = { draft: BookingDraft; catalog: BookingCatalog; onEdit?: (step: BookingStep) => void; detailed?: boolean };
export function BookingSummary({ draft, catalog, onEdit, detailed = false }: Props) {
  const service = catalog.services.find(s => s.id === draft.serviceId);
  const duration = service?.durations.find(d => d.id === draft.durationId);
  const quote = calculatePricing(draft, catalog);
  const edit = (step: BookingStep, label: string) => onEdit && <button type="button" className="booking-edit" onClick={() => onEdit(step)} aria-label={`Edit ${label}`}>Edit <span aria-hidden="true">↗</span></button>;
  return (
    <div className={`booking-summary ${detailed ? 'booking-summary--detailed' : ''}`}>
      {!detailed && <img className="booking-summary-image" src={bookingImages[service?.imageKey ?? 'intro']} alt="" width="320" height="200" decoding="async" />}
      <div className="booking-summary-heading"><span className="booking-eyebrow">Your ritual</span><span className="booking-summary-flower" aria-hidden="true">✳</span></div>
      <div className="booking-summary-group">
        <div className="booking-summary-label"><span>Experience</span>{edit('experience', 'experience')}</div>
        <h3>{service?.title ?? 'A moment just for you'}</h3>
        <p>{duration ? `${duration.minutes} min massage` : 'Choose your experience to begin.'}{duration && totalDuration(draft, catalog) > duration.minutes ? ` · ${totalDuration(draft, catalog)} min with enhancements` : ''}</p>
      </div>
      {(detailed || draft.enhancements.length > 0) && <div className="booking-summary-group">
        <div className="booking-summary-label"><span>Thoughtful touches</span>{edit('enhancements', 'enhancements')}</div>
        {draft.enhancements.length ? <ul>{draft.enhancements.map(s => <li key={s.id}>{catalog.enhancements.find(e => e.id === s.id)?.name}{s.quantity > 1 ? ` × ${s.quantity}` : ''} <span className="booking-muted">(demo)</span></li>)}</ul> : <p>No enhancements selected.</p>}
      </div>}
      {(detailed || draft.location.address) && <div className="booking-summary-group">
        <div className="booking-summary-label"><span>Your space</span>{edit('location', 'location')}</div>
        <p>{draft.location.address}{draft.location.address2 ? `, ${draft.location.address2}` : ''}<br />{[draft.location.city, draft.location.state, draft.location.zip].filter(Boolean).join(', ')}</p>
        {detailed && draft.location.instructions && <p className="booking-muted">Arrival: {draft.location.instructions}</p>}
      </div>}
      {(detailed || draft.slot) && <div className="booking-summary-group">
        <div className="booking-summary-label"><span>Your moment</span>{edit('datetime', 'date and time')}</div>
        {draft.slot && draft.date ? <p>{formatDate(draft.date)}<br />{formatTime(draft.slot.startAt, draft.slot.timezone)} – {formatTime(draft.slot.endAt, draft.slot.timezone)}<br /><span className="booking-muted">{draft.slot.timezone} · demo timezone</span></p> : <p>Choose a date and time.</p>}
      </div>}
      {detailed && <>
        <div className="booking-summary-group">
          <div className="booking-summary-label"><span>Made for you</span>{edit('personalize', 'personal details')}</div>
          <p>{draft.customer.firstName} {draft.customer.lastName}<br />{draft.customer.email}<br />{draft.customer.phone}</p>
          {draft.preferences.pressure && <p>Pressure: {draft.preferences.pressure === 'decide' ? 'Let Mayi decide' : draft.preferences.pressure}</p>}
          {draft.preferences.session && <p>Preferences: {draft.preferences.session}</p>}
          {draft.preferences.requests && <p>Special requests: {draft.preferences.requests}</p>}
        </div>
      </>}
      <div className="booking-summary-group booking-price">
        {detailed && <dl>{quote.lines.map(line => <div key={line.id}><dt>{line.label}</dt><dd>{line.amountMinor === null ? 'To be confirmed' : money(line.amountMinor)}</dd></div>)}</dl>}
        <div className="booking-summary-label"><span>Estimated total</span></div>
        <strong>{quote.totalMinor === null ? 'Price to be confirmed' : money(quote.totalMinor)}</strong>
        <p className="booking-muted">{service ? `Published starting price: ${money(service.startingPriceMinor)}. ` : ''}Exact session pricing and any travel fee need Mayi’s confirmation.</p>
      </div>
    </div>
  );
}
