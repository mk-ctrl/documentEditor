import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { greeting } from '../lib/time.js';
import AppHeader from '../components/AppHeader.jsx';
import DocCard from '../components/DocCard.jsx';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api('/documents')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  async function createDoc() {
    setCreating(true);
    try {
      const doc = await api('/documents', { method: 'POST', body: {} });
      navigate(`/d/${doc.id}`, { state: { isNew: true } });
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  }

  return (
    <div className="app">
      <AppHeader>
        <button className="btn btn-mint btn-sm" onClick={createDoc} disabled={creating}>
          {creating ? 'Creating…' : '+ New document'}
        </button>
      </AppHeader>

      <main className="dashboard">
        <section className="dash-hero">
          <p className="kicker serif">
            {greeting()}
            {profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </p>
          <h1>Your desk</h1>
        </section>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        {!data && !error && (
          <div className="doc-grid" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="paper doc-card skeleton" />
            ))}
          </div>
        )}

        {data && (
          <>
            <section className="dash-section">
              <h2 className="section-title">
                My documents <span className="count">{data.owned.length}</span>
              </h2>
              <div className="doc-grid">
                <button className="doc-card new-card" onClick={createDoc} disabled={creating}>
                  <span className="plus">+</span>
                  <span>Blank document</span>
                </button>
                {data.owned.map((d) => (
                  <DocCard key={d.id} doc={d} />
                ))}
              </div>
            </section>

            <section className="dash-section">
              <h2 className="section-title">
                Shared with me <span className="count">{data.shared.length}</span>
              </h2>
              {data.shared.length === 0 ? (
                <p className="empty serif">Nothing here yet. When someone shares a document with you, it lands on this shelf.</p>
              ) : (
                <div className="doc-grid">
                  {data.shared.map((d) => (
                    <DocCard key={d.id} doc={d} shared />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
