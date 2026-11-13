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
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const dest = location.state?.from || '/';
  if (!loading && user) return <Navigate to={dest} replace />;

  async function submit(e, creds = { email, password }) {
    e?.preventDefault();
    setError('');
    if (!creds.email.trim() || !creds.password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(creds.email.trim().toLowerCase(), creds.password);
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
      submit(null, { email: u.email, password: DEMO_PASSWORD });
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
          <p className="eyebrow">Welcome back</p>
          <h2 id="login-title">Sign in</h2>

          <form className="auth-form" onSubmit={submit} noValidate>
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
                autoComplete="current-password"
                placeholder="••••••••"
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
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

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
