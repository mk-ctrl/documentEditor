import { createClient } from '@supabase/supabase-js';

// Browser client: uses the publishable (anon) key and is used for LOGIN ONLY.
// All document data goes through our Express API, and RLS blocks direct table access from here.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env file.');
}

export const supabase = createClient(url, key);
