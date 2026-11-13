import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const DELAY_MS = 800;
const hasKeys = (o) => Object.keys(o).length > 0;

/**
 * Debounced autosave for a document.
 *   queue({ title }) / queue({ content }) merges changes into a pending patch,
 *   and 800ms after the last change the patch is PATCHed to the API.
 * Status: 'saved' | 'dirty' | 'saving' | 'error'. Failed patches are kept and retried by flush().
 * Only one request is in flight at a time; changes made during a save go out right after it.
 */
export function useAutosave(docId) {
  const [status, setStatus] = useState('saved');
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const pending = useRef({});
  const inFlight = useRef(false);
  const timer = useRef(null);
  const flushRef = useRef(null);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (inFlight.current || !hasKeys(pending.current)) return;

    const body = pending.current;
    pending.current = {};
    inFlight.current = true;
    setStatus('saving');
    try {
      const res = await api(`/documents/${docId}`, { method: 'PATCH', body });
      setSavedAt(res.updated_at);
      setError('');
      inFlight.current = false;
      if (hasKeys(pending.current)) flushRef.current();
      else setStatus('saved');
    } catch (e) {
      // keep the failed changes (newer edits win) so a retry sends everything
      pending.current = { ...body, ...pending.current };
      inFlight.current = false;
      setError(e.message);
      setStatus('error');
    }
  }, [docId]);
  flushRef.current = flush;

  const queue = useCallback((patch) => {
    pending.current = { ...pending.current, ...patch };
    setStatus((s) => (s === 'saving' ? s : 'dirty'));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flushRef.current(), DELAY_MS);
  }, []);

  // Warn before closing the tab with unsaved changes; save on unmount (navigating away in-app).
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (hasKeys(pending.current) || inFlight.current) {
        flushRef.current();
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      flushRef.current();
    };
  }, []);

  return { status, error, savedAt, queue, flush };
}
