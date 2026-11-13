import { useEffect, useRef, useState } from 'react';
import { EyeIcon } from './icons.jsx';

const STATUS_LABEL = {
  saved: 'Saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Not saved',
};

/**
 * Autosave status pill: "Saved / Unsaved changes / Saving… / Not saved + Retry", or "View only".
 * Each time the status turns into "saved" after a save, the check mark draws itself in.
 */
export default function SaveIndicator({ status, error, canWrite, onRetry }) {
  // Counts transitions into "saved" so the check <svg> remounts and replays its draw animation.
  const [savedTimes, setSavedTimes] = useState(0);
  const prev = useRef(status);
  useEffect(() => {
    if (status === 'saved' && prev.current !== 'saved') setSavedTimes((n) => n + 1);
    prev.current = status;
  }, [status]);

  const shown = canWrite ? status : 'readonly';

  return (
    <div className={`save-status is-${shown}`} role="status" aria-live="polite">
      <span className="save-icon" aria-hidden="true">
        {shown === 'saved' && (
          <svg key={savedTimes} viewBox="0 0 16 16" className={savedTimes > 0 ? 'is-fresh' : ''}>
            <path d="M4.2 8.4l2.5 2.4 5.1-5.4" />
          </svg>
        )}
        {shown === 'error' && <b>!</b>}
        {shown === 'readonly' && <EyeIcon width={14} height={14} />}
      </span>
      <span className="save-label" key={shown}>
        {canWrite ? STATUS_LABEL[status] : 'View only'}
      </span>
      {canWrite && status === 'error' && (
        <>
          <span className="save-error">· {error}</span>
          <button className="btn btn-ghost btn-sm" onClick={onRetry}>
            Retry
          </button>
        </>
      )}
    </div>
  );
}
