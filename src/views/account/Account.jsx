import { useEffect, useState } from "react";
import { Link } from "@/components/navigation";
import { useSelector } from "react-redux";
import Icon from "../../components/ui/Icon";
import { Badge, Button, ProductImage } from "../../components/ui";
import { useSeo } from "../../hooks/useSeo";
import AccountLayout from "./AccountLayout";
import orderService, { orderStatus } from "../../services/orderService";
import { selectWishlistIds } from "../../store/wishlistSlice";
import { dateFmt, money } from "../../utils/format";

export function OrderCard({ order }) {
  const st = orderStatus(order);
  const tone = st.stage === 4 ? "success" : st.stage >= 2 ? "info" : "";
  return (
    <div className="order-card">
      <div className="order-card__head"><div><span className="order-card__num">{order.number}</span><div className="order-card__date">Placed {dateFmt(order.placedAt)}</div></div><Badge tone={tone}>{st.label}</Badge></div>
      <div className="order-card__imgs">{order.items.slice(0, 4).map((i) => <span key={i.key}><ProductImage src={i.image} alt={i.name} sizes="48px" name={i.name} /></span>)}{order.items.length > 4 && <span className="order-card__more">+{order.items.length - 4}</span>}</div>
      <div className="order-card__foot"><span>{order.items.reduce((n, i) => n + i.qty, 0)} items · <b>{money(order.totals.total)}</b></span><div className="row"><Button size="sm" variant="secondary" to={`/account/orders/${order.number}`}>View details</Button>{st.stage < 4 && <Button size="sm" variant="tertiary" to={`/track-order?number=${order.number}`}>Track</Button>}</div></div>
    </div>
  );
}

export default function Account() {
  useSeo({ title: "My account", noindex: true });
  const user = useSelector((s) => s.auth.user);
  const wish = useSelector(selectWishlistIds);
  const [orders, setOrders] = useState(null);
  const [loadError, setLoadError] = useState("");
  useEffect(() => { let active=true; setLoadError(""); orderService.list().then(data=>{if(active)setOrders(data);}).catch(e=>{if(active)setLoadError(e.message);}); return ()=>{active=false;}; }, [user?.email]);
  const first = user?.name?.split(" ")[0];
  return (
    <AccountLayout>
      <div className="acct__welcome"><div><h1 className="h2" style={{ fontSize: "var(--fs-h3)" }}>Hi, {first}</h1><p className="muted small">{user?.email}</p></div><Button variant="secondary" size="sm" to="/account/profile" icon="settings">Edit profile</Button></div>
      <div className="acct__tiles">
        <Link to="/account/orders" className="tile"><span className="tile__icon"><Icon name="package" size={20} /></span><span className="tile__title">Orders</span><span className="tile__sub">{orders ? `${orders.length} order${orders.length === 1 ? "" : "s"}` : loadError ? "Unavailable" : "Loading…"}</span></Link>
        <Link to="/wishlist" className="tile"><span className="tile__icon"><Icon name="heart" size={20} /></span><span className="tile__title">Wishlist</span><span className="tile__sub">{wish.length} saved</span></Link>
        <Link to="/account/addresses" className="tile"><span className="tile__icon"><Icon name="mapPin" size={20} /></span><span className="tile__title">Addresses</span><span className="tile__sub">{user?.addresses?.length || 0} saved</span></Link>
        <Link to="/account/payment-methods" className="tile"><span className="tile__icon"><Icon name="creditCard" size={20} /></span><span className="tile__title">Payment</span><span className="tile__sub">Cash on delivery</span></Link>
        <Link to="/track-order" className="tile"><span className="tile__icon"><Icon name="truck" size={20} /></span><span className="tile__title">Track order</span><span className="tile__sub">Check delivery status</span></Link>
        <Link to="/contact" className="tile"><span className="tile__icon"><Icon name="chat" size={20} /></span><span className="tile__title">Help</span><span className="tile__sub">Contact support</span></Link>
      </div>
      <div>
        <div className="section-head" style={{ marginBottom: 12 }}><h2 className="h3">Recent orders</h2>{orders?.length > 0 && <Button variant="tertiary" to="/account/orders" iconRight="arrowRight">All orders</Button>}</div>
        {loadError ? <p role="alert" className="notice">{loadError} <button type="button" onClick={()=>window.location.reload()}>Try again</button></p> : orders === null ? <div className="skel" style={{ height: 120, borderRadius: 14 }} /> : orders.length === 0 ? <div className="empty" style={{ padding: "32px 0" }}><div className="empty__icon"><Icon name="package" size={26} /></div><h3 className="h3">No orders yet</h3><p>When you place an order it will show up here.</p><div className="empty__actions"><Button to="/shop">Start shopping</Button></div></div> : <div style={{ display: "grid", gap: 12 }}>{orders.slice(0, 2).map((o) => <OrderCard key={o.number} order={o} />)}</div>}
      </div>
    </AccountLayout>
  );
}
