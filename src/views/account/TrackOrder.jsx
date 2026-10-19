import { useEffect, useState } from "react";
import { Link, useSearchParams } from "@/components/navigation";
import { useSelector } from "react-redux";
import Icon from "../../components/ui/Icon";
import { Badge, Breadcrumb, Button, Input, Notice } from "../../components/ui";
import { useSeo } from "../../hooks/useSeo";
import { useForm } from "../../hooks/useForm";
import { rules } from "../../utils/validation";
import orderService, { orderStatus } from "../../services/orderService";
import { Timeline } from "./OrderDetails";
import { dateFmt, money } from "../../utils/format";

export default function TrackOrder() {
  useSeo({ title: "Track your order", description: "Enter your order number and email to see the latest delivery status.", path: "/track-order" });
  const [sp] = useSearchParams();
  const user = useSelector((s) => s.auth.user);
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const f = useForm({ number: sp.get("number") || "", email: sp.get("email") || user?.email || "" }, { number: [rules.required("Order number")], email: [rules.required("Email"), rules.email()] });
  const submit = f.handleSubmit(async (v) => { setNotFound(false); const o = await orderService.track(v.number, v.email); if (!o) { setNotFound(true); setOrder(null); } else setOrder(o); });
  useEffect(() => { if (sp.get("number") && (sp.get("email") || user?.email)) submit(); }, []);
  return (
    <div className="page container">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Track order", to: "/track-order" }]} />
      <div className="page-head"><h1 className="h1">Track your order</h1><p className="lead">{user ? "Enter your order number to see the latest delivery updates." : "Sign in to securely view your orders and delivery updates."}</p></div>
      <div className="tracking-layout">
        <form className="card form-grid" noValidate onSubmit={submit} style={{ alignSelf: "start" }}>
          <Input label="Order number" placeholder="e.g. AT-42E12F9240C341F4" autoComplete="off" {...f.field("number")} error={f.error("number")} />
          <Input label="Email address" type="email" autoComplete="email" {...f.field("email")} error={f.error("email")} />
          {f.formError && <Notice tone="error" icon="alert" role="alert">{f.formError}</Notice>}
          {!user && <Notice icon="lock">Please <Link to="/login?next=/track-order" className="link">sign in to your account</Link> to track an order.</Notice>}
          {notFound && <Notice tone="error" icon="alert" role="alert">We couldn't find an order with those details. Check the number in your account order history, or <Link to="/contact" className="link">contact us</Link>.</Notice>}
          <Button type="submit" size="lg" disabled={!user} loading={f.submitting} icon="truck">Track order</Button>
          <p className="xs muted">Find your order number in My orders or on the order confirmation page.</p>
        </form>
        <div>
          {order ? (
            <div className="card" style={{ display: "grid", gap: 20 }}>
              <div className="acct__welcome"><div><b style={{ letterSpacing: "0.03em" }}>{order.number}</b><div className="muted small">Placed {dateFmt(order.placedAt)} · {order.items.reduce((n, i) => n + i.qty, 0)} items · {money(order.totals.total)}</div></div><Badge tone={orderStatus(order).stage === 4 ? "success" : "info"}>{orderStatus(order).label}</Badge></div>
              <Timeline order={order} />
              <div className="confirm__box"><b>Delivering to</b>{order.shipping.firstName} {order.shipping.lastName}, {order.shipping.city}, {order.shipping.state}<div className="muted">{order.method.name} · Estimated {order.eta}</div></div>
              {user && <Button variant="tertiary" to={`/account/orders/${order.number}`} iconRight="arrowRight">View full order</Button>}
            </div>
          ) : (
            <div className="card" style={{ background: "var(--beige)", border: 0 }}><div className="row" style={{ alignItems: "flex-start", gap: 14 }}><Icon name="info" size={20} style={{ flexShrink: 0, marginTop: 2 }} /><div className="small"><b>Where's my order?</b><p className="muted" style={{ marginTop: 4 }}>Standard orders ship within 1 business day and arrive in 3–6 business days. Tracking updates appear here when the seller dispatches your order.</p><p style={{ marginTop: 8 }}><Link to="/shipping" className="link">Shipping policy</Link> · <Link to="/faq" className="link">FAQ</Link></p></div></div></div>
          )}
        </div>
      </div>
    </div>
  );
}
