/**
 * Friendly empty states with a small CSS illustration: a fanned stack of blank sheets.
 *   kind: 'mine' (no documents yet) | 'shared' (nothing shared) | 'search' (no matches)
 */
export default function EmptyShelf({ kind = 'mine', title, children, actions }) {
  return (
    <div className={`empty-state empty-state--${kind}`}>
      <div className="empty-art" aria-hidden="true">
        <span className="empty-sheet" />
        <span className="empty-sheet" />
        <span className="empty-sheet empty-sheet--top">
          <i />
          <i className="is-mark" />
          <i />
        </span>
        {kind === 'search' ? <span className="empty-lens" /> : <span className="empty-ring" />}
      </div>
      <div>
        <h3 className="empty-title">{title}</h3>
        <p className="empty-copy serif">{children}</p>
        {actions && <div className="empty-actions">{actions}</div>}
      </div>
    </div>
  );
}
