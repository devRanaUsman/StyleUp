import { safePath, Link, useNavigate, useSearchParams } from "@/components/navigation";
import { useDispatch } from "react-redux";
import { Button, Checkbox, Input, Notice, PasswordInput } from "../../components/ui";
import { toast } from "../../components/ui/Overlays";
import { useSeo } from "../../hooks/useSeo";
import { useForm } from "../../hooks/useForm";
import { rules } from "../../utils/validation";
import authService from "../../services/authService";
import { authActions } from "../../store/authSlice";

export default function Register() {
  useSeo({ title: "Create account", description: "Join StyleUp for faster checkout, order tracking and early access to new arrivals.", path: "/register" });
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const f = useForm({ name: "", email: sp.get("email") || "", password: "", confirm: "", terms: false, news: true }, { name: [rules.required("Full name"), rules.minLen(2, "Name")], email: [rules.required("Email"), rules.email()], password: [rules.required("Password"), rules.password()], confirm: [rules.required("Confirm password"), rules.match("password")], terms: [(v) => (v ? "" : "Please accept the terms to continue.")] });
  const submit = f.handleSubmit(async (v) => { const u = await authService.register(v); dispatch(authActions.setUser(u)); toast(dispatch, `Welcome to StyleUp, ${u.name.split(" ")[0]}`, { type: "success" }); window.location.assign(safePath(sp.get("next"), "/account")); });
  const pw = f.values.password; const strength = !pw ? 0 : pw.length < 8 ? 1 : /\d/.test(pw) && /[A-Z]/.test(pw) && pw.length >= 12 ? 3 : /\d/.test(pw) ? 2 : 1;
  return (
    <div className="container auth">
      <h1 className="h1">Create your account</h1>
      <p className="auth__lead">Faster checkout, order tracking and early access to new arrivals.</p>
      {f.formError && <Notice tone="error" icon="alert" role="alert">{f.formError} {f.formError.includes("exists") && <Link to={`/login?email=${encodeURIComponent(f.values.email)}`} className="link">Sign in</Link>}</Notice>}
      <form className="auth__form" noValidate onSubmit={submit} style={{ marginTop: 16 }}>
        <Input label="Full name" autoComplete="name" {...f.field("name")} error={f.error("name")} />
        <Input label="Email address" type="email" autoComplete="email" inputMode="email" {...f.field("email")} error={f.error("email")} />
        <div>
          <PasswordInput label="Password" autoComplete="new-password" hint="At least 8 characters with a number." {...f.field("password")} error={f.error("password")} />
          {pw && <div className="progress" style={{ marginTop: 8 }} aria-label={`Password strength: ${["", "weak", "good", "strong"][strength]}`}><div className="progress__bar" style={{ width: `${strength * 33.3}%`, background: strength === 1 ? "var(--sale)" : strength === 2 ? "var(--warning)" : "var(--success)" }} /></div>}
        </div>
        <PasswordInput label="Confirm password" autoComplete="new-password" {...f.field("confirm")} error={f.error("confirm")} />
        <div>
          <Checkbox label={<>I agree to the <Link to="/terms" className="link" target="_blank">Terms</Link> and <Link to="/privacy" className="link" target="_blank">Privacy Policy</Link></>} name="terms" checked={f.values.terms} onChange={f.field("terms").onChange} aria-invalid={f.error("terms") ? "true" : undefined} />
          {f.error("terms") && <span className="field__error" role="alert">{f.error("terms")}</span>}
        </div>
        <Checkbox label="Send me new arrivals and offers (unsubscribe any time)" name="news" checked={f.values.news} onChange={f.field("news").onChange} />
        <Button type="submit" size="lg" block loading={f.submitting}>Create account</Button>
      </form>
      <p className="auth__switch">Already have an account? <Link to="/login" className="link">Sign in</Link></p>
    </div>
  );
}
