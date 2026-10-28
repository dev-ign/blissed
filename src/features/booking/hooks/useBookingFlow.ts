import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { initialBooking, reduceBooking, type BookingAction } from '../domain/bookingRules';
import { bookingSteps, trackBooking, type BookingCatalog, type BookingEntryContext, type BookingGateway, type BookingStep } from '../domain/types';
import { validateStep, type ValidationErrors } from '../domain/validation';

export function useBookingFlow(entry: BookingEntryContext, catalog: BookingCatalog, gateway: BookingGateway) {
  const [draft, dispatch] = useReducer((state: ReturnType<typeof initialBooking>, action: Parameters<typeof reduceBooking>[1]) => reduceBooking(state, action, catalog), entry, context => initialBooking(context, catalog));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const requestInFlight = useRef(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const navigate = useCallback((step: BookingStep) => { request.current?.abort(); setErrors({}); setFailure(''); dispatch({ type: 'navigate', step }); }, []);
  const index = bookingSteps.findIndex(s => s.id === draft.currentStep);

  async function next() {
    if (requestInFlight.current) return;
    const currentErrors = validateStep(draft.currentStep, draft, catalog, new Date(), draft.currentStep !== 'location');
    setErrors(currentErrors); setFailure('');
    if (Object.keys(currentErrors).length) { setValidationAttempt(attempt => attempt + 1); return; }
    if (draft.currentStep === 'location' || draft.currentStep === 'review') {
      requestInFlight.current = true; setBusy(true);
      const controller = new AbortController(); request.current = controller;
      try {
        if (draft.currentStep === 'location') {
          const result = await gateway.validateLocation(draft.location, controller.signal);
          if (controller.signal.aborted) return;
          dispatch({ type: 'location-result', result });
          if (result.status === 'eligible') { trackBooking({ name: 'location_step_completed' }); dispatch({ type: 'navigate', step: 'datetime' }); }
          else { setErrors({ coverage: result.message }); setValidationAttempt(attempt => attempt + 1); }
        } else {
          const result = await gateway.createBooking({ draft, idempotencyKey: idempotencyKey.current }, controller.signal);
          if (controller.signal.aborted) return;
          // A demo can never emit booking_confirmed or show a real reservation reference.
          if (result.status !== 'preview') throw new Error('This preview cannot create a reservation.');
          dispatch({ type: 'complete' });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setFailure(error instanceof Error ? error.message : 'Please try again. Your preview details are still here.');
          if (draft.currentStep === 'review') dispatch({ type: 'slot', slot: null });
        }
      } finally { requestInFlight.current = false; if (!controller.signal.aborted) setBusy(false); }
      return;
    }
    if (draft.currentStep === 'datetime') trackBooking({ name: 'date_time_selected' });
    if (draft.currentStep === 'personalize') trackBooking({ name: 'personalization_completed' });
    const nextStep = bookingSteps[index + 1];
    if (nextStep) { if (nextStep.id === 'review') trackBooking({ name: 'booking_review_viewed' }); navigate(nextStep.id); }
  }
  const change = (action: BookingAction) => {
    dispatch(action); setFailure('');
    setErrors(previous => {
      if (!Object.keys(previous).length) return previous;
      const updated = reduceBooking(draft, action, catalog);
      const validation = validateStep(draft.currentStep, updated, catalog, new Date(), draft.currentStep !== 'location');
      const remaining: ValidationErrors = {};
      for (const key of Object.keys(previous)) {
        if (validation[key]) remaining[key] = validation[key];
        else if (key === 'coverage' && updated.locationValidation && updated.locationValidation.status !== 'eligible') remaining[key] = updated.locationValidation.message;
      }
      return remaining;
    });
  };
  return { draft, dispatch: change, errors, validationAttempt, busy, failure, next, navigate, index, cancel: () => request.current?.abort() };
}
