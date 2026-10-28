import { useRef, type RefObject } from 'react';
import { gsap, useGSAP, ScrollTrigger, motion } from '../animations/gsap';
import { revealOnce } from '../animations/reveals';

const PIN_QUERY = '(min-width: 900px) and (prefers-reduced-motion: no-preference)';
const HOLD = 0.48;
const TRANSITION = 0.9;

export function useExperienceScroll(root: RefObject<HTMLElement | null>) {
  const settled = useRef(new WeakSet<Element>());
  useGSAP(() => {
    const container = root.current;
    if (!container) return;

    const clearCinematicStyles = () => {
      for (const element of container.querySelectorAll<HTMLElement>('.story-scene, .experience-copy > h2, .experience-copy > p, .story-step-heading, .story-subtitle, .story-description')) {
        for (const property of ['opacity', 'visibility', 'transform']) element.style.removeProperty(property);
      }
    };
    const media = gsap.matchMedia();
    media.add(PIN_QUERY, context => {
      const backgrounds = Array.from(container.querySelectorAll<HTMLElement>('.story-backdrop'));
      const scenes = Array.from(container.querySelectorAll<HTMLElement>('.story-scene'));
      if (backgrounds.length !== 4 || scenes.length !== 4) return;

      clearCinematicStyles();
      container.setAttribute('data-story-pinned', '');
      try {
        gsap.set(backgrounds[0], { opacity: 1 });
        gsap.set(backgrounds.slice(1), { opacity: 0 });
        gsap.set(scenes[0], { autoAlpha: 1, y: 0 });
        gsap.set(scenes.slice(1), { autoAlpha: 0, y: 12 });

        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * 3.3)}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        const names = ['reconnect', 'arrive', 'exhale', 'restore'];
        timeline.addLabel(names[0], 0).to(backgrounds[0], { opacity: 1, duration: HOLD });

        for (let index = 0; index < scenes.length - 1; index += 1) {
          const transitionLabel = `to-${names[index + 1]}`;
          timeline.addLabel(transitionLabel);
          timeline.to(scenes[index], { autoAlpha: 0, y: -12, duration: TRANSITION * 0.55 }, transitionLabel);
          timeline.to(backgrounds[index + 1], { opacity: 1, duration: TRANSITION }, transitionLabel);
          timeline.fromTo(
            scenes[index + 1],
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: TRANSITION * 0.58, immediateRender: false },
            `${transitionLabel}+=${TRANSITION * 0.38}`,
          );
          // Refine the existing scrubbed transition, rather than attaching another
          // ScrollTrigger to cinematic text. The original panel fade stays intact.
          const text = Array.from(scenes[index + 1].querySelectorAll<HTMLElement>('.story-step-heading, .story-subtitle, .story-description'));
          timeline.fromTo(text, { opacity: 0, y: 14 }, {
            opacity: 1, y: 0, duration: 0.44, stagger: 0.08, ease: motion.ease, immediateRender: false,
          }, `${transitionLabel}+=0.3`);
          timeline.addLabel(names[index + 1]).to(backgrounds[index + 1], { opacity: 1, duration: HOLD });
        }

        let active = true;
        const images = Array.from(container.querySelectorAll<HTMLImageElement>('.story-backdrop img'));
        Promise.allSettled([
          document.fonts.ready,
          ...images.map((image) => image.decode()),
        ]).then(() => {
          if (active) ScrollTrigger.refresh();
        });

        return () => {
          active = false;
          container.removeAttribute('data-story-pinned');
          // autoAlpha can restore a computed hidden state captured while the pin
          // enhancement was active. Static/reduced-motion chapters own no inline
          // opacity, visibility, or transforms after this media context is reverted.
          clearCinematicStyles();
        };
      } catch (error) {
        context.revert();
        container.removeAttribute('data-story-pinned');
        clearCinematicStyles();
        console.error('Cinematic motion could not initialize; showing static chapters.', error);
      }
    });

    media.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', context => {
      clearCinematicStyles();
      try {
        const reveals = Array.from(container.querySelectorAll<HTMLElement>('.experience-copy, .story-step-copy')).map(copy =>
          revealOnce(copy, Array.from(copy.querySelectorAll<HTMLElement>('h2, .story-step-heading, .story-subtitle, .story-description, .experience-copy > p'))
            .filter(element => !element.matches('.story-step-heading h2')), settled.current),
        ).filter((item): item is NonNullable<typeof item> => Boolean(item));
        const finishAtAnchor = () => {
          if (location.hash !== '#experience') return;
          reveals.filter(item => item.trigger.getBoundingClientRect().top < innerHeight).forEach(item => item.finish());
        };
        window.addEventListener('hashchange', finishAtAnchor);
        return () => window.removeEventListener('hashchange', finishAtAnchor);
      } catch (error) {
        context.revert();
        clearCinematicStyles();
        console.error('Chapter reveals could not initialize; showing static text.', error);
      }
    });

    // Explicit ownership on entry to static mode also clears ScrollTrigger's
    // saved pin animation state after its global match-media reversion.
    media.add('(prefers-reduced-motion: reduce)', clearCinematicStyles);

    let active = true;
    document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    return () => { active = false; media.revert(); };
  }, { scope: root });
}
