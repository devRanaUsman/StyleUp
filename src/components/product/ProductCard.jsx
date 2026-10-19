import { useRef, useState } from "react";
import { Link } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../ui/Icon";
import { Button, Price, ProductBadges, ProductImage, Rating } from "../ui";
import { productUrl, variantStock } from "../../services/catalogService";
import { wishlistActions, selectInWishlist } from "../../store/wishlistSlice";
import { cartActions } from "../../store/cartSlice";
import { uiActions } from "../../store/uiSlice";
import { toast } from "../ui/Overlays";

/** Shared: add a product to cart with variant validation + drawer + toast. */
export function useAddToCart() {
  const dispatch = useDispatch();
  return (product, { color, size, qty = 1, openDrawer = true } = {}) => {
    const needsColor = product.colors.length > 0 && !color;
    const needsSize = product.sizes.length > 0 && !size;
    if (needsColor || needsSize) return { ok: false, reason: "options" };
    const stock = variantStock(product, color ?? null, size ?? null);
    if (stock <= 0) { toast(dispatch, "That option is out of stock.", { type: "error" }); return { ok: false, reason: "stock" }; }
    dispatch(cartActions.addItem({ product, color: color ?? null, size: size ?? null, qty, maxStock: stock }));
    if (openDrawer) dispatch(uiActions.openCart());
    else toast(dispatch, `${product.product_name} added to cart`, { type: "success", action: { label: "View cart", onClick: () => dispatch(uiActions.openCart()) } });
    return { ok: true };
  };
}

export function WishlistButton({ product, className = "pcard__wish", size = 18 }) {
  const dispatch = useDispatch();
  const on = useSelector(selectInWishlist(product.product_id));
  const [pop, setPop] = useState(false);
  const toggle = (e) => {
    e.preventDefault(); e.stopPropagation();
    dispatch(wishlistActions.toggle(product.product_id));
    setPop(true); setTimeout(() => setPop(false), 320);
    toast(dispatch, on ? "Removed from wishlist" : "Saved to wishlist", { type: on ? "info" : "success", icon: "heart", action: on ? undefined : { label: "View", onClick: () => (window.location.href = "/wishlist") } });
  };
  return (
    <button type="button" className={`${className} ${on ? "is-on" : ""} ${pop ? "is-pop" : ""}`} aria-pressed={on} aria-label={on ? `Remove ${product.product_name} from wishlist` : `Add ${product.product_name} to wishlist`} onClick={toggle}>
      <Icon name="heart" size={size} />
    </button>
  );
}

export default function ProductCard({ product, eager, full, onQuickView }) {
  const url = productUrl(product);
  const addToCart = useAddToCart();
  const dispatch = useDispatch();
  const out = product.availability === "out_of_stock";
  const simple = product.colors.length <= 1 && product.sizes.length <= 1; // can be added directly
  const quickAdd = (e) => {
    e.preventDefault();
    if (out) return;
    if (simple) addToCart(product, { color: product.colors[0]?.name, size: product.sizes[0], openDrawer: true });
    else dispatch(uiActions.openModal({ type: "quickview", slug: product.slug }));
  };
  const [hoverOk, setHoverOk] = useState(true);
  const hasHover = Boolean(product.hover_image) && hoverOk;
  return (
    <article className={`pcard ${full ? "pcard--full" : ""}`}>
      <div className="pcard__top">
        <Link to={url} className="pcard__media" aria-label={product.product_name} tabIndex={-1}>
          <ProductImage src={product.thumbnail} srcSet={product.images[0]?.srcset} alt={product.images[0]?.alt || product.product_name} eager={eager} name={product.product_name} className={`pcard__img pcard__img--main ${hasHover ? "has-hover" : ""}`} />
          {hasHover && <img src={product.hover_image} alt="" loading="lazy" decoding="async" className="pcard__img pcard__img--hover" aria-hidden="true" onError={() => setHoverOk(false)} />}
          <div className="pcard__badges"><ProductBadges product={product} /></div>
        </Link>
        <WishlistButton product={product} />
      </div>
      <div className="pcard__body">
        <h3 style={{ fontSize: "inherit", fontWeight: "inherit" }}><Link to={url} className="pcard__name">{product.product_name}</Link></h3>
        <div className="pcard__cat">{product.subcategory}{full && product.category ? ` · ${product.category}` : ""}</div>
        {product.review_count > 0 && <Rating value={product.rating} count={product.review_count} />}
        <div className="pcard__foot">
          <Price product={product} />
          <button type="button" className="pcard__add" aria-label={out ? `${product.product_name} is sold out` : simple ? `Add ${product.product_name} to cart` : `Choose options for ${product.product_name}`} onClick={quickAdd} disabled={out}>
            <Icon name="cart" size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className = "product-grid", eagerCount = 4, onQuickView, full }) {
  return <div className={className}>{products.map((p, i) => <ProductCard key={p.product_id} product={p} eager={i < eagerCount} onQuickView={onQuickView} full={full} />)}</div>;
}

export function ProductCarousel({ products, title, sub, to, linkLabel = "View all", id, onQuickView }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ start: true, end: false });
  if (!products?.length) return null;
  const scroll = (dir) => { const el = ref.current; if (!el) return; el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" }); };
  const onScroll = () => { const el = ref.current; if (!el) return; setPos({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  return (
    <section className="pcarousel" aria-labelledby={id}>
      <div className="section-head">
        <div><h2 className="h2" id={id}>{title}</h2>{sub && <p className="sub">{sub}</p>}</div>
        <div className="row">
          {to && <Button variant="tertiary" to={to} iconRight="arrowRight">{linkLabel}</Button>}
          <div className="pcarousel__nav">
            <button type="button" className="pcarousel__btn" aria-label="Scroll left" disabled={pos.start} onClick={() => scroll(-1)}><Icon name="chevronLeft" size={18} /></button>
            <button type="button" className="pcarousel__btn" aria-label="Scroll right" disabled={pos.end} onClick={() => scroll(1)}><Icon name="chevronRight" size={18} /></button>
          </div>
        </div>
      </div>
      <div className="pcarousel__track" ref={ref} onScroll={onScroll}>{products.map((p) => <ProductCard key={p.product_id} product={p} onQuickView={onQuickView} />)}</div>
    </section>
  );
}

export function CategoryCard({ category }) {
  return (
    <Link to={`/${category.slug}`} className="cat-card">
      <span className="cat-card__img"><ProductImage src={category.image} alt="" sizes="150px" name={category.name} /></span>
      <span className="cat-card__name">{category.name}</span>
      <span className="cat-card__count">{Math.floor(category.count / 10) * 10}+ items</span>
    </Link>
  );
}

export function CollectionCard({ collection }) {
  return (
    <Link to={`/collections/${collection.slug}`} className="coll-card">
      <ProductImage src={collection.image} alt="" sizes="(min-width: 1280px) 16vw, (min-width: 768px) 33vw, 50vw" name={collection.name} />
      <span className="coll-card__copy"><span className="coll-card__name">{collection.name}</span><span className="coll-card__desc">{collection.description}</span><span className="coll-card__cta">Shop the edit <Icon name="arrowRight" size={12} /></span></span>
    </Link>
  );
}
