import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const products = JSON.parse(fs.readFileSync(path.join(root, "src/data/products.json"), "utf8"));
const catalogText = fs.readFileSync(path.join(root, "src/data/catalog.js"), "utf8");

const slugify = (value) => String(value).toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const envPath = path.join(root, ".env");
const fileEnv = fs.existsSync(envPath) ? Object.fromEntries(fs.readFileSync(envPath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => { const i = line.indexOf("="); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")]; })) : {};
const base = (process.env.SITE_URL || process.env.VITE_SITE_URL || fileEnv.VITE_SITE_URL || "https://styleup.com").replace(/\/$/, "");

const staticRoutes = [
  "/", "/shop", "/new-arrivals", "/best-sellers", "/sale", "/categories", "/collections",
  "/about", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/terms",
  "/sustainability", "/gift-cards", "/size-guide", "/track-order",
];

// Keep the build script dependency-free by deriving category/collection slugs from the checked-in catalog source.
const categoryMatches = [...catalogText.matchAll(/\{ slug: "([^"]+)", name: "[^"]+", image:[\s\S]*?subcategories: \[([^\]]*)\] \}/g)];
const collectionBlock = catalogText.match(/export const COLLECTIONS = \[([\s\S]*?)\];/i)?.[1] || "";
const collectionSlugs = [...collectionBlock.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);

const categoryRoutes = [];
for (const match of categoryMatches) {
  const cat = match[1];
  categoryRoutes.push(`/${cat}`);
  const subs = [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  for (const sub of subs) categoryRoutes.push(`/${cat}/${slugify(sub)}`);
}
const collectionRoutes = collectionSlugs.map((slug) => `/collections/${slug}`);
const productRoutes = products.map((p) => `/${p.category_slug}/${p.subcategory_slug}/${p.slug}`);

const urls = [...new Set([...staticRoutes, ...categoryRoutes, ...collectionRoutes, ...productRoutes])].sort();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((route) => `  <url><loc>${esc(base + route)}</loc></url>`).join("\n")}\n</urlset>\n`;

fs.mkdirSync(path.join(root, "public"), { recursive: true });
fs.writeFileSync(path.join(root, "public/sitemap.xml"), xml);
const robots = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;
fs.writeFileSync(path.join(root, "public/robots.txt"), robots);
console.log(`Generated sitemap.xml with ${urls.length} URLs and robots.txt for ${base}`);
