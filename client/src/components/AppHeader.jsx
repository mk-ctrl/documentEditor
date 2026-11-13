import { useAuth } from '../lib/auth.jsx';
import Brand from './Brand.jsx';
import Avatar from './Avatar.jsx';

export default function AppHeader({ children }) {
  const { profile, user, signOut } = useAuth();
  return (
    <header className="app-header">
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
