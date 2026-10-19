// Consistent 24px line icons, 1.5px stroke. Usage: <Icon name="cart" size={20} />
const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  heart: <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.7 1.3-1.6 2.8-2.7 4.8-2.7 3.6 0 5.7 3.5 4.5 6.8C19.5 15.9 12 20.5 12 20.5Z" />,
  cart: <><path d="M4 4h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H7" /><circle cx="10" cy="20" r="1.2" /><circle cx="18" cy="20" r="1.2" /></>,
  bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  arrowRight: <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>,
  arrowLeft: <><path d="M20 12H4" /><path d="m10 6-6 6 6 6" /></>,
  arrowUp: <><path d="M12 20V4" /><path d="m6 10 6-6 6 6" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12 5 5 9-10" />,
  star: <path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4l-5.7 3.1 1.2-6.4L2.8 9.7l6.4-.8L12 3Z" />,
  truck: <><path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3v4h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  refresh: <><path d="M20 12a8 8 0 0 1-14.3 4.9" /><path d="M4 12a8 8 0 0 1 14.3-4.9" /><path d="M4 4v4h4" /><path d="M20 20v-4h-4" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.4 3.2 8 7.5 9.5 4.3-1.5 7.5-5.1 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
  headset: <><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19v1a2 2 0 0 1-2 2h-3" /></>,
  award: <><circle cx="12" cy="9" r="5" /><path d="m9 13-1.5 8L12 18l4.5 3L15 13" /></>,
  leaf: <><path d="M5 19c0-8 5-13 14-14-.5 9-5 14-12 14" /><path d="M5 19c3-4 6-7 10-9" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  mapPin: <><path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11Z" /><circle cx="12" cy="10" r="2" /></>,
  zoom: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M11 8v6" /><path d="M8 11h6" /></>,
  expand: <><path d="M8 3H3v5" /><path d="M16 3h5v5" /><path d="M3 16v5h5" /><path d="M21 16v5h-5" /></>,
  play: <path d="M8 5v14l11-7L8 5Z" />,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m13 7 4 4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  alert: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>,
  package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M4 7.5 12 12l8-4.5" /><path d="M12 12v9" /></>,
  home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  filter: <><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></>,
  sliders: <><path d="M4 8h10" /><path d="M18 8h2" /><circle cx="16" cy="8" r="2" /><path d="M4 16h2" /><path d="M10 16h10" /><circle cx="8" cy="16" r="2" /></>,
  card: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></>,
  wallet: <><path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4V7Z" /><path d="M4 7V5a1 1 0 0 1 1-1h11" /><circle cx="16" cy="14" r="1" /></>,
  logout: <><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4" /><path d="M18 12H9" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.5 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.7" /><path d="M6.6 6.6A16 16 0 0 0 2 12s3.5 6 10 6a9.6 9.6 0 0 0 4-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  ruler: <><path d="M3 15 15 3l6 6L9 21l-6-6Z" /><path d="m7 11 2 2" /><path d="m10 8 2 2" /><path d="m13 5 2 2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  gift: <><rect x="3" y="10" width="18" height="11" rx="1.5" /><path d="M3 14h18" /><path d="M12 10v11" /><path d="M12 10s-4-1-4-3.5a2 2 0 0 1 4 0c0-2 4-2 4 0 0 2.5-4 3.5-4 3.5Z" /></>,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5 9 15M15 9l2.5-2.5" />,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><path d="M17 7h.01" /></>,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8Z" />,
  pinterest: <><circle cx="12" cy="12" r="9" /><path d="M10 20c.5-2 1-4.5 1.5-6.5M12.5 14c1.2 1.2 4 .5 4-3 0-2.5-2-4-4.5-4S8 8.7 8 11c0 1.4.5 2 1 2.3" /></>,
  youtube: <><rect x="3" y="6" width="18" height="12" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></>,
  tiktok: <><path d="M14 4v9.5a3 3 0 1 1-3-3" /><path d="M14 4c.5 2.5 2 4 4.5 4" /></>,
  chat: <><path d="M4 5h16v11H9l-5 4V5Z" /><path d="M8 9h8M8 12h5" /></>,
  creditCard: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 14h3" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" /><path d="M12 17h.01" /></>,
  send: <><path d="M21 3 10 14" /><path d="M21 3 14 21l-4-7-7-4 18-7Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  tag: <><path d="M3 12V4h8l9 9-8 8-9-9Z" /><circle cx="7.5" cy="8.5" r="1" /></>,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  box: <><path d="M4 8h16v12H4z" /><path d="M4 8l2-4h12l2 4" /><path d="M10 12h4" /></>,
  layers: <><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15 9-2 5-5 2 2-5 5-2Z" /></>,
  spark: <path d="M12 2c0 6-4 10-10 10 6 0 10 4 10 10 0-6 4-10 10-10-6 0-10-4-10-10Z" />,
};

export default function Icon({ name, size = 22, strokeWidth = 1.5, className = "", ...rest }) {
  const p = PATHS[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...rest}>
      {p}
    </svg>
  );
}

export function StarIcon({ fill = 1, size = 14 }) {
  // fill: 0..1 — partial fill via clip
  const id = `s${Math.round(fill * 100)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs><clipPath id={id}><rect x="0" y="0" width={24 * fill} height="24" /></clipPath></defs>
      <path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4l-5.7 3.1 1.2-6.4L2.8 9.7l6.4-.8L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4l-5.7 3.1 1.2-6.4L2.8 9.7l6.4-.8L12 3Z" fill="currentColor" clipPath={`url(#${id})`} />
    </svg>
  );
}
