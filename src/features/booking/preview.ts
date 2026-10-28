// Production builds keep the original coming-soon behavior unless explicitly enabled.
export const bookingPreviewEnabled = import.meta.env.VITE_BOOKING_PREVIEW === undefined ? import.meta.env.DEV : import.meta.env.VITE_BOOKING_PREVIEW === 'true';
