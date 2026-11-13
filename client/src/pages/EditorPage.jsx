import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { api } from '../lib/api.js';
import { useAutosave } from '../lib/useAutosave.js';
import { timeAgo } from '../lib/time.js';
import AppHeader from '../components/AppHeader.jsx';
import Toolbar from '../components/Toolbar.jsx';
import { FullPageSpinner } from '../components/RequireAuth.jsx';

// The editor's feature set, kept to what the product supports. Also used to sanitize imported HTML.
export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    code: false,
    codeBlock: false,
    link: false,
  }),
  Placeholder.configure({ placeholder: 'Start writing…' }),
];

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

function DocError({ code, message }) {
  const title = code === 403 ? 'This page is private' : code === 404 ? 'Document not found' : 'Something went wrong';
  const body =
    code === 403
      ? "You don't have access to this document. Ask its owner to share it with you."
      : code === 404
        ? 'It may have been deleted, or the link is wrong.'
        : message;
  return (
    <div className="app">
      <AppHeader />
      <main className="center-state" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="paper error-sheet">
          <h1>{title}</h1>
          <p>{body}</p>
          <Link className="btn btn-ink" to="/">
            Back to your desk
          </Link>
        </div>
      </main>
    </div>
  );
}

const STATUS_LABEL = {
  saved: 'Saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Not saved',
};

function DocEditor({ doc }) {
  const navigate = useNavigate();
  const location = useLocation();
  const canWrite = doc.role === 'owner' || doc.role === 'editor';
  const isOwner = doc.role === 'owner';
  const { status, error, savedAt, queue, flush } = useAutosave(doc.id);
  const [title, setTitle] = useState(doc.title);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef(null);

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

  // Ctrl/Cmd+S saves immediately instead of opening the browser's save dialog.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flush();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flush]);

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
      window.alert(e.message);
    }
  }

  const ownerName = isOwner ? 'you' : doc.owner?.name || doc.owner?.email;

  return (
    <div className="app editor-app">
      <AppHeader>
        <Link to="/" className="btn btn-ghost btn-sm" onClick={flush}>
          ← Desk
        </Link>
      </AppHeader>

      <div className="editor-bar">
        <div className={`save-status is-${status}`} role="status" aria-live="polite">
          <span className="dot" />
          {canWrite ? STATUS_LABEL[status] : 'View only'}
          {status === 'error' && (
            <>
              <span className="save-error">· {error}</span>
              <button className="btn btn-ghost btn-sm" onClick={flush}>
                Retry
              </button>
            </>
          )}
        </div>
        {canWrite && editor && <Toolbar editor={editor} />}
        <div className="editor-bar-right">
          {!isOwner && <span className={`chip chip-${doc.role}`}>{doc.role}</span>}
          {isOwner && (
            <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      <main className="desk">
        {!canWrite && (
          <p className="readonly-note">
            You can read this document, but only its owner or an editor can change it.
          </p>
        )}
        <article className="paper sheet">
          <p className="sheet-eyebrow">
            Owned by {ownerName} · Edited {timeAgo(savedAt || doc.updated_at)}
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
          <EditorContent editor={editor} className="sheet-body" />
        </article>
      </main>
    </div>
  );
}
