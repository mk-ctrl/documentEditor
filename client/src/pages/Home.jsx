import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Phase 0 placeholder: proves the React app, the /api proxy and the database are all wired up.
export default function Home() {
  const [status, setStatus] = useState({ state: 'loading' });

  useEffect(() => {
    api('/health')
      .then((data) => setStatus({ state: 'ok', data }))
      .catch((err) => setStatus({ state: 'error', message: err.message }));
  }, []);

  return (
    <main className="placeholder">
      <h1>Docs</h1>
      <p>Scaffold is live.</p>
      <p className="status">
        API:{' '}
        {status.state === 'loading' && 'checking…'}
        {status.state === 'ok' && `ok · database ${status.data.db ? 'connected' : 'unreachable'}`}
        {status.state === 'error' && `error · ${status.message}`}
      </p>
    </main>
  );
}
