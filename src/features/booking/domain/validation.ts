import { dateInTimezone, isCalendarDate } from './dates';
import { bookingSteps, type BookingCatalog, type BookingDraft, type BookingStep } from './types';
export type ValidationErrors = Record<string, string>;
type TextRule = { required?: boolean; max: number; pattern?: RegExp; formatMessage?: string; label: string };
const customerRules: Record<keyof BookingDraft['customer'], TextRule> = {
  firstName: { required: true, max: 60, label: 'First name' }, lastName: { required: true, max: 60, label: 'Last name' },
  email: { required: true, max: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, formatMessage: 'Enter a valid email address.', label: 'Email' },
  phone: { required: true, max: 30, pattern: /^\+?[\d\s().-]+$/, formatMessage: 'Enter a valid phone number.', label: 'Phone' },
};
const locationRules: Record<keyof BookingDraft['location'], TextRule> = {
  address: { required: true, max: 160, label: 'Street address' }, address2: { max: 100, label: 'Address line 2' }, city: { required: true, max: 80, label: 'City' },
  state: { required: true, max: 2, pattern: /^[A-Za-z]{2}$/, formatMessage: 'Use a two-letter state abbreviation.', label: 'State' },
  zip: { required: true, max: 10, pattern: /^\d{5}(-\d{4})?$/, formatMessage: 'Enter a five-digit ZIP code.', label: 'ZIP code' }, instructions: { max: 400, label: 'Arrival instructions' },
};
function validateFields(values: Record<string, string>, rules: Record<string, TextRule>): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const [key, rule] of Object.entries(rules)) {
    const value = values[key]?.trim() ?? '';
    if (rule.required && !value) errors[key] = `${rule.label} is required.`;
    else if (value.length > rule.max) errors[key] = `Use ${rule.max} characters or fewer.`;
    else if (value && rule.pattern && !rule.pattern.test(value)) errors[key] = rule.formatMessage ?? `Check ${rule.label.toLowerCase()}.`;
  }
  return errors;
}
export function validateStep(step: BookingStep, draft: BookingDraft, catalog: BookingCatalog, now = new Date(), requireEligibility = true): ValidationErrors {
  const errors: ValidationErrors = {};
  const service = catalog.services.find(s => s.id === draft.serviceId);
  if (step === 'experience') {
    if (!service) errors.service = 'Choose a massage experience to continue.';
    else if (!service.durations.some(d => d.id === draft.durationId)) errors.duration = 'Choose a duration for your experience.';
  }
  if (step === 'enhancements') {
    for (const selected of draft.enhancements) {
      const e = catalog.enhancements.find(item => item.id === selected.id);
      if (!e || !service || !e.serviceIds.includes(service.id) || selected.quantity < 1 || !Number.isInteger(selected.quantity) || selected.quantity > e.maxQuantity || e.incompatibleIds.some(id => draft.enhancements.some(s => s.id === id))) errors.enhancements = 'Please review your enhancements; these selections cannot be combined.';
    }
    if (service && catalog.enhancements.some(e => e.required && e.serviceIds.includes(service.id) && !draft.enhancements.some(s => s.id === e.id))) errors.enhancements = 'Choose the required enhancement to continue.';
  }
  if (step === 'location') {
    Object.assign(errors, validateFields(draft.location, locationRules));
    if (requireEligibility && draft.locationValidation?.status !== 'eligible') errors.coverage = 'Check your location’s demo coverage before continuing.';
  }
  if (step === 'datetime') {
    if (!draft.date || !isCalendarDate(draft.date)) errors.date = 'Choose an available date.';
    if (!draft.slot) errors.slot = 'Choose a time for your experience.';
    else if (new Date(draft.slot.startAt).getTime() <= now.getTime() || dateInTimezone(new Date(draft.slot.startAt), draft.slot.timezone) !== draft.date) errors.slot = 'That time is no longer available. Please choose another.';
  }
  if (step === 'personalize') {
    Object.assign(errors, validateFields(draft.customer, customerRules));
    const digits = draft.customer.phone.replace(/\D/g, '');
    if (!errors.phone && (digits.length < 10 || digits.length > 15)) errors.phone = 'Enter a phone number with 10–15 digits.';
    if (draft.preferences.session.length > 300) errors.session = 'Use 300 characters or fewer.';
    if (draft.preferences.requests.length > 600) errors.requests = 'Use 600 characters or fewer.';
    if (!['', 'light', 'medium', 'firm', 'decide'].includes(draft.preferences.pressure)) errors.pressure = 'Choose one of the pressure preferences.';
  }
  if (step === 'review') for (const previous of bookingSteps.filter(s => s.id !== 'review')) Object.assign(errors, validateStep(previous.id, draft, catalog, now));
  return errors;
}
export function canVisitStep(target: BookingStep, draft: BookingDraft, catalog: BookingCatalog, now = new Date()): boolean {
  const index = bookingSteps.findIndex(s => s.id === target);
  const currentIndex = bookingSteps.findIndex(s => s.id === draft.currentStep);
  // Earlier steps must remain editable even if an appointment has since expired.
  if (index >= 0 && index < currentIndex) return true;
  return index >= 0 && bookingSteps.slice(0, index).every(s => Object.keys(validateStep(s.id, draft, catalog, now)).length === 0);
}
