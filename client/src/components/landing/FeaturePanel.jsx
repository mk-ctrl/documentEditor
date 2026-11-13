import { useReveal } from '../../lib/useReveal.js';
import Shapes from '../Shapes.jsx';

/**
 * A full-bleed coloured story panel: number label, giant sans headline, light serif subtitle,
 * a few short notes and a paper mockup. Children = the mockup.
 *   tone: 'mint' | 'coral' | 'grey' | 'desk'   flip: put the mockup on the left
 */
export default function FeaturePanel({ id, tone, index, label, title, subtitle, notes = [], shapes = [], flip, children }) {
  const ref = useReveal({ threshold: 0.12 });
  const headingId = `${id}-title`;
  return (
    <section id={id} className={`lp-panel lp-tone-${tone}${flip ? ' is-flip' : ''}`} aria-labelledby={headingId}>
      <Shapes items={shapes} />
      <div className="lp-panel-inner reveal" ref={ref}>
        <header className="lp-panel-head">
          <p className="lp-label reveal-child" style={{ '--i': 0 }}>
            <span>{String(index).padStart(2, '0')}</span> {label}
          </p>
          <h2 id={headingId} className="lp-giant reveal-child" style={{ '--i': 1 }}>
            {title}
          </h2>
          <p className="lp-serif-sub reveal-child" style={{ '--i': 2 }}>
            {subtitle}
          </p>
        </header>
        <div className="lp-panel-body">
          <div className="lp-panel-art reveal-child" style={{ '--i': 3 }}>
            {children}
          </div>
          {notes.length > 0 && (
            <ul className="lp-notes">
              {notes.map((n, i) => (
                <li key={n.title} className="reveal-child" style={{ '--i': 4 + i }}>
                  <strong>{n.title}</strong>
                  <span>{n.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
