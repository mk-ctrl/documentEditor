import { useEffect, useState } from 'react';
import { scrollToEl } from './motion.js';

/**
 * Fixed right-side dot navigation (hidden on small screens via CSS).
 * Highlights the section that crosses the middle of the viewport.
 *   sections: [{ id: 'write', label: 'Write' }, ...] — ids of elements on the page.
 */
export default function DotNav({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      // A thin band around the vertical middle of the viewport decides the active section.
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav className="lp-dots" aria-label="Page sections">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`lp-dot${active === s.id ? ' is-active' : ''}`}
          aria-label={`Go to ${s.label} section`}
          aria-current={active === s.id ? 'true' : undefined}
          onClick={() => scrollToEl(document.getElementById(s.id))}
        >
          <span className="lp-dot-label" aria-hidden="true">
            {s.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
