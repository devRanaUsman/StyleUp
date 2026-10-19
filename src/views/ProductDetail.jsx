"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../components/ui/Icon";
import { Accordion, Breadcrumb, Button, EmptyState, Price, Rating, SkeletonLines, Input, Textarea } from "../components/ui";
import { Modal, toast } from "../components/ui/Overlays";
import Gallery from "../components/product/Gallery";
import { VariantSelector } from "../components/product/QuickView";
import { ProductCarousel } from "../components/product/ProductCard";
import { useSeo, breadcrumbLd, productLd } from "../hooks/useSeo";
import { getProduct, productUrl, related, completeTheLook, getProductsByIds } from "../services/catalogService";
import { uiActions } from "../store/uiSlice";
import { money, deliveryWindow, relDate } from "../utils/format";
import NotFound from "./NotFound";
import engagementService from "../services/engagementService";

const WHY = {
  Women: [["award", "Premium quality", "Crafted from carefully selected materials."], ["layers", "Easy layering", "Designed to work with what you already own."], ["compass", "Versatile design", "Suitable for work, weekends and everything between."], ["clock", "Timeless style", "Clean lines made to stay relevant beyond seasons."]],
  Men: [["award", "Premium quality", "Carefully chosen fabrics with a considered finish."], ["layers", "Easy layering", "Clean silhouettes that pair with the rest of your wardrobe."], ["compass", "Versatile design", "From the office to the weekend without changing."], ["clock", "Timeless style", "Made to be worn often, for years."]],
  Bags: [["award", "Premium quality", "Crafted from carefully selected materials."], ["box", "Spacious & organised", "Practical compartments for everyday essentials."], ["compass", "Versatile design", "Suitable for work, casual outings and events."], ["clock", "Timeless style", "Clean design created to remain relevant beyond seasons."]],
  Shoes: [["award", "Premium quality", "Uppers and soles chosen to last."], ["heart", "All-day comfort", "Cushioned footbed and a fit refined over seasons."], ["compass", "Versatile design", "Pairs with tailoring and denim alike."], ["clock", "Timeless style", "Classic shapes you'll reach for often."]],
  Accessories: [["award", "Premium quality", "Finished by hand in small batches."], ["gift", "Gift ready", "Arrives in an StyleUp pouch."], ["compass", "Versatile design", "Wear it with everything."], ["clock", "Timeless style", "Small details that outlast trends."]],
  Beauty: [["leaf", "Plant-based", "Botanical formulas, tested on real skin."], ["shield", "Gentle", "Free from parabens, sulphates and synthetic fragrance."], ["refresh", "Recyclable", "Glass and post-consumer plastic packaging."], ["sparkle", "Daily ritual", "Made for everyday use."]],
  "Home & Living": [["award", "Made with care", "Finished by hand — small variations are part of it."], ["leaf", "Natural materials", "Stoneware, linen, soy wax and oak."], ["home", "Warm neutrals", "Designed to sit calmly with the rest of the collection."], ["clock", "Timeless style", "Pieces that stay in your home for years."]],
};

function ReviewForm({ product, onClose }) {
  const dispatch = useDispatch();
  const [v, setV] = useState({ rating: 5, title: "", text: "", name: "" });
  const [err, setErr] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!v.name.trim()) er.name = "Name is required.";
    if (!v.title.trim()) er.title = "Add a short title.";
    if (v.text.trim().length < 20) er.text = "Tell us a little more (at least 20 characters).";
    setErr(er);
    if (Object.keys(er).length) return;
    setSubmitting(true);
    try {
      await engagementService.review({ product_id: product.product_id, rating: v.rating, title: v.title.trim(), text: v.text.trim(), author: v.name.trim() });
      toast(dispatch, "Thanks — your review is awaiting moderation.", { type: "success" });
      onClose();
    } catch (e) { toast(dispatch, e.message || "We couldn't submit your review. Please try again.", { type: "error" }); }
    finally { setSubmitting(false); }
  };
  return (
    <form onSubmit={submit} className="form-grid" noValidate>
      <div className="field"><span className="field__label">Your rating</span><div className="rating__stars" role="radiogroup" aria-label="Rating" style={{ gap: 4 }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={v.rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setV({ ...v, rating: n })} style={{ color: "var(--green)" }}><Icon name="star" size={26} style={{ fill: n <= v.rating ? "currentColor" : "none" }} /></button>)}</div></div>
      <Input label="Your name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={err.name} autoComplete="name" />
      <Input label="Review title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} error={err.title} />
      <Textarea label="Your review" value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} error={err.text} hint={`Reviewing ${product.product_name}`} />
      <div className="row"><Button type="submit" loading={submitting}>Submit review</Button><Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button></div>
    </form>
  );
}

export default function ProductDetail({initialProduct}) {
  const { category, subcategory, slug } = useParams();
  const dispatch = useDispatch();
  const recentIds = useSelector((s) => s.ui.recentlyViewed);
  const [product, setProduct] = useState(initialProduct); // undefined=loading, null=404
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [review, setReview] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef(null);
  const reviewsRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setProduct(undefined);
    setLoadError("");
    getProduct(slug)
      .then((p) => { if (alive) setProduct(p); })
      .catch(() => { if (alive) { setProduct(undefined); setLoadError("We couldn't load this product. Check your connection and try again."); } });
    return () => { alive = false; };
  }, [slug, retryKey]);
  useEffect(() => { if (product) dispatch(uiActions.addRecentlyViewed(product.product_id)); }, [product?.product_id]);
  useEffect(() => {
    const el = ctaRef.current; if (!el || !("IntersectionObserver" in window)) return;
    const ob = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    ob.observe(el); return () => ob.disconnect();
  }, [product?.product_id]);

  const url = product ? productUrl(product) : "";
  const crumbs = product ? [{ label: "Home", to: "/" }, { label: product.category, to: `/${product.category_slug}` }, { label: product.subcategory, to: `/${product.category_slug}/${product.subcategory_slug}` }, { label: product.product_name, to: url }] : [];
  useSeo(product ? { title: product.product_name, description: product.short_description, path: url, image: product.thumbnail, type: "product", jsonLd: [productLd(product, url), breadcrumbLd(crumbs)] } : { title: product === null ? "Not found" : "Loading…" });

  const relatedList = useMemo(() => (product ? related(product, 10) : []), [product]);
  const lookList = useMemo(() => (product ? completeTheLook(product, 6) : []), [product]);
  const recent = useMemo(() => getProductsByIds(recentIds.filter((id) => id !== product?.product_id)).slice(0, 8), [recentIds, product]);

  if (product === null) return <NotFound />;
  if (loadError) return (
    <div className="page container"><EmptyState icon="alert" title="We couldn't load this product" text={loadError} actions={<><Button onClick={() => setRetryKey((x) => x + 1)}>Try again</Button><Button variant="secondary" to="/shop">Browse products</Button></>} /></div>
  );
  if (!product) return (
    <div className="page container" role="status" aria-live="polite"><div style={{ height: 48 }} /><div className="pdp"><div className="skel" style={{ aspectRatio: "4/5", borderRadius: 14 }} /><div><SkeletonLines n={6} w={["40%", "80%", "30%", "60%", "100%", "100%"]} /></div></div><span className="sr-only">Loading product details</span></div>
  );
  // Wrong category/subcategory in URL: still render but canonical points to the right one (handled by useSeo path)
  const badge = product.new_arrival ? "New arrival" : product.best_seller ? "Best seller" : product.sale_status ? `Save ${product.discount_percentage}%` : null;
  const price = product.sale_price ?? product.regular_price;
  const dist = product.rating_distribution || {};
  const why = WHY[product.category] || WHY.Women;
  const specs = [["Material", product.materials, "layers"], product.dimensions && ["Dimensions", product.dimensions, "ruler"], product.weight && ["Weight", product.weight, "box"], product.colors.length && ["Colors", product.colors.map((c) => c.name).join(", "), "sparkle"], product.sizes.length && ["Sizes", product.sizes.join(", "), "ruler"], ["Care", product.care_instructions, "refresh"], ["SKU", product.SKU, "info"]].filter(Boolean);
  const delivery = deliveryWindow();

  return (
    <div className="page container">
      <Breadcrumb items={crumbs} />
      <div className="pdp">
        <Gallery product={product} />
        <div className="pdp__info">
          <div>
            {badge && <span className={`badge ${product.new_arrival ? "badge--new" : product.sale_status ? "badge--sale" : "badge--best"}`} style={{ marginBottom: 12 }}>{badge}</span>}
            <div className="pdp__brand">{product.brand}</div>
            <h1 className="pdp__title">{product.product_name}</h1>
            <div className="pdp__rating-row" style={{ marginTop: 10 }}>
              {product.review_count > 0 ? <><Rating value={product.rating} count={product.review_count} showValue /><a href="#reviews" onClick={(e) => { e.preventDefault(); reviewsRef.current?.scrollIntoView({ behavior: "smooth" }); }}>Read reviews</a></> : <span className="small muted">No reviews yet</span>}
            </div>
          </div>
          <div>
            <Price product={product} size="lg" />
          </div>
          <div ref={ctaRef}><VariantSelector product={product} /></div>
          <ul className="pdp__trust">
            <li><Icon name="truck" size={20} /><b>Free shipping</b>On orders over $50</li>
            <li><Icon name="refresh" size={20} /><b>Easy returns</b>30-day returns</li>
            <li><Icon name="lock" size={20} /><b>Secure checkout</b>Pay on delivery</li>
          </ul>
          <ul className="pdp__delivery">
            <li><Icon name="package" size={16} /><span><b>Estimated delivery:</b> {delivery} with standard shipping. Express available at checkout.</span></li>
            <li><Icon name="refresh" size={16} /><span><b>Free returns</b> within 30 days of delivery, no questions asked.</span></li>
          </ul>
          <div className="pdp__sku">SKU {product.SKU}</div>
        </div>
      </div>

      <div className="pdp__sections">
        <div className="pdp__two">
          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>About this piece</h2>
            <Accordion defaultOpen={[0]} items={[
              { title: "Product description", content: <><p>{product.short_description}</p><p>{product.full_description}</p></> },
              { title: "Details", content: <><p>Brand: {product.brand}. Collection: {product.collection || "Core range"}.</p><p>Tags: {product.tags.join(", ")}.</p></> },
              { title: "Materials", content: <p>{product.materials}.</p> },
              product.dimensions ? { title: "Dimensions", content: <p>{product.dimensions}{product.weight ? ` · Approx. ${product.weight}` : ""}</p> } : null,
              { title: "Care instructions", content: <p>{product.care_instructions}</p> },
              { title: "Shipping", content: <><p>Free standard shipping on orders over $50. Standard delivery takes 3–6 business days; express delivery 1–2 business days.</p><p><Link to="/shipping" className="link">Read our shipping policy</Link></p></> },
              { title: "Returns", content: <><p>Return any item within 30 days of delivery for a full refund. Items must be unworn with tags attached.</p><p><Link to="/returns" className="link">How returns work</Link></p></> },
            ]} />
          </div>
          <div>
            <h2 className="h3" style={{ marginBottom: 16 }}>Why you'll love it</h2>
            <div className="why" style={{ marginBottom: 24 }}>{why.map(([ic, t, tx]) => <div key={t} className="why__item"><span className="why__icon"><Icon name={ic} size={20} /></span><div><div className="why__title">{t}</div><div className="why__text">{tx}</div></div></div>)}</div>
            <dl className="specs">{specs.map(([k, v, ic]) => <div key={k} className="specs__row"><dt><Icon name={ic} size={15} />{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        </div>

        <div className="ship-cards">
          <div className="ship-card"><Icon name="truck" size={22} /><div><b>Free Shipping</b><span>On orders above $50</span></div></div>
          <div className="ship-card"><Icon name="refresh" size={22} /><div><b>Easy 30-Day Returns</b><span>Simple return process</span></div></div>
          <div className="ship-card"><Icon name="lock" size={22} /><div><b>Secure Checkout</b><span>Pay on delivery</span></div></div>
        </div>

        <section id="reviews" ref={reviewsRef} aria-labelledby="reviews-title" style={{ scrollMarginTop: 100 }}>
          <div className="reviews__head">
            <div><h2 className="h2" id="reviews-title">Customer reviews</h2>{product.review_count > 0 && <div className="reviews__avg" style={{ marginTop: 12 }}><span className="big">{product.rating.toFixed(1)}<span className="muted" style={{ fontSize: "1rem", fontFamily: "var(--font-sans)" }}> out of 5</span></span><Rating value={product.rating} size="lg" hideCount /><span className="small muted">Based on {product.review_count.toLocaleString()} reviews</span></div>}</div>
            {product.review_count > 0 && <div className="reviews__dist">{[5, 4, 3, 2, 1].map((n) => <div key={n} className="reviews__bar"><span>{n} star</span><div className="progress"><div className="progress__bar" style={{ width: `${((dist[n] || 0) / product.review_count) * 100}%` }} /></div><span>{dist[n] || 0}</span></div>)}</div>}
            <div><Button variant="secondary" onClick={() => setReview(true)}>Write a review</Button></div>
          </div>
          {product.reviews.length ? (
            <div className="reviews__list">{product.reviews.map((r) => (
              <article key={r.id} className="review">
                <div className="review__meta"><span className="review__avatar" aria-hidden="true">{r.author.slice(0, 1)}</span><span className="review__author">{r.author}</span>{r.verified && <span className="review__verified"><Icon name="check" size={12} strokeWidth={3} />Verified buyer</span>}</div>
                <Rating value={r.rating} hideCount />
                <div className="review__title">{r.title}</div>
                <p className="review__text">{r.text}</p>
                <span className="review__date">{relDate(r.date)}</span>
              </article>
            ))}</div>
          ) : <p className="muted">Be the first to review this product.</p>}
        </section>

        <ProductCarousel id="related-title" title="You may also like" products={relatedList} />
        {lookList.length > 0 && <ProductCarousel id="look-title" title="Complete the look" products={lookList} />}
        {recent.length > 0 && <ProductCarousel id="recent-title" title="Recently viewed" products={recent} />}
      </div>

      {/* Sticky mobile buy bar */}
      <div className={`buybar ${showBar ? "is-visible" : ""}`} aria-hidden={!showBar}>
        <div><div className="buybar__price">{money(price)}</div><div className="buybar__sub">{product.product_name}</div></div>
        <Button onClick={() => { ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} tabIndex={showBar ? 0 : -1}>{product.availability === "out_of_stock" ? "Notify me" : "Add to cart"}</Button>
      </div>

      <Modal open={review} onClose={() => setReview(false)} title="Write a review"><ReviewForm product={product} onClose={() => setReview(false)} /></Modal>
    </div>
  );
}
