import { describe, it, expect } from 'vitest';
import { getRole, can } from '../lib/access.js';

const OWNER = 'u-owner';
const EDITOR = 'u-editor';
const VIEWER = 'u-viewer';
const STRANGER = 'u-stranger';

const doc = { id: 'd1', owner_id: OWNER };
const shares = [
  { document_id: 'd1', user_id: EDITOR, role: 'editor' },
  { document_id: 'd1', user_id: VIEWER, role: 'viewer' },
  // a share on a DIFFERENT document must never grant access to d1
  { document_id: 'd2', user_id: STRANGER, role: 'editor' },
];

describe('getRole', () => {
  it('identifies the owner even without a share row', () => {
    expect(getRole(OWNER, doc, shares)).toBe('owner');
  });
  it('returns the shared role for collaborators', () => {
    expect(getRole(EDITOR, doc, shares)).toBe('editor');
    expect(getRole(VIEWER, doc, shares)).toBe('viewer');
  });
  it('ignores shares that belong to other documents', () => {
    expect(getRole(STRANGER, doc, shares)).toBeNull();
  });
  it('returns null for missing user or document', () => {
    expect(getRole(null, doc, shares)).toBeNull();
    expect(getRole(OWNER, null, shares)).toBeNull();
  });
});

describe('can: full permission matrix', () => {
  const matrix = {
    owner: { read: true, write: true, share: true, delete: true },
    editor: { read: true, write: true, share: false, delete: false },
    viewer: { read: true, write: false, share: false, delete: false },
    null: { read: false, write: false, share: false, delete: false },
  };

  for (const [role, actions] of Object.entries(matrix)) {
    for (const [action, expected] of Object.entries(actions)) {
      it(`${role} ${expected ? 'can' : 'cannot'} ${action}`, () => {
        expect(can(role === 'null' ? null : role, action)).toBe(expected);
      });
    }
  }

  it('throws on an unknown action instead of silently allowing it', () => {
    expect(() => can('owner', 'publish')).toThrow(/unknown action/i);
  });
});
