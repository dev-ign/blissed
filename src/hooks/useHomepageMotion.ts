import { useRef, type RefObject } from 'react';
import { gsap, useGSAP, ScrollTrigger, motion, mediaSafe } from '../animations/gsap';
import { revealOnce, revealSettings, visualOrder, clearRevealStyles } from '../animations/reveals';

const revealTargets = '.services-intro > *, .services-cta-row > *, .service-card, .events-content > *, .events-image img, .about-image img, .about-content > *, .testimonial blockquote > p, .testimonial blockquote footer, .testimonial-dots';

type Reveal = NonNullable<ReturnType<typeof revealOnce>>;

export function useHomepageMotion(root: RefObject<HTMLDivElement | null>) {
  const settled = useRef(new WeakSet<Element>());
  const heroFinished = useRef(false);

  useGSAP(() => {
    const page = root.current;
    if (!page) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', context => {
      const select = (selector: string) => Array.from(page.querySelectorAll<HTMLElement>(selector));
      clearRevealStyles(select(revealTargets));
      const finishCards = new Map<HTMLElement, () => void>();
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const heroTargets = select('.hero h1 > span, .hero-description, .hero-actions, .google-review');
      let hero: gsap.core.Timeline | undefined;
      let settleCards: (elements: Element[]) => void = () => {};
      const reveals: Reveal[] = [];

      const cards = (location.hash === '#services' ? [] : select('.service-card')).filter(card => !settled.current.has(card) && card.getBoundingClientRect().top >= innerHeight);
      // Synchronous layout-effect setup precedes paint. CSS remains visible by default;
      // no image/font promise, enhancement class, or timer can strand this content.
      try {
        if (heroTargets.length && !heroFinished.current && window.scrollY < 24 && (!location.hash || location.hash === '#home') && navigation?.type !== 'back_forward') {
          const { duration, y, stagger } = revealSettings();
          hero = gsap.timeline({ id: 'hero-entrance', defaults: { duration, ease: motion.ease }, onComplete: () => { heroFinished.current = true; } });
          hero.addLabel('image', 0)
            .fromTo(select('.header-inner'), { opacity: 0.35 }, { opacity: 1, duration: 0.35, clearProps: 'opacity' }, 0)
            .fromTo(select('.hero h1 > span'), { opacity: 0, y }, { opacity: 1, y: 0, stagger, clearProps: 'opacity,transform' }, 0.1)
            .fromTo(select('.hero-description'), { opacity: 0, y }, { opacity: 1, y: 0, clearProps: 'opacity,transform' }, 0.3)
            .fromTo(select('.hero-actions'), { opacity: 0, y: y * 0.7 }, { opacity: 1, y: 0, clearProps: 'opacity,transform' }, 0.43)
            .fromTo(select('.google-review'), { opacity: 0, y: y * 0.5 }, { opacity: 1, y: 0, duration: 0.5, clearProps: 'opacity,transform' }, 0.57);
        }
        const reveal = (triggerSelector: string, targetSelector: string, gentle = false) => {
          for (const trigger of select(triggerSelector)) {
            const result = revealOnce(trigger, Array.from(trigger.querySelectorAll<HTMLElement>(targetSelector)), settled.current, gentle);
            if (result) reveals.push(result);
          }
        };
        reveal('.services-intro', '.eyebrow, h2, :scope > p:last-child');
        reveal('.services-cta-row', '.text-action');
        // Individual triggers batch only the cards entering together. No hidden lower
        // rows waiting for a section-wide stagger; actual grid coordinates set order.
        if (cards.length) gsap.set(cards, { opacity: 0, y: revealSettings().y });
        const enterCards = mediaSafe(context, 'enterCards', (elements: Element[]) => {
          const ordered = visualOrder(elements.filter((card): card is HTMLElement => card instanceof HTMLElement && !settled.current.has(card)), innerWidth >= 768);
          if (!ordered.length) return;
          const settings = revealSettings();
          ordered.forEach(card => {
            finishCards.set(card, () => { gsap.killTweensOf(card); gsap.set(card, { clearProps: 'opacity,transform' }); settled.current.add(card); });
          });
          gsap.to(ordered, { opacity: 1, y: 0, duration: settings.duration, ease: motion.ease, stagger: innerWidth < 768 ? 0.06 : motion.cardStagger,
            clearProps: 'opacity,transform', onComplete: () => ordered.forEach(card => settled.current.add(card)) });
        });
        settleCards = mediaSafe(context, 'settleCards', (elements: Element[]) => elements.forEach(card => {
          gsap.killTweensOf(card); gsap.set(card, { clearProps: 'opacity,transform' }); settled.current.add(card);
        }));
        if (cards.length) ScrollTrigger.batch(cards, { start: motion.start, end: 'bottom top', once: true, interval: 0.07, onEnter: enterCards, onLeave: settleCards });
        reveal('.events-content', '.eyebrow, h2, .events-description, .event-prices, .travel-note, .booking-button');
        reveal('.events-image', 'img');
        reveal('.about-image', 'img');
        reveal('.about-content', 'h2, .about-tagline, .about-body, .about-benefits');
        reveal('.testimonial', 'blockquote > p, blockquote footer, .testimonial-dots', true);
      } catch (error) {
        // Revert partially initialized enhancement rather than leaving hidden text.
        context.revert();
        clearRevealStyles([...heroTargets, ...select('.header-inner'), ...select(revealTargets)]);
        console.error('Homepage motion could not initialize; showing static content.', error);
      }
      const finishHero = () => { hero?.progress(1); };
      const onFocus = mediaSafe(context, 'focusReveal', (event: FocusEvent | PointerEvent) => {
        if (!(event.target instanceof Node)) return;
        if (heroTargets.some(target => target.contains(event.target as Node))) finishHero();
        for (const item of reveals) if (item.targets.some(target => target.contains(event.target as Node))) item.finish();
        for (const [card, finish] of finishCards) if (card.contains(event.target)) finish();
        // A keyboard user can reach a not-yet-entered card before its scroll callback.
        const card = event.target instanceof Element ? event.target.closest<HTMLElement>('.service-card') : null;
        if (card && cards.includes(card)) settleCards([card]);
      });
      const onScroll = () => { if (scrollY > 64) finishHero(); };
      const onHistory = () => {
        finishHero();
        reveals.filter(item => item.trigger.getBoundingClientRect().top < innerHeight).forEach(item => item.finish());
        settleCards(cards.filter(card => card.getBoundingClientRect().top < innerHeight));
      };
      const onPageShow = (event: PageTransitionEvent) => { if (event.persisted || (location.hash && location.hash !== '#home') || navigation?.type === 'back_forward') onHistory(); };
      page.addEventListener('focusin', onFocus);
      page.addEventListener('pointerdown', onFocus);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('hashchange', onHistory);
      window.addEventListener('popstate', onHistory);
      window.addEventListener('pageshow', onPageShow);
      return () => {
        page.removeEventListener('focusin', onFocus);
        page.removeEventListener('pointerdown', onFocus);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('hashchange', onHistory);
        window.removeEventListener('popstate', onHistory);
        window.removeEventListener('pageshow', onPageShow);
      };
    });
    media.add('(prefers-reduced-motion: reduce)', () => {
      heroFinished.current = true;
      clearRevealStyles(page.querySelectorAll<HTMLElement>(`${revealTargets}, .header-inner, .hero h1 > span, .hero-description, .hero-actions, .google-review`));
    });
    return () => media.revert();
  }, { scope: root });
}
