import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Icon from "../../components/ui/Icon";
import { Button } from "../../components/ui";
import { useSeo } from "../../hooks/useSeo";
import AccountLayout from "./AccountLayout";
import { OrderCard } from "./Account";
import orderService from "../../services/orderService";

export default function Orders() {
  useSeo({ title: "My orders", noindex: true });
  const user = useSelector((s) => s.auth.user);
  const [orders, setOrders] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  useEffect(() => { let active=true; setLoadError(""); orderService.list().then(data=>{if(active)setOrders(data);}).catch(e=>{if(active)setLoadError(e.message);}); return ()=>{active=false;}; }, [user?.email]);
  const shown = orders?.filter((o) => filter === "all" || (filter === "recent" ? Date.now() - new Date(o.placedAt) < 30 * 86400000 : true));
  return (
    <AccountLayout title="My orders" crumbs={[{ label: "Orders", to: "/account/orders" }]}>
      <div className="tabs tabs--pills" role="tablist">{[["all", "All orders"], ["recent", "Last 30 days"]].map(([id, l]) => <button key={id} type="button" role="tab" className="tab" aria-selected={filter === id} onClick={() => setFilter(id)}>{l}</button>)}</div>
      {loadError ? <p role="alert" className="notice">{loadError} <button type="button" onClick={()=>window.location.reload()}>Try again</button></p> : orders === null ? <div className="skel" style={{ height: 160, borderRadius: 14 }} /> : shown.length === 0 ? <div className="empty" style={{ padding: "32px 0" }}><div className="empty__icon"><Icon name="package" size={26} /></div><h2 className="h3">{orders.length ? "No orders in this period" : "You haven't placed any orders yet"}</h2><p>Orders placed with {user?.email} will appear here.</p><div className="empty__actions"><Button to="/shop">Start shopping</Button></div></div> : <div style={{ display: "grid", gap: 12 }}>{shown.map((o) => <OrderCard key={o.number} order={o} />)}</div>}
    </AccountLayout>
  );
}
