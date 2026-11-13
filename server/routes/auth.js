import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { HttpError } from '../lib/httpError.js';
import { parse, signupSchema } from '../lib/validation.js';

const router = Router();

// POST /api/auth/signup { name, email, password }
// Creates a confirmed Supabase user server-side, so there's no email-confirmation step to wait on
// (an internal tool for a demo). The on_auth_user_created trigger creates the profile row.
// The client then signs in normally with supabase-js.
router.post('/signup', async (req, res) => {
  const { name, email, password } = parse(signupSchema, req.body);

  const { data, error } = await supabaseAdmin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    if (error.status === 422 || /already (been )?registered|already exists/i.test(error.message)) {
      throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
    }
    if (/password/i.test(error.message)) throw new HttpError(400, error.message);
    throw error;
  }

  res.status(201).json({ id: data.user.id, email, name });
});

export default router;
