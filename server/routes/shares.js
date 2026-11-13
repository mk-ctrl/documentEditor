import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireDocAccess } from '../lib/access.js';
import { HttpError } from '../lib/httpError.js';
import { parse, shareSchema } from '../lib/validation.js';

// Mounted at /api/documents/:id/shares
const router = Router({ mergeParams: true });

async function listPeople(doc) {
  const db = supabaseAdmin();
  const [{ data: owner, error: ownerErr }, { data: shares, error: sharesErr }] = await Promise.all([
    db.from('profiles').select('id, name, email').eq('id', doc.owner_id).single(),
    db
      .from('document_shares')
      .select('role, created_at, user:profiles!document_shares_user_id_fkey(id, name, email)')
      .eq('document_id', doc.id)
      .order('created_at'),
  ]);
  if (ownerErr) throw ownerErr;
  if (sharesErr) throw sharesErr;
  return {
    owner,
    people: shares.map((s) => ({ ...s.user, role: s.role })),
  };
}

// GET → owner + everyone with access. Anyone who can read the doc can see who else can.
router.get('/', async (req, res) => {
  const { doc } = await requireDocAccess(req.user.id, req.params.id, 'read');
  res.json(await listPeople(doc));
});

// POST { email, role } → grant access, or change the role of an existing collaborator (owner only)
router.post('/', async (req, res) => {
  const { email, role } = parse(shareSchema, req.body);
  const { doc } = await requireDocAccess(req.user.id, req.params.id, 'share');
  const db = supabaseAdmin();

  const { data: target, error } = await db.from('profiles').select('id').eq('email', email).maybeSingle();
  if (error) throw error;
  if (!target) throw new HttpError(404, `No Quire account uses ${email}`);
  if (target.id === doc.owner_id) throw new HttpError(400, 'The owner already has full access');

  const { error: upsertErr } = await db
    .from('document_shares')
    .upsert({ document_id: doc.id, user_id: target.id, role }, { onConflict: 'document_id,user_id' });
  if (upsertErr) throw upsertErr;

  res.status(201).json(await listPeople(doc));
});

// DELETE /:userId → revoke access (owner only)
router.delete('/:userId', async (req, res) => {
  const { doc } = await requireDocAccess(req.user.id, req.params.id, 'share');
  const { error } = await supabaseAdmin()
    .from('document_shares')
    .delete()
    .eq('document_id', doc.id)
    .eq('user_id', req.params.userId);
  if (error) throw error;
  res.json(await listPeople(doc));
});

export default router;
