import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';
import { api, setTokenProvider, setUnauthorizedHandler } from './api.js';

// Every API call carries the current Supabase access token (refreshed automatically by supabase-js).
setTokenProvider(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

// Server rejected our token (revoked/expired session) → clear it locally; RequireAuth redirects to /login.
setUnauthorizedHandler(() => {
  supabase.auth.signOut({ scope: 'local' });
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    api('/me')
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [userId]);

  const value = useMemo(
    () => ({
      loading: session === undefined,
      session,
      user: session?.user ?? null,
      profile,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
