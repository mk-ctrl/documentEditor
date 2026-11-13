import { useEffect, useState } from 'react';
import { useEditorState } from '@tiptap/react';
import { timeAgo } from '../../lib/time.js';
import Avatar from '../Avatar.jsx';
import { LinkIcon } from './icons.jsx';

const WORDS_PER_MINUTE = 220;

function selectCounts({ editor }) {
  if (!editor) return { words: 0, headings: 0 };
  const { doc } = editor.state;
  const text = doc.textBetween(0, doc.content.size, ' ', ' ');
  let headings = 0;
  doc.descendants((node) => {
    if (node.type.name === 'heading') headings += 1;
    return !node.isTextblock;
  });
  return { words: (text.match(/\S+/g) || []).length, headings };
}

/** Re-render every `ms` so relative times ("2 minutes ago") don't go stale while the page is open. */
function useTick(ms) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

const ROLE_LABEL = { owner: 'Owner', editor: 'Can edit', viewer: 'Can view' };

/**
 * Document facts: word count, reading time, owner, your role, last edited, people with access.
 * Right rail on wide screens; a horizontal footer card under the sheet on smaller ones.
 */
export default function DocStats({ editor, role, ownerName, editedAt, people, onCopyLink }) {
  const { words, headings } = useEditorState({ editor, selector: selectCounts });
  useTick(30_000);
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const everyone = [people.owner, ...people.people].filter(Boolean);

  return (
    <aside className="doc-stats rail-card" aria-label="About this document">
      <p className="rail-eyebrow">This document</p>

      <div className="stat-figures">
        <div className="stat-figure">
          <strong>{words.toLocaleString()}</strong>
          <span>{words === 1 ? 'word' : 'words'}</span>
        </div>
        <div className="stat-figure">
          <strong>{words === 0 ? '0' : minutes}</strong>
          <span>min read</span>
        </div>
        <div className="stat-figure">
          <strong>{headings}</strong>
          <span>{headings === 1 ? 'section' : 'sections'}</span>
        </div>
      </div>

      <dl className="stat-list">
        <div>
          <dt>Owner</dt>
          <dd>{ownerName}</dd>
        </div>
        <div>
          <dt>Your role</dt>
          <dd>
            <span className={`chip chip-${role}`}>{ROLE_LABEL[role] ?? role}</span>
          </dd>
        </div>
        <div>
          <dt>Last edited</dt>
          <dd>{timeAgo(editedAt)}</dd>
        </div>
        <div>
          <dt>Access</dt>
          <dd className="stat-people">
            <span className="avatar-stack" aria-hidden="true">
              {everyone.slice(0, 4).map((p) => (
                <Avatar key={p.email} name={p.name} email={p.email} size={24} />
              ))}
            </span>
            {everyone.length === 1 ? 'Only the owner' : `${everyone.length} people`}
          </dd>
        </div>
      </dl>

      <button type="button" className="btn btn-ghost btn-sm stat-copy" onClick={onCopyLink}>
        <LinkIcon width={15} height={15} />
        Copy link
      </button>
    </aside>
  );
}
