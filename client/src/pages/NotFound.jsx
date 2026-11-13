import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="placeholder">
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to your documents</Link>
      </p>
    </main>
  );
}
