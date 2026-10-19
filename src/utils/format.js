export const money = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n ?? 0);

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;

export const dateFmt = (iso, opts = { year: "numeric", month: "short", day: "numeric" }) =>
  iso ? new Date(iso).toLocaleDateString("en-US", opts) : "";

export const relDate = (iso) => {
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) { const w = Math.round(days / 7); return `${w} week${w > 1 ? "s" : ""} ago`; }
  if (days < 365) { const m = Math.round(days / 30); return `${m} month${m > 1 ? "s" : ""} ago`; }
  return dateFmt(iso);
};

export const slugify = (s = "") =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const titleCase = (s = "") => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const uid = () => Math.random().toString(36).slice(2, 10);

export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const deliveryWindow = (from = new Date(), min = 3, max = 6) => {
  const a = addDays(from, min), b = addDays(from, max);
  const f = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(a)} – ${f(b)}`;
};
