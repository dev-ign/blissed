import type { Dispatch } from 'react';
import { bookingImages } from '../data/bookingImages';
import { bookingSteps, trackBooking, type BookingCatalog, type BookingDraft, type BookingStep, type BookingGateway, type Pressure } from '../domain/types';
import type { BookingAction } from '../domain/bookingRules';
import type { ValidationErrors } from '../domain/validation';
import { money } from '../domain/pricing';
import { addDays, dateInTimezone, formatTime } from '../domain/dates';
import { PREVIEW_MESSAGE } from '../data/bookingConfig';
import { isDateSelectable } from '../domain/availability';
import { useBookingAvailability } from '../hooks/useBookingAvailability';
import { FormField } from '../components/FormField';
import { CalendarPicker } from '../components/CalendarPicker';
import { BookingSummary } from '../components/BookingSummary';

export type StepProps = { draft: BookingDraft; catalog: BookingCatalog; dispatch: Dispatch<BookingAction>; errors: ValidationErrors; busy: boolean; navigate: (step: BookingStep) => void; gateway: BookingGateway };
export function SelectionMark({ selected }: { selected: boolean }) { return <span className={`booking-check ${selected ? 'is-selected' : ''}`} aria-hidden="true">{selected ? '✓' : ''}</span>; }
function ErrorNote({ text, id }: { text?: string; id?: string }) { return text ? <p className="booking-field-error" id={id}><span aria-hidden="true">!</span> {text}</p> : null; }

export function ExperienceStep({ draft, catalog, dispatch, errors }: StepProps) {
  const selected = catalog.services.find(s => s.id === draft.serviceId);
  return <>
    <fieldset className="booking-fieldset" aria-describedby={errors.service ? 'booking-service-error' : undefined}>
      <legend className="booking-sr-only">Choose your massage experience</legend>
      <div className="booking-service-grid">{catalog.services.map(service => <label className={`booking-service-option ${draft.serviceId === service.id ? 'is-selected' : ''}`} key={service.id}>
        <input className="booking-choice-input" type="radio" name="experience" value={service.id} checked={draft.serviceId === service.id} onChange={() => { dispatch({ type: 'service', id: service.id }); trackBooking({ name: 'service_selected', serviceId: service.id }); }} />
        <img src={bookingImages[service.imageKey]} alt="" width="320" height="160" decoding="async" loading="eager" />
        <div className="booking-service-details"><SelectionMark selected={draft.serviceId === service.id} /><h3>{service.title}</h3><p>{service.subtitle}</p><span>From {money(service.startingPriceMinor)}</span></div>
      </label>)}</div>
      <ErrorNote text={errors.service} id="booking-service-error" />
    </fieldset>
    {selected && <fieldset className="booking-fieldset booking-duration" aria-describedby={`booking-duration-hint${errors.duration ? ' booking-duration-error' : ''}`} aria-invalid={errors.duration ? true : undefined}>
      <legend>Your time to unwind</legend>
      <div className="booking-duration-grid">{selected.durations.map(duration => <label className={`booking-tile ${draft.durationId === duration.id ? 'is-selected' : ''}`} key={duration.id}>
        <input className="booking-choice-input" type="radio" name="duration" checked={draft.durationId === duration.id} onChange={() => { dispatch({ type: 'duration', id: duration.id }); trackBooking({ name: 'duration_selected', durationId: duration.id }); }} />
        <strong>{duration.minutes}<span> min</span></strong>{duration.priceMinor !== null && <small>{money(duration.priceMinor)}</small>}
      </label>)}</div>
      <p className="booking-field-hint" id="booking-duration-hint">Demo duration choices. Exact service options and prices need Mayi’s confirmation.</p><ErrorNote text={errors.duration} id="booking-duration-error" />
    </fieldset>}
  </>;
}
export function EnhancementsStep({ draft, catalog, dispatch, errors }: StepProps) {
  const enhancements = catalog.enhancements.filter(e => draft.serviceId && e.serviceIds.includes(draft.serviceId));
  return <>
    <div className="booking-demo-note"><span aria-hidden="true">✧</span><p>These are demo enhancements and demo prices, not confirmed Blissed offerings.</p></div>
    <fieldset className="booking-fieldset"><legend className="booking-sr-only">Optional enhancements</legend>
      <div className="booking-enhancement-grid">{enhancements.map(e => {
        const quantity = draft.enhancements.find(s => s.id === e.id)?.quantity ?? 0;
        return <div className={`booking-enhancement ${quantity ? 'is-selected' : ''}`} key={e.id}>
          <label><input type="checkbox" className="booking-choice-input" checked={quantity > 0} disabled={e.required} onChange={event => { dispatch({ type: 'enhancement', id: e.id, quantity: event.target.checked ? 1 : 0 }); trackBooking({ name: 'enhancement_selected', enhancementId: e.id, selected: event.target.checked }); }} /><span className={`booking-enhancement-symbol booking-enhancement-symbol--${e.symbol}`} aria-hidden="true">{e.symbol === 'leaf' ? '❧' : e.symbol === 'stone' ? '◒' : '≈'}</span><SelectionMark selected={quantity > 0} /><h3>{e.name}</h3><p>{e.description}</p><span className="booking-enhancement-meta">{e.priceMinor === null ? 'Price to confirm' : e.priceMinor === 0 ? 'No demo charge' : `Demo +${money(e.priceMinor)}`}{e.additionalMinutes > 0 ? ` · +${e.additionalMinutes} min` : ''}{e.required ? ' · Required' : ''}</span></label>
          {quantity > 0 && e.maxQuantity > 1 && <label className="booking-quantity">Quantity<input type="number" min="1" max={e.maxQuantity} value={quantity} onChange={event => dispatch({ type: 'enhancement', id: e.id, quantity: Number(event.target.value) })} /></label>}
        </div>;
      })}</div><ErrorNote text={errors.enhancements} />
    </fieldset>
    <p className="booking-soft-note">Nothing extra needed? Your experience is already yours.</p>
  </>;
}
export function LocationStep({ draft, dispatch, errors }: StepProps) {
  const field = (name: keyof BookingDraft['location'], label: string, props: Partial<Parameters<typeof FormField>[0]> = {}) => <FormField name={name} label={label} value={draft.location[name]} onChange={value => dispatch({ type: 'location', patch: { [name]: value } })} error={errors[name]} maxLength={160} {...props} />;
  return <>
    <div className="booking-demo-note"><span aria-hidden="true">⌁</span><p>Preview coverage only: use test ZIP <strong>00001</strong> to continue, <strong>00002</strong> for outside coverage. Other ZIPs show unknown coverage. This is not Mayi’s real service area.</p></div>
    <div className="booking-form-grid">
      {field('address', 'Street address', { required: true, autoComplete: 'street-address', className: 'booking-field--full' })}
      {field('address2', 'Apartment, suite, or room', { autoComplete: 'address-line2', maxLength: 100, className: 'booking-field--full' })}
      {field('city', 'City', { required: true, autoComplete: 'address-level2', maxLength: 80, className: 'booking-field--full' })}
      {field('state', 'State', { required: true, autoComplete: 'address-level1', maxLength: 2, placeholder: 'NY' })}
      {field('zip', 'ZIP code', { required: true, autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 10, placeholder: '00001' })}
      {field('instructions', 'Arrival instructions', { multiline: true, maxLength: 400, className: 'booking-field--full', placeholder: 'Parking, building access, or anything that helps us arrive.' })}
    </div>
    {draft.locationValidation && <div className={`booking-coverage booking-coverage--${draft.locationValidation.status}`} role="status">{draft.locationValidation.message}</div>}
    <ErrorNote text={errors.coverage} />
    <p className="booking-soft-note">Travel fees and actual coverage will be confirmed separately.</p>
  </>;
}
export function DateTimeStep({ draft, catalog, dispatch, errors, gateway, busy }: StepProps) {
  const availability = useBookingAvailability(draft, catalog, gateway);
  const today = dateInTimezone(new Date(), catalog.calendar.timezone);
  const groups = [
    { label: 'Morning', slots: availability.slots.filter(s => Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: s.timezone }).format(new Date(s.startAt))) < 12) },
    { label: 'Afternoon', slots: availability.slots.filter(s => Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: s.timezone }).format(new Date(s.startAt))) >= 12) },
  ];
  return <>
    <div className="booking-timezone"><span aria-hidden="true">◷</span> {catalog.calendar.timezone} <span>Demo timezone</span></div>
    <CalendarPicker today={today} lastDate={addDays(today, catalog.calendar.horizonDays)} selected={draft.date} onSelect={date => dispatch({ type: 'date', date })} isAvailable={date => isDateSelectable(date, today, catalog.calendar)} disabled={busy} />
    <ErrorNote text={errors.date} />
    <div className="booking-time-region" aria-busy={availability.status === 'loading'}>
      <div className="booking-sr-only" role="status">{availability.status === 'success' ? `${availability.slots.length} demo appointment times available.` : ''}</div>
      {availability.status === 'idle' && <div className="booking-empty"><span aria-hidden="true">◷</span><h3>Your moment is waiting.</h3><p>Choose a date to explore demo appointment times.</p></div>}
      {availability.status === 'loading' && <div className="booking-empty" role="status"><span className="booking-spinner" aria-hidden="true" /><p>Finding a little time for you…</p></div>}
      {availability.status === 'empty' && <div className="booking-empty" role="status"><h3>A quieter day on the calendar.</h3><p>No demo appointments are available. Try another date{draft.scenario === 'empty' ? ' or switch back to typical availability below' : ''}.</p></div>}
      {availability.status === 'error' && <div className="booking-empty" role="alert"><h3>A small pause.</h3><p>{availability.error}</p><button className="booking-secondary" type="button" onClick={availability.retry}>Try again</button></div>}
      {availability.status === 'success' && <fieldset className="booking-fieldset"><legend className="booking-sr-only">Available appointment times</legend>{groups.map(group => group.slots.length > 0 && <div className="booking-time-group" key={group.label}><h3>{group.label}</h3><div className="booking-time-grid">{group.slots.map(slot => <label className={`booking-tile ${draft.slot?.id === slot.id ? 'is-selected' : ''}`} key={slot.id}>
        <input type="radio" name="appointment-time" className="booking-choice-input" checked={draft.slot?.id === slot.id} onChange={() => dispatch({ type: 'slot', slot })} /><span>{formatTime(slot.startAt, slot.timezone)}</span>
      </label>)}</div></div>)}</fieldset>}
      <ErrorNote text={errors.slot} />
    </div>
    <details className="booking-demo-tools"><summary>Explore preview scenarios</summary><label htmlFor="booking-scenario">Demo availability<select id="booking-scenario" value={draft.scenario} onChange={event => dispatch({ type: 'scenario', scenario: event.target.value as BookingDraft['scenario'] })}><option value="normal">Typical availability</option><option value="empty">Fully booked</option><option value="error">Connection unavailable</option></select></label><p>These controls only change the demo schedule.</p></details>
  </>;
}
export function PersonalizeStep({ draft, catalog, dispatch, errors }: StepProps) {
  const service = catalog.services.find(s => s.id === draft.serviceId);
  const fields = [
    { name: 'firstName', label: 'First name', autoComplete: 'given-name', maxLength: 60 },
    { name: 'lastName', label: 'Last name', autoComplete: 'family-name', maxLength: 60 },
    { name: 'email', label: 'Email address', autoComplete: 'email', maxLength: 254, type: 'email' },
    { name: 'phone', label: 'Phone number', autoComplete: 'tel', maxLength: 30, type: 'tel' },
  ] as const;
  return <>
    <p className="booking-privacy-note">Use fictional contact details for this preview. Details stay in this open session and are discarded when you leave.</p>
    <div className="booking-form-grid">{fields.map(field => <FormField {...field} key={field.name} required value={draft.customer[field.name]} onChange={value => dispatch({ type: 'customer', patch: { [field.name]: value } })} error={errors[field.name]} />)}</div>
    {service?.pressureApplicable && <fieldset className="booking-fieldset booking-pressure"><legend>How do you like your pressure? <span>Optional</span></legend><div className="booking-pressure-grid">{([['light', 'Light'], ['medium', 'Medium'], ['firm', 'Firm'], ['decide', 'Let Mayi decide']] as [Pressure, string][]).map(([id, label]) => <label className={`booking-tile ${draft.preferences.pressure === id ? 'is-selected' : ''}`} key={id}><input type="radio" className="booking-choice-input" name="pressure" checked={draft.preferences.pressure === id} onChange={() => dispatch({ type: 'preferences', patch: { pressure: id } })} /><span>{label}</span></label>)}</div><ErrorNote text={errors.pressure} /></fieldset>}
    <div className="booking-form-grid">
      <FormField name="session" label="Session preferences" value={draft.preferences.session} onChange={session => dispatch({ type: 'preferences', patch: { session } })} maxLength={300} multiline className="booking-field--full" error={errors.session} placeholder="A quiet session, softer music, or another simple preference." />
      <FormField name="requests" label="Anything else for your comfort?" value={draft.preferences.requests} onChange={requests => dispatch({ type: 'preferences', patch: { requests } })} maxLength={600} multiline className="booking-field--full" error={errors.requests} hint="Please don’t include medical history or sensitive health information. Mayi may follow up about relevant intake details separately." />
    </div>
  </>;
}
export function ReviewStep({ draft, catalog, navigate }: StepProps) {
  return <><div className="booking-review-note"><span aria-hidden="true">✧</span><p>One last look. This preview won’t reserve an appointment or take a payment.</p></div><BookingSummary draft={draft} catalog={catalog} onEdit={navigate} detailed /><p className="booking-soft-note">Booking and cancellation terms are not yet configured. No policies or charges are accepted in this preview.</p></>;
}
export function ConfirmationView({ draft, catalog }: Pick<StepProps, 'draft' | 'catalog'>) {
  const service = catalog.services.find(s => s.id === draft.serviceId);
  return <div className="booking-completion"><span className="booking-completion-mark" aria-hidden="true">✓</span><p className="booking-eyebrow">Your booking preview</p><h2 id="booking-complete-title" tabIndex={-1}>A little more bliss<br /><em>looks good on you.</em></h2><p>{PREVIEW_MESSAGE}</p><div className="booking-completion-card"><h3>{service?.title}</h3>{draft.date && <p>{new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${draft.date}T12:00:00Z`))}</p>}{draft.slot && <p>{formatTime(draft.slot.startAt, draft.slot.timezone)} · {draft.slot.timezone}</p>}<span>Preview only · no payment · no emails sent</span></div><p className="booking-soft-note">You’ve explored the journey. Actual services, coverage, pricing, and availability will need to be confirmed with Mayi.</p></div>;
}

export const stepComponents = { experience: ExperienceStep, enhancements: EnhancementsStep, location: LocationStep, datetime: DateTimeStep, personalize: PersonalizeStep, review: ReviewStep } satisfies Record<typeof bookingSteps[number]['id'], (props: StepProps) => React.JSX.Element>;
