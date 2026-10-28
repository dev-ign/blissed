import type { RefObject } from 'react';
import { gsap, useGSAP } from '../animations/gsap';

export function useHeroScroll(root: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    if (!root.current) return;
    const matchMedia = gsap.matchMedia();
    matchMedia.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const image = root.current?.querySelector('.hero-image');
      const content = root.current?.querySelector('.hero-content');
      if (!image || !content) return;
      gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
      })
        .to(image, { scale: 1.035, ease: 'none' }, 0)
        .to(content, { y: -22, opacity: 0.78, ease: 'none' }, 0);
    });
    return () => matchMedia.revert();
  }, { scope: root });
}
