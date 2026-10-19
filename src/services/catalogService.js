/** Catalog helpers backed by the Next.js API and server-provided product snapshots. */
let PRODUCTS = [];
export function setCatalog(products){ PRODUCTS=products; ALL_PRODUCTS=products; }
import { CATEGORIES, categoryBySlug } from "../data/catalog";
import { slugify } from "../utils/format";
import { hasApi, request } from "./api";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Small simulated latency so skeleton states are exercised (remove for API)
const LATENCY = 180;

export const PAGE_SIZE = 24;

export const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "best-selling", label: "Best Selling" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating", label: "Highest Rated" },
  { id: "most-reviewed", label: "Most Reviewed" },
];

export const currentPrice = (p) => (p.sale_price != null ? p.sale_price : p.regular_price);

export function sortProducts(list, sort) {
  const a = [...list];
  switch (sort) {
    case "newest": return a.sort((x, y) => y.created_date.localeCompare(x.created_date));
    case "best-selling": return a.sort((x, y) => (y.best_seller - x.best_seller) || (y.review_count - x.review_count));
    case "price-asc": return a.sort((x, y) => currentPrice(x) - currentPrice(y));
    case "price-desc": return a.sort((x, y) => currentPrice(y) - currentPrice(x));
    case "rating": return a.sort((x, y) => (y.rating - x.rating) || (y.review_count - x.review_count));
    case "most-reviewed": return a.sort((x, y) => y.review_count - x.review_count);
    default: return a.sort((x, y) => (y.featured - x.featured) || (y.best_seller - x.best_seller) || (y.new_arrival - x.new_arrival) || (y.rating - x.rating));
  }
}

const PRICE_BUCKETS = [
  { id: "under-50", label: "Under $50", min: 0, max: 50 },
  { id: "50-100", label: "$50 – $100", min: 50, max: 100 },
  { id: "100-150", label: "$100 – $150", min: 100, max: 150 },
  { id: "150-plus", label: "$150 & up", min: 150, max: Infinity },
];
export { PRICE_BUCKETS };

/** Apply URL-style filters to a list. */
export function applyFilters(list, f = {}) {
  let out = list;
  if (f.category) out = out.filter((p) => p.category_slug === f.category);
  if (f.subcategory) out = out.filter((p) => p.subcategory_slug === f.subcategory);
  if (f.subcategories?.length) out = out.filter((p) => f.subcategories.includes(p.subcategory_slug));
  if (f.price?.length) out = out.filter((p) => f.price.some((id) => { const b = PRICE_BUCKETS.find((x) => x.id === id); return b && currentPrice(p) >= b.min && currentPrice(p) < b.max; }));
  if (f.size?.length) out = out.filter((p) => p.sizes.some((s) => f.size.includes(s)));
  if (f.color?.length) out = out.filter((p) => p.colors.some((c) => f.color.includes(slugify(c.name))));
  if (f.brand?.length) out = out.filter((p) => f.brand.includes(slugify(p.brand)));
  if (f.rating) out = out.filter((p) => p.rating >= Number(f.rating));
  if (f.availability === "in-stock") out = out.filter((p) => p.availability !== "out_of_stock");
  if (f.new) out = out.filter((p) => p.new_arrival);
  if (f.best) out = out.filter((p) => p.best_seller);
  if (f.sale) out = out.filter((p) => p.sale_status);
  if (f.collection) out = out.filter((p) => p.collection && slugify(p.collection) === f.collection);
  if (f.tag) out = out.filter((p) => p.tags.includes(f.tag));
  return out;
}

/** Facet counts for the current base list (before the facet's own filter). */
export function facets(base) {
  const count = (fn) => { const m = new Map(); for (const p of base) for (const k of fn(p)) m.set(k, (m.get(k) || 0) + 1); return m; };
  return {
    subcategories: count((p) => [[p.subcategory, p.subcategory_slug].join("|")]),
    sizes: count((p) => p.sizes),
    colors: count((p) => p.colors.map((c) => `${c.name}|${c.hex}`)),
    brands: count((p) => [p.brand]),
    price: new Map(PRICE_BUCKETS.map((b) => [b.id, base.filter((p) => currentPrice(p) >= b.min && currentPrice(p) < b.max).length])),
  };
}

function responseItems(data) {
  if (Array.isArray(data)) return data;
  return data?.items || data?.products || data?.data || [];
}

function mapFacet(value) {
  if (value instanceof Map) return value;
  if (Array.isArray(value)) return new Map(value.map((entry) => Array.isArray(entry) ? entry : [entry.key ?? entry.id ?? entry.name, entry.count ?? entry.value ?? 0]));
  if (value && typeof value === "object") return new Map(Object.entries(value));
  return new Map();
}

function normalizeFacets(raw, fallbackItems = []) {
  if (!raw) return facets(fallbackItems);
  return {
    subcategories: mapFacet(raw.subcategories),
    sizes: mapFacet(raw.sizes),
    colors: mapFacet(raw.colors),
    brands: mapFacet(raw.brands),
    price: mapFacet(raw.price),
  };
}

function catalogQuery({ filters = {}, sort, page, pageSize, q, slug } = {}) {
  const qs = new URLSearchParams();
  if (sort) qs.set("sort", sort);
  if (page) qs.set("page", String(page));
  if (pageSize) qs.set("pageSize", String(pageSize));
  if (q) qs.set("q", q);
  if (slug) qs.set("slug", slug);
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === false || value === "" || (Array.isArray(value) && !value.length)) continue;
    qs.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return qs.toString();
}

export async function listProducts({ filters = {}, sort = "featured", page = 1, pageSize = PAGE_SIZE } = {}) {
  if (hasApi()) {
    const data = await request(`/items/api?${catalogQuery({ filters, sort, page, pageSize })}`);
    const items = responseItems(data);
    const total = Number(data?.total ?? data?.count ?? items.length);
    const resolvedPage = Number(data?.page ?? page);
    const pages = Number(data?.pages ?? data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize)));
    return { items, total, page: resolvedPage, pages, facets: normalizeFacets(data?.facets, items) };
  }
  await wait(LATENCY);
  const filtered = applyFilters(PRODUCTS, filters);
  const sorted = sortProducts(filtered, sort);
  const start = (page - 1) * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: sorted.length, page, pages: Math.max(1, Math.ceil(sorted.length / pageSize)), facets: facets(applyFilters(PRODUCTS, { category: filters.category, subcategory: filters.subcategory, collection: filters.collection, new: filters.new, best: filters.best, sale: filters.sale })) };
}

export async function getProduct(slug) {
  if (hasApi()) {
    try {
      const data = await request(`/items/api?${catalogQuery({ slug })}`);
      return data?.item || data?.product || responseItems(data)[0] || null;
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }
  await wait(LATENCY);
  return PRODUCTS.find((p) => p.slug === slug) || null;
}
export function getProductSync(slug) { return PRODUCTS.find((p) => p.slug === slug) || null; }
export function getProductsByIds(ids) { return ids.map((id) => PRODUCTS.find((p) => p.product_id === id)).filter(Boolean); }

export function productUrl(p) { return `/${p.category_slug}/${p.subcategory_slug}/${p.slug}`; }

export function pickProducts(pred, n = 8, sort = "featured") { return sortProducts(PRODUCTS.filter(pred), sort).slice(0, n); }
export const newArrivals = (n = 8, category) => pickProducts((p) => p.new_arrival && (!category || p.category_slug === category), n, "newest");
export const bestSellers = (n = 8, category) => pickProducts((p) => p.best_seller && (!category || p.category_slug === category), n, "best-selling");
export const onSale = (n = 8) => pickProducts((p) => p.sale_status, n);
export const categoryCount = (slug) => PRODUCTS.filter((p) => p.category_slug === slug).length;

export function related(product, n = 8) {
  return sortProducts(PRODUCTS.filter((p) => p.product_id !== product.product_id && p.subcategory === product.subcategory && p.category === product.category), "featured")
    .concat(sortProducts(PRODUCTS.filter((p) => p.product_id !== product.product_id && p.category === product.category && p.subcategory !== product.subcategory), "featured"))
    .slice(0, n);
}
export function completeTheLook(product, n = 4) {
  const pairs = { Women: ["Bags", "Shoes", "Accessories"], Men: ["Shoes", "Accessories", "Bags"], Bags: ["Women", "Shoes", "Accessories"], Shoes: ["Women", "Men", "Bags"], Accessories: ["Women", "Bags", "Beauty"], Beauty: ["Beauty", "Accessories", "Home & Living"], "Home & Living": ["Home & Living", "Beauty"] };
  const cats = pairs[product.category] || [];
  const out = [];
  for (const c of cats) { out.push(...sortProducts(PRODUCTS.filter((p) => p.category === c && p.availability !== "out_of_stock" && p.product_id !== product.product_id), "best-selling").slice(0, 2)); }
  return out.slice(0, n);
}

/** Variant stock lookup */
export function variantStock(product, color, size) {
  const v = product.variants.find((x) => (x.color ?? null) === (color ?? null) && (x.size ?? null) === (size ?? null));
  return v ? v.stock : 0;
}
export function colorHasStock(product, color) { return product.variants.some((v) => v.color === color && v.stock > 0); }
export function sizeHasStock(product, color, size) { return product.variants.some((v) => (color == null || v.color === color) && v.size === size && v.stock > 0); }

// ---------------- Search ----------------
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
const VOCAB = (() => { const s = new Set(); for (const p of PRODUCTS) for (const w of norm(`${p.product_name} ${p.subcategory} ${p.category} ${p.brand} ${p.tags.join(" ")}`).split(/[^a-z0-9]+/)) if (w.length > 2) s.add(w); return [...s]; })();

function localSearchProducts(query, limit = Infinity) {
  const q = norm(query || "").trim();
  if (!q) return { items: [], total: 0, corrected: null, categories: [] };
  const terms = q.split(/\s+/).filter(Boolean);
  const score = (p) => {
    const hay = norm(`${p.product_name} ${p.subcategory} ${p.category} ${p.brand} ${p.tags.join(" ")} ${p.materials}`);
    const name = norm(p.product_name);
    let s = 0;
    for (const t of terms) {
      if (name.startsWith(t)) s += 8; else if (name.includes(t)) s += 5; else if (hay.includes(t)) s += 2; else return 0;
    }
    return s + (p.best_seller ? 1 : 0);
  };
  const scored = PRODUCTS.map((p) => [score(p), p]).filter(([s]) => s > 0);
  if (!scored.length) {
    // fuzzy: correct each term to the closest vocab word within distance 2
    const fixed = terms.map((t) => { let best = t, bd = 3; for (const w of VOCAB) { const d = lev(t, w); if (d < bd) { bd = d; best = w; } } return best; });
    const cq = fixed.join(" ");
    if (cq !== q) { const r = localSearchProducts(cq, limit); if (r.items.length) return { ...r, corrected: cq }; }
  }
  scored.sort((a, b) => b[0] - a[0]);
  const items = scored.map(([, p]) => p);
  const catMap = new Map();
  for (const p of items) { const key = `${p.category}|${p.subcategory}|${p.category_slug}/${p.subcategory_slug}`; catMap.set(key, (catMap.get(key) || 0) + 1); }
  const categories = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => { const [c, s, path] = k.split("|"); return { category: c, subcategory: s, path: "/" + path, count: n }; });
  return { items: items.slice(0, limit), total: items.length, corrected: null, categories };
}

function searchCategories(items) {
  const catMap = new Map();
  for (const p of items) {
    if (!p?.category || !p?.subcategory) continue;
    const path = p.category_slug && p.subcategory_slug ? `${p.category_slug}/${p.subcategory_slug}` : `${slugify(p.category)}/${slugify(p.subcategory)}`;
    const key = `${p.category}|${p.subcategory}|${path}`;
    catMap.set(key, (catMap.get(key) || 0) + 1);
  }
  return [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, count]) => { const [category, subcategory, path] = k.split("|"); return { category, subcategory, path: `/${path}`, count }; });
}

export async function searchProducts(query, limit = Infinity) {
  const term = String(query || "").trim();
  if (!term) return { items: [], total: 0, corrected: null, categories: [] };
  if (!hasApi()) return localSearchProducts(term, limit);
  const safeLimit = Number.isFinite(limit) ? Math.max(1, limit) : 500;
  const data = await request(`/items/api?${catalogQuery({ q: term, page: 1, pageSize: safeLimit })}`);
  const items = responseItems(data);
  return {
    items: items.slice(0, safeLimit),
    total: Number(data?.total ?? data?.count ?? items.length),
    corrected: data?.corrected || data?.correction || null,
    categories: Array.isArray(data?.categories) ? data.categories : searchCategories(items),
  };
}

export function popularProducts(n = 4) { return sortProducts(PRODUCTS, "best-selling").slice(0, n); }
export const allCategories = () => CATEGORIES.map((c) => ({ ...c, count: categoryCount(c.slug) }));
export const subcategoryName = (catSlug, subSlug) => { const c = categoryBySlug(catSlug); return c?.subcategories.find((s) => slugify(s) === subSlug) || null; };
export let ALL_PRODUCTS = PRODUCTS;
