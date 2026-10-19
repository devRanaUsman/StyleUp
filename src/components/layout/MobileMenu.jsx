import { useState } from "react";
import { Link } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Drawer } from "../ui/Overlays";
import Icon from "../ui/Icon";
import { NAV } from "../../data/catalog";
import { uiActions } from "../../store/uiSlice";

export default function MobileMenu() {
  const open = useSelector((s) => s.ui.menuOpen);
  const isAuth = useSelector((s) => s.auth.isAuthenticated);
  const dispatch = useDispatch();
  const close = () => dispatch(uiActions.closeMenu());
  const [expanded, setExpanded] = useState(null);

  return (
    <Drawer open={open} onClose={close} title="Menu" side="left">
      <nav aria-label="Mobile">
        <ul className="mmenu__list">
          {NAV.map((item) => (
            <li key={item.label} className="mmenu__item">
              {item.mega ? (
                <>
                  <button type="button" className={`mmenu__row ${item.accent ? "mmenu__row--accent" : ""}`} aria-expanded={expanded === item.label} aria-controls={`mm-${item.label}`} onClick={() => setExpanded((e) => (e === item.label ? null : item.label))}>
                    {item.label}<Icon name="chevronDown" size={18} />
                  </button>
                  {expanded === item.label && (
                    <div className="mmenu__sub" id={`mm-${item.label}`}>
                      <Link to={item.to} onClick={close}>All {item.label}</Link>
                      {item.mega.columns.map((col) => (
                        <div key={col.title}><div className="mmenu__sub-title">{col.title}</div>{col.links.map(([l, to]) => <Link key={to} to={to} onClick={close}>{l}</Link>)}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link to={item.to} className={`mmenu__row ${item.accent ? "mmenu__row--accent" : ""}`} onClick={close}>{item.label}<Icon name="chevronRight" size={18} /></Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="mmenu__foot">
        <Link to={isAuth ? "/account" : "/login"} onClick={close}><Icon name="user" size={20} />{isAuth ? "My Account" : "Sign in / Register"}</Link>
        <Link to="/track-order" onClick={close}><Icon name="package" size={20} />Track Order</Link>
        <Link to="/contact" onClick={close}><Icon name="headset" size={20} />Help & Contact</Link>
        <Link to="/contact#stores" onClick={close}><Icon name="mapPin" size={20} />Store Locator</Link>
      </div>
    </Drawer>
  );
}
