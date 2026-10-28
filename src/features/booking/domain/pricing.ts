import type { BookingCatalog, BookingDraft } from './types';

export const money = (minor: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: minor % 100 === 0 ? 0 : 2 }).format(minor / 100);
export type PriceLine = { id: string; label: string; amountMinor: number | null };
export function calculatePricing(draft: BookingDraft, catalog: BookingCatalog, discountMinor = 0) {
  const service = catalog.services.find(s => s.id === draft.serviceId);
  const duration = service?.durations.find(d => d.id === draft.durationId);
  const lines: PriceLine[] = [{ id: 'service', label: service?.title ?? 'Your experience', amountMinor: duration?.priceMinor ?? null }];
  for (const selected of draft.enhancements) {
    const enhancement = catalog.enhancements.find(e => e.id === selected.id && service && e.serviceIds.includes(service.id));
    if (enhancement) lines.push({ id: enhancement.id, label: `${enhancement.name}${selected.quantity > 1 ? ` × ${selected.quantity}` : ''} (demo)`, amountMinor: enhancement.priceMinor === null ? null : enhancement.priceMinor * selected.quantity });
  }
  lines.push({ id: 'travel', label: 'Travel fee', amountMinor: draft.locationValidation?.travelFeeMinor ?? null });
  if (discountMinor > 0) lines.push({ id: 'discount', label: 'Discount', amountMinor: -Math.round(discountMinor) });
  const knownSubtotalMinor = lines.reduce((total, line) => total + (line.amountMinor ?? 0), 0);
  return { lines, knownSubtotalMinor, totalMinor: lines.every(line => line.amountMinor !== null) ? Math.max(0, knownSubtotalMinor) : null };
}
