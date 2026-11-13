import { Link } from 'react-router-dom';

// Two stacked sheets: a "quire" is a gathering of folded pages.
export function BrandMark({ className = 'brand-mark' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="9.5" y="4.5" width="16" height="20" rx="1.5" fill="none" stroke="var(--tan)" strokeWidth="2.2" />
      <path d="M6.5 9.5v17a1.5 1.5 0 0 0 1.5 1.5h13" fill="none" stroke="var(--tan)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13.5 11h8M13.5 15h8M13.5 19h5" stroke="var(--tan)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand" aria-label="Quire home">
      <BrandMark />
      <span>Quire</span>
    </Link>
  );
}
