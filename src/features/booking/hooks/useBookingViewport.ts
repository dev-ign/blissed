import { useEffect, type RefObject } from 'react';

// Adapt only while a text control and a reduced visual viewport indicate a keyboard.
// Pinch zoom and ordinary browser chrome changes retain native viewport behavior.
export function useBookingViewport(dialog: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const element = dialog.current;
    const viewport = window.visualViewport;
    if (!element || !viewport) return;
    let unoccludedHeight = window.innerHeight;
    let layoutWidth = window.innerWidth;
    let frame = 0;
    const update = () => {
      const active = document.activeElement;
      if (window.innerWidth !== layoutWidth) { layoutWidth = window.innerWidth; unoccludedHeight = window.innerHeight; }
      const editing = element.contains(active) && (active instanceof HTMLTextAreaElement || (active instanceof HTMLInputElement && !['radio', 'checkbox', 'button', 'submit'].includes(active.type)));
      const wasOpen = element.hasAttribute('data-keyboard-open');
      const occluded = (editing || wasOpen) && viewport.scale === 1 && window.matchMedia('(max-width: 767px)').matches && viewport.height < Math.max(unoccludedHeight, window.innerHeight) - (wasOpen ? 24 : 100);
      element.toggleAttribute('data-keyboard-open', occluded);
      if (occluded) {
        element.style.setProperty('--booking-viewport-height', `${viewport.height}px`);
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => active instanceof HTMLElement && active.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
      } else {
        element.style.removeProperty('--booking-viewport-height');
        if (!editing && viewport.height >= unoccludedHeight - 24) unoccludedHeight = window.innerHeight;
      }
    };
    viewport.addEventListener('resize', update);
    window.addEventListener('resize', update);
    element.addEventListener('focusin', update);
    element.addEventListener('focusout', update);
    return () => { cancelAnimationFrame(frame); viewport.removeEventListener('resize', update); window.removeEventListener('resize', update); element.removeEventListener('focusin', update); element.removeEventListener('focusout', update); };
  }, [dialog]);
}
