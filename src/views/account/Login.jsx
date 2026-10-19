import { safePath, Link, useNavigate, useSearchParams } from "@/components/navigation";
import { useDispatch } from "react-redux";
import Icon from "../../components/ui/Icon";
import { Button, Checkbox, Input, Notice, PasswordInput } from "../../components/ui";
import { toast } from "../../components/ui/Overlays";
import { useSeo } from "../../hooks/useSeo";
import { useForm } from "../../hooks/useForm";
import { rules } from "../../utils/validation";
import authService from "../../services/authService";
import { authActions } from "../../store/authSlice";
import { loginDestination } from "../../utils/account";

export default function Login() {
  useSeo({ title: "Sign in", description: "Sign in to your StyleUp account to track orders, manage addresses and save your wishlist.", path: "/login" });
  const [sp] = useSearchParams();
  const next = safePath(sp.get("next"), "/account");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const f = useForm({ email: sp.get("email") || "", password: "", remember: true }, { email: [rules.required("Email"), rules.email()], password: [rules.required("Password")] });
  const submit = f.handleSubmit(async (v) => { const u = await authService.login(v.email, v.password, undefined, v.remember); dispatch(authActions.setUser(u)); toast(dispatch, `Welcome back, ${u.name.split(" ")[0]}`, { type: "success" }); window.location.assign(loginDestination(u.role, sp.get("next"))); });
  return (
    <div className="container auth">
      <h1 className="h1">Welcome back</h1>
      <p className="auth__lead">Sign in to your StyleUp account. Customers, sellers and administrators are taken to their own dashboard.</p>
      {sp.get("registered") && <Notice tone="success" icon="check">Account created. Sign in to continue.</Notice>}
      {f.formError && <Notice tone="error" icon="alert" role="alert">{f.formError}</Notice>}
      <form className="auth__form" noValidate onSubmit={submit} style={{ marginTop: 16 }}>
        <Input label="Email address" type="email" autoComplete="email" inputMode="email" {...f.field("email")} error={f.error("email")} />
        <PasswordInput label="Password" autoComplete="current-password" {...f.field("password")} error={f.error("password")} />
        <div className="auth__row"><Checkbox label="Keep me signed in" name="remember" checked={f.values.remember} onChange={f.field("remember").onChange} /><Link to="/forgot-password" className="link">Forgot password?</Link></div>
        <Button type="submit" size="lg" block loading={f.submitting}>Sign in</Button>
      </form>
      <p className="auth__switch">New to StyleUp? <Link to={`/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="link">Create an account</Link></p>
      <ul className="auth__perks"><li><Icon name="package" size={18} />Track orders and returns in one place</li><li><Icon name="heart" size={18} />Keep your wishlist across devices</li><li><Icon name="zap" size={18} />Faster checkout with saved details</li></ul>
      <p className="small muted" style={{marginTop:24}}><Link to="/seller/login">Seller sign in</Link> · <Link to="/admin/login">Administrator sign in</Link></p>
    </div>
  );
}
