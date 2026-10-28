import { massageServices } from '../../../data/services';
import type { BookingCatalog, BookingService, DurationOption } from '../domain/types';

export const BOOKING_TIMEZONE = 'America/New_York'; // Demo setting; Mayi must confirm the production zone.
export const PREVIEW_MESSAGE = 'This is a booking preview. Your appointment has not been reserved.';
const durations: Record<string, DurationOption> = {
  '60': { id: '60', minutes: 60, priceMinor: null },
  '90': { id: '90', minutes: 90, priceMinor: null },
  '120': { id: '120', minutes: 120, priceMinor: null },
};
// Exact service variations/prices are unverified. These are explicitly demo choices.
const durationIds = { reset: ['60', '90', '120'], 'deep-restore': ['60', '90', '120'], 'active-recovery': ['60', '90'], prenatal: ['60', '90'], 'your-way': ['60', '90', '120'] } as const;
export const bookingServices: readonly BookingService[] = massageServices.map(service => ({ ...service, pressureApplicable: service.id !== 'prenatal', durations: durationIds[service.id].map(id => durations[id]) }));
const allIds = massageServices.map(s => s.id);
export const bookingCatalog: BookingCatalog = {
  calendar: { timezone: BOOKING_TIMEZONE, horizonDays: 90, closedWeekdays: [0] },
  services: bookingServices,
  enhancements: [
    { id: 'aroma', name: 'Aromatherapy', description: 'A soft, botanical note for a slower moment.', priceMinor: 1200, additionalMinutes: 0, serviceIds: ['reset', 'deep-restore', 'your-way'], incompatibleIds: ['unscented'], maxQuantity: 1, required: false, symbol: 'leaf' },
    { id: 'stones', name: 'Warm stones', description: 'A little extra warmth, a little more unwinding.', priceMinor: 2000, additionalMinutes: 15, serviceIds: ['reset', 'deep-restore', 'your-way'], incompatibleIds: [], maxQuantity: 1, required: false, symbol: 'stone' },
    { id: 'unscented', name: 'An unscented ritual', description: 'Keep your surroundings simple and fragrance-free.', priceMinor: 0, additionalMinutes: 0, serviceIds: allIds, incompatibleIds: ['aroma'], maxQuantity: 1, required: false, symbol: 'calm' },
  ],
};
