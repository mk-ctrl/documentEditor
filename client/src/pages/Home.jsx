import { useAuth } from '../lib/auth.jsx';
import Brand from '../components/Brand.jsx';
import Avatar from '../components/Avatar.jsx';

// Phase 1 placeholder for the dashboard (replaced in Phase 2).
export default function Home() {
  const { profile, user, signOut } = useAuth();
  return (
    <div className="center-state">
      <div>
        <Brand />
        <h1 style={{ marginTop: 24 }}>Hi, {profile?.name?.split(' ')[0] ?? '…'}</h1>
        <p>You're signed in as {user?.email}.</p>
        <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
          <Avatar name={profile?.name} email={user?.email} />
          <button className="btn btn-ink btn-sm" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
