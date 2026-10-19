import { useEffect } from "react";
const SITE = "StyleUp";
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

function setMeta(sel, attrs) {
  let el = document.head.querySelector(sel);
  if (!el) { el = document.createElement(attrs.tag || "meta"); document.head.appendChild(el); }
  for (const [k, v] of Object.entries(attrs)) if (k !== "tag") el.setAttribute(k, v);
  return el;
}

/** Per-page title, description, canonical, OG/Twitter, and JSON-LD. */
export function useSeo({ title, description, path, image, type = "website", jsonLd, noindex } = {}) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE}` : `${SITE} — Elevate Your Everyday Style`;
    document.title = full;
    const url = ORIGIN + (path ?? window.location.pathname);
    const desc = description || "Timeless pieces. Thoughtful details. Made for every you.";
    const img = image || `${ORIGIN}/og-default.jpg`;
    setMeta('meta[name="description"]', { name: "description", content: desc });
    setMeta('link[rel="canonical"]', { tag: "link", rel: "canonical", href: url });
    setMeta('meta[property="og:title"]', { property: "og:title", content: full });
    setMeta('meta[property="og:description"]', { property: "og:description", content: desc });
    setMeta('meta[property="og:url"]', { property: "og:url", content: url });
    setMeta('meta[property="og:type"]', { property: "og:type", content: type });
    setMeta('meta[property="og:image"]', { property: "og:image", content: img });
    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE });
    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: full });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: img });
    setMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow" });
    document.querySelectorAll('script[data-seo-jsonld]').forEach((n) => n.remove());
    const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    for (const b of blocks) { const s = document.createElement("script"); s.type = "application/ld+json"; s.dataset.seoJsonld = "1"; s.textContent = JSON.stringify(b); document.head.appendChild(s); }
  }, [title, description, path, image, type, noindex, JSON.stringify(jsonLd)]);
}

export const breadcrumbLd = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, item: ORIGIN + it.to })) });
export const productLd = (p, url) => ({
  "@context": "https://schema.org", "@type": "Product", name: p.product_name, image: p.images.map((i) => i.src), description: p.short_description, sku: p.SKU, brand: { "@type": "Brand", name: p.brand },
  offers: { "@type": "Offer", url: ORIGIN + url, priceCurrency: p.currency, price: p.sale_price ?? p.regular_price, availability: `https://schema.org/${p.availability === "out_of_stock" ? "OutOfStock" : "InStock"}`, itemCondition: "https://schema.org/NewCondition" },
  ...(p.review_count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.review_count } } : {}),
});
