import type { ServiceContent, ServiceId } from '../../../data/services';

export type { ServiceId };
export const bookingSteps = [
  { id: 'experience', label: 'Your Experience', title: 'A little time, entirely yours.', description: 'Start with how you want to feel. We’ll take care of the details.' },
  { id: 'enhancements', label: 'Enhancements', title: 'Make it your own.', description: 'A few thoughtful touches. Choose what feels right, or keep things simple.' },
  { id: 'location', label: 'Your Location', title: 'Your space. Your sanctuary.', description: 'Tell us where you’d like to unwind. We’ll bring the experience to you.' },
  { id: 'datetime', label: 'Date & Time', title: 'Find your moment.', description: 'A little breathing room in your calendar. All times below are demo availability.' },
  { id: 'personalize', label: 'Personalize', title: 'Let’s make you comfortable.', description: 'A few details to make the experience feel like yours.' },
  { id: 'review', label: 'Review & Confirm', title: 'A moment to look forward to.', description: 'Take a look at your ritual. You can adjust any detail before previewing.' },
] as const;
export type BookingStep = typeof bookingSteps[number]['id'];
export type BookingEntryContext = { source: 'hero' | 'navigation' | 'service-card' | 'services' | 'events' | 'footer' | 'other'; serviceId?: ServiceId; durationId?: string };
export type DurationOption = { id: string; minutes: number; priceMinor: number | null };
export type BookingService = ServiceContent & { durations: readonly DurationOption[]; pressureApplicable: boolean };
export type BookingEnhancement = { id: string; name: string; description: string; priceMinor: number | null; additionalMinutes: number; serviceIds: readonly ServiceId[]; incompatibleIds: readonly string[]; maxQuantity: number; required: boolean; symbol: 'leaf' | 'stone' | 'calm' };
export type EnhancementSelection = { id: string; quantity: number };
export type BookingLocation = { address: string; address2: string; city: string; state: string; zip: string; instructions: string };
export type LocationValidationResult = { status: 'eligible' | 'ineligible' | 'unknown'; message: string; travelFeeMinor: number | null };
export type BookingCustomer = { firstName: string; lastName: string; email: string; phone: string };
export type Pressure = '' | 'light' | 'medium' | 'firm' | 'decide';
export type BookingPreferences = { pressure: Pressure; session: string; requests: string };
export type AvailabilityScenario = 'normal' | 'empty' | 'error';
export type AvailabilityQuery = { serviceId: ServiceId; durationMinutes: number; enhancementIds: string[]; location: BookingLocation; date: string; timezone: string; scenario: AvailabilityScenario };
export type BookingAvailability = { id: string; startAt: string; endAt: string; timezone: string; queryKey: string };
export type AvailabilityStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';
export type BookingDraft = {
  currentStep: BookingStep; serviceId: ServiceId | null; durationId: string | null;
  enhancements: EnhancementSelection[]; location: BookingLocation; locationValidation: LocationValidationResult | null;
  date: string | null; slot: BookingAvailability | null; customer: BookingCustomer; preferences: BookingPreferences;
  scenario: AvailabilityScenario; notice: string; completed: boolean;
};
export type BookingCalendarPolicy = { timezone: string; horizonDays: number; closedWeekdays: readonly number[] };
export type BookingCatalog = { services: readonly BookingService[]; enhancements: readonly BookingEnhancement[]; calendar: BookingCalendarPolicy };
export type CreateBookingRequest = { draft: BookingDraft; idempotencyKey: string };
export type CreateBookingResult = { status: 'preview'; message: string } | { status: 'confirmed'; reference: string };
export interface BookingGateway {
  getCalendarPolicy(signal?: AbortSignal): Promise<BookingCalendarPolicy>;
  getServices(signal?: AbortSignal): Promise<readonly BookingService[]>;
  getEnhancements(serviceId: ServiceId, signal?: AbortSignal): Promise<readonly BookingEnhancement[]>;
  validateLocation(location: BookingLocation, signal?: AbortSignal): Promise<LocationValidationResult>;
  getAvailability(query: AvailabilityQuery, signal?: AbortSignal): Promise<BookingAvailability[]>;
  createBooking(request: CreateBookingRequest, signal?: AbortSignal): Promise<CreateBookingResult>;
}
export type BookingEvent =
  | { name: 'booking_opened'; source: BookingEntryContext['source'] }
  | { name: 'service_selected'; serviceId: ServiceId }
  | { name: 'duration_selected'; durationId: string }
  | { name: 'enhancement_selected'; enhancementId: string; selected: boolean }
  | { name: 'location_step_completed' | 'date_time_selected' | 'personalization_completed' | 'booking_review_viewed' | 'booking_handoff' }
  | { name: 'booking_confirmed'; authoritativeReference: string }
  | { name: 'booking_abandoned'; step: BookingStep };
export type BookingAnalytics = (event: BookingEvent) => void;
// A future consent-aware integration can replace this. Never send draft/customer data here.
export const trackBooking: BookingAnalytics = () => {};
