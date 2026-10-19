import OrderActions from "@/components/OrderActions";
import { useEffect, useState } from "react";
import { Link, useParams } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../../components/ui/Icon";
import { Badge, Button, EmptyState, ProductImage, SkeletonLines } from "../../components/ui";
import { toast } from "../../components/ui/Overlays";
import { useSeo } from "../../hooks/useSeo";
import AccountLayout from "./AccountLayout";
import orderService, { orderStatus } from "../../services/orderService";
import { getProductSync, variantStock } from "../../services/catalogService";
import { cartActions } from "../../store/cartSlice";
import { uiActions } from "../../store/uiSlice";
import { dateFmt, money } from "../../utils/format";
import { OrderSummary } from "../Cart";

export function Timeline({ order }) {
  const st = orderStatus(order);
  if (["Cancelled", "Returned"].includes(order.status)) return <p className="notice">This order is {order.status.toLowerCase()}. See the item and payment details below.</p>;
  return (
    <ol className="timeline">{st.stages.map((s, i) => <li key={s} className={`timeline__step ${i < st.stage ? "is-done" : i === st.stage ? "is-current" : ""}`}>{s}{i === 0 && <small>{dateFmt(order.placedAt)}</small>}{i === st.stage && i < 4 && <small>Estimated arrival {order.eta}</small>}{i === 4 && st.stage === 4 && <small>Delivered</small>}</li>)}</ol>
  );
}

export default function OrderDetails() {
  const { number } = useParams();
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [order, setOrder] = useState(undefined);
  const [loadError,setLoadError]=useState("");
  useSeo({ title: `Order ${number}`, noindex: true });
  useEffect(() => { orderService.get(number).then((o) => setOrder(o && o.contact.email === user?.email ? o : null)).catch(e=>setLoadError(e.message)); }, [number, user?.email]);
  const reorder = () => { let n = 0; for (const i of order.items) { const p = getProductSync(i.slug); if (p && variantStock(p,i.color,i.size)>0) { dispatch(cartActions.addItem({ product: p, color: i.color, size: i.size, qty: i.qty, maxStock: variantStock(p,i.color,i.size) })); n++; } } if (n) { dispatch(uiActions.openCart()); toast(dispatch, `${n} item${n > 1 ? "s" : ""} added to cart`, { type: "success" }); } else toast(dispatch, "These items are no longer available.", { type: "error" }); };
  return (
    <AccountLayout crumbs={[{ label: "Orders", to: "/account/orders" }, { label: number, to: `/account/orders/${number}` }]}>
      {loadError ? <p role="alert" className="notice">{loadError} <button type="button" onClick={()=>window.location.reload()}>Try again</button></p> : order === undefined ? <SkeletonLines n={5} /> : order === null ? <EmptyState icon="package" title="Order not found" text="We couldn't find that order in your account." actions={<Button to="/account/orders">Back to orders</Button>} /> : (
        <>
          <div className="acct__welcome"><div><h1 className="h2" style={{ fontSize: "var(--fs-h3)" }}>Order {order.number}</h1><p className="muted small">Placed {dateFmt(order.placedAt)}</p></div><Badge tone={orderStatus(order).stage === 4 ? "success" : "info"}>{orderStatus(order).label}</Badge></div>
          <div className="confirm__grid">
            <div className="card"><h2 className="h3" style={{ fontSize: "1.125rem", marginBottom: 16 }}>Delivery status</h2><Timeline order={order} /></div>
            <div style={{ display: "grid", gap: 12 }}>
              <div className="confirm__box"><b>Shipping address</b>{order.shipping.firstName} {order.shipping.lastName}<br />{order.shipping.address1}{order.shipping.address2 && `, ${order.shipping.address2}`}<br />{order.shipping.city}, {order.shipping.state} {order.shipping.postal}<br />{order.shipping.country}</div>
              <div className="confirm__box"><b>Payment</b>{order.payment.type === "card" ? `${order.payment.brand} ending in ${order.payment.last4}` : order.payment.type === "cod" ? "Cash on delivery" : order.payment.type}<div className="muted">{order.method.name} · Payment: {order.payment.status}</div></div>
            </div>
          </div>
          <div className="card">
            <h2 className="h3" style={{ fontSize: "1.125rem", marginBottom: 16 }}>Items</h2>
            <div className="co-items" style={{ maxHeight: "none" }}>{order.items.map((i) => <div key={i.key} className="co-item"><div className="co-item__img"><ProductImage src={i.image} alt="" sizes="56px" name={i.name} /><span className="co-item__qty">{i.qty}</span></div><div><Link to={`/${i.category}/${i.subcategory}/${i.slug}`} className="co-item__name">{i.name}</Link><div className="co-item__variant">{[i.color, i.size].filter(Boolean).join(" · ")} · {i.status}{i.tracking && ` · Tracking: ${i.tracking}`}</div></div><div>{money(i.price * i.qty)}</div></div>)}</div>
            <OrderSummary totals={{ ...order.totals, method: order.method, promo: null }} />
          </div>
          <OrderActions order={order} onChange={setOrder}/><div className="row" style={{ flexWrap: "wrap" }}><Button onClick={reorder} icon="refresh">Buy again</Button><Button variant="secondary" to={`/track-order?number=${order.number}`}>Track package</Button><Button variant="secondary" to="/returns">Return policy</Button><Button variant="tertiary" to="/contact" icon="chat">Get help</Button></div>
        </>
      )}
    </AccountLayout>
  );
}
