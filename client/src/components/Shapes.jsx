/**
 * Decorative floating outline shapes (squares, rings, triangles), as in the reference site.
 * Purely visual: aria-hidden, pointer-events none, frozen under prefers-reduced-motion.
 *
 *   <Shapes items={[{ kind: 'square', top: '10%', left: '6%', color: 'var(--sun)', size: 34, rotate: 12, delay: 0 }]} />
 *
 * kind: 'square' | 'ring' | 'tri'. Position with top/left/right/bottom (any CSS length).
 * The parent must be position: relative (or absolute/fixed) and usually overflow: hidden.
 */
export default function Shapes({ items = [] }) {
  return (
    <div className="shapes" aria-hidden="true">
      {items.map((s, i) => (
        <span
          key={i}
          className={`shape shape-${s.kind || 'square'}`}
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            bottom: s.bottom,
            color: s.color || 'rgba(255,255,255,.12)',
            '--size': `${s.size || 34}px`,
            '--r': `${s.rotate || 0}deg`,
            animationDelay: `${s.delay ?? i * -1.7}s`,
            animationDuration: `${s.duration || 9 + (i % 4) * 2}s`,
          }}
        />
      ))}
    </div>
  );
}
