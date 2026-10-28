import type { ServiceContent } from '../../../data/services';
// Small, locally generated WebP derivatives of the original homepage photography.
export const bookingImages: Record<ServiceContent['imageKey'] | 'intro', string> = {
  reset: '/assets/booking/reset.webp', deepRestore: '/assets/booking/deepRestore.webp',
  activeRecovery: '/assets/booking/activeRecovery.webp', prenatal: '/assets/booking/prenatal.webp',
  yourWay: '/assets/booking/yourWay.webp', intro: '/assets/booking/intro.webp',
};
