import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import Avatar from './Avatar.jsx';

/** Owner-only dialog: invite by email as viewer/editor, change roles, remove access. */
export default function ShareDialog({ docId, title, people, onChange, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function run(fn) {
    setError('');
    setBusy(true);
    try {
      onChange(await fn());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function invite(e) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    const ok = await run(() => api(`/documents/${docId}/shares`, { method: 'POST', body: { email: value, role } }));
    if (ok) setEmail('');
  }

  const changeRole = (person, newRole) =>
    run(() => api(`/documents/${docId}/shares`, { method: 'POST', body: { email: person.email, role: newRole } }));
  const remove = (person) => run(() => api(`/documents/${docId}/shares/${person.id}`, { method: 'DELETE' }));

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="paper modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <p className="eyebrow">Share</p>
        <h2 id="share-title">{title}</h2>

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
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Access level">
            <option value="viewer">Can view</option>
            <option value="editor">Can edit</option>
          </select>
          <button className="btn btn-mint" type="submit" disabled={busy || !email.trim()}>
            Share
          </button>
        </form>
        <p className="hint serif">Try bob@example.com or carol@example.com</p>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <h3 className="people-title">People with access</h3>
        <ul className="people">
          {people.owner && (
            <li>
              <Avatar name={people.owner.name} email={people.owner.email} size={32} />
              <div className="who">
                <strong>{people.owner.name}</strong>
                <span>{people.owner.email}</span>
              </div>
              <span className="chip chip-owner">Owner</span>
            </li>
          )}
          {people.people.map((p) => (
            <li key={p.id}>
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
              <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => remove(p)} aria-label={`Remove ${p.name}`}>
                Remove
              </button>
            </li>
          ))}
          {people.people.length === 0 && <li className="people-empty serif">Only you can see this document.</li>}
        </ul>

        <div className="modal-actions">
          <button className="btn btn-ink" onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
