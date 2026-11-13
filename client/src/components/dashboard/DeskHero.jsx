import Shapes from '../Shapes.jsx';

const HERO_SHAPES = [
  { kind: 'square', top: '14%', left: '3%', color: 'rgba(242, 236, 152, 0.55)', size: 30, rotate: 14 },
  { kind: 'ring', top: '68%', left: '40%', color: 'rgba(166, 216, 201, 0.45)', size: 44, delay: -3 },
  { kind: 'tri', top: '8%', right: '6%', color: 'rgba(255, 61, 110, 0.5)', size: 34, rotate: -12, delay: -6 },
  { kind: 'square', bottom: '10%', right: '3%', color: 'rgba(255, 255, 255, 0.12)', size: 58, rotate: 20, delay: -2 },
  { kind: 'ring', top: '30%', left: '47%', color: 'rgba(255, 255, 255, 0.1)', size: 22, delay: -8 },
];

// Paper action tile. Follows the pointer with a gentle 3D tilt (CSS neutralises it under reduced motion).
function DeskTile({ variant, eyebrow, title, hint, badge, onClick, disabled, busy, children }) {
  function onPointerMove(e) {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`);
  }
  function onPointerLeave(e) {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  }

  return (
    <button
      type="button"
      className={`paper desk-tile desk-tile--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <span className="desk-tile-eyebrow" aria-hidden="true">
        {eyebrow}
      </span>
      <span className="desk-tile-badge" aria-hidden="true">
        {badge}
      </span>
      <span className="desk-tile-title">{title}</span>
      <span className="desk-tile-lines" aria-hidden="true">
        <i style={{ width: '92%' }} />
        <i className="is-mark" style={{ width: '70%' }} />
        <i style={{ width: '84%' }} />
        <i style={{ width: '46%' }} />
      </span>
      <span className="desk-tile-hint serif">{hint}</span>
      {children}
    </button>
  );
}

/** Charcoal "desk" band: greeting, giant headline, stats, and two tactile paper action tiles. */
export default function DeskHero({ greeting, stats, onCreate, onImport, creating, importing, onScrollDown }) {
  return (
    <section className="desk-hero" aria-labelledby="desk-title">
      <Shapes items={HERO_SHAPES} />
      <div className="dash-wrap desk-hero-inner">
        <div className="desk-copy">
          <p className="desk-kicker serif">{greeting}</p>
          <h1 id="desk-title" className="desk-title">
            Your desk<span aria-hidden="true">.</span>
          </h1>
          <p className="desk-sub serif">
            Start a blank page, or import a <b>.txt</b>, <b>.md</b> or <b>.docx</b> file (up to 2 MB) as a new
            editable document.
          </p>
          <p className="desk-stats">
            <span className="desk-live" aria-hidden="true" />
            {stats}
          </p>
        </div>

        <div className="desk-tiles">
          <DeskTile
            variant="blank"
            eyebrow="New · untitled"
            badge="+"
            title={creating ? 'Opening…' : 'Blank page'}
            hint="Start from a clean sheet"
            onClick={onCreate}
            disabled={creating}
            busy={creating}
          />
          <DeskTile
            variant="import"
            eyebrow="From your computer"
            badge={
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title={importing ? 'Importing…' : 'Import a file'}
            hint=".txt, .md or .docx up to 2 MB, or drop it anywhere"
            onClick={onImport}
            disabled={Boolean(importing)}
            busy={Boolean(importing)}
          >
            {/* torn-paper snippet overlapping the sheet, like a clipping pinned on top */}
            <span className="desk-snippet" aria-hidden="true">
              <span className="desk-snippet-name">notes.md</span>
              <i style={{ width: '90%' }} />
              <i className="is-mark" style={{ width: '64%' }} />
              <i style={{ width: '78%' }} />
            </span>
          </DeskTile>
          <span className="desk-note" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>

      <button type="button" className="desk-scroll" onClick={onScrollDown} aria-label="Jump to your documents">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
