// Small motion helpers shared by the landing page components.

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Smooth-scrolls an element into view (instant when the user prefers reduced motion). */
export function scrollToEl(el, block = 'start') {
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
}
