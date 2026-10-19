import { useState } from "react";
import { Link } from "@/components/navigation";
import Icon from "../ui/Icon";
import { FOOTER_LINKS, STORE_NAME } from "../../data/catalog";
import { Logo } from "./Header";

const SOCIAL = [["Instagram", "instagram", "https://instagram.com"], ["Facebook", "facebook", "https://facebook.com"], ["Pinterest", "pinterest", "https://pinterest.com"], ["TikTok", "tiktok", "https://tiktok.com"], ["YouTube", "youtube", "https://youtube.com"]];

function FooterCol({ title, links }) {
  const [open, setOpen] = useState(false);
  const id = `fcol-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="footer__col">
      <button type="button" className="footer__title" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>{title}<Icon name="chevronDown" size={16} /></button>
      <ul className="footer__list" id={id} data-open={open}>{links.map(([l, to]) => <li key={to + l}><Link to={to}>{l}</Link></li>)}</ul>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="currentColor" aria-hidden="true"><path d="M14.9 10.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.2.7-.7 0-1.7-.7-2.8-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.3.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.7c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2-.8-2-3.3ZM12.8 4.4c.6-.7 1-1.7.9-2.7-.9.1-2 .6-2.6 1.3-.6.7-1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2Z" /></svg>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo light />
            <p>Everyday essentials, considered. Quality you can feel, at prices that make sense.</p>
            <ul className="footer__social" aria-label={`Follow ${STORE_NAME}`}>{SOCIAL.map(([n, ic, href]) => <li key={n}><a href={href} target="_blank" rel="noreferrer" aria-label={`${STORE_NAME} on ${n}`}><Icon name={ic} size={17} /></a></li>)}</ul>
          </div>
          {Object.entries(FOOTER_LINKS).map(([t, links]) => <FooterCol key={t} title={t} links={links} />)}
          <div className="footer__col">
            <div className="footer__title">Download Our App</div>
            <p className="footer__app-note">Shop on the go with our mobile app.</p>
            <div className="footer__app">
              <a className="footer__app-badge" href="https://play.google.com/store" target="_blank" rel="noreferrer"><Icon name="play" size={17} /><span><small>Get it on</small><b>Google Play</b></span></a>
              <a className="footer__app-badge" href="https://www.apple.com/app-store/" target="_blank" rel="noreferrer"><AppleIcon /><span><small>Download on the</small><b>App Store</b></span></a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} {STORE_NAME}. All rights reserved.</span>
          <span><Link to="/privacy">Privacy Policy</Link> &nbsp;·&nbsp; <Link to="/terms">Terms of Service</Link> &nbsp;·&nbsp; <Link to="/faq">Cookie Policy</Link> &nbsp;·&nbsp; <Link to="/seller/login">Seller portal</Link></span>
        </div>
      </div>
    </footer>
  );
}
