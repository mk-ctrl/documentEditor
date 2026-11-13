import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

// Liveness check + a tiny real query. The daily Vercel cron hits this to keep the
// free Supabase project from pausing due to inactivity.
router.get('/', async (_req, res) => {
  let db = false;
  try {
    // A real 1-row read. (A `head: true` count query returns 204 even when the table is missing.)
    const { error } = await supabaseAdmin().from('documents').select('id').limit(1);
    db = !error;
  } catch {
    db = false;
  }
  res.status(db ? 200 : 503).json({ ok: db, db });
});

export default router;
