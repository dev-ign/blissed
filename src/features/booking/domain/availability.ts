import { addDays, isCalendarDate } from './dates';
import { totalDuration } from './bookingRules';
import type { AvailabilityQuery, BookingCalendarPolicy, BookingCatalog, BookingDraft } from './types';

export function availabilityKey(query: AvailabilityQuery): string {
  return JSON.stringify([query.serviceId, query.durationMinutes, [...query.enhancementIds].sort(), query.location.address.trim(), query.location.address2.trim(), query.location.city.trim(), query.location.state.toUpperCase(), query.location.zip.trim(), query.date, query.timezone, query.scenario]);
}
export function availabilityQuery(draft: BookingDraft, catalog: BookingCatalog): AvailabilityQuery | null {
  if (!draft.serviceId || !draft.durationId || !draft.date || draft.locationValidation?.status !== 'eligible') return null;
  return { serviceId: draft.serviceId, durationMinutes: totalDuration(draft, catalog), enhancementIds: draft.enhancements.flatMap(e => Array.from({ length: e.quantity }, () => e.id)), location: draft.location, date: draft.date, timezone: catalog.calendar.timezone, scenario: draft.scenario };
}
export function isDateSelectable(date: string, today: string, policy: BookingCalendarPolicy): boolean {
  return isCalendarDate(date) && date >= today && date <= addDays(today, policy.horizonDays) && !policy.closedWeekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}
