import { accountHome } from "../../utils/account";
import { NavLink, useLocation } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../ui/Icon";
import { uiActions } from "../../store/uiSlice";
import { selectWishlistIds } from "../../store/wishlistSlice";

export default function BottomNav() {
  const dispatch = useDispatch();
  const wish = useSelector(selectWishlistIds).length;
  const isAuth = useSelector((s) => s.auth.isAuthenticated);
  const role = useSelector((s) => s.auth.user?.role);
  const { pathname } = useLocation();
  if (pathname.startsWith("/checkout")) return null;
  const cls = ({ isActive }) => (isActive ? "is-active" : "");
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      <NavLink to="/" end className={cls}><Icon name="home" size={22} />Home</NavLink>
      <NavLink to="/shop" className={cls}><Icon name="bag" size={22} />Shop</NavLink>
      <button type="button" onClick={() => dispatch(uiActions.openMenu())} aria-haspopup="dialog"><Icon name="grid" size={22} />Categories</button>
      <NavLink to="/wishlist" className={cls}><Icon name="heart" size={22} />Wishlist{wish > 0 && <span className="icon-btn__count" aria-hidden="true">{wish}</span>}</NavLink>
      <NavLink to={isAuth ? accountHome(role) : "/login"} className={cls}><Icon name="user" size={22} />Account</NavLink>
    </nav>
  );
}
