// The mock booking preview is available in every environment unless explicitly disabled.
// This controls access to the preview, never live reservations or payments.
export const bookingPreviewEnabled = import.meta.env.VITE_BOOKING_PREVIEW !== 'false';
