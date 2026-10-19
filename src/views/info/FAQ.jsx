import { useMemo, useState } from "react";
import { Link } from "@/components/navigation";
import { Accordion, Breadcrumb, Button, Input } from "../../components/ui";
import { useSeo, breadcrumbLd } from "../../hooks/useSeo";

const FAQS = [
  ["Orders & shipping", [
    ["How long does delivery take?", "Standard delivery arrives in 3–6 business days and is free on orders over $50. Express delivery arrives in 1–2 business days for $14.95 when ordered before 2pm ET."],
    ["Can I change or cancel my order?", "Yes, within 60 minutes of placing it — contact us with your order number. After that the order is already being packed, but you can return it for free once it arrives."],
    ["Do you ship internationally?", "We ship to the US, Canada, UK, EU, Australia, UAE, Pakistan, India, Japan and Singapore. Duties and taxes are included in the price at checkout, so there's nothing to pay on delivery."],
    ["How do I track my order?", "Use the tracking link in your shipping email, or enter your order number and email on the Track Order page."],
  ]],
  ["Returns & exchanges", [
    ["What is your returns policy?", "Return any unworn item with tags within 30 days of delivery for a full refund. US returns are free; international returns are deducted $9.95."],
    ["How do I exchange for a different size?", "Start a return from My Orders and choose Exchange. We ship the replacement as soon as the carrier scans your return — no need to wait for it to reach us."],
    ["When will I get my refund?", "Within 3–5 business days of your return arriving, to the original payment method. Your bank may take a further 2–3 days to show it."],
    ["What if an item arrives damaged?", "Send us a photo within 7 days and we'll replace it or refund you immediately. Anything that develops a fault within 12 months is covered too."],
  ]],
  ["Products & sizing", [
    ["How do I find my size?", "Each product page has a size guide with measurements in centimetres. If you're between sizes, our clothing generally fits true to size — size up for a relaxed look. Our full Size Guide page has more detail."],
    ["Are your materials sustainable?", "72% of our clothing is made from preferred fibres like organic cotton, RWS wool and linen, and all leather comes from LWG-audited tanneries. Read more on our Sustainability page."],
    ["Will an out-of-stock item come back?", "Often, yes. Tap 'Notify me' on the product page and we'll email you the moment it's restocked."],
    ["How should I care for my leather bag?", "Wipe with a soft dry cloth, condition every few months, and store in the dust bag away from direct sunlight. Every bag comes with free lifetime repairs."],
  ]],
  ["Payment & promotions", [
    ["Which payment methods do you accept?", "Cash on delivery is currently available. Online payments and saved cards are not yet supported."],
    ["How do I use a promo code?", "Enter it in the promo code box in your cart or at checkout. Codes can't be combined and some have minimum spend — the message will tell you if a code can't be applied."],
    ["Is my payment information secure?", "Yes. Payments are processed by a PCI-DSS compliant provider over an encrypted connection. We never see or store your full card number."],
  ]],
  ["Account", [
    ["Do I need an account to order?", "No — you can check out as a guest. An account lets you track orders, save addresses and cards, and keep your wishlist across devices."],
    ["I forgot my password", "Use the Forgot password link on the sign-in page and we'll email you a reset link that's valid for 30 minutes."],
    ["How do I delete my account?", "Go to Profile Settings and choose Delete my account. Your saved details are removed straight away; order records are kept as required by law."],
  ]],
];

export default function FAQ() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "FAQ", to: "/faq" }];
  const [cat, setCat] = useState(FAQS[0][0]);
  const [q, setQ] = useState("");
  useSeo({ title: "FAQ", description: "Answers to common questions about StyleUp orders, shipping, returns, sizing, payment and accounts.", path: "/faq", jsonLd: [breadcrumbLd(crumbs), { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.flatMap(([, qs]) => qs.map(([n, a]) => ({ "@type": "Question", name: n, acceptedAnswer: { "@type": "Answer", text: a } }))) }] });
  const items = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t) return FAQS.flatMap(([, qs]) => qs).filter(([n, a]) => n.toLowerCase().includes(t) || a.toLowerCase().includes(t));
    return FAQS.find(([c]) => c === cat)[1];
  }, [q, cat]);
  return (
    <div className="container">
      <div style={{ paddingTop: 16 }}><Breadcrumb items={crumbs} /></div>
      <div className="info-hero"><h1 className="h1">Frequently asked questions</h1><p className="lead">Quick answers to the things people ask us most.</p></div>
      <div style={{ maxWidth: 800, paddingBottom: 64 }}>
        <Input label="Search questions" placeholder="e.g. refund, sizing, international" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
        {!q && <div className="tabs tabs--pills faq-cats" role="tablist" style={{ marginTop: 20 }}>{FAQS.map(([c]) => <button key={c} type="button" role="tab" className="tab" aria-selected={cat === c} onClick={() => setCat(c)}>{c}</button>)}</div>}
        {items.length ? <Accordion single defaultOpen={[0]} items={items.map(([t, a]) => ({ title: t, content: <p>{a}</p> }))} /> : <p className="muted" style={{ marginTop: 20 }}>No matches for "{q}". Try a different word or <Link to="/contact" className="link">contact us</Link>.</p>}
        <div className="notice" style={{ marginTop: 32 }}><span>Didn't find what you need?</span><Button size="sm" variant="secondary" to="/contact" style={{ marginLeft: "auto" }}>Contact us</Button></div>
      </div>
    </div>
  );
}
