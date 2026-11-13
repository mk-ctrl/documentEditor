import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal: returns a ref; when the element enters the viewport it gets `is-visible`.
 * Pair with the `.reveal` class (see styles.css). Children with `.reveal-child` stagger in
 * using their `--i` custom property (style={{ '--i': index }}).
 * Respects prefers-reduced-motion (CSS shows everything immediately).
 */
export function useReveal({ threshold = 0.15, once = true } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          if (once) io.disconnect();
        } else if (!once) {
          el.classList.remove('is-visible');
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return ref;
}
