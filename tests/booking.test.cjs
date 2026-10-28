const test = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const load = name => require(join(process.env.BOOKING_TEST_BUILD, `features/booking/${name}.js`));
const { bookingCatalog: catalog, BOOKING_TIMEZONE } = load('data/bookingConfig');
const { initialBooking, reduceBooking, totalDuration } = load('domain/bookingRules');
const { validateStep, canVisitStep } = load('domain/validation');
const { calculatePricing } = load('domain/pricing');
const { zonedTimeToISO, dateInTimezone, isCalendarDate } = load('domain/dates');
const { createMockBookingGateway } = load('providers/MockBookingGateway');
const { availabilityQuery, availabilityKey, isDateSelectable } = load('domain/availability');
const now = new Date('2026-10-28T12:00:00Z');
const reduce = (draft, action, config = catalog) => reduceBooking(draft, action, config, now);
const start = () => initialBooking({ source: 'hero' }, catalog);
function located() {
  let draft = reduce(start(), { type: 'service', id: 'reset' });
  draft = reduce(draft, { type: 'location', patch: { address: '1 Demo Lane', city: 'Demo City', state: 'NY', zip: '00001' } });
  draft = reduce(draft, { type: 'location-result', result: { status: 'eligible', message: 'Demo', travelFeeMinor: null } });
  return reduce(draft, { type: 'date', date: '2026-10-30' });
}
function withSlot() {
  const draft = located();
  const query = availabilityQuery(draft, catalog);
  return reduce(draft, { type: 'slot', slot: { id: 'demo:2026-10-30:09:00:60', startAt: '2026-10-30T13:00:00.000Z', endAt: '2026-10-30T14:00:00.000Z', timezone: BOOKING_TIMEZONE, queryKey: availabilityKey(query) } });
}
function completeDraft() {
  return reduce(withSlot(), { type: 'customer', patch: { firstName: 'Demo', lastName: 'Guest', email: 'demo@example.com', phone: '202-555-0123' } });
}
test('general entry starts fresh with no service or customer details', () => {
  const draft = start(); assert.equal(draft.currentStep, 'experience'); assert.equal(draft.serviceId, null); assert.equal(draft.durationId, null); assert.equal(draft.customer.email, '');
});
test('every service supports typed contextual preselection and a valid default duration', () => {
  for (const service of catalog.services) { const d = initialBooking({ source: 'service-card', serviceId: service.id }, catalog); assert.equal(d.serviceId, service.id); assert.equal(d.durationId, service.durations[0].id); }
});
test('context duration is accepted only when valid for that service', () => {
  assert.equal(initialBooking({ source: 'service-card', serviceId: 'reset', durationId: '120' }, catalog).durationId, '120');
  assert.equal(initialBooking({ source: 'service-card', serviceId: 'prenatal', durationId: '120' }, catalog).durationId, '60');
});
test('service change resets duration and slot, removes incompatible enhancements, and explains removals', () => {
  let d = reduce(withSlot(), { type: 'enhancement', id: 'stones', quantity: 1 }); d = reduce(d, { type: 'duration', id: '120' });
  d = reduce(d, { type: 'service', id: 'prenatal' }); assert.equal(d.durationId, '60'); assert.equal(d.slot, null); assert.deepEqual(d.enhancements, []); assert.match(d.notice, /Warm stones removed/); assert.equal(d.locationValidation.status, 'eligible');
});
test('reselecting the same service or duration preserves the slot', () => {
  const d = withSlot(); assert.equal(reduce(d, { type: 'service', id: 'reset' }), d); assert.equal(reduce(d, { type: 'duration', id: '60' }), d);
});
test('duration changes invalidate slots; invalid durations cannot enter state', () => {
  const d = withSlot(); assert.equal(reduce(d, { type: 'duration', id: '90' }).slot, null); assert.equal(reduce(d, { type: 'duration', id: '999' }), d);
});
test('enhancement compatibility is enforced and changes invalidate slots', () => {
  let d = reduce(withSlot(), { type: 'enhancement', id: 'aroma', quantity: 1 }); assert.equal(d.slot, null);
  d = reduce(d, { type: 'enhancement', id: 'unscented', quantity: 1 }); assert.deepEqual(d.enhancements, [{ id: 'unscented', quantity: 1 }]); assert.match(d.notice, /Aromatherapy removed/);
  assert.equal(reduce(d, { type: 'enhancement', id: 'unscented', quantity: 2 }), d);
});
test('unsupported service enhancements and negative/fractional quantities are rejected', () => {
  const d = initialBooking({ source: 'hero', serviceId: 'prenatal' }, catalog); assert.equal(reduce(d, { type: 'enhancement', id: 'aroma', quantity: 1 }), d);
  for (const quantity of [-1, .5]) assert.equal(reduce(d, { type: 'enhancement', id: 'unscented', quantity }), d);
});
test('required enhancements are selected automatically and cannot be removed', () => {
  const config = { ...catalog, enhancements: catalog.enhancements.map(e => ({ ...e, required: e.id === 'unscented' })) };
  const d = initialBooking({ source: 'hero', serviceId: 'reset' }, config); assert.deepEqual(d.enhancements, [{ id: 'unscented', quantity: 1 }]);
  assert.equal(reduce(d, { type: 'enhancement', id: 'unscented', quantity: 0 }, config), d);
  const bad = { ...d, enhancements: [] }; assert.ok(validateStep('enhancements', bad, config, now).enhancements);
});
test('enhancement time is included in availability duration', () => {
  const d = reduce(located(), { type: 'enhancement', id: 'stones', quantity: 1 }); assert.equal(totalDuration(d, catalog), 75); assert.equal(availabilityQuery(d, catalog).durationMinutes, 75);
});
test('location edits clear eligibility and slots; arrival notes preserve them', () => {
  const d = withSlot(); const changed = reduce(d, { type: 'location', patch: { zip: '00002' } }); assert.equal(changed.slot, null); assert.equal(changed.locationValidation, null);
  const notes = reduce(d, { type: 'location', patch: { instructions: 'Demo parking instructions' } }); assert.deepEqual(notes.slot, d.slot); assert.equal(availabilityKey(availabilityQuery(notes, catalog)), availabilityKey(availabilityQuery(d, catalog)));
});
test('contact and session preferences do not invalidate availability', () => {
  const d = withSlot(); assert.deepEqual(reduce(d, { type: 'customer', patch: { firstName: 'Demo' } }).slot, d.slot); assert.deepEqual(reduce(d, { type: 'preferences', patch: { requests: 'Quiet music' } }).slot, d.slot);
});
test('date and scenario changes invalidate the selected slot', () => {
  const d = withSlot(); assert.equal(reduce(d, { type: 'date', date: '2026-10-31' }).slot, null); assert.equal(reduce(d, { type: 'scenario', scenario: 'empty' }).slot, null);
});
test('navigation cannot skip incomplete dependent steps; backward navigation preserves data', () => {
  const d = start(); assert.equal(canVisitStep('review', d, catalog, now), false); assert.equal(reduce(d, { type: 'navigate', step: 'location' }), d);
  const ready = completeDraft(); assert.equal(canVisitStep('review', ready, catalog, now), true); const back = reduce(ready, { type: 'navigate', step: 'experience' }); assert.deepEqual(back.customer, ready.customer); assert.deepEqual(back.slot, ready.slot);
});
test('step validation covers required fields, formats, maximum lengths, and optional values', () => {
  assert.ok(validateStep('experience', start(), catalog, now).service);
  assert.ok(validateStep('location', start(), catalog, now).address);
  let d = completeDraft(); assert.deepEqual(validateStep('personalize', d, catalog, now), {});
  d = { ...d, customer: { firstName: '', lastName: 'x'.repeat(61), email: 'not-an-email', phone: '123' }, preferences: { pressure: '', session: 'x'.repeat(301), requests: 'x'.repeat(601) } };
  const errors = validateStep('personalize', d, catalog, now); for (const key of ['firstName', 'lastName', 'email', 'phone', 'session', 'requests']) assert.ok(errors[key]);
});
test('an expired slot never blocks backward editing, but still prevents forward review', () => {
  const expiredAt = new Date('2026-11-01T12:00:00Z');
  const draft = { ...completeDraft(), currentStep: 'review' };
  assert.equal(canVisitStep('personalize', draft, catalog, expiredAt), true);
  assert.equal(canVisitStep('review', { ...draft, currentStep: 'personalize' }, catalog, expiredAt), false);
});
test('review validates every prerequisite and rejects stale or mismatched dates', () => {
  const d = completeDraft(); assert.deepEqual(validateStep('review', d, catalog, now), {});
  assert.ok(validateStep('datetime', d, catalog, new Date('2026-11-01T12:00:00Z')).slot);
  assert.ok(validateStep('datetime', { ...d, date: '2026-10-31' }, catalog, now).slot);
});
test('unverified duration and travel prices never produce a misleading total', () => {
  const d = reduce(withSlot(), { type: 'enhancement', id: 'stones', quantity: 1 }); const quote = calculatePricing(d, catalog); assert.equal(quote.totalMinor, null); assert.equal(quote.knownSubtotalMinor, 2000);
});
test('pricing uses integer minor units, quantities, travel fees, and future discounts', () => {
  const config = { ...catalog, services: catalog.services.map(s => ({ ...s, durations: s.durations.map(d => ({ ...d, priceMinor: 6000 })) })), enhancements: catalog.enhancements.map(e => ({ ...e, maxQuantity: 2 })) };
  let d = reduce(located(), { type: 'enhancement', id: 'stones', quantity: 2 }, config); d = { ...d, locationValidation: { status: 'eligible', message: 'Fixture', travelFeeMinor: 1500 } };
  assert.equal(calculatePricing(d, config, 500).totalMinor, 11000); assert.equal(calculatePricing(d, config, 99999).totalMinor, 0); assert.equal(calculatePricing(start(), config).totalMinor, null);
});
test('UTC date normalization handles DST and validates actual calendar dates', () => {
  assert.equal(zonedTimeToISO('2026-10-30', '09:00', BOOKING_TIMEZONE), '2026-10-30T13:00:00.000Z');
  assert.equal(zonedTimeToISO('2026-11-02', '09:00', BOOKING_TIMEZONE), '2026-11-02T14:00:00.000Z');
  assert.equal(dateInTimezone(new Date('2026-10-30T02:00:00Z'), BOOKING_TIMEZONE), '2026-10-29'); assert.equal(isCalendarDate('2026-02-30'), false);
});
test('mock date policy disables past dates, Sundays, and dates beyond the horizon', () => {
  assert.equal(isDateSelectable('2026-10-27', '2026-10-28', catalog.calendar), false); assert.equal(isDateSelectable('2026-11-01', '2026-10-28', catalog.calendar), false); assert.equal(isDateSelectable('2027-02-01', '2026-10-28', catalog.calendar), false);
});
test('mock location checking has deterministic eligible, ineligible, and unknown states', async () => {
  const provider = createMockBookingGateway({ latency: 0, now: () => now });
  for (const [zip, status] of [['00001', 'eligible'], ['00002', 'ineligible'], ['10001', 'unknown']]) assert.equal((await provider.validateLocation({ ...located().location, zip })).status, status);
});
test('mock availability supports success, empty, error, duration constraints, and cancellation', async () => {
  const provider = createMockBookingGateway({ latency: 0, now: () => now }); const q = availabilityQuery(located(), catalog);
  const first = await provider.getAvailability(q); assert.equal(first.length, 5); assert.deepEqual(await provider.getAvailability(q), first);
  assert.deepEqual(await provider.getAvailability({ ...q, scenario: 'empty' }), []); await assert.rejects(provider.getAvailability({ ...q, scenario: 'error' }), /demo scheduling/);
  assert.equal((await provider.getAvailability({ ...q, durationMinutes: 135 })).length, 4);
  const controller = new AbortController(); controller.abort(); await assert.rejects(provider.getAvailability(q, controller.signal), { name: 'AbortError' });
});
test('preview submission revalidates availability and never returns a real confirmation', async () => {
  const provider = createMockBookingGateway({ latency: 0, now: () => now }); const draft = completeDraft();
  const result = await provider.createBooking({ draft, idempotencyKey: 'test-1' }); assert.equal(result.status, 'preview'); assert.match(result.message, /has not been reserved/); assert.equal('reference' in result, false);
  assert.deepEqual(await provider.createBooking({ draft, idempotencyKey: 'test-1' }), result);
  await assert.rejects(provider.createBooking({ draft: { ...draft, scenario: 'empty' }, idempotencyKey: 'test-2' }), /no longer available/);
  await assert.rejects(provider.createBooking({ draft: { ...draft, slot: { ...draft.slot, queryKey: 'stale' } }, idempotencyKey: 'test-3' }), /no longer available/);
});
