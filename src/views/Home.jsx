import { useMemo } from "react";
import { Link } from "@/components/navigation";
import Icon from "../components/ui/Icon";
import { Button, ProductImage, TrustGrid, SectionHead } from "../components/ui";
import ProductCard, { CategoryCard } from "../components/product/ProductCard";
import Newsletter from "../components/home/Newsletter";
import { useSeo } from "../hooks/useSeo";
import { allCategories, newArrivals, bestSellers, ALL_PRODUCTS, productUrl } from "../services/catalogService";
import { TRUST, SALE_CAMPAIGN } from "../data/catalog";
import { money } from "../utils/format";

const HERO_IMG = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80";
const PERKS = [["lock", "Secure Payments"], ["award", "Premium Quality"], ["truck", "Fast Delivery"]];

function HeroMedia({ pick }) {
  return (
    <div className="home-hero__media">
      <img src={HERO_IMG} alt="A calm living room styled with a linen sofa, ceramics and a woven pendant light" width="1200" height="900" fetchPriority="high" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      {pick && (
        <Link to={productUrl(pick)} className="home-hero__pick" aria-label={`Shop ${pick.product_name}`}>
          <span className="home-hero__pick-img"><ProductImage src={pick.thumbnail} alt="" sizes="72px" name={pick.product_name} /></span>
          <span className="home-hero__pick-copy">
            <span className="home-hero__pick-label">Editor’s pick</span>
            <span className="home-hero__pick-name">{pick.product_name}</span>
            <span className="home-hero__pick-price">{money(pick.sale_price ?? pick.regular_price)}</span>
          </span>
          <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  );
}

function PromoTiles({ deal, fresh }) {
  return (
    <div className="promo-row">
      <article className="promo-tile promo-tile--deal">
        <div className="promo-tile__copy">
          <span className="promo-tile__eyebrow">Deal of the Day</span>
          <h3>Up to 60% Off</h3>
          <p>On selected items only. While stock lasts.</p>
          <Link to="/sale" className="promo-tile__cta">Shop Deals <Icon name="arrowRight" size={15} /></Link>
        </div>
        <div className="promo-tile__media">
          {deal ? <ProductImage src={deal.thumbnail} alt="" sizes="220px" name={deal.product_name} /> : null}
        </div>
      </article>

      <article className="promo-tile promo-tile--fresh">
        <div className="promo-tile__copy">
          <span className="promo-tile__eyebrow">New Arrivals</span>
          <h3>Fresh Finds</h3>
          <p>Check out the latest products just for you.</p>
          <Link to="/new-arrivals" className="promo-tile__cta">Explore Now <Icon name="arrowRight" size={15} /></Link>
        </div>
        <div className="promo-tile__media">
          {fresh ? <ProductImage src={fresh.thumbnail} alt="" sizes="220px" name={fresh.product_name} /> : null}
        </div>
      </article>

      <article className="promo-tile promo-tile--member">
        <div className="promo-tile__copy">
          <span className="promo-tile__eyebrow">Member Exclusive</span>
          <h3>Extra 10% Off</h3>
          <p>On prepaid orders this weekend.</p>
          <Link to="/register" className="promo-tile__cta">Join &amp; Save <Icon name="arrowRight" size={15} /></Link>
        </div>
        <div className="promo-tile__coin" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <defs>
              <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f6e2ac" />
                <stop offset="0.45" stopColor="#d5b276" />
                <stop offset="1" stopColor="#9a7434" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill="url(#coin)" />
            <circle cx="60" cy="60" r="44" fill="none" stroke="#7d5c24" strokeOpacity="0.45" strokeWidth="1.4" strokeDasharray="2 4" />
            <text x="60" y="71" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="34" fontWeight="800" fill="#5a4118">%</text>
          </svg>
        </div>
      </article>
    </div>
  );
}

export default function Home() {
  useSeo({ title: "Everything You Love, All in One Place", description: "Shop quality fashion, accessories, beauty and home at StyleUp — everyday essentials, unbeatable prices and a seamless experience.", path: "/", jsonLd: { "@context": "https://schema.org", "@type": "WebSite", name: "StyleUp", url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), potentialAction: { "@type": "SearchAction", target: `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } } });
  const cats = useMemo(() => allCategories(), []);
  const trending = useMemo(() => bestSellers(10), []);
  const recommended = useMemo(() => newArrivals(10), []);
  const deal = useMemo(() => trending.find((p) => p.sale_status) || trending[0] || ALL_PRODUCTS[0], [trending]);
  const fresh = recommended[2] || recommended[0];
  const pick = useMemo(() => ALL_PRODUCTS.find((p) => p.slug === "classic-satchel-bag") || trending[0], [trending]);

  return (
    <div className="home">
      {/* ---------- HERO ---------- */}
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="container">
          <div className="home-hero__inner">
            <div className="home-hero__copy">
              <span className="eyebrow">Quality. Style. Everyday.</span>
              <h1 className="home-hero__title" id="hero-title">Everything You Love,<br /><span>All in One Place.</span></h1>
              <p className="home-hero__sub">Shop top-quality products across all categories with unbeatable prices and a seamless experience.</p>
              <div className="home-hero__actions">
                <Button to="/shop" size="lg" iconRight="arrowRight">Shop Now</Button>
              </div>
              <ul className="home-hero__perks">{PERKS.map(([ic, t]) => <li key={t}><Icon name={ic} size={17} />{t}</li>)}</ul>
            </div>
            <HeroMedia pick={pick} />
          </div>
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      <section className="home-block" aria-labelledby="cats-title">
        <div className="container">
          <SectionHead title="Shop by Category" to="/categories" linkLabel="View all categories" h="h2" />
          <div className="cat-cards">{cats.map((c) => <CategoryCard key={c.slug} category={c} />)}</div>
        </div>
      </section>

      {/* ---------- PROMOS ---------- */}
      <section className="home-block" aria-label={`${SALE_CAMPAIGN.name} and member offers`}>
        <div className="container"><PromoTiles deal={deal} fresh={fresh} /></div>
      </section>

      {/* ---------- TRENDING ---------- */}
      <section className="home-block home-block--products" aria-labelledby="trending-title">
        <div className="container">
          <SectionHead title="Trending Now" to="/best-sellers" linkLabel="View all products" />
          <div className="product-grid product-grid--home">{trending.map((p, i) => <ProductCard key={p.product_id} product={p} eager={i < 5} />)}</div>
        </div>
      </section>

      {/* ---------- TRUST ---------- */}
      <div className="home-trust"><div className="container"><TrustGrid items={TRUST} /></div></div>

      {/* ---------- RECOMMENDED ---------- */}
      <section className="home-block home-block--products" aria-labelledby="reco-title">
        <div className="container">
          <SectionHead title="Recommended for You" to="/new-arrivals" linkLabel="View all recommendations" />
          <div className="product-grid product-grid--home">{recommended.map((p) => <ProductCard key={p.product_id} product={p} />)}</div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
}
