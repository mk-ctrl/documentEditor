import { useReveal } from '../../lib/useReveal.js';
import Shapes from '../Shapes.jsx';

const SHAPES = [
  { kind: 'ring', top: '18%', left: '8%', color: 'rgba(255, 255, 255, 0.45)', size: 48 },
  { kind: 'square', bottom: '16%', right: '9%', color: 'rgba(242, 236, 152, 0.8)', size: 36, rotate: 16, delay: -3 },
  { kind: 'tri', top: '14%', right: '16%', color: 'rgba(53, 51, 48, 0.25)', size: 30, rotate: 8, delay: -5 },
];

/** Closing coral band: the reference's alternating serif / giant-sans rhythm, ending in an action. */
export default function Finale({ onCreate, creating }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="dash-finale reveal" aria-label="Start something new">
      <Shapes items={SHAPES} />
      <div className="dash-wrap">
        <p className="finale-line serif reveal-child" style={{ '--i': 0 }}>
          Because we believe
        </p>
        <p className="finale-big reveal-child" style={{ '--i': 1 }}>
          Great work
        </p>
        <p className="finale-line serif reveal-child" style={{ '--i': 2 }}>
          starts on
        </p>
        <p className="finale-big reveal-child" style={{ '--i': 3 }}>
          a blank page.
        </p>
        <div className="reveal-child" style={{ '--i': 4 }}>
          <button type="button" className="btn btn-ink finale-btn" onClick={onCreate} disabled={creating}>
            {creating ? 'Opening…' : 'Start a blank page'}
          </button>
        </div>
      </div>
    </section>
  );
}
