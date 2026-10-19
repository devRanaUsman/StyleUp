import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../ui/Icon";
import { Button, Price, ProductImage, Quantity, Rating, SizeSelector, Swatches } from "../ui";
import { Modal, toast } from "../ui/Overlays";
import { uiActions } from "../../store/uiSlice";
import { selectInWishlist, wishlistActions } from "../../store/wishlistSlice";
import { getProductSync, productUrl, variantStock, colorHasStock, sizeHasStock } from "../../services/catalogService";
import { useAddToCart } from "./ProductCard";
import { money } from "../../utils/format";
import engagementService from "../../services/engagementService";

/** Everything below the price: color, size, quantity, stock message and CTA. */
export function VariantSelector({ product, compact, onAdded, showWishlist = true }) {
  const dispatch = useDispatch();
  const addToCart = useAddToCart();
  const hasColors = product.colors.length > 0;
  const hasSizes = product.sizes.length > 0;
  const [color, setColor] = useState(() => product.colors.find((c) => colorHasStock(product, c.name))?.name || product.colors[0]?.name || null);
  const [size, setSize] = useState(() => (product.sizes.length === 1 ? product.sizes[0] : null));
  const [qty, setQty] = useState(1);
  const [touched, setTouched] = useState(false);
  const [notify, setNotify] = useState("");
  const [notified, setNotified] = useState(false);
  const wished = useSelector(selectInWishlist(product.product_id));
  useEffect(() => { setQty(1); setTouched(false); }, [color, size]);

  const stock = useMemo(() => (hasSizes && !size ? null : variantStock(product, color, size)), [product, color, size, hasSizes]);
  const selectedOut = stock === 0;
  const productOut = product.availability === "out_of_stock";
  const needsSize = hasSizes && !size;
  const canAdd = !productOut && !selectedOut && !needsSize;
  const stockLabel = productOut || (selectedOut && !needsSize) ? "Out of stock" : stock == null ? "" : stock < 5 ? `Only ${stock} left` : "In stock";
  const stockTone = productOut || selectedOut ? "out" : stock != null && stock < 5 ? "low" : "in";

  const add = () => {
    if (needsSize) { setTouched(true); document.querySelector('.sizes [role="radio"]')?.focus(); return; }
    const r = addToCart(product, { color, size, qty, openDrawer: true });
    if (r.ok) onAdded?.();
  };
  const notifyMe = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(notify)) { toast(dispatch, "Please enter a valid email address.", { type: "error" }); return; }
    try {
      await engagementService.notifyAvailability({ email: notify.trim().toLowerCase(), product_id: product.product_id, color, size });
      setNotified(true);
      toast(dispatch, "We'll email you when it's back.", { type: "success" });
    } catch (err) { toast(dispatch, err.message || "We couldn't save that alert. Please try again.", { type: "error" }); }
  };

  return (
    <div className="pdp__info" style={compact ? { position: "static", gap: 16 } : undefined}>
      {hasColors && (
        <div className="pdp__option">
          <div className="pdp__option-label">Color: <span>{color}</span></div>
          <Swatches colors={product.colors} value={color} onChange={setColor} disabledCheck={(n) => colorHasStock(product, n)} />
        </div>
      )}
      {hasSizes && (
        <div className="pdp__option">
          <div className="pdp__option-label">Size: <span>{size || "Select a size"}</span>{product.sizes.length > 1 && <button type="button" className="link-btn" onClick={() => dispatch(uiActions.openModal({ type: "sizeguide", category: product.category }))}><Icon name="ruler" size={13} />Size guide</button>}</div>
          <SizeSelector sizes={product.sizes} value={size} onChange={setSize} available={(s) => sizeHasStock(product, color, s)} />
          {touched && needsSize && <span className="field__error" role="alert"><Icon name="alert" size={13} />Please select a size.</span>}
        </div>
      )}
      {stockLabel && <span className={`pdp__stock pdp__stock--${stockTone}`} aria-live="polite">{stockLabel}</span>}
      {productOut || (selectedOut && !needsSize) ? (
        notified ? <div className="notice notice--success"><Icon name="check" size={16} />You're on the list. We'll let you know as soon as it's back.</div> : (
          <form className="pdp__option" onSubmit={notifyMe}>
            <label className="field__label" htmlFor={`notify-${product.product_id}`}>Notify me when available</label>
            <div className="row" style={{ gap: 8 }}><input id={`notify-${product.product_id}`} type="email" className="input" placeholder="Your email" value={notify} onChange={(e) => setNotify(e.target.value)} style={{ flex: 1, minWidth: 0 }} /><Button type="submit" variant="secondary">Notify me</Button></div>
          </form>
        )
      ) : (
        <>
          <div className="pdp__option"><div className="pdp__option-label">Quantity</div><Quantity value={qty} max={stock ?? 99} onChange={setQty} /></div>
          <div className="pdp__buy">
            <Button size="lg" onClick={add} disabled={!canAdd && !needsSize} aria-disabled={!canAdd ? "true" : undefined} icon="bag">Add to cart</Button>
            {showWishlist && <button type="button" className={`pdp__wish ${wished ? "is-on" : ""}`} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Save to wishlist"} onClick={() => { dispatch(wishlistActions.toggle(product.product_id)); toast(dispatch, wished ? "Removed from wishlist" : "Saved to wishlist", { type: wished ? "info" : "success", icon: "heart" }); }}><Icon name="heart" size={20} /></button>}
          </div>
        </>
      )}
    </div>
  );
}

export default function QuickViewModal() {
  const modal = useSelector((s) => s.ui.modal);
  const dispatch = useDispatch();
  const close = () => dispatch(uiActions.closeModal());
  const product = modal?.type === "quickview" ? getProductSync(modal.slug) : null;
  return (
    <>
      <Modal open={!!product} onClose={close} width="820px" labelledBy="qv-title">
        {product && (
          <div className="quick">
            <div className="quick__img"><ProductImage src={product.thumbnail} srcSet={product.images[0]?.srcset} sizes="400px" alt={product.images[0]?.alt} eager name={product.product_name} /></div>
            <div className="quick__body">
              <div>
                <div className="pdp__brand">{product.brand}</div>
                <h2 className="h3" id="qv-title" style={{ marginTop: 4 }}>{product.product_name}</h2>
                <div className="row" style={{ marginTop: 8, gap: 12, flexWrap: "wrap" }}><Price product={product} size="lg" />{product.review_count > 0 && <Rating value={product.rating} count={product.review_count} />}</div>
              </div>
              <p className="small muted">{product.short_description}</p>
              <VariantSelector product={product} compact onAdded={close} />
              <Link to={productUrl(product)} className="link small" onClick={close}>View full details</Link>
            </div>
          </div>
        )}
      </Modal>
      <SizeGuideModal open={modal?.type === "sizeguide"} category={modal?.category} onClose={close} />
    </>
  );
}

const CLOTH = [["XS", "80–84", "62–66", "86–90"], ["S", "84–88", "66–70", "90–94"], ["M", "88–92", "70–74", "94–98"], ["L", "92–98", "74–80", "98–104"], ["XL", "98–104", "80–88", "104–110"], ["XXL", "104–112", "88–96", "110–118"]];
const MEN = [["XS", "84–88", "72–76"], ["S", "88–94", "76–82"], ["M", "94–100", "82–88"], ["L", "100–106", "88–94"], ["XL", "106–112", "94–100"], ["XXL", "112–120", "100–108"]];
const SHOES = [["36", "23.0", "5", "3.5"], ["37", "23.7", "6", "4"], ["38", "24.3", "7", "5"], ["39", "25.0", "8", "6"], ["40", "25.7", "9", "6.5"], ["41", "26.3", "10", "7.5"], ["42", "27.0", "9 (M)", "8"], ["43", "27.7", "10 (M)", "9"], ["44", "28.3", "11 (M)", "10"], ["45", "29.0", "12 (M)", "11"]];

export function SizeGuideModal({ open, category, onClose }) {
  const isShoes = category === "Shoes";
  const isMen = category === "Men";
  return (
    <Modal open={open} onClose={onClose} title="Size guide" width="640px">
      <p className="small muted" style={{ marginBottom: 16 }}>{isShoes ? "Measure your foot from heel to longest toe and compare below. If you're between sizes, size up." : "Measure over light clothing, keeping the tape snug but not tight. All measurements in centimetres."}</p>
      <div className="size-table" style={{ marginBottom: 12 }}>
        {isShoes ? (
          <table><thead><tr><th>EU</th><th>Foot length (cm)</th><th>US</th><th>UK</th></tr></thead><tbody>{SHOES.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table>
        ) : isMen ? (
          <table><thead><tr><th>Size</th><th>Chest</th><th>Waist</th></tr></thead><tbody>{MEN.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table>
        ) : (
          <table><thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hips</th></tr></thead><tbody>{CLOTH.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table>
        )}
      </div>
      <Link to="/size-guide" className="link small" onClick={onClose}>Full size guide and fit tips</Link>
    </Modal>
  );
}

export { money };
