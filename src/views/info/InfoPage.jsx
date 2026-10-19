import { Link, useNavigate } from "@/components/navigation";
import Icon from "../../components/ui/Icon";
import { Breadcrumb, Button, TrustGrid } from "../../components/ui";
import { useSeo, breadcrumbLd } from "../../hooks/useSeo";
import { FOOTER_BENEFITS } from "../../data/catalog";
import { slugify } from "../../utils/format";

const ABOUT_IMG = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=75";

const PAGES = {
  about: {
    title: "About StyleUp", path: "/about", lead: "We started StyleUp with a simple belief: getting dressed should feel easy, and the things you wear every day deserve the most care.",
    description: "StyleUp is a modern fashion and lifestyle brand designing timeless, thoughtfully made pieces for every day.",
    sections: [
      ["Our story", [`StyleUp began in 2019 as a small edit of twelve pieces — a blazer, a tote, a pair of loafers and the things that go with them. The idea was to build a wardrobe from the ground up: fewer, better items that work together and hold up to real life.`, `Today we design across women's and men's clothing, bags, shoes, accessories, beauty and home, but the brief hasn't changed. Every product starts with the same three questions: Will you reach for it often? Is it made well enough to last? Does it still feel right in five years?`]],
      ["What we stand for", [`Considered design over trend-chasing. Honest materials and construction you can see and feel. Fair prices that reflect what things actually cost to make well. And a shopping experience that respects your time, from clear sizing to easy returns.`]],
      ["How we make things", [`We work with a small group of long-term partner workshops in Portugal, Italy, Turkey and India. Most have been with us since the beginning. We visit regularly, pay on time, and develop products together rather than sending a spec sheet and waiting.`, `Our fabrics are chosen for hand-feel and durability first: organic and recycled cotton, responsibly sourced wool, linen, and leather from tanneries audited by the Leather Working Group. Read more on our <a href="/sustainability">sustainability page</a>.`]],
      ["The team", [`We're a team of 42 designers, makers, writers and customer-care specialists based between New York and Lisbon. If you write to us, a real person reads it — usually within a few hours.`]],
    ],
    stats: [["2019", "Founded"], ["42", "Team members"], ["11", "Partner workshops"]],
    cta: ["Explore the collection", "/shop"],
  },
  shipping: {
    title: "Shipping information", path: "/shipping", lead: "Free standard shipping on orders over $50. Here's everything else you need to know about getting your order to you.",
    description: "StyleUp shipping options, delivery times, costs and international delivery information.",
    sections: [
      ["Delivery options", [`<b>Standard delivery</b> — $5.95, free on orders over $50. Arrives in 3–6 business days.`, `<b>Express delivery</b> — $14.95. Arrives in 1–2 business days when ordered before 2pm ET.`, `<b>Collect from store</b> — Free. Ready in 2 hours at our Greene Street store during opening hours.`]],
      ["Processing times", [`Orders placed before 2pm ET on a business day ship the same day. Orders placed after 2pm, on weekends or on public holidays ship the next business day. During sale periods, allow one extra day.`]],
      ["Tracking your order", [`You'll receive a shipping confirmation email with a tracking link as soon as your parcel leaves our warehouse. You can also check the status any time on our <a href="/track-order">Track Order</a> page using your order number and email.`]],
      ["International shipping", [`We currently ship to the United States, Canada, the United Kingdom, the EU, Australia, the UAE, Pakistan, India, Japan and Singapore. International delivery takes 5–12 business days and costs are calculated at checkout. Duties and taxes for orders outside the US are included in the price shown at checkout — there's nothing extra to pay on delivery.`]],
      ["Missing or damaged parcels", [`If your tracking shows delivered but you can't find your parcel, check with neighbours and your building's mailroom, then get in touch within 7 days and we'll investigate with the carrier. Damaged on arrival? Send us a photo and we'll replace it or refund you right away.`]],
    ],
    cta: ["Track an order", "/track-order"],
  },
  returns: {
    title: "Returns & exchanges", path: "/returns", lead: "Changed your mind? Return any item within 30 days of delivery for a full refund. No questions, no restocking fees.",
    description: "StyleUp 30-day returns policy: how to return or exchange an order, refund timelines and conditions.",
    sections: [
      ["How to return", [`1. Sign in and open the order under <a href="/account/orders">My Orders</a>, or use the link in your delivery email.`, `2. Select the items you're returning and a reason (this helps us improve, but it won't affect your refund).`, `3. Print the prepaid label or show the QR code at any drop-off point. US returns are free; international returns are deducted $9.95 from the refund.`, `4. Drop it off. Refunds are issued within 3–5 business days of the parcel reaching us.`]],
      ["Exchanges", [`Need a different size or colour? Choose "Exchange" instead of "Return" and we'll ship the replacement as soon as the return is scanned by the carrier — you don't have to wait for it to arrive back with us.`]],
      ["Conditions", [`Items must be unworn, unwashed and in their original condition with tags attached. Beauty products can be returned if unopened. Earrings, and items marked final sale, can't be returned for hygiene reasons unless faulty.`]],
      ["Faulty items", [`If something arrives damaged or develops a fault within 12 months of purchase, contact us with a photo. We'll repair, replace or refund — whichever you prefer.`]],
    ],
    cta: ["Start a return", "/account/orders"],
  },
  privacy: {
    title: "Privacy policy", path: "/privacy", lead: "Last updated 1 August 2026. This policy explains what data we collect, why, and the choices you have.",
    description: "How StyleUp collects, uses and protects your personal information.",
    sections: [
      ["What we collect", [`<b>Information you give us</b>: name, email, phone number, shipping and billing addresses, and payment details (processed by our payment provider — we never see your full card number).`, `<b>Information collected automatically</b>: device type, browser, pages viewed and how you arrived at our site, via cookies and similar technologies you can control from the cookie banner or your browser.`]],
      ["How we use it", [`To fulfil and deliver orders, provide customer support, prevent fraud, and — if you've opted in — send you news and offers. We also use aggregated, anonymised data to understand how the site is used and make it better.`]],
      ["Sharing", [`We share data only with the partners who help us run StyleUp: payment processors, delivery carriers, our email provider and analytics tools. They can only use your data to provide their service to us. We never sell personal data.`]],
      ["Your rights", [`You can access, correct or delete your data at any time from <a href="/account/profile">Profile Settings</a>, or by emailing privacy@styleup.com. You can unsubscribe from marketing with one click in any email. Depending on where you live you may have additional rights under GDPR, CCPA or similar laws — email us and we'll help.`]],
      ["Cookies", [`Essential cookies keep your cart and session working and can't be switched off. Analytics and marketing cookies are optional — choose "Reject optional" in the cookie banner to disable them.`]],
      ["Contact", [`Questions about privacy? Email privacy@styleup.com or write to StyleUp Inc., 128 Greene Street, New York, NY 10012.`]],
    ],
  },
  terms: {
    title: "Terms of service", path: "/terms", lead: "Last updated 1 August 2026. By using styleup.com or placing an order, you agree to these terms.",
    description: "StyleUp terms of service covering orders, pricing, payment, delivery and returns.",
    sections: [
      ["Orders and acceptance", [`An order is an offer to buy. We accept it when we send the shipping confirmation. We may decline or cancel an order — for example if an item is out of stock, a price was listed in error, or we suspect fraud — and will refund any payment taken.`]],
      ["Pricing and payment", [`Prices are in US dollars and include applicable sales tax where shown. Promotional codes can't be combined and may have minimum spend or expiry conditions. Payment is taken when the order is placed.`]],
      ["Delivery and risk", [`Delivery times are estimates. Risk in the goods passes to you on delivery. Our full <a href="/shipping">shipping policy</a> applies.`]],
      ["Returns", [`Our <a href="/returns">30-day returns policy</a> forms part of these terms. Nothing in these terms limits your statutory rights.`]],
      ["Accounts", [`You're responsible for keeping your password confidential and for activity on your account. Let us know immediately if you suspect unauthorised use.`]],
      ["Intellectual property", [`All content on this site — designs, photography, text and the StyleUp name and logo — belongs to StyleUp Inc. or our licensors and may not be reproduced without permission.`]],
      ["Liability", [`To the extent permitted by law, our liability for any claim relating to an order is limited to the amount you paid for it. We're not liable for indirect or consequential loss.`]],
      ["Governing law", [`These terms are governed by the laws of the State of New York. Disputes will be handled in the courts of New York County.`]],
    ],
  },
  sustainability: {
    title: "Sustainability", path: "/sustainability", lead: "Making fewer, better things is the most sustainable choice we can offer. Here's where we are, and where we're going.",
    description: "StyleUp's approach to responsible materials, fair production, packaging and product longevity.",
    sections: [
      ["Materials", [`72% of our clothing by volume is now made from preferred fibres: organic or recycled cotton, RWS-certified wool, European linen and Tencel™ lyocell. All leather comes from Leather Working Group gold- or silver-rated tanneries. Our target is 90% by the end of 2027.`]],
      ["People", [`We publish our full supplier list and audit every partner workshop annually against the Fair Wear code. Every worker in our supply chain is paid at least a living wage for their region, verified by an independent third party.`]],
      ["Packaging", [`Orders ship in FSC-certified boxes with paper tape and no plastic. Beauty products use glass or post-consumer recycled plastic and are refillable wherever the formula allows.`]],
      ["Longevity and repair", [`The most sustainable product is the one you keep. Every StyleUp piece comes with a 12-month fault guarantee, and we offer free repairs on bags and shoes for the life of the product. Our <a href="/returns">returns policy</a> also lets you try before you commit.`]],
      ["What we're still working on", [`Shipping emissions, especially for express delivery, remain our largest footprint. We offset today and are moving to lower-emission carriers by route. We'll publish our first full impact report in early 2027.`]],
    ],
    stats: [["72%", "Preferred fibres"], ["100%", "Living wage verified"], ["0", "Plastic in packaging"]],
    cta: ["Shop the collection", "/shop"],
  },

};

function Rich({ html }) { const navigate = useNavigate(); return <p dangerouslySetInnerHTML={{ __html: html }} onClick={(e) => { const a = e.target.closest("a"); const href = a?.getAttribute("href"); if (href?.startsWith("/")) { e.preventDefault(); navigate(href); } }} />; }

export default function InfoPage({ page }) {
  const p = PAGES[page];
  const crumbs = [{ label: "Home", to: "/" }, { label: p.title, to: p.path }];
  useSeo({ title: p.title, description: p.description, path: p.path, jsonLd: breadcrumbLd(crumbs) });
  return (
    <div className="container">
      <div style={{ paddingTop: 16 }}><Breadcrumb items={crumbs} /></div>
      <div className="info-hero"><h1 className="h1">{p.title}</h1><p className="lead">{p.lead}</p></div>
      {page === "about" && <div className="about-img"><img src={ABOUT_IMG} alt="Inside the StyleUp studio" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} /></div>}
      <div className="info-layout" style={{ paddingBottom: 64 }}>
        <nav className="info-toc" aria-label="On this page"><div className="info-toc__title">On this page</div>{p.sections.map(([t]) => <a key={t} href={`#${slugify(t)}`}>{t}</a>)}</nav>
        <div className="prose">
          {p.stats && <div className="stat-row">{p.stats.map(([v, l]) => <div key={l} className="stat"><b>{v}</b><span>{l}</span></div>)}</div>}
          {p.sections.map(([t, paras]) => <section key={t} id={slugify(t)} style={{ scrollMarginTop: 100 }}><h2>{t}</h2>{paras.map((x, i) => <Rich key={i} html={x} />)}</section>)}
          {p.cta && <div style={{ marginTop: 32 }}><Button to={p.cta[1]} iconRight="arrowRight">{p.cta[0]}</Button></div>}
          {(page === "shipping" || page === "returns") && <p style={{ marginTop: 32 }} className="small muted">Still have a question? Check the <Link to="/faq" className="link">FAQ</Link> or <Link to="/contact" className="link">contact us</Link>.</p>}
        </div>
      </div>
      {page === "about" && <div style={{ paddingBottom: 48 }}><TrustGrid items={FOOTER_BENEFITS} /></div>}
      {page === "sustainability" && <div className="notice" style={{ marginBottom: 48 }}><Icon name="leaf" size={18} /><span>Look for the <b>Sustainable</b> tag on product pages to find pieces made from preferred materials.</span></div>}
    </div>
  );
}
