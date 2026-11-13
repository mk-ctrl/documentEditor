import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { api } from '../lib/api.js';
import { editorExtensions } from '../lib/editorExtensions.js';
import { useAutosave } from '../lib/useAutosave.js';
import { timeAgo } from '../lib/time.js';
import { useToast } from '../lib/toast.jsx';
import AppHeader from '../components/AppHeader.jsx';
import Toolbar from '../components/Toolbar.jsx';
import { FullPageSpinner } from '../components/RequireAuth.jsx';
import ShareDialog from '../components/ShareDialog.jsx';
import Avatar from '../components/Avatar.jsx';
import Shapes from '../components/Shapes.jsx';
import SaveIndicator from '../components/editor/SaveIndicator.jsx';
import DocOutline from '../components/editor/DocOutline.jsx';
import DocStats from '../components/editor/DocStats.jsx';
import { copyText, docLink } from '../components/editor/copyText.js';
import { EyeIcon, PeopleIcon, TrashIcon } from '../components/editor/icons.jsx';

export default function EditorPage() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    api(`/documents/${id}`)
      .then((doc) => alive && setState({ status: 'ready', doc }))
      .catch((e) => alive && setState({ status: 'error', code: e.status, message: e.message }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.status === 'loading') return <FullPageSpinner />;
  if (state.status === 'error') return <DocError code={state.code} message={state.message} />;
  return <DocEditor key={state.doc.id} doc={state.doc} />;
}

/* ── Decorative layers ────────────────────────────────────── */

// Outline shapes on the charcoal desk behind error sheets.
const ERROR_SHAPES = [
  { kind: 'square', top: '14%', left: '9%', color: 'var(--sun)', size: 40, rotate: 12 },
  { kind: 'ring', top: '22%', right: '11%', color: 'var(--mint)', size: 46 },
  { kind: 'tri', bottom: '16%', left: '14%', color: 'var(--coral)', size: 44, rotate: -8 },
  { kind: 'square', bottom: '12%', right: '16%', color: 'rgba(255,255,255,.18)', size: 28, rotate: -20 },
];

// Shapes on the mint band at the top of the desk: they frame the sheet without touching the text.
const BAND_SHAPES = [
  { kind: 'square', top: '18%', left: '4%', color: 'var(--sun)', size: 34, rotate: 14, delay: -1 },
  { kind: 'ring', top: '52%', left: '12%', color: 'rgba(255,255,255,.7)', size: 26, delay: -4 },
  { kind: 'tri', top: '24%', right: '6%', color: 'rgba(31,77,65,.16)', size: 40, rotate: 8, delay: -2 },
  { kind: 'ring', top: '62%', right: '13%', color: 'var(--sun)', size: 34, delay: -6 },
];

// Very faint shapes fixed to the viewport edges, far from the column of text.
const DESK_SHAPES = [
  { kind: 'ring', top: '58%', left: '2.5%', color: 'rgba(201,162,126,.28)', size: 30, delay: -3 },
  { kind: 'square', top: '82%', right: '3%', color: 'rgba(140,202,184,.35)', size: 26, rotate: 20, delay: -7 },
  { kind: 'tri', top: '74%', left: '6%', color: 'rgba(255,61,110,.14)', size: 28, rotate: -12, delay: -5 },
];

const ERROR_COPY = {
  403: {
    kicker: 'Knock, knock.',
    title: 'This page is private',
    body: "You don't have access to this document. Ask its owner to share it with you.",
  },
  404: {
    kicker: 'This sheet has wandered off.',
    title: 'Document not found',
    body: 'It may have been deleted, or the link is wrong.',
  },
};

function DocError({ code, message }) {
  const copy = ERROR_COPY[code] ?? { kicker: 'A smudge on the page.', title: 'Something went wrong', body: message };
  return (
    <div className="app">
      <AppHeader />
      <main className="doc-error">
        <Shapes items={ERROR_SHAPES} />
        <div className="sheet-stack sheet-stack-sm">
          <div className="paper error-sheet">
            <p className="error-kicker serif">{copy.kicker}</p>
            <h1>{copy.title}</h1>
            <p className="error-body">{copy.body}</p>
            {/* grey "text lines", like the paper mockups on the reference site */}
            <div className="error-lines" aria-hidden="true">
              <span style={{ width: '92%' }} />
              <span className="is-marked" style={{ width: '64%' }} />
              <span style={{ width: '78%' }} />
            </div>
            <Link className="btn btn-ink" to="/">
              Back to your desk
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Editor ───────────────────────────────────────────────── */

function DocEditor({ doc }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const canWrite = doc.role === 'owner' || doc.role === 'editor';
  const isOwner = doc.role === 'owner';
  const { status, error, savedAt, queue, flush } = useAutosave(doc.id);
  const [title, setTitle] = useState(doc.title);
  const [deleting, setDeleting] = useState(false);
  const [people, setPeople] = useState({ owner: doc.owner, people: [] });
  const [shareOpen, setShareOpen] = useState(false);
  const titleRef = useRef(null);
  const shareBtnRef = useRef(null);

  useEffect(() => {
    api(`/documents/${doc.id}/shares`)
      .then(setPeople)
      .catch(() => {});
  }, [doc.id]);

  const editor = useEditor({
    extensions: editorExtensions,
    content: doc.content,
    editable: canWrite,
    onUpdate: ({ editor: e }) => queue({ content: e.getJSON() }),
  });

  // New documents: select the title so the user can type a name straight away.
  useEffect(() => {
    if (location.state?.isNew && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
      // Clear the flag so a page refresh doesn't re-select the title.
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  // Ctrl/Cmd+S saves immediately instead of opening the browser's save dialog,
  // and confirms with a toast once everything is stored.
  const statusRef = useRef(status);
  statusRef.current = status;
  const manualSave = useRef(false);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!canWrite) return;
        if (statusRef.current === 'saved') toast('All changes saved', { tone: 'success' });
        else manualSave.current = true;
        flush();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flush, canWrite, toast]);

  // React to save-state transitions: confirm a manual save, and surface failures as a toast.
  const prevStatus = useRef(status);
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if (status === 'saved' && manualSave.current) {
      manualSave.current = false;
      toast('All changes saved', { tone: 'success' });
    }
    if (status === 'error' && prev !== 'error') {
      manualSave.current = false;
      toast(`Couldn't save: ${error || 'please retry'}`, { tone: 'error', duration: 5000 });
    }
  }, [status, error, toast]);

  function onTitleChange(e) {
    const value = e.target.value;
    setTitle(value);
    if (value.trim()) queue({ title: value.trim().slice(0, 200) });
  }

  function onTitleBlur() {
    if (!title.trim()) {
      setTitle('Untitled document');
      queue({ title: 'Untitled document' });
    }
  }

  async function onDelete() {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await api(`/documents/${doc.id}`, { method: 'DELETE' });
      navigate('/', { replace: true });
    } catch (e) {
      setDeleting(false);
      toast(`Couldn't delete: ${e.message}`, { tone: 'error', duration: 5000 });
    }
  }

  async function onCopyLink() {
    const url = docLink(doc.id);
    if (await copyText(url)) toast('Link copied', { tone: 'success' });
    else toast(`Couldn't copy. The link is ${url}`, { tone: 'error', duration: 6000 });
  }

  function closeShare() {
    setShareOpen(false);
    // hand focus back to the button that opened the dialog
    requestAnimationFrame(() => shareBtnRef.current?.focus());
  }

  const ownerName = isOwner ? 'you' : doc.owner?.name || doc.owner?.email || 'the owner';
  const ownerLabel = isOwner ? 'You' : ownerName;
  const editedAt = savedAt || doc.updated_at;

  return (
    <div className={`app editor-app editor-page role-${doc.role}`}>
      <AppHeader>
        <Link to="/" className="btn btn-ghost btn-sm desk-link" onClick={flush}>
          ← Desk
        </Link>
      </AppHeader>

      <div className="editor-bar">
        <SaveIndicator status={status} error={error} canWrite={canWrite} onRetry={flush} />
        {canWrite && editor && <Toolbar editor={editor} />}
        <div className="editor-bar-right">
          <div className="avatar-stack" role="group" aria-label="People with access">
            {[people.owner, ...people.people].filter(Boolean).slice(0, 5).map((p, i) => (
              <span className="avatar-pop" key={p.email} style={{ '--i': i }}>
                <Avatar name={p.name} email={p.email} size={28} />
              </span>
            ))}
          </div>
          {!isOwner && <span className={`chip chip-${doc.role}`}>{doc.role}</span>}
          {isOwner && (
            <>
              <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={deleting}>
                <TrashIcon width={15} height={15} />
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button ref={shareBtnRef} className="btn btn-mint btn-sm" onClick={() => setShareOpen(true)}>
                <PeopleIcon width={15} height={15} />
                Share
              </button>
            </>
          )}
        </div>
      </div>

      <main className="desk">
        {/* decoration: a mint band the sheet floats over, plus faint shapes pinned to the viewport edges */}
        <div className="desk-band" aria-hidden="true">
          <Shapes items={BAND_SHAPES} />
        </div>
        <div className="desk-decor" aria-hidden="true">
          <Shapes items={DESK_SHAPES} />
        </div>

        <div className="desk-grid">
          <div className="desk-rail desk-rail-left">
            <DocOutline editor={editor} />
          </div>

          <div className="desk-center">
            {!canWrite && (
              <div className="viewer-banner">
                <span className="viewer-banner-icon" aria-hidden="true">
                  <EyeIcon />
                </span>
                <div>
                  <strong>You're reading {ownerName}'s document</strong>
                  <p className="readonly-note">
                    You can read this document, but only its owner or an editor can change it.
                  </p>
                </div>
              </div>
            )}

            <div className="sheet-stack">
              <article className="paper sheet">
                <p className="sheet-eyebrow">
                  Owned by {ownerName} · Edited {timeAgo(editedAt)}
                </p>
                <input
                  ref={titleRef}
                  className="sheet-title"
                  value={title}
                  onChange={onTitleChange}
                  onBlur={onTitleBlur}
                  readOnly={!canWrite}
                  maxLength={200}
                  aria-label="Document title"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      editor?.commands.focus('start');
                    }
                  }}
                />
                <span className="sheet-rule" aria-hidden="true" />
                <EditorContent editor={editor} className="sheet-body" />
              </article>
            </div>
          </div>

          <div className="desk-rail desk-rail-right">
            <DocStats
              editor={editor}
              role={doc.role}
              ownerName={ownerLabel}
              editedAt={editedAt}
              people={people}
              onCopyLink={onCopyLink}
            />
          </div>
        </div>
      </main>

      {shareOpen && (
        <ShareDialog docId={doc.id} title={title} people={people} onChange={setPeople} onClose={closeShare} />
      )}
    </div>
  );
}
