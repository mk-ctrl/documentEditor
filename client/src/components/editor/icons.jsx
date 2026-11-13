/**
 * Small stroke icons for the editor surface. All decorative: they sit next to visible text
 * (or inside a control that has its own aria-label), so every icon is aria-hidden.
 */
const base = {
  viewBox: '0 0 20 20',
  width: 18,
  height: 18,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

export const EyeIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M1.8 10S5 4.2 10 4.2 18.2 10 18.2 10 15 15.8 10 15.8 1.8 10 1.8 10Z" />
    <circle cx="10" cy="10" r="2.6" />
  </svg>
);

export const LinkIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M8.4 11.6a3.2 3.2 0 0 0 4.5 0l2.6-2.6a3.2 3.2 0 0 0-4.5-4.5l-1 1" />
    <path d="M11.6 8.4a3.2 3.2 0 0 0-4.5 0L4.5 11a3.2 3.2 0 0 0 4.5 4.5l1-1" />
  </svg>
);

export const TrashIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3.5 5.5h13M8 5.5V4h4v1.5M5.2 5.5l.8 10.5h8l.8-10.5" />
  </svg>
);

export const PeopleIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="7.5" cy="7" r="2.8" />
    <path d="M2.5 16c.6-2.8 2.6-4.3 5-4.3s4.4 1.5 5 4.3" />
    <path d="M13 4.6a2.6 2.6 0 0 1 0 4.9M14.6 11.9c1.5.5 2.5 1.9 2.9 4.1" />
  </svg>
);

export const LockIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="4" y="9" width="12" height="8" rx="1.5" />
    <path d="M6.8 9V6.6a3.2 3.2 0 0 1 6.4 0V9" />
  </svg>
);
