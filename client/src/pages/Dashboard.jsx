import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { htmlToDoc } from '../lib/editorExtensions.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/toast.jsx';
import { greeting, timeAgo } from '../lib/time.js';
import AppHeader from '../components/AppHeader.jsx';
import DocCard from '../components/DocCard.jsx';
import DeskHero from '../components/dashboard/DeskHero.jsx';
import DashToolbar from '../components/dashboard/DashToolbar.jsx';
import Shelf from '../components/dashboard/Shelf.jsx';
import EmptyShelf from '../components/dashboard/EmptyShelf.jsx';
import DropOverlay from '../components/dashboard/DropOverlay.jsx';
import Finale from '../components/dashboard/Finale.jsx';
import { useFileDrop } from '../components/dashboard/useFileDrop.js';

const ACCEPT = '.txt,.md,.markdown,.docx';
const MAX_BYTES = 2 * 1024 * 1024;

const MINT_SHAPES = [
  { kind: 'ring', top: '10%', right: '6%', color: 'rgba(255, 255, 255, 0.55)', size: 54 },
  { kind: 'square', bottom: '12%', left: '3%', color: 'rgba(242, 236, 152, 0.9)', size: 30, rotate: 18, delay: -4 },
  { kind: 'tri', top: '46%', right: '2%', color: 'rgba(31, 77, 65, 0.16)', size: 34, rotate: -8, delay: -2 },
];

// Soft yellow outlines on the light-grey shelf, like the reference's grey panels.
const MINE_SHAPES = [
  { kind: 'square', top: '9%', right: '5%', color: 'rgba(226, 216, 92, 0.7)', size: 40, rotate: 14 },
  { kind: 'ring', bottom: '8%', left: '2%', color: 'rgba(226, 216, 92, 0.55)', size: 46, delay: -5 },
];

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function sortDocs(list, sort) {
  const out = [...list];
  if (sort === 'title') {
    out.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
  } else {
    out.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  }
  return out;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(''); // file name while an import is in flight
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const fileRef = useRef(null);
  const searchRef = useRef(null);
  const shelvesRef = useRef(null);

  useEffect(() => {
    api('/documents')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  // "/" jumps to the search box (unless you're already typing somewhere).
  useEffect(() => {
    function onKey(e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  // Upload → server converts to HTML → editor schema sanitizes it → create a normal document.
  // Shared by the file picker and drag & drop.
  async function importFile(file) {
    if (!file) return;
    if (importing) {
      toast('An import is already running.', { tone: 'neutral' });
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPT.split(',').includes(ext)) {
      toast(`“${file.name}” isn't supported. Import a .txt, .md or .docx file.`, { tone: 'error', duration: 5000 });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast(`“${file.name}” is larger than 2 MB.`, { tone: 'error', duration: 5000 });
      return;
    }
    setImporting(file.name);
    try {
      const form = new FormData();
      form.append('file', file);
      const { title, html } = await api('/documents/import', { method: 'POST', body: form });
      const doc = await api('/documents', { method: 'POST', body: { title, content: htmlToDoc(html) } });
      toast(`Imported “${doc.title || title}”`, { tone: 'success' });
      navigate(`/d/${doc.id}`);
    } catch (err) {
      toast(`Import failed: ${err.message}`, { tone: 'error', duration: 6000 });
      setImporting('');
    }
  }

  function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    importFile(file);
  }

  const dragging = useFileDrop(importFile);

  function scrollToShelves() {
    const el = shelvesRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const top = el.getBoundingClientRect().top + window.scrollY - 64; // sit just under the sticky header
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }

  // Client-side filter + sort.
  const q = query.trim().toLowerCase();
  const view = useMemo(() => {
    if (!data) return null;
    const match = (d) => !q || (d.title || '').toLowerCase().includes(q);
    return {
      owned: sortDocs(data.owned.filter(match), sort),
      shared: sortDocs(data.shared.filter(match), sort),
    };
  }, [data, q, sort]);

  const counts = view
    ? { all: view.owned.length + view.shared.length, mine: view.owned.length, shared: view.shared.length }
    : { all: '–', mine: '–', shared: '–' };

  const stats = useMemo(() => {
    if (error && !data) return 'Your documents could not be loaded.';
    if (!data) return 'Gathering your pages…';
    const all = [...data.owned, ...data.shared];
    const latest = all.reduce((m, d) => (!m || d.updated_at > m ? d.updated_at : m), null);
    const parts = [plural(data.owned.length, 'document'), `${data.shared.length} shared with you`];
    if (latest) parts.push(`last edited ${timeAgo(latest)}`);
    return parts.join(' · ');
  }, [data, error]);

  const firstName = profile?.name ? `, ${profile.name.split(' ')[0]}` : '';
  const me = { name: profile?.name, email: user?.email };
  const showMine = tab !== 'shared';
  const showShared = tab !== 'mine';
  const noResults =
    view && q && (!showMine || view.owned.length === 0) && (!showShared || view.shared.length === 0);

  const pickFile = () => fileRef.current?.click();

  return (
    <div className="app dash-app">
      <AppHeader tone="desk">
        <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={onPick} />
        <button
          className="btn btn-ghost btn-sm hdr-btn"
          onClick={pickFile}
          disabled={Boolean(importing)}
          title="Import a .txt, .md or .docx file (max 2 MB) as a new document"
        >
          <span className="hdr-icon" aria-hidden="true">
            ↑
          </span>
          <span className="hdr-label">{importing ? 'Importing…' : 'Import file'}</span>
        </button>
        <button className="btn btn-mint btn-sm hdr-btn" onClick={createDoc} disabled={creating}>
          <span className="hdr-icon" aria-hidden="true">
            +
          </span>
          <span className="hdr-label">{creating ? 'Creating…' : 'New document'}</span>
        </button>
      </AppHeader>

      {/* inert while importing: the busy overlay blocks the mouse, this blocks the keyboard too */}
      <main className="dash" inert={Boolean(importing)}>
        <DeskHero
          greeting={`${greeting()}${firstName}`}
          stats={stats}
          onCreate={createDoc}
          onImport={pickFile}
          creating={creating}
          importing={importing}
          onScrollDown={scrollToShelves}
        />

        <div ref={shelvesRef} className="dash-bar">
          <div className="dash-wrap">
            <DashToolbar
              tab={tab}
              onTab={setTab}
              counts={counts}
              query={query}
              onQuery={setQuery}
              sort={sort}
              onSort={setSort}
              searchRef={searchRef}
            />
          </div>
        </div>

        {error && (
          <div className="dash-wrap dash-error">
            <p className="error-text" role="alert">
              {error}
            </p>
          </div>
        )}

        {!data && !error && (
          <Shelf id="loading" title="My documents" subtitle="Pulling your pages out of the drawer…" busy>
            <ul className="card-grid">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="card-slot" style={{ '--i': i }}>
                  <div className="paper doc-card skeleton" />
                </li>
              ))}
            </ul>
          </Shelf>
        )}

        {view && noResults && (
          <Shelf id="results" title="Search">
            <EmptyShelf
              kind="search"
              title={`Nothing matches “${query.trim()}”`}
              actions={
                <button type="button" className="btn btn-ink" onClick={() => setQuery('')}>
                  Clear search
                </button>
              }
            >
              Try a shorter word, or look in another tab.
            </EmptyShelf>
          </Shelf>
        )}

        {view && !noResults && showMine && (
          <Shelf
            id="mine"
            shapes={MINE_SHAPES}
            title="My documents"
            count={view.owned.length}
            subtitle="Pages you started. Yours to edit, share and re-use."
          >
            {data.owned.length === 0 ? (
              <EmptyShelf
                kind="mine"
                title="Your desk is clear"
                actions={
                  <>
                    <button type="button" className="btn btn-mint" onClick={createDoc} disabled={creating}>
                      Start a blank page
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={pickFile} disabled={Boolean(importing)}>
                      Import a file
                    </button>
                  </>
                }
              >
                Every good document starts as a blank sheet. Write one, or drop in a .txt, .md or .docx.
              </EmptyShelf>
            ) : view.owned.length === 0 ? (
              <p className="shelf-note serif">None of your titles match “{query.trim()}”.</p>
            ) : (
              <ul className="card-grid">
                {!q && (
                  <li className="card-slot" style={{ '--i': 0 }}>
                    <button className="doc-card new-card" onClick={createDoc} disabled={creating}>
                      <span className="plus" aria-hidden="true">
                        +
                      </span>
                      <span>Blank document</span>
                      <span className="new-sub serif">a clean sheet</span>
                    </button>
                  </li>
                )}
                {view.owned.map((d, i) => (
                  <li key={d.id} className="card-slot" style={{ '--i': i + 1 }}>
                    <DocCard doc={d} me={me} />
                  </li>
                ))}
              </ul>
            )}
          </Shelf>
        )}

        {view && !noResults && showShared && (
          <Shelf
            id="shared"
            tone="mint"
            shapes={MINT_SHAPES}
            title="Shared with me"
            count={view.shared.length}
            subtitle="Work other people trusted you with."
          >
            {data.shared.length === 0 ? (
              <EmptyShelf kind="shared" title="Nothing here yet">
                When someone shares a document with you, it lands on this shelf.
              </EmptyShelf>
            ) : view.shared.length === 0 ? (
              <p className="shelf-note serif">No shared titles match “{query.trim()}”.</p>
            ) : (
              <ul className="card-grid">
                {view.shared.map((d, i) => (
                  <li key={d.id} className="card-slot" style={{ '--i': i }}>
                    <DocCard doc={d} shared />
                  </li>
                ))}
              </ul>
            )}
          </Shelf>
        )}

        {data && <Finale onCreate={createDoc} creating={creating} />}
      </main>

      <DropOverlay mode={importing ? 'busy' : dragging ? 'drag' : null} fileName={importing} />
    </div>
  );
}
