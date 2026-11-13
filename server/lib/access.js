import { supabaseAdmin } from './supabaseAdmin.js';
import { HttpError } from './httpError.js';

/*
  The single source of truth for "who can do what to a document".
  Every document route goes through requireDocAccess(), so permission rules live in exactly one place.

    role    │ read │ write │ share │ delete
    ────────┼──────┼───────┼───────┼───────
    owner   │  ✓   │   ✓   │   ✓   │   ✓
    editor  │  ✓   │   ✓   │       │
    viewer  │  ✓   │       │       │
    (none)  │      │       │       │
*/
export const PERMISSIONS = {
  read: ['owner', 'editor', 'viewer'],
  write: ['owner', 'editor'],
  share: ['owner'],
  delete: ['owner'],
};

/** Pure: work out a user's role on a document from the doc row and its share rows. */
export function getRole(userId, doc, shares = []) {
  if (!userId || !doc) return null;
  if (doc.owner_id === userId) return 'owner';
  const share = shares.find((s) => s.user_id === userId && s.document_id === doc.id);
  return share ? share.role : null;
}

/** Pure: is this role allowed to perform this action? */
export function can(role, action) {
  const allowed = PERMISSIONS[action];
  if (!allowed) throw new Error(`Unknown action: ${action}`);
  return role != null && allowed.includes(role);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Loads a document and the caller's role, then enforces `action`.
 * - 404 if the id is malformed or the document doesn't exist
 * - 403 if it exists but the user has no access, or their role can't do `action`
 */
export async function requireDocAccess(userId, docId, action) {
  if (!UUID_RE.test(docId)) throw new HttpError(404, 'Document not found');
  const db = supabaseAdmin();

  const { data: doc, error } = await db.from('documents').select('*').eq('id', docId).maybeSingle();
  if (error) throw error;
  if (!doc) throw new HttpError(404, 'Document not found');

  const { data: shares, error: shareErr } = await db
    .from('document_shares')
    .select('document_id, user_id, role')
    .eq('document_id', docId)
    .eq('user_id', userId);
  if (shareErr) throw shareErr;

  const role = getRole(userId, doc, shares);
  if (!role) throw new HttpError(403, "You don't have access to this document");
  if (!can(role, action)) {
    throw new HttpError(403, `As a ${role} you can't ${action} this document`);
  }
  return { doc, role };
}
