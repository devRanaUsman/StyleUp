import { useMemo } from "react";
import { Link } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../components/ui/Icon";
import { Breadcrumb, Button, EmptyState, Price, ProductBadges, ProductImage, Rating } from "../components/ui";
import { toast } from "../components/ui/Overlays";
import { ProductGrid, useAddToCart } from "../components/product/ProductCard";
import { useSeo } from "../hooks/useSeo";
import { getProductsByIds, productUrl, bestSellers } from "../services/catalogService";
import { selectWishlistIds, wishlistActions } from "../store/wishlistSlice";
import { uiActions } from "../store/uiSlice";

function WishCard({ product }) {
  const dispatch = useDispatch();
  const addToCart = useAddToCart();
  const out = product.availability === "out_of_stock";
  const simple = product.colors.length <= 1 && product.sizes.length <= 1;
  const move = () => {
    if (out) return;
    if (simple) { const r = addToCart(product, { color: product.colors[0]?.name, size: product.sizes[0], openDrawer: true }); if (r.ok) dispatch(wishlistActions.remove(product.product_id)); }
    else dispatch(uiActions.openModal({ type: "quickview", slug: product.slug }));
  };
  const remove = () => { dispatch(wishlistActions.remove(product.product_id)); toast(dispatch, "Removed from wishlist", { action: { label: "Undo", onClick: () => dispatch(wishlistActions.toggle(product.product_id)) } }); };
  const avail = product.availability === "out_of_stock" ? ["out", "Out of stock"] : product.availability === "low_stock" ? ["low", `Only ${product.stock_quantity} left`] : ["in", "In stock"];
  return (
    <article className="pcard wl-card">
      <div className="pcard__top">
      <Link to={productUrl(product)} className="pcard__media"><ProductImage src={product.thumbnail} srcSet={product.images[0]?.srcset} alt={product.images[0]?.alt} name={product.product_name} className="pcard__img pcard__img--main" /><div className="pcard__badges"><ProductBadges product={product} /></div></Link>
      <button type="button" className="pcard__wish is-on" aria-label={`Remove ${product.product_name} from wishlist`} onClick={remove}><Icon name="heart" size={18} /></button>
      </div>
      <div className="pcard__body">
        <Link to={productUrl(product)} className="pcard__name">{product.product_name}</Link>
        <Price product={product} />
        {product.review_count > 0 && <Rating value={product.rating} count={product.review_count} />}
        <span className={`wl-avail wl-avail--${avail[0]}`}>{avail[1]}</span>
        <div className="wl-card__actions"><Button size="sm" onClick={move} disabled={out}>{out ? "Sold out" : simple ? "Move to cart" : "Choose options"}</Button><Button size="sm" variant="secondary" onClick={remove} aria-label={`Remove ${product.product_name}`}>Remove</Button></div>
      </div>
    </article>
  );
}

export default function Wishlist() {
  useSeo({ title: "Wishlist", noindex: true });
  const ids = useSelector(selectWishlistIds);
  const products = useMemo(() => getProductsByIds(ids), [ids]);
  const suggest = useMemo(() => bestSellers(4), []);
  return (
    <div className="page container">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Wishlist", to: "/wishlist" }]} />
      <div className="page-head"><h1 className="h1">Wishlist</h1>{products.length > 0 && <p className="lead">{products.length} saved {products.length === 1 ? "item" : "items"}. Saved on this device — sign in to keep them across devices.</p>}</div>
      {products.length === 0 ? (
        <>
          <EmptyState icon="heart" title="Save your favorites here." text="Tap the heart on any product to keep it for later." actions={<Button to="/shop">Explore Products</Button>} />
          <h2 className="h3" style={{ margin: "24px 0 20px" }}>Popular picks</h2><ProductGrid products={suggest} />
        </>
      ) : <div className="product-grid">{products.map((p) => <WishCard key={p.product_id} product={p} />)}</div>}
    </div>
  );
}
