import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import Brand from './Brand.jsx';
import Avatar from './Avatar.jsx';

/**
 * Sticky app bar: brand left; page actions (children), the signed-in user and "Sign out" right.
 *   tone: 'light' (default, used by the editor) | 'desk' (charcoal, blends into the dashboard hero)
 * Gets `is-scrolled` once the page moves so it can lift off the content with a shadow.
 */
export default function AppHeader({ children, tone = 'light' }) {
  const { profile, user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`app-header app-header--${tone}${scrolled ? ' is-scrolled' : ''}`}>
      <Brand />
      <div className="app-header-actions">
        {children}
        <div className="user-pill" title={user?.email}>
          <Avatar name={profile?.name} email={user?.email} />
          <span className="user-name">{profile?.name ?? user?.email}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
