import type { BookingCatalog, BookingDraft, BookingEntryContext, BookingLocation, BookingPreferences, BookingStep, BookingCustomer, BookingAvailability, LocationValidationResult, ServiceId, AvailabilityScenario } from './types';
import { canVisitStep } from './validation';

export type BookingAction =
  | { type: 'service'; id: ServiceId }
  | { type: 'duration'; id: string }
  | { type: 'enhancement'; id: string; quantity: number }
  | { type: 'location'; patch: Partial<BookingLocation> }
  | { type: 'location-result'; result: LocationValidationResult }
  | { type: 'date'; date: string }
  | { type: 'slot'; slot: BookingAvailability | null }
  | { type: 'customer'; patch: Partial<BookingCustomer> }
  | { type: 'preferences'; patch: Partial<BookingPreferences> }
  | { type: 'navigate'; step: BookingStep }
  | { type: 'scenario'; scenario: AvailabilityScenario }
  | { type: 'complete' };

export function initialBooking(entry: BookingEntryContext, catalog: BookingCatalog): BookingDraft {
  const service = catalog.services.find(s => s.id === entry.serviceId);
  return {
    currentStep: 'experience', serviceId: service?.id ?? null,
    durationId: service?.durations.find(d => d.id === entry.durationId)?.id ?? service?.durations[0]?.id ?? null,
    enhancements: service ? catalog.enhancements.filter(e => e.required && e.serviceIds.includes(service.id)).map(e => ({ id: e.id, quantity: 1 })) : [],
    location: { address: '', address2: '', city: '', state: '', zip: '', instructions: '' }, locationValidation: null,
    date: null, slot: null, customer: { firstName: '', lastName: '', email: '', phone: '' }, preferences: { pressure: '', session: '', requests: '' },
    scenario: 'normal', notice: '', completed: false,
  };
}

export function reduceBooking(draft: BookingDraft, action: BookingAction, catalog: BookingCatalog, now = new Date()): BookingDraft {
  if (action.type === 'navigate') return canVisitStep(action.step, draft, catalog, now) ? { ...draft, currentStep: action.step, notice: '' } : draft;
  if (action.type === 'service') {
    if (draft.serviceId === action.id) return draft;
    const service = catalog.services.find(s => s.id === action.id);
    if (!service) return draft;
    const kept = draft.enhancements.filter(s => catalog.enhancements.some(e => e.id === s.id && e.serviceIds.includes(service.id)));
    const required = catalog.enhancements.filter(e => e.required && e.serviceIds.includes(service.id) && !kept.some(s => s.id === e.id)).map(e => ({ id: e.id, quantity: 1 }));
    const removed = draft.enhancements.filter(e => !kept.includes(e)).map(s => catalog.enhancements.find(e => e.id === s.id)?.name).filter(Boolean);
    return { ...draft, serviceId: service.id, durationId: service.durations[0]?.id ?? null, enhancements: [...kept, ...required], slot: null, preferences: { ...draft.preferences, pressure: service.pressureApplicable ? draft.preferences.pressure : '' }, notice: removed.length ? `${removed.join(', ')} removed because ${removed.length > 1 ? 'they aren’t' : 'it isn’t'} available with ${service.title}. Please choose a new appointment time.` : draft.slot ? 'Your experience changed. Please choose a new appointment time.' : '' };
  }
  if (action.type === 'duration') {
    if (draft.durationId === action.id) return draft;
    if (!catalog.services.find(s => s.id === draft.serviceId)?.durations.some(d => d.id === action.id)) return draft;
    return { ...draft, durationId: action.id, slot: null, notice: draft.slot ? 'Your duration changed. Please choose a new appointment time.' : '' };
  }
  if (action.type === 'enhancement') {
    const enhancement = catalog.enhancements.find(e => e.id === action.id && draft.serviceId && e.serviceIds.includes(draft.serviceId));
    if (!enhancement || !Number.isInteger(action.quantity) || action.quantity < 0 || action.quantity > enhancement.maxQuantity || (enhancement.required && action.quantity === 0)) return draft;
    const removed = action.quantity ? draft.enhancements.filter(s => enhancement.incompatibleIds.includes(s.id) || catalog.enhancements.find(e => e.id === s.id)?.incompatibleIds.includes(enhancement.id)) : [];
    if (removed.some(s => catalog.enhancements.find(e => e.id === s.id)?.required)) return { ...draft, notice: 'This enhancement cannot be combined with a required selection.' };
    const enhancements = draft.enhancements.filter(s => s.id !== action.id && !removed.includes(s));
    if (action.quantity) enhancements.push({ id: action.id, quantity: action.quantity });
    return { ...draft, enhancements, slot: null, notice: removed.length ? `${removed.map(s => catalog.enhancements.find(e => e.id === s.id)?.name).join(', ')} removed because these enhancements cannot be combined.` : draft.slot ? 'Your enhancements changed. Please choose a new appointment time.' : '' };
  }
  if (action.type === 'location') {
    const changesScheduling = Object.entries(action.patch).some(([key, value]) => key !== 'instructions' && draft.location[key as keyof BookingLocation] !== value);
    return { ...draft, location: { ...draft.location, ...action.patch }, ...(changesScheduling ? { slot: null, locationValidation: null, notice: draft.slot ? 'Your location changed. Please check coverage and choose a new appointment time.' : '' } : {}) };
  }
  if (action.type === 'location-result') return { ...draft, locationValidation: action.result, ...(action.result.status !== 'eligible' ? { slot: null } : {}) };
  if (action.type === 'date') return action.date === draft.date ? draft : { ...draft, date: action.date, slot: null };
  if (action.type === 'slot') return { ...draft, slot: action.slot, notice: '' };
  if (action.type === 'scenario') return { ...draft, scenario: action.scenario, slot: null };
  if (action.type === 'customer') return { ...draft, customer: { ...draft.customer, ...action.patch } };
  if (action.type === 'preferences') return { ...draft, preferences: { ...draft.preferences, ...action.patch } };
  if (action.type === 'complete') return canVisitStep('review', draft, catalog, now) && draft.slot ? { ...draft, completed: true } : draft;
  return draft;
}

export function totalDuration(draft: BookingDraft, catalog: BookingCatalog): number {
  const base = catalog.services.find(s => s.id === draft.serviceId)?.durations.find(d => d.id === draft.durationId)?.minutes ?? 0;
  return base + draft.enhancements.reduce((sum, s) => sum + (catalog.enhancements.find(e => e.id === s.id)?.additionalMinutes ?? 0) * s.quantity, 0);
}
