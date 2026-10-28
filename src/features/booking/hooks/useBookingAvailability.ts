import { useEffect, useMemo, useState } from 'react';
import { availabilityKey, availabilityQuery } from '../domain/availability';
import type { AvailabilityStatus, BookingAvailability, BookingCatalog, BookingDraft, BookingGateway } from '../domain/types';

export function useBookingAvailability(draft: BookingDraft, catalog: BookingCatalog, gateway: BookingGateway) {
  const query = availabilityQuery(draft, catalog);
  const key = query ? availabilityKey(query) : '';
  // Use the normalized key so contact/preference edits do not refetch scheduling data.
  const stableQuery = useMemo(() => query, [key]); // The key includes every scheduling field, excluding arrival notes.
  const [state, setState] = useState<{ key: string; status: AvailabilityStatus; slots: BookingAvailability[]; error: string }>({ key: '', status: 'idle', slots: [], error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!stableQuery) return;
    const controller = new AbortController();
    setState({ key, status: 'loading', slots: [], error: '' });
    gateway.getAvailability(stableQuery, controller.signal).then(slots => {
      if (!controller.signal.aborted) setState({ key, status: slots.length ? 'success' : 'empty', slots, error: '' });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, status: 'error', slots: [], error: error instanceof Error ? error.message : 'Availability could not be loaded.' });
    });
    return () => controller.abort();
  }, [stableQuery, key, gateway, retry]);
  const current = !key ? { status: 'idle' as const, slots: [], error: '' } : state.key === key ? state : { status: 'loading' as const, slots: [], error: '' };
  return { ...current, retry: () => setRetry(value => value + 1) };
}
