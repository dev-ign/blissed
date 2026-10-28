import { bookingCatalog, PREVIEW_MESSAGE } from '../data/bookingConfig';
import { dateInTimezone, zonedTimeToISO } from '../domain/dates';
import { availabilityKey, availabilityQuery, isDateSelectable } from '../domain/availability';
import { validateStep } from '../domain/validation';
import type { BookingAvailability, BookingCatalog, BookingGateway, CreateBookingResult } from '../domain/types';
function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
export function createMockBookingGateway(options: { latency?: number; now?: () => Date; catalog?: BookingCatalog } = {}): BookingGateway {
  const latency = options.latency ?? 280;
  const now = options.now ?? (() => new Date());
  const catalog = options.catalog ?? bookingCatalog;
  const previews = new Map<string, CreateBookingResult>();
  const gateway: BookingGateway = {
    async getCalendarPolicy(signal) { await wait(latency, signal); return catalog.calendar; },
    async getServices(signal) { await wait(latency, signal); return catalog.services; },
    async getEnhancements(serviceId, signal) { await wait(latency, signal); return catalog.enhancements.filter(e => e.serviceIds.includes(serviceId)); },
    async validateLocation(location, signal) {
      await wait(latency, signal);
      if (location.zip.trim() === '00001') return { status: 'eligible', message: 'This test ZIP is eligible in the demo. Actual service coverage and travel fees are still to be confirmed.', travelFeeMinor: null };
      if (location.zip.trim() === '00002') return { status: 'ineligible', message: 'This test ZIP is outside the demo coverage. This does not describe Mayi’s real service area. Use 00001 to continue exploring.', travelFeeMinor: null };
      return { status: 'unknown', message: 'Coverage is not configured for this ZIP in the preview. Use test ZIP 00001 to continue. Actual availability must be confirmed with Mayi.', travelFeeMinor: null };
    },
    async getAvailability(query, signal) {
      await wait(latency, signal);
      if (query.scenario === 'error') throw new Error('The demo scheduling connection is unavailable. Your selections are saved in this open preview.');
      if (query.scenario === 'empty' || !isDateSelectable(query.date, dateInTimezone(now(), query.timezone), catalog.calendar)) return [];
      const service = catalog.services.find(s => s.id === query.serviceId);
      if (!service || query.durationMinutes <= 0 || query.location.zip.trim() !== '00001') return [];
      // Provider-owned test schedule, intentionally independent of the visual components.
      const schedule = ['09:00', '10:30', '13:00', '14:30', '16:00'];
      const close = zonedTimeToISO(query.date, '18:00', query.timezone);
      const key = availabilityKey(query);
      return schedule.flatMap(time => {
        const startAt = zonedTimeToISO(query.date, time, query.timezone);
        const endAt = new Date(Date.parse(startAt) + query.durationMinutes * 60_000).toISOString();
        if (Date.parse(startAt) <= now().getTime() || endAt > close) return [];
        return [{ id: `demo:${query.date}:${time}:${query.durationMinutes}`, startAt, endAt, timezone: query.timezone, queryKey: key } satisfies BookingAvailability];
      });
    },
    async createBooking(request, signal) {
      if (previews.has(request.idempotencyKey)) return previews.get(request.idempotencyKey)!;
      const errors = validateStep('review', request.draft, catalog, now());
      if (Object.keys(errors).length) throw new Error('A few details need another look. Please review your selections.');
      const query = availabilityQuery(request.draft, catalog);
      if (!query) throw new Error('Please check your location and appointment time.');
      const slots = await gateway.getAvailability(query, signal);
      if (!slots.some(slot => slot.id === request.draft.slot?.id && slot.queryKey === request.draft.slot.queryKey && slot.startAt === request.draft.slot.startAt)) throw new Error('That time is no longer available in the demo. Please choose another time.');
      const result: CreateBookingResult = { status: 'preview', message: PREVIEW_MESSAGE };
      previews.set(request.idempotencyKey, result);
      return result;
    },
  };
  return gateway;
}
