const COLORS = ['var(--mint)', 'var(--sun)', '#ffc2d1', 'var(--tan)', '#c9d6f2'];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({ name, email, size = 26 }) {
  const label = (name || email || '?').trim();
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <span
      className="avatar"
      title={name ? `${name} <${email}>` : email}
      style={{ background: COLORS[hash(email || label) % COLORS.length], width: size, height: size }}
    >
      {initials}
    </span>
  );
}
