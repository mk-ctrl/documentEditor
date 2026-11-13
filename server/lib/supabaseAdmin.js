import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client using the SECRET (service-role) key.
// It bypasses RLS, which is why every route must check permissions with getAccess() before touching data.
// Created lazily so importing the app (e.g. in tests) doesn't crash when env vars are absent.
let client;

export function supabaseAdmin() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
