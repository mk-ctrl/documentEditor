import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useReveal } from '../lib/useReveal.js';
import Brand from '../components/Brand.jsx';
import Avatar from '../components/Avatar.jsx';
import Shapes from '../components/Shapes.jsx';
import TopBar from '../components/landing/TopBar.jsx';
import DotNav from '../components/landing/DotNav.jsx';
import HeroCollage from '../components/landing/HeroCollage.jsx';
import FeaturePanel from '../components/landing/FeaturePanel.jsx';
import { WriteMockup, ShareMockup, FilesMockup, DeskMockup } from '../components/landing/Mockups.jsx';
import { scrollToEl } from '../components/landing/motion.js';

// Seeded demo accounts (see scripts/seed.js). Clicking one signs in instantly when the
// demo password is configured, which makes testing sharing between users a one-click switch.
const DEMO_USERS = [
  { email: 'alice@example.com', name: 'Alice Park' },
  { email: 'bob@example.com', name: 'Bob Rivera' },
  { email: 'carol@example.com', name: 'Carol Singh' },
];
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || '';

// Sections listed in the right-side dot navigation (ids of elements below).
const SECTIONS = [
  // "Welcome", not "Sign in": keeps "Sign in" unique to the form's submit button.
  { id: 'top', label: 'Welcome' },
  { id: 'story', label: 'Story' },
  { id: 'write', label: 'Write' },
  { id: 'share', label: 'Share' },
  { id: 'files', label: 'Files' },
  { id: 'desk', label: 'Desk' },
  { id: 'start', label: 'Start' },
];

const HERO_SHAPES = [
  { kind: 'square', top: '16%', left: '4%', color: '#4a4743', size: 34, rotate: 12 },
  { kind: 'ring', bottom: '14%', left: '34%', color: '#4a4743', size: 40 },
  { kind: 'tri', top: '12%', right: '38%', color: 'rgba(242,236,152,.28)', size: 40, rotate: -10 },
  { kind: 'square', bottom: '8%', right: '6%', color: 'rgba(166,216,201,.3)', size: 30, rotate: 30 },
  { kind: 'ring', top: '58%', left: '8%', color: 'rgba(255,61,110,.35)', size: 22 },
];

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
  // Bumped whenever something outside the sheet (top bar, CTA) asks to jump to the form.
  const [focusTick, setFocusTick] = useState(0);
  const sheetRef = useRef(null);
  const storyRef = useReveal({ threshold: 0.25 });
  const ctaRef = useReveal({ threshold: 0.2 });

  // Runs after the mode switch has rendered, so the right first field exists.
  useEffect(() => {
    if (!focusTick) return;
    scrollToEl(sheetRef.current, 'center');
    document.getElementById(isSignup ? 'name' : 'email')?.focus({ preventScroll: true });
  }, [focusTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const dest = location.state?.from || '/';
  if (!loading && user) return <Navigate to={dest} replace />;

  function switchMode(next) {
    setMode(next);
    setError('');
    navigate(next === 'signup' ? '/signup' : '/login', { replace: true, state: location.state });
  }

  /** Switch to a mode (if needed), then scroll to and focus the auth sheet. */
  function goToAuth(next) {
    if (next !== mode) switchMode(next);
    setFocusTick((t) => t + 1);
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
    <div className="lp">
      <TopBar onSignIn={() => goToAuth('signin')} onGetStarted={() => goToAuth('signup')} />
      <DotNav sections={SECTIONS} />

      <main>
        {/* ── Hero: pitch on the left, the auth sheet (in a floating collage) on the right ── */}
        <section id="top" className="lp-hero" aria-label="Welcome">
          <Shapes items={HERO_SHAPES} />
          <div className="lp-hero-inner">
            <div className="lp-hero-copy">
              <p className="lp-kicker lp-in" style={{ '--d': 0 }}>
                A quiet place to write
              </p>
              <h1 className="lp-hero-title">
                <span className="lp-in" style={{ '--d': 1 }}>
                  Words that
                </span>{' '}
                <span className="lp-in" style={{ '--d': 2 }}>
                  travel <em>well.</em>
                </span>
              </h1>
              <p className="lp-hero-sub lp-in" style={{ '--d': 3 }}>
                Write, format and share documents with your team. No clutter, just the page.
              </p>
              <button
                type="button"
                className="lp-scroll lp-in"
                style={{ '--d': 4 }}
                aria-label="Scroll to the story"
                onClick={() => scrollToEl(document.getElementById('story'))}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <HeroCollage>
              <section className="paper auth-sheet lp-auth" aria-labelledby="login-title" ref={sheetRef}>
                <p className="eyebrow">{isSignup ? 'New here?' : 'Welcome back'}</p>
                {/* key re-runs the small title animation when the mode flips */}
                <h2 id="login-title" key={mode} className="lp-auth-title">
                  {isSignup ? 'Create your account' : 'Sign in'}
                </h2>

                <form className="auth-form" onSubmit={submit} noValidate>
                  {isSignup && (
                    <div className="field lp-field-in">
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
                        {/* avatar is decorative so the button is named by the first name alone */}
                        <span aria-hidden="true" className="demo-chip-avatar">
                          <Avatar name={u.name} email={u.email} size={24} />
                        </span>
                        {u.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </HeroCollage>
          </div>
        </section>

        {/* ── Manifesto: alternating serif / giant sans lines ── */}
        <section id="story" className="lp-story" aria-labelledby="story-title">
          <Shapes
            items={[
              { kind: 'square', top: '14%', left: '8%', color: 'var(--sun)', size: 44, rotate: 14 },
              { kind: 'ring', bottom: '16%', right: '10%', color: 'var(--sun)', size: 56 },
              { kind: 'tri', top: '20%', right: '18%', color: 'rgba(255,61,110,.35)', size: 34, rotate: 18 },
              { kind: 'square', bottom: '12%', left: '22%', color: 'rgba(166,216,201,.7)', size: 24, rotate: -20 },
            ]}
          />
          <div className="lp-story-inner reveal" ref={storyRef}>
            <h2 id="story-title" className="lp-manifesto">
              <span className="lp-m-serif reveal-child" style={{ '--i': 0 }}>
                Because we believe
              </span>{' '}
              <span className="lp-m-sans reveal-child" style={{ '--i': 1 }}>
                good work
              </span>{' '}
              <span className="lp-m-serif reveal-child" style={{ '--i': 2 }}>
                starts on
              </span>{' '}
              <span className="lp-m-sans reveal-child" style={{ '--i': 3 }}>
                <span className="lp-underline">
                  a blank page.
                  <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M4 14 C 70 4, 150 4, 296 10" />
                  </svg>
                </span>
              </span>
            </h2>
            <p className="lp-story-note reveal-child" style={{ '--i': 5 }}>
              Quire keeps the tools out of your way: a calm sheet, a few honest formatting buttons, autosave you never
              think about, and sharing that says exactly who can do what.
            </p>
          </div>
        </section>

        <FeaturePanel
          id="write"
          tone="mint"
          index={1}
          label="Write"
          title="Write & format"
          subtitle="A simple, focused writing experience."
          notes={[
            { title: 'Real formatting', text: 'Headings, bold, italic, underline and lists, right where you type.' },
            { title: 'Autosave', text: 'Every pause is saved. No save button to remember.' },
          ]}
          shapes={[
            { kind: 'ring', top: '10%', right: '8%', color: 'rgba(31,77,65,.22)', size: 48 },
            { kind: 'square', bottom: '12%', left: '4%', color: 'rgba(255,255,255,.6)', size: 30, rotate: 20 },
          ]}
        >
          <WriteMockup />
        </FeaturePanel>

        <FeaturePanel
          id="share"
          tone="coral"
          index={2}
          label="Share"
          title="Share with intent"
          subtitle="Viewer or editor. You decide, per person."
          flip
          notes={[
            { title: 'Clear roles', text: 'Owners invite people by email as viewers or editors.' },
            { title: 'Change your mind', text: 'Switch a role or remove access at any time.' },
          ]}
          shapes={[
            { kind: 'tri', top: '12%', left: '6%', color: 'rgba(255,255,255,.35)', size: 44, rotate: -12 },
            { kind: 'square', bottom: '10%', right: '8%', color: 'rgba(53,51,48,.25)', size: 36, rotate: 18 },
          ]}
        >
          <ShareMockup />
        </FeaturePanel>

        <FeaturePanel
          id="files"
          tone="grey"
          index={3}
          label="Import"
          title="Bring your files"
          subtitle="Plain text, Markdown or Word, up to 2 MB."
          notes={[
            { title: '.txt · .md · .docx', text: 'Upload a file and it opens as a new, editable document.' },
            { title: 'Structure kept', text: 'Headings, lists and emphasis come along for the ride.' },
          ]}
          shapes={[
            { kind: 'square', top: '14%', right: '10%', color: 'var(--sun)', size: 52, rotate: 10 },
            { kind: 'ring', bottom: '12%', left: '6%', color: 'var(--sun)', size: 60 },
            { kind: 'tri', top: '46%', left: '46%', color: 'var(--sun)', size: 30, rotate: 24 },
          ]}
        >
          <FilesMockup />
        </FeaturePanel>

        <FeaturePanel
          id="desk"
          tone="desk"
          index={4}
          label="Desk"
          title="Your desk"
          subtitle="Everything you own, and everything shared with you."
          flip
          shapes={[
            { kind: 'square', top: '12%', left: '6%', color: '#4a4743', size: 36, rotate: -8 },
            { kind: 'ring', bottom: '10%', right: '12%', color: 'rgba(166,216,201,.3)', size: 44 },
          ]}
        >
          <DeskMockup />
        </FeaturePanel>

        {/* ── Final call to action: jumps back to the auth sheet ── */}
        <section id="start" className="lp-cta" aria-labelledby="cta-title">
          <Shapes
            items={[
              { kind: 'ring', top: '18%', left: '10%', color: 'rgba(31,77,65,.25)', size: 40 },
              { kind: 'square', bottom: '18%', right: '12%', color: 'rgba(255,255,255,.6)', size: 34, rotate: 16 },
            ]}
          />
          <div className="lp-cta-inner reveal" ref={ctaRef}>
            <p className="lp-m-serif reveal-child" style={{ '--i': 0 }}>
              Ready when you are.
            </p>
            <h2 id="cta-title" className="lp-giant reveal-child" style={{ '--i': 1 }}>
              Start a page.
            </h2>
            <div className="lp-cta-actions reveal-child" style={{ '--i': 2 }}>
              <button type="button" className="btn btn-ink lp-cta-btn" onClick={() => goToAuth('signup')}>
                Start writing
              </button>
              <button type="button" className="lp-cta-link" onClick={() => goToAuth('signin')}>
                or try a demo account
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <Brand to="/login" />
        <p>Quire · a small collaborative editor</p>
      </footer>
    </div>
  );
}
