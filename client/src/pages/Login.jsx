import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Brand from '../components/Brand.jsx';
import Avatar from '../components/Avatar.jsx';

// Seeded demo accounts (see scripts/seed.js). Clicking one signs in instantly when the
// demo password is configured, which makes testing sharing between users a one-click switch.
const DEMO_USERS = [
  { email: 'alice@example.com', name: 'Alice Park' },
  { email: 'bob@example.com', name: 'Bob Rivera' },
  { email: 'carol@example.com', name: 'Carol Singh' },
];
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || '';

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(location.pathname === '/signup' ? 'signup' : 'signin');
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const dest = location.state?.from || '/';
  if (!loading && user) return <Navigate to={dest} replace />;

  function switchMode(next) {
    setMode(next);
    setError('');
    navigate(next === 'signup' ? '/signup' : '/login', { replace: true, state: location.state });
  }

  async function submit(e, creds = { email, password }, asSignup = isSignup) {
    e?.preventDefault();
    setError('');
    if (asSignup && !name.trim()) {
      setError('Enter your name.');
      return;
    }
    if (!creds.email.trim() || !creds.password) {
      setError('Enter your email and password.');
      return;
    }
    if (asSignup && creds.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const cleanEmail = creds.email.trim().toLowerCase();
      if (asSignup) await signUp(name.trim(), cleanEmail, creds.password);
      else await signIn(cleanEmail, creds.password);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function pickDemo(u) {
    setEmail(u.email);
    if (DEMO_PASSWORD) {
      setPassword(DEMO_PASSWORD);
      submit(null, { email: u.email, password: DEMO_PASSWORD }, false);
    }
  }

  return (
    <div className="auth">
      <span className="shape shape-square" style={{ top: '14%', left: '6%', color: '#4a4743', '--r': '12deg' }} />
      <span className="shape shape-ring" style={{ bottom: '16%', left: '38%', color: '#4a4743' }} />
      <span className="shape shape-tri" style={{ top: '22%', right: '8%', color: 'rgba(242,236,152,.22)', '--r': '-10deg' }} />
      <span className="shape shape-square" style={{ bottom: '8%', right: '30%', color: 'rgba(166,216,201,.25)', '--r': '30deg' }} />

      <header className="auth-top">
        <Brand to="/login" />
      </header>

      <main className="auth-main">
        <section className="auth-pitch">
          <p className="kicker">Because good work</p>
          <h1>
            starts on
            <br />a blank page.
          </h1>
          <p className="sub">Write, format and share documents with your team. No clutter, just the page.</p>
        </section>

        <section className="paper auth-sheet" aria-labelledby="login-title">
          <p className="eyebrow">{isSignup ? 'New here?' : 'Welcome back'}</p>
          <h2 id="login-title">{isSignup ? 'Create your account' : 'Sign in'}</h2>

          <form className="auth-form" onSubmit={submit} noValidate>
            {isSignup && (
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  className="input"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-mint" type="submit" disabled={busy}>
              {busy ? (isSignup ? 'Creating account…' : 'Signing in…') : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'No account yet?'}{' '}
            <button type="button" className="link-btn" onClick={() => switchMode(isSignup ? 'signin' : 'signup')}>
              {isSignup ? 'Sign in' : 'Create one'}
            </button>
          </p>

          <div className="demo-users">
            <p>{DEMO_PASSWORD ? 'Or jump in as a demo user:' : 'Demo users (password in the README):'}</p>
            <div className="demo-list">
              {DEMO_USERS.map((u) => (
                <button key={u.email} type="button" className="demo-chip" disabled={busy} onClick={() => pickDemo(u)}>
                  <Avatar name={u.name} email={u.email} size={24} />
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="auth-foot">Quire · a small collaborative editor</footer>
    </div>
  );
}
