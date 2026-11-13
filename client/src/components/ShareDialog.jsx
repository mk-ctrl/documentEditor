import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Avatar from './Avatar.jsx';
import Shapes from './Shapes.jsx';
import { copyText, docLink } from './editor/copyText.js';
import { LinkIcon, LockIcon } from './editor/icons.jsx';

const ROLE_HELP = {
  viewer: 'Viewers can read the document and see who has access.',
  editor: "Editors can change the title and text, but can't share or delete it.",
};
const ROLE_NOUN = { viewer: 'viewer', editor: 'editor' };

// Rows fade/collapse out for this long before the list drops them (matches .is-leaving in editor.css).
const LEAVE_MS = 260;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const HEADER_SHAPES = [
  { kind: 'ring', top: '18%', right: '7%', color: 'rgba(255,255,255,.55)', size: 30, delay: -2 },
  { kind: 'square', bottom: '-14px', right: '22%', color: 'rgba(242,236,152,.9)', size: 26, rotate: 14, delay: -5 },
  { kind: 'tri', top: '-10px', right: '36%', color: 'rgba(31,77,65,.14)', size: 30, rotate: -10, delay: -1 },
];

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

/** Owner-only dialog: invite by email as viewer/editor, change roles, remove access, copy the link. */
export default function ShareDialog({ docId, title, people, onChange, onClose }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(() => new Set());
  const inputRef = useRef(null);
  const dialogRef = useRef(null);

  // Latest onClose without re-binding the key handler on every parent render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      // Keep Tab / Shift+Tab inside the dialog while it's open.
      if (e.key === 'Tab' && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        // Focus can fall out of the dialog (e.g. onto <body> after a row is removed): pull it back in.
        if (!dialogRef.current.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** Runs an API call that returns the new people list; returns it (or null on failure). */
  async function run(fn) {
    setError('');
    setBusy(true);
    try {
      const next = await fn();
      onChange(next);
      return next;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  const nameOf = (person) => person?.name || person?.email;

  async function invite(e) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    const next = await run(() => api(`/documents/${docId}/shares`, { method: 'POST', body: { email: value, role } }));
    if (next) {
      setEmail('');
      const added = next.people.find((p) => p.email?.toLowerCase() === value);
      toast(`Shared with ${nameOf(added) || value} as ${ROLE_NOUN[role]}`, { tone: 'success' });
    }
  }

  async function changeRole(person, newRole) {
    const next = await run(() =>
      api(`/documents/${docId}/shares`, { method: 'POST', body: { email: person.email, role: newRole } }),
    );
    if (next) toast(`${nameOf(person)} can now ${newRole === 'editor' ? 'edit' : 'view'}`, { tone: 'success' });
  }

  async function remove(person) {
    setLeaving((s) => new Set(s).add(person.id));
    // Let the row's exit animation finish before the list re-renders without it.
    const next = await run(async () => {
      const [res] = await Promise.all([
        api(`/documents/${docId}/shares/${person.id}`, { method: 'DELETE' }),
        wait(reducedMotion() ? 0 : LEAVE_MS),
      ]);
      return res;
    });
    setLeaving((s) => {
      const copy = new Set(s);
      copy.delete(person.id);
      return copy;
    });
    if (next) {
      toast(`Removed ${nameOf(person)}`, { tone: 'neutral' });
      // The focused Remove button just left the DOM; give keyboard users a sensible place to continue.
      inputRef.current?.focus();
    }
  }

  async function copyLink() {
    const url = docLink(docId);
    if (await copyText(url)) toast('Link copied', { tone: 'success' });
    else toast(`Couldn't copy. The link is ${url}`, { tone: 'error', duration: 6000 });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section
        ref={dialogRef}
        className="paper modal share-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <header className="share-head">
          <Shapes items={HEADER_SHAPES} />
          <p className="eyebrow">Share</p>
          <h2 id="share-title">{title}</h2>
          <p className="share-sub">Invite people to read or write along with you.</p>
        </header>

        <div className="share-body">
          <form className="share-form" onSubmit={invite} noValidate>
            <input
              ref={inputRef}
              className="input"
              type="email"
              placeholder="Add people by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
            <select
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Access level"
              aria-describedby="share-role-help"
            >
              <option value="viewer">Can view</option>
              <option value="editor">Can edit</option>
            </select>
            <button className="btn btn-mint" type="submit" disabled={busy || !email.trim()}>
              Share
            </button>
          </form>
          <p id="share-role-help" className="role-help" key={role}>
            <span className={`role-dot role-dot-${role}`} aria-hidden="true" />
            {ROLE_HELP[role]}
          </p>
          <p className="hint serif">Try bob@example.com or carol@example.com</p>

          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}

          <h3 className="people-title">People with access</h3>
          <ul className="people">
            {people.owner && (
              <li style={{ '--i': 0 }}>
                <Avatar name={people.owner.name} email={people.owner.email} size={32} />
                <div className="who">
                  <strong>{people.owner.name}</strong>
                  <span>{people.owner.email}</span>
                </div>
                <span className="chip chip-owner">Owner</span>
              </li>
            )}
            {people.people.map((p, i) => (
              <li key={p.id} style={{ '--i': i + 1 }} className={leaving.has(p.id) ? 'is-leaving' : ''}>
                <Avatar name={p.name} email={p.email} size={32} />
                <div className="who">
                  <strong>{p.name}</strong>
                  <span>{p.email}</span>
                </div>
                <select
                  className="select select-sm"
                  value={p.role}
                  disabled={busy}
                  onChange={(e) => changeRole(p, e.target.value)}
                  aria-label={`Access for ${p.name}`}
                >
                  <option value="viewer">Can view</option>
                  <option value="editor">Can edit</option>
                </select>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={busy}
                  onClick={() => remove(p)}
                  aria-label={`Remove ${p.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
            {people.people.length === 0 && <li className="people-empty serif">Only you can see this document.</li>}
          </ul>

          <div className="share-link">
            <LockIcon className="share-link-icon" />
            <p className="serif">Only people with access can open this link.</p>
            <button type="button" className="btn btn-ghost btn-sm share-copy" onClick={copyLink}>
              <LinkIcon width={15} height={15} />
              Copy link
            </button>
          </div>

          <div className="modal-actions">
            <button className="btn btn-ink" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
