import { useReveal } from '../../lib/useReveal.js';
import Shapes from '../Shapes.jsx';

/**
 * A full-bleed dashboard band ("shelf") with a big sans heading + serif subline, like the
 * reference's colour panels. Gets `is-visible` when scrolled into view, which starts the heading
 * reveal and the staggered card entrance (see .card-slot in dashboard.css).
 */
export default function Shelf({ id, title, count, subtitle, tone = 'canvas', shapes, busy, children }) {
  // threshold 0: a long shelf may never be 15% visible at once, so fire on first contact.
  const ref = useReveal({ threshold: 0 });
  return (
    <section ref={ref} className={`shelf shelf--${tone}`} aria-labelledby={`${id}-title`} aria-busy={busy || undefined}>
      {shapes && <Shapes items={shapes} />}
      <div className="dash-wrap">
        <header className="shelf-head">
          <h2 id={`${id}-title`} className="shelf-title">
            {title}
            {count != null && <span className="shelf-count">{count}</span>}
          </h2>
          {subtitle && <p className="shelf-sub serif">{subtitle}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
