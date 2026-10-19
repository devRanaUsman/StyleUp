import { useState } from "react";
import { Link } from "@/components/navigation";
import Icon from "../../components/ui/Icon";
import { Breadcrumb, Button, Input, Notice, Select, Textarea } from "../../components/ui";
import { useSeo, breadcrumbLd } from "../../hooks/useSeo";
import { useForm } from "../../hooks/useForm";
import { rules } from "../../utils/validation";
import engagementService from "../../services/engagementService";

const TOPICS = ["Order status", "Returns & exchanges", "Product question", "Sizing help", "Payment issue", "Press & partnerships", "Something else"];

export default function Contact() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Contact", to: "/contact" }];
  useSeo({ title: "Contact us", description: "Get in touch with StyleUp customer care by email, phone or live chat. We reply within a few hours.", path: "/contact", jsonLd: breadcrumbLd(crumbs) });
  const [sent, setSent] = useState(null);
  const [chatUnavailable, setChatUnavailable] = useState(false);
  const f = useForm({ name: "", email: "", order: "", topic: "", message: "" }, { name: [rules.required("Name")], email: [rules.required("Email"), rules.email()], topic: [rules.required("Topic")], message: [rules.required("Message"), rules.minLen(20, "Message")] });
  const submit = f.handleSubmit(async (v) => { const r = await engagementService.contact(v); setSent(r); });
  const startChat = () => {
    const url = process.env.NEXT_PUBLIC_CHAT_URL;
    if (url) { window.open(url, "_blank", "noopener,noreferrer"); setChatUnavailable(false); }
    else setChatUnavailable(true);
  };
  return (
    <div className="container">
      <div style={{ paddingTop: 16 }}><Breadcrumb items={crumbs} /></div>
      <div className="info-hero"><h1 className="h1">We're here to help</h1><p className="lead">Real people, real answers — usually within a couple of hours during opening times.</p></div>
      <div className="contact-grid" style={{ paddingBottom: 64 }}>
        <div>
          <div className="contact-cards">
            <div className="contact-card"><span className="contact-card__icon"><Icon name="mail" size={20} /></span><div><b>Email</b><p><a href="mailto:hello@styleup.com">hello@styleup.com</a> · Replies within 4 hours</p></div></div>
            <div className="contact-card"><span className="contact-card__icon"><Icon name="phone" size={20} /></span><div><b>Phone</b><p><a href="tel:+18005550199">+1 (800) 555-0199</a> · Mon–Fri 9am–6pm ET</p></div></div>
            <div className="contact-card"><span className="contact-card__icon"><Icon name="chat" size={20} /></span><div><b>Live chat</b><p>Available in the app and on the site 9am–9pm ET. <button type="button" className="link" onClick={startChat}>Start a chat</button></p></div></div>
            <div className="contact-card"><span className="contact-card__icon"><Icon name="help" size={20} /></span><div><b>Quick answers</b><p>Most questions are covered in our <Link to="/faq">FAQ</Link>, <Link to="/shipping">shipping</Link> and <Link to="/returns">returns</Link> pages.</p></div></div>
          </div>
          {chatUnavailable && <Notice tone="info" icon="info">Live chat is currently unavailable. Please use the message form to contact the store.</Notice>}
          <h2 className="h3" id="stores" style={{ margin: "32px 0 12px", scrollMarginTop: 100 }}>Visit us</h2>
          <div className="stores" style={{ marginTop: 0 }}>
            <div className="store"><b>New York</b>128 Greene Street<br />SoHo, NY 10012<br /><span className="muted">Mon–Sat 10–8, Sun 11–6</span></div>
            <div className="store"><b>Lisbon</b>Rua Garrett 54<br />Chiado, 1200-204<br /><span className="muted">Mon–Sat 10–8, Sun 12–6</span></div>
            <div className="store"><b>London</b>21 Marylebone High St<br />W1U 4NQ<br /><span className="muted">Mon–Sat 10–7, Sun 12–6</span></div>
          </div>
        </div>
        <div>
          {sent ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}><div className="confirm__check" style={{ margin: "0 auto 16px" }}><Icon name="check" size={30} strokeWidth={2.5} /></div><h2 className="h2">Message received</h2><p className="muted" style={{ marginTop: 8 }}>Your reference is <b>{sent.reference}</b>. Your message is saved in our customer care inbox.</p><div className="empty__actions" style={{ marginTop: 20 }}><Button to="/shop">Continue shopping</Button><Button variant="secondary" onClick={() => { setSent(null); f.setValues({ name: "", email: "", order: "", topic: "", message: "" }); }}>Send another</Button></div></div>
          ) : (
            <form className="card form-grid" noValidate onSubmit={submit}>
              <h2 className="h3">Send us a message</h2>
              {f.formError && <Notice tone="error" icon="alert" role="alert">{f.formError}</Notice>}
              <div className="form-grid form-grid--2"><Input label="Your name" autoComplete="name" {...f.field("name")} error={f.error("name")} /><Input label="Email" type="email" autoComplete="email" {...f.field("email")} error={f.error("email")} /></div>
              <div className="form-grid form-grid--2"><Select label="Topic" placeholder="Choose a topic" options={TOPICS} {...f.field("topic")} error={f.error("topic")} /><Input label="Order number" optional placeholder="AT-…" {...f.field("order")} /></div>
              <Textarea label="Message" rows={6} hint="Include as much detail as you can so we can help first time." {...f.field("message")} error={f.error("message")} />
              <div><Button type="submit" size="lg" loading={f.submitting} icon="send">Send message</Button></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
