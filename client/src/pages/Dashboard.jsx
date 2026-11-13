import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { htmlToDoc } from '../lib/editorExtensions.js';

const ACCEPT = '.txt,.md,.markdown,.docx';
const MAX_BYTES = 2 * 1024 * 1024;
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
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  // Upload → server converts to HTML → editor schema sanitizes it → create a normal document.
  async function importFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setError('');
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPT.split(',').includes(ext)) {
      setError(`"${file.name}" isn't supported. Import a .txt, .md or .docx file.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`"${file.name}" is larger than 2 MB.`);
      return;
    }
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { title, html } = await api('/documents/import', { method: 'POST', body: form });
      const doc = await api('/documents', { method: 'POST', body: { title, content: htmlToDoc(html) } });
      navigate(`/d/${doc.id}`);
    } catch (err) {
      setError(err.message);
      setImporting(false);
    }
  }

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
        <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={importFile} />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          title="Import a .txt, .md or .docx file (max 2 MB) as a new document"
        >
          {importing ? 'Importing…' : '↑ Import file'}
        </button>
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
          <p className="dash-sub serif">
            Start a blank page, or import a <b>.txt</b>, <b>.md</b> or <b>.docx</b> file (up to 2 MB) as a new
            editable document.
          </p>
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
