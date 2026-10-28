import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// One registration point shared by the entrance, reveals, and existing scroll effects.
gsap.registerPlugin(useGSAP, ScrollTrigger);
export { gsap, useGSAP, ScrollTrigger };

export const motion = {
  ease: 'power2.out',
  duration: 0.64,
  mobileDuration: 0.5,
  distance: 20,
  mobileDistance: 12,
  textStagger: 0.1,
  cardStagger: 0.12,
  start: 'clamp(top 88%)',
} as const;

// GSAP's named callback API returns Function; preserve the callback's argument type.
export function mediaSafe<Args extends unknown[]>(context: gsap.Context, name: string, callback: (...args: Args) => void) {
  return context.add(name, callback) as (...args: Args) => void;
}
