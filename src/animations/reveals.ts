import { gsap, ScrollTrigger, motion } from './gsap';

export function clearRevealStyles(elements: Iterable<HTMLElement>) {
  for (const element of elements) {
    element.style.removeProperty('opacity');
    element.style.removeProperty('transform');
  }
}

export function revealSettings() {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  return { duration: mobile ? motion.mobileDuration : motion.duration, y: mobile ? motion.mobileDistance : motion.distance, stagger: mobile ? 0.075 : motion.textStagger };
}

// Read layout only when a batch enters, so desktop rows and mobile reading order agree.
export function visualOrder(elements: HTMLElement[], rightToLeft = false) {
  const positions = elements.map(element => ({ element, rect: element.getBoundingClientRect() }));
  positions.sort((a, b) => Math.abs(a.rect.top - b.rect.top) > 8
    ? a.rect.top - b.rect.top
    : rightToLeft ? b.rect.left - a.rect.left : a.rect.left - b.rect.left);
  return positions.map(item => item.element);
}

export function revealOnce(trigger: HTMLElement, targets: HTMLElement[], settled: WeakSet<Element>, gentle = false) {
  if (!targets.length) return null;
  const anchor = location.hash ? document.getElementById(location.hash.slice(1)) : null;
  if (settled.has(trigger) || (anchor && anchor.contains(trigger))) {
    clearRevealStyles(targets);
    settled.add(trigger);
    return null;
  }
  // Restored scroll positions and direct anchors must never land on hidden content.
  if (trigger.getBoundingClientRect().top < window.innerHeight) {
    clearRevealStyles(targets);
    settled.add(trigger);
    return null;
  }
  const settings = revealSettings();
  const timeline = gsap.timeline({
    paused: true,
    defaults: { duration: gentle ? 0.45 : settings.duration, ease: motion.ease },
    onComplete: () => settled.add(trigger),
  });
  timeline.fromTo(targets, { opacity: 0, y: gentle ? 6 : settings.y }, {
    opacity: 1, y: 0, stagger: settings.stagger, clearProps: 'opacity,transform',
  });
  const controller = ScrollTrigger.create({
    trigger, animation: timeline, start: motion.start, end: 'bottom top', once: true,
    onLeave: () => timeline.progress(1),
  });
  return { trigger, targets, finish: () => { timeline.progress(1); controller.kill(); settled.add(trigger); } };
}
