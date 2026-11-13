import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { HttpError } from '../lib/httpError.js';

/**
 * Verifies the Supabase access token from `Authorization: Bearer <token>`
 * and puts the user on req.user = { id, email }. Responds 401 otherwise.
 */
export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Sign in required'));
  }

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data?.user) {
    return next(new HttpError(401, 'Your session has expired. Please sign in again.'));
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}
