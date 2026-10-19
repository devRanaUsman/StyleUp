import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "@/components/navigation";
import { useSelector } from "react-redux";
import Icon from "../../components/ui/Icon";
import { Button, EmptyState, ProductImage, SkeletonLines } from "../../components/ui";
import { ProductGrid } from "../../components/product/ProductCard";
import { useSeo } from "../../hooks/useSeo";
import orderService from "../../services/orderService";
import { bestSellers } from "../../services/catalogService";
import { money } from "../../utils/format";
import { OrderSummary } from "../Cart";

export default function OrderConfirmation() {
  const { number } = useParams();
  const { state } = useLocation();
  const user = useSelector((s) => s.auth.user);
  const [order, setOrder] = useState(state?.order);
  const [loadError,setLoadError]=useState("");
  useSeo({ title: "Order confirmed", noindex: true });
  useEffect(() => { if (!order) orderService.get(number).then((o) => setOrder(o || null)).catch(e=>setLoadError(e.message)); }, [number]);
  if (loadError) return <div className="page container"><p role="alert">{loadError}</p><Button onClick={()=>window.location.reload()}>Try again</Button></div>;
  if (order === null) return <div className="page container"><EmptyState icon="package" title="We couldn't find that order." text="Check the order number in your account, or track it below." actions={<><Button to="/track-order">Track an order</Button><Button variant="secondary" to="/shop">Continue shopping</Button></>} /></div>;
  if (!order) return <div className="page container"><SkeletonLines n={4} /></div>;
  const totals = { ...order.totals, method: order.method, promo: null };
  return (
    <div className="page container">
      <div className="confirm">
        <div className="confirm__head">
          <div className="confirm__check"><Icon name="check" size={34} strokeWidth={2.5} /></div>
          <h1 className="h1">Thank you for your order!</h1>
          <p className="lead">Your order has been saved to your account.</p>
          <div className="confirm__number">Order number <b>{order.number}</b></div>
        </div>
        <div className="confirm__grid">
          <div className="confirm__box"><b>Estimated delivery</b>{order.eta}<div className="muted">{order.method.name} · {order.method.eta}</div></div>
          <div className="confirm__box"><b>Shipping to</b>{order.shipping.firstName} {order.shipping.lastName}<br />{order.shipping.address1}{order.shipping.address2 && `, ${order.shipping.address2}`}<br />{order.shipping.city}, {order.shipping.state} {order.shipping.postal}</div>
          <div className="confirm__box"><b>Payment</b>{order.payment.type === "card" ? `${order.payment.brand} ending in ${order.payment.last4}` : "Cash on delivery"}<div className="muted">Payment: {order.payment.status} · Total: {money(order.totals.total)}</div></div>
          <div className="confirm__box"><b>Need help?</b>Manage your order in your account. Orders can be cancelled before shipping.<div><Link to="/contact" className="link">Contact support</Link></div></div>
        </div>
        <div className="card">
          <h2 className="h3" style={{ marginBottom: 16 }}>Items ({order.items.reduce((n, i) => n + i.qty, 0)})</h2>
          <div className="co-items" style={{ maxHeight: "none" }}>{order.items.map((i) => <div key={i.key} className="co-item"><div className="co-item__img"><ProductImage src={i.image} alt="" sizes="56px" name={i.name} /><span className="co-item__qty">{i.qty}</span></div><div><Link to={`/${i.category}/${i.subcategory}/${i.slug}`} className="co-item__name">{i.name}</Link><div className="co-item__variant">{[i.color, i.size].filter(Boolean).join(" · ")}</div></div><div>{money(i.price * i.qty)}</div></div>)}</div>
          <OrderSummary totals={totals} />
        </div>
        <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          <Button to="/shop">Continue shopping</Button>
          {user ? <Button variant="secondary" to={`/account/orders/${order.number}`}>View order</Button> : <Button variant="secondary" to={`/track-order?number=${order.number}&email=${encodeURIComponent(order.contact.email)}`}>Track order</Button>}
        </div>
        {!user && <div className="notice"><Icon name="user" size={16} /><span>Want to track orders and save details for next time? <Link to={`/register?email=${encodeURIComponent(order.contact.email)}`} className="link">Create an account</Link>.</span></div>}
      </div>
      <h2 className="h3" style={{ margin: "56px 0 20px" }}>You may also like</h2>
      <ProductGrid products={bestSellers(4)} />
    </div>
  );
}
