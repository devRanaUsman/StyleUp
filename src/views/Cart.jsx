import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../components/ui/Icon";
import { Breadcrumb, Button, EmptyState } from "../components/ui";
import { toast } from "../components/ui/Overlays";
import { CartLine, FreeShippingBar } from "../components/cart/CartDrawer";
import { ProductCarousel } from "../components/product/ProductCard";
import { useSeo } from "../hooks/useSeo";
import { cartActions, selectCartItems, selectCartTotals } from "../store/cartSlice";
import { PROMO_CODES } from "../data/catalog";
import { bestSellers } from "../services/catalogService";
import { money } from "../utils/format";

export function PromoForm({ subtotal: sub }) {
  const dispatch = useDispatch();
  const totals = useSelector(selectCartTotals);
  const subtotal = sub ?? totals.subtotal;
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const apply = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) { setErr("Enter a promo code."); return; }
    const p = PROMO_CODES[c];
    if (!p) { setErr("That code isn't valid. Check for typos and try again."); return; }
    if (p.expires && new Date(p.expires) < new Date()) { setErr("This code has expired."); return; }
    if (p.minSubtotal && subtotal < p.minSubtotal) { setErr(`Add ${money(p.minSubtotal - subtotal)} more to use this code.`); return; }
    dispatch(cartActions.applyPromo(c)); setErr(""); setCode(""); toast(dispatch, `${c} applied — ${p.label}`, { type: "success" });
  };
  if (totals.promoCode) return <div className="promo-applied"><span><Icon name="tag" size={14} /> <b>{totals.promoCode}</b> · {totals.promo?.label}</span><button type="button" onClick={() => dispatch(cartActions.removePromo())}>Remove</button></div>;
  return (
    <form className="field" onSubmit={apply} noValidate>
      <div className="promo-form" style={{ marginTop: 0 }}><label htmlFor="promo" className="sr-only">Promo code</label><input id="promo" className="input" placeholder="Promo code" value={code} onChange={(e) => { setCode(e.target.value); setErr(""); }} aria-invalid={err ? "true" : undefined} aria-describedby={err ? "promo-err" : undefined} /><Button type="submit" variant="secondary">Apply</Button></div>
      {err && <span className="field__error" id="promo-err" role="alert"><Icon name="alert" size={13} />{err}</span>}
    </form>
  );
}

export function OrderSummary({ totals, estimate }) {
  return <SummaryRows totals={totals} estimate={estimate} />;
}

export function SummaryRows({ totals, estimate }) {
  return (
    <div className="summary__rows">
      <div className="summary__row"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
      {totals.discount > 0 && <div className="summary__row summary__discount"><span>Discount{totals.promoCode ? ` (${totals.promoCode})` : ""}</span><span>−{money(totals.discount)}</span></div>}
      <div className="summary__row"><span>Shipping{estimate ? <span className="muted"> (standard)</span> : ""}</span><span>{!totals.shipping ? <span className="summary__discount">Free</span> : money(totals.shipping)}</span></div>
      <div className="summary__row"><span>Estimated tax</span><span>{money(totals.tax || 0)}</span></div>
      <div className="summary__row summary__row--total"><span>Total</span><span>{money(totals.total)}</span></div>
    </div>
  );
}

export default function Cart() {
  useSeo({ title: "Your cart", noindex: true });
  const items = useSelector(selectCartItems);
  const totals = useSelector(selectCartTotals);
  const recs = useMemo(() => bestSellers(10), []);
  const count = items.reduce((n, i) => n + i.qty, 0);
  return (
    <div className="page container">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Cart", to: "/cart" }]} />
      <div className="page-head"><h1 className="h1">Your cart</h1>{count > 0 && <p className="lead">{count} {count === 1 ? "item" : "items"}</p>}</div>
      {items.length === 0 ? (
        <>
          <EmptyState icon="cart" title="Your cart is currently empty." text="Looks like you haven't added anything yet. Let's fix that." actions={<><Button to="/shop">Continue Shopping</Button><Button variant="secondary" to="/best-sellers">Browse Best Sellers</Button></>} />
          <ProductCarousel id="cart-recs" title="Popular right now" products={recs} to="/best-sellers" />
        </>
      ) : (
        <>
          <div className="cart-layout">
            <div>
              <FreeShippingBar subtotal={totals.subtotal} />
              <div className="cart-lines">{items.map((it) => <CartLine key={it.key} item={it} />)}</div>
              <div className="row" style={{ marginTop: 20, justifyContent: "space-between" }}><Button variant="tertiary" to="/shop" icon="arrowLeft">Continue shopping</Button></div>
            </div>
            <aside className="summary card" style={{ padding: 24 }} aria-label="Order summary">
              <h2 className="h3" style={{ marginBottom: 16 }}>Order summary</h2>
              <SummaryRows totals={totals} estimate />
              <div style={{ marginTop: 16 }}><PromoForm subtotal={totals.subtotal} /></div>
              <Button block size="lg" to="/checkout" style={{ marginTop: 20 }}>Proceed to checkout</Button>
              <div className="secure-note"><Icon name="lock" size={13} />Secure checkout · Free 30-day returns</div>
            </aside>
          </div>
          <ProductCarousel id="cart-recs" title="You might also like" products={recs.filter((p) => !items.some((i) => i.productId === p.product_id))} />
        </>
      )}
    </div>
  );
}
