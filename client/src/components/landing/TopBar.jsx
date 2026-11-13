import { useEffect, useState } from 'react';
import Brand from '../Brand.jsx';

/**
 * Fixed landing top bar: transparent over the hero, turns into a solid charcoal strip once the
 * page has scrolled so it stays legible over the coloured panels below.
 */
export default function TopBar({ onSignIn, onGetStarted }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lp-top${solid ? ' is-solid' : ''}`}>
      <Brand to="/login" />
      <nav className="lp-top-actions" aria-label="Account">
        {/* "Log in" (not "Sign in") so it never collides with the form's submit button name. */}
        <button type="button" className="lp-top-link" onClick={onSignIn}>
          Log in
        </button>
        <button type="button" className="btn btn-mint btn-sm" onClick={onGetStarted}>
          Get started
        </button>
      </nav>
    </header>
  );
}
