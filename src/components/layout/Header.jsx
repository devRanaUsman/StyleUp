import { accountHome } from "../../utils/account";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../ui/Icon";
import { NAV, CATEGORIES, FREE_SHIPPING_THRESHOLD, STORE_NAME } from "../../data/catalog";
import { uiActions } from "../../store/uiSlice";
import { selectCartCount } from "../../store/cartSlice";
import { selectWishlistIds } from "../../store/wishlistSlice";
import MobileMenu from "./MobileMenu";

const notices = [
  { icon: "truck", text: `Free shipping on orders over $${FREE_SHIPPING_THRESHOLD}` },
  { icon: "refresh", text: "Easy 30-day returns" },
];

function UtilityBar() {
  return (
    <div className="utility" role="region" aria-label="Store benefits">
      <div className="container utility__inner">
        <ul className="utility__list">
          {notices.map((n) => <li key={n.text}><Icon name={n.icon} size={14} />{n.text}</li>)}
        </ul>
        <div className="utility__links">
          <Link to="/track-order">Track Order</Link>
          <Link to="/faq">Help Center</Link>
          <Link to="/seller/register">Sell on {STORE_NAME}</Link>
        </div>
      </div>
    </div>
  );
}

export function Logo({ className = "", light = false }) {
  return (
    <Link to="/" className={`logo ${light ? "logo--light" : ""} ${className}`} aria-label={`${STORE_NAME} home`}>
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19 9 5l3 7 3-7 5 14" /></svg>
      </span>
      <span className="logo__word">{STORE_NAME.toUpperCase()}</span>
    </Link>
  );
}

function MegaMenu({ item, onClose }) {
  const { columns, feature } = item.mega;
  return (
    <div className="mega" role="region" aria-label={`${item.label} menu`}>
      <div className="container">
        <div className="mega__inner" style={{ "--cols": columns.length }}>
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mega__col-title">{col.title}</div>
              <ul className="mega__list">{col.links.map(([label, to]) => <li key={to + label}><Link to={to} onClick={onClose}>{label}</Link></li>)}</ul>
            </div>
          ))}
          <Link to={feature.to} className="mega__feature" onClick={onClose}>
            <img src={feature.image} alt="" loading="lazy" width="600" height="750" />
            <span className="mega__feature-copy"><strong>{feature.title}</strong><span>{feature.text}</span></span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SearchForm() {
  const router = useNavigate();
  const [q, setQ] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router(`/search?q=${encodeURIComponent(term)}`);
    setQ("");
  };
  return (
    <form className="hsearch" role="search" onSubmit={submit}>
      <Icon name="search" size={18} className="hsearch__icon" />
      <label htmlFor="site-search" className="sr-only">Search products, brands and more</label>
      <input id="site-search" type="search" className="hsearch__input" placeholder="Search products, brands and more…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      <button type="submit" className="hsearch__btn" aria-label="Search"><Icon name="search" size={18} /></button>
    </form>
  );
}

function HeaderAction({ to, icon, label, count, onClick, className = "" }) {
  const inner = (
    <>
      <span className="haction__icon"><Icon name={icon} size={21} />{count > 0 && <span className="haction__count" aria-hidden="true">{count > 99 ? "99+" : count}</span>}</span>
      <span className="haction__label">{label}</span>
    </>
  );
  const aria = count > 0 ? `${label} (${count})` : label;
  if (to) return <Link to={to} className={`haction ${className}`} aria-label={aria}>{inner}</Link>;
  return <button type="button" className={`haction ${className}`} aria-label={aria} onClick={onClick}>{inner}</button>;
}

export default function Header() {
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);
  const wishCount = useSelector(selectWishlistIds).length;
  const isAuth = useSelector((s) => s.auth.isAuthenticated);
  const role = useSelector((s) => s.auth.user?.role);
  const location = useLocation();
  const [stuck, setStuck] = useState(false);
  const [openMega, setOpenMega] = useState(null);
  const [openCats, setOpenCats] = useState(false);
  const timer = useRef();
  const navRef = useRef(null);

  useEffect(() => { const h = () => setStuck(window.scrollY > 24); h(); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);
  useEffect(() => { setOpenMega(null); setOpenCats(false); }, [location.pathname]);
  useEffect(() => {
    if (!openMega && !openCats) return;
    const onKey = (e) => { if (e.key === "Escape") { setOpenMega(null); setOpenCats(false); } };
    const onClick = (e) => { if (navRef.current && !navRef.current.contains(e.target)) { setOpenMega(null); setOpenCats(false); } };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [openMega, openCats]);

  const enter = (label) => { clearTimeout(timer.current); timer.current = setTimeout(() => { setOpenMega(label); setOpenCats(false); }, 110); };
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpenMega(null), 180); };

  return (
    <>
      <UtilityBar />
      <header className={`header ${stuck ? "is-stuck" : ""}`}>
        <div className="header__bar-wrap">
          <div className="container header__bar">
            <div className="header__left">
              <button type="button" className="icon-btn header__burger" aria-label="Open menu" aria-haspopup="dialog" onClick={() => dispatch(uiActions.openMenu())}><Icon name="menu" size={22} /></button>
              <Logo />
            </div>
            <div className="header__search"><SearchForm /></div>
            <div className="header__right">
              <button type="button" className="icon-btn header__search-mobile" aria-label="Search" aria-haspopup="dialog" onClick={() => dispatch(uiActions.openSearch())}><Icon name="search" size={22} /></button>
              <HeaderAction to={isAuth ? accountHome(role) : "/login"} icon="user" label={isAuth ? "Account" : "Sign in"} />
              <HeaderAction to="/wishlist" icon="heart" label="Wishlist" count={wishCount} />
              <HeaderAction icon="cart" label="Cart" count={cartCount} onClick={() => dispatch(uiActions.openCart())} />
            </div>
          </div>
        </div>

        <div className="header__nav" ref={navRef}>
          <div className="container header__nav-inner">
            <div className="catmenu">
              <button type="button" className={`catmenu__btn ${openCats ? "is-open" : ""}`} aria-expanded={openCats} aria-controls="catmenu-panel" onClick={() => { setOpenCats((o) => !o); setOpenMega(null); }}>
                <Icon name="grid" size={17} />
                Categories
                <Icon name="chevronDown" size={14} className="catmenu__chev" />
              </button>
              {openCats && (
                <div className="catmenu__panel" id="catmenu-panel">
                  <ul>
                    {CATEGORIES.map((c) => <li key={c.slug}><Link to={`/${c.slug}`} onClick={() => setOpenCats(false)}>{c.name}<Icon name="arrowRight" size={14} /></Link></li>)}
                    <li><Link to="/categories" className="catmenu__all" onClick={() => setOpenCats(false)}>View all categories<Icon name="arrowRight" size={14} /></Link></li>
                  </ul>
                </div>
              )}
            </div>
            <span className="header__nav-divider" aria-hidden="true" />
            <nav className="nav" aria-label="Main">
              {NAV.map((item) => (
                <div key={item.label} className="nav__item" onMouseEnter={() => item.mega && enter(item.label)} onMouseLeave={leave}>
                  <NavLink to={item.to} className={({ isActive }) => `nav__link ${item.accent ? "nav__link--accent" : ""} ${isActive ? "is-active" : ""}`}
                    aria-haspopup={item.mega ? "true" : undefined} aria-expanded={item.mega ? openMega === item.label : undefined}
                    onFocus={() => item.mega && setOpenMega(item.label)}
                    onKeyDown={(e) => { if (item.mega && (e.key === "ArrowDown" || e.key === " ")) { e.preventDefault(); setOpenMega(item.label); } }}>
                    {item.accent && <span className="nav__dot" aria-hidden="true" />}
                    {item.label}
                    {item.mega && <Icon name="chevronDown" size={13} />}
                  </NavLink>
                  {item.mega && openMega === item.label && <MegaMenu item={item} onClose={() => setOpenMega(null)} />}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <MobileMenu />
    </>
  );
}
