import { NavLink, useNavigate } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../../components/ui/Icon";
import { Breadcrumb } from "../../components/ui";
import { toast } from "../../components/ui/Overlays";
import authService from "../../services/authService";
import { authActions } from "../../store/authSlice";

export const ACCOUNT_NAV = [
  ["/account", "Dashboard", "user", true],
  ["/account/orders", "My orders", "package"],
  ["/track-order", "Track order", "truck"],
  ["/account/addresses", "Addresses", "mapPin"],
  ["/account/payment-methods", "Payment methods", "creditCard"],
  ["/account/profile", "Profile settings", "settings"],
  ["/wishlist", "Wishlist", "heart"],
];

export default function AccountLayout({ title, crumbs = [], children }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logout = async () => { try { await authService.logout(); window.location.assign('/'); } catch(e) { toast(dispatch,e.message,{type:'error'}); } };
  return (
    <div className="page container">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "My account", to: "/account" }, ...crumbs]} />
      <div className="acct">
        <nav className="acct__nav" aria-label="Account">
          {user?.role && user.role!=='customer' && <NavLink to={'/'+user.role}>Open {user.role} dashboard</NavLink>}
          {ACCOUNT_NAV.map(([to, label, icon, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "is-active" : "")}><Icon name={icon} size={18} />{label}</NavLink>)}
          <button type="button" onClick={logout}><Icon name="logout" size={18} />Sign out</button>
        </nav>
        <div className="acct__main">
          {title && <h1 className="h2" style={{ fontSize: "var(--fs-h3)" }}>{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
}
