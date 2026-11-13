import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

// The signed-in user's profile (name is shown in the header and on shared docs).
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .select('id, email, name')
    .eq('id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  res.json(data ?? { id: req.user.id, email: req.user.email, name: req.user.email });
});

export default router;
