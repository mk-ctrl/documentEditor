import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../lib/time.js';

// Faux text lines give each card the look of a written page (widths vary per document).
function Lines({ seed }) {
  const widths = [92, 100, 78, 96, 64, 88, 100, 54];
  const offset = [...seed].reduce((n, c) => n + c.charCodeAt(0), 0) % widths.length;
  return (
    <div className="card-lines" aria-hidden="true">
      {widths.map((_, i) => (
        <span key={i} style={{ width: `${widths[(i + offset) % widths.length]}%` }} />
      ))}
    </div>
  );
}

export default function DocCard({ doc, shared = false }) {
  return (
    <Link to={`/d/${doc.id}`} className="paper doc-card">
      <p className="card-eyebrow">Edited {timeAgo(doc.updated_at)}</p>
      <h3 className="card-title">{doc.title}</h3>
      <Lines seed={doc.id} />
      <div className="card-foot">
        {shared ? (
          <>
            <span className="card-owner">
              <Avatar name={doc.owner?.name} email={doc.owner?.email} size={22} />
              {doc.owner?.name?.split(' ')[0]}
            </span>
            <span className={`chip chip-${doc.role}`}>{doc.role}</span>
          </>
        ) : (
          <span className="card-meta">
            {doc.share_count > 0 ? `Shared with ${doc.share_count}` : 'Only you'}
          </span>
        )}
      </div>
    </Link>
  );
}
