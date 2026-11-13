import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireDocAccess } from '../lib/access.js';
import { parse, createDocumentSchema, updateDocumentSchema } from '../lib/validation.js';
import multer from 'multer';
import sharesRouter from './shares.js';
import { fileToHtml, titleFromFilename, MAX_IMPORT_BYTES } from '../lib/importFile.js';
import { HttpError } from '../lib/httpError.js';

const router = Router();
router.use('/:id/shares', sharesRouter);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMPORT_BYTES, files: 1 } });

// POST /api/documents/import (multipart, field "file") → { title, html }
// The client turns the HTML into editor JSON (sanitizing it through the editor schema),
// then creates the document with the regular POST /api/documents.
router.post('/import', (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    try {
      if (err?.code === 'LIMIT_FILE_SIZE') throw new HttpError(413, 'File is too large. The limit is 2 MB.');
      if (err) throw new HttpError(400, 'Upload failed. Send one file in the "file" field.');
      if (!req.file) throw new HttpError(400, 'Choose a file to import');
      const html = await fileToHtml(req.file);
      res.json({ title: titleFromFilename(req.file.originalname), html });
    } catch (e) {
      next(e);
    }
  });
});
const LIST_FIELDS = 'id, title, owner_id, created_at, updated_at';

// GET /api/documents → { owned: [...], shared: [...] }
router.get('/', async (req, res) => {
  const db = supabaseAdmin();
  const me = req.user.id;

  const [ownedRes, sharedRes] = await Promise.all([
    db
      .from('documents')
      .select(`${LIST_FIELDS}, document_shares(count)`)
      .eq('owner_id', me)
      .order('updated_at', { ascending: false }),
    db
      .from('document_shares')
      // documents↔profiles has two paths (owner FK, and via document_shares), so name the FK explicitly.
      .select(`role, document:documents!inner(${LIST_FIELDS}, owner:profiles!documents_owner_id_fkey(name, email))`)
      .eq('user_id', me),
  ]);
  if (ownedRes.error) throw ownedRes.error;
  if (sharedRes.error) throw sharedRes.error;

  const owned = ownedRes.data.map(({ document_shares, ...d }) => ({
    ...d,
    share_count: document_shares?.[0]?.count ?? 0,
  }));
  const shared = sharedRes.data
    .map(({ role, document }) => ({ ...document, role }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  res.json({ owned, shared });
});

// POST /api/documents → new document owned by the caller
router.post('/', async (req, res) => {
  const body = parse(createDocumentSchema, req.body);
  const { data, error } = await supabaseAdmin()
    .from('documents')
    .insert({ owner_id: req.user.id, ...body })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json({ ...data, role: 'owner' });
});

// GET /api/documents/:id → document + caller's role + owner profile
router.get('/:id', async (req, res) => {
  const { doc, role } = await requireDocAccess(req.user.id, req.params.id, 'read');
  const { data: owner } = await supabaseAdmin()
    .from('profiles')
    .select('name, email')
    .eq('id', doc.owner_id)
    .maybeSingle();
  res.json({ ...doc, role, owner });
});

// PATCH /api/documents/:id → rename and/or save content (owner or editor)
router.patch('/:id', async (req, res) => {
  const body = parse(updateDocumentSchema, req.body);
  await requireDocAccess(req.user.id, req.params.id, 'write');
  const { data, error } = await supabaseAdmin()
    .from('documents')
    .update(body)
    .eq('id', req.params.id)
    .select('id, title, updated_at')
    .single();
  if (error) throw error;
  res.json(data);
});

// DELETE /api/documents/:id → owner only (shares cascade)
router.delete('/:id', async (req, res) => {
  await requireDocAccess(req.user.id, req.params.id, 'delete');
  const { error } = await supabaseAdmin().from('documents').delete().eq('id', req.params.id);
  if (error) throw error;
  res.status(204).end();
});

export default router;
