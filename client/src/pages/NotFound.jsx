import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="center-state">
      <div>
        <h1>Nothing on this page</h1>
        <p>The page you're looking for doesn't exist.</p>
        <Link className="btn btn-ink" to="/">
          Back to your documents
        </Link>
      </div>
    </main>
  );
}
