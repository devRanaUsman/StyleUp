import { Link, useNavigate } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Drawer, toast } from "../ui/Overlays";
import Icon from "../ui/Icon";
import { Button, ProductImage, Quantity } from "../ui";
import { cartActions, selectCartItems, selectCartTotals } from "../../store/cartSlice";
import { uiActions } from "../../store/uiSlice";
import { money } from "../../utils/format";
import { bestSellers } from "../../services/catalogService";
import { FREE_SHIPPING_THRESHOLD } from "../../data/catalog";

export function CartLine({ item, compact }) {
  const dispatch = useDispatch();
  const allItems = useSelector(selectCartItems);
  const url = `/${item.category}/${item.subcategory}/${item.slug}`;
  const variant = [item.color, item.size].filter(Boolean).join(" · ");
  const remove = () => { const prev = allItems; dispatch(cartActions.removeItem(item.key)); toast(dispatch, "Removed from cart", { action: { label: "Undo", onClick: () => dispatch(cartActions.hydrate({ items: prev })) } }); };
  return (
    <div className={`cart-line ${compact ? "cart-line--compact" : ""}`}>
      <Link to={url} className="cart-line__img" onClick={() => dispatch(uiActions.closeCart())}><ProductImage src={item.image} alt={item.name} sizes="96px" name={item.name} /></Link>
      <div className="cart-line__body">
        <div className="cart-line__top">
          <div>
            <Link to={url} className="cart-line__name" onClick={() => dispatch(uiActions.closeCart())}>{item.name}</Link>
            {variant && <div className="cart-line__variant">{variant}</div>}
          </div>
          <button type="button" className="cart-line__remove" aria-label={`Remove ${item.name}`} onClick={remove}><Icon name="close" size={16} /></button>
        </div>
        <div className="cart-line__bottom">
          <Quantity small value={item.qty} max={item.maxStock} onChange={(q) => dispatch(cartActions.setQty({ key: item.key, qty: q }))} label={`Quantity for ${item.name}`} />
          <div className="cart-line__price">
            <b>{money(item.price * item.qty)}</b>
            {item.regularPrice > item.price && <s className="muted xs">{money(item.regularPrice * item.qty)}</s>}
          </div>
        </div>
        {item.qty >= item.maxStock && <div className="cart-line__note">Only {item.maxStock} available</div>}
      </div>
    </div>
  );
}

export function FreeShippingBar({ subtotal }) {
  const left = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <div className="freeship" aria-live="polite">
      <div className="freeship__text">{left > 0 ? <>You're <b>{money(left)}</b> away from free shipping</> : <><Icon name="check" size={14} strokeWidth={2.5} /> You've unlocked free shipping</>}</div>
      <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100" aria-label="Progress to free shipping"><div className="progress__bar" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function CartDrawer() {
  const open = useSelector((s) => s.ui.cartOpen);
  const items = useSelector(selectCartItems);
  const totals = useSelector(selectCartTotals);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const close = () => dispatch(uiActions.closeCart());
  const go = (to) => { close(); navigate(to); };
  const inCart = new Set(items.map((i) => i.productId));
  const recs = bestSellers(6).filter((p) => !inCart.has(p.product_id) && p.colors.length <= 1 && p.sizes.length <= 1).slice(0, 3);

  return (
    <Drawer open={open} onClose={close} title={`Your cart${items.length ? ` (${items.reduce((n, i) => n + i.qty, 0)})` : ""}`}
      footer={items.length ? (
        <>
          <div className="cart-drawer__sub"><span>Subtotal</span><b>{money(totals.subtotal)}</b></div>
          <p className="xs muted" style={{ marginBottom: 12 }}>Shipping and taxes calculated at checkout.</p>
          <div className="row" style={{ gap: 8 }}>
            <Button variant="secondary" block onClick={() => go("/cart")}>View cart</Button>
            <Button block onClick={() => go("/checkout")}>Checkout</Button>
          </div>
        </>
      ) : null}>
      {items.length === 0 ? (
        <div className="empty" style={{ padding: "40px 0" }}>
          <div className="empty__icon"><Icon name="cart" size={28} /></div>
          <h3 className="h3">Your cart is currently empty.</h3>
          <p>Add a few pieces and they'll appear here.</p>
          <div className="empty__actions"><Button onClick={() => go("/shop")}>Continue shopping</Button><Button variant="secondary" onClick={() => go("/best-sellers")}>Best sellers</Button></div>
        </div>
      ) : (
        <>
          <FreeShippingBar subtotal={totals.subtotal} />
          <div className="cart-lines">{items.map((it) => <CartLine key={it.key} item={it} compact />)}</div>
          {recs.length > 0 && (
            <div className="cart-recs">
              <div className="search-block__title">You might also like</div>
              {recs.map((p) => <CartRec key={p.product_id} product={p} />)}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}

function CartRec({ product }) {
  const dispatch = useDispatch();
  const add = () => { dispatch(cartActions.addItem({ product, color: product.colors[0]?.name ?? null, size: product.sizes[0] ?? null, qty: 1, maxStock: product.stock_quantity })); toast(dispatch, "Added to cart", { type: "success" }); };
  return (
    <div className="cart-rec">
      <div className="cart-rec__img"><ProductImage src={product.thumbnail} alt={product.product_name} sizes="56px" name={product.product_name} /></div>
      <div className="cart-rec__body"><div className="cart-rec__name">{product.product_name}</div><div className="cart-rec__price">{money(product.sale_price ?? product.regular_price)}</div></div>
      <button type="button" className="icon-btn icon-btn--sm" style={{ border: "1px solid var(--border-strong)", background: "var(--white)" }} aria-label={`Add ${product.product_name} to cart`} onClick={add}><Icon name="plus" size={16} /></button>
    </div>
  );
}
