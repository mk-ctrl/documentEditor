import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../lib/time.js';

// Same palette as <Avatar>, used for the anonymous "shared with" dots.
const DOT_COLORS = ['var(--mint)', 'var(--sun)', '#ffc2d1', 'var(--tan)', '#c9d6f2'];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Faux text lines give each card the look of a written page; one line is "highlighted" in yellow.
function Lines({ seed }) {
  const widths = [92, 100, 78, 96, 64, 88, 100, 54];
  const offset = seed % widths.length;
  const mark = 1 + (seed % 4);
  return (
    <div className="card-lines" aria-hidden="true">
      {widths.map((_, i) => (
        <span
          key={i}
          className={i === mark ? 'is-mark' : undefined}
          style={{ width: `${widths[(i + offset) % widths.length]}%` }}
        />
      ))}
    </div>
  );
}

/**
 * A document as a sheet of paper. Rests at a slight, stable tilt (derived from its id) and
 * straightens when hovered/focused. A coloured top edge + corner tab show your role.
 *   shared: render as a "shared with me" document (owner + role come from the API)
 *   me:     { name, email } of the signed-in user, shown as the owner of their own documents
 */
export default function DocCard({ doc, shared = false, me }) {
  const seed = hash(doc.id);
  const tilt = ((seed % 7) - 3) * 0.45; // -1.35deg … 1.35deg
  const role = shared ? doc.role : 'owner';
  const shareCount = doc.share_count ?? 0;

  return (
    <Link to={`/d/${doc.id}`} className={`paper doc-card doc-card--${role}`} style={{ '--tilt': `${tilt}deg` }}>
      <span className={`chip chip-${role} doc-card-tab`}>{role}</span>
      <p className="card-eyebrow">
        Edited <time dateTime={doc.updated_at}>{timeAgo(doc.updated_at)}</time>
      </p>
      <h3 className="card-title">{doc.title || 'Untitled document'}</h3>
      <Lines seed={seed} />
      <div className="card-foot">
        {shared ? (
          <span className="card-owner">
            <Avatar name={doc.owner?.name} email={doc.owner?.email} size={22} />
            <span className="card-owner-name">from {doc.owner?.name?.split(' ')[0] ?? 'someone'}</span>
          </span>
        ) : (
          <>
            {me && <Avatar name={me.name} email={me.email} size={22} />}
            <span className="card-meta card-share">
              {shareCount > 0 && (
                <span className="share-dots" aria-hidden="true">
                  {Array.from({ length: Math.min(shareCount, 3) }, (_, i) => (
                    <span key={i} style={{ background: DOT_COLORS[(seed + i) % DOT_COLORS.length] }} />
                  ))}
                </span>
              )}
              {shareCount > 0 ? `Shared with ${shareCount}` : 'Only you'}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
