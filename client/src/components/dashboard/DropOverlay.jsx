import Shapes from '../Shapes.jsx';

const SHAPES = [
  { kind: 'square', top: '16%', left: '12%', color: 'rgba(242, 236, 152, 0.6)', size: 34, rotate: 12 },
  { kind: 'ring', bottom: '18%', left: '20%', color: 'rgba(166, 216, 201, 0.6)', size: 46, delay: -4 },
  { kind: 'tri', top: '20%', right: '14%', color: 'rgba(255, 61, 110, 0.6)', size: 38, rotate: -10, delay: -2 },
];

/**
 * Full-screen layer shown while a file is dragged over the dashboard (mode "drag"),
 * and while a dropped/picked file is being imported (mode "busy", blocks clicks).
 * The status live region is always mounted (and visually hidden) so screen readers reliably
 * announce changes; a live region inserted together with its text is often skipped.
 */
export default function DropOverlay({ mode, fileName }) {
  const busy = mode === 'busy';
  const announcement = busy
    ? `Importing ${fileName || 'file'}…`
    : mode === 'drag'
      ? 'Drop to import a .txt, .md or .docx file up to 2 MB'
      : '';

  return (
    <>
      <p className="dash-sr" role="status" aria-live="polite">
        {announcement}
      </p>
      {mode && (
        <div className={`drop-overlay${busy ? ' is-busy' : ''}`} aria-hidden="true">
          <Shapes items={SHAPES} />
          <div className="paper drop-sheet">
            {busy ? (
              <>
                <span className="spinner drop-spinner" />
                <p className="drop-title">Importing…</p>
                <p className="drop-sub serif">{fileName ? `Turning “${fileName}” into a document` : 'One moment'}</p>
              </>
            ) : (
              <>
                <span className="drop-arrow">
                  <svg viewBox="0 0 24 24" width="28" height="28">
                    <path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="drop-title">Drop to import</p>
                <p className="drop-sub serif">.txt .md .docx up to 2 MB</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
