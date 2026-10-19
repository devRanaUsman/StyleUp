import { useNavigate } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Button, Checkbox, Input, Notice, PasswordInput } from "../../components/ui";
import { toast } from "../../components/ui/Overlays";
import { useSeo } from "../../hooks/useSeo";
import { useForm } from "../../hooks/useForm";
import { rules } from "../../utils/validation";
import authService from "../../services/authService";
import { authActions } from "../../store/authSlice";
import AccountLayout from "./AccountLayout";

export default function Profile() {
  useSeo({ title: "Profile settings", noindex: true });
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const p = useForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", news: user?.prefs?.news ?? true, offers: user?.prefs?.offers ?? true }, { name: [rules.required("Name"), rules.minLen(2, "Name")], email: [rules.required("Email"), rules.email()], phone: [rules.phone()] });
  const pw = useForm({ current: "", next: "", confirm: "" }, { current: [rules.required("Current password")], next: [rules.required("New password"), rules.password()], confirm: [rules.required("Confirm password"), rules.match("next")] });
  const saveProfile = p.handleSubmit(async (v) => { const u = await authService.updateProfile(user.id, { name: v.name.trim(), email: v.email.trim().toLowerCase(), phone: v.phone, prefs: { news: v.news, offers: v.offers } }); dispatch(authActions.setUser(u)); toast(dispatch, "Profile updated", { type: "success" }); });
  const savePw = pw.handleSubmit(async (v) => { await authService.changePassword(user.id, v.current, v.next); pw.setValues({ current: "", next: "", confirm: "" }); toast(dispatch, "Password changed", { type: "success" }); });
  
  return (
    <AccountLayout title="Profile settings" crumbs={[{ label: "Profile", to: "/account/profile" }]}>
      <form className="card form-grid" noValidate onSubmit={saveProfile}>
        <h2 className="h3" style={{ fontSize: "1.125rem" }}>Personal details</h2>
        {p.formError && <Notice tone="error" icon="alert" role="alert">{p.formError}</Notice>}
        <div className="form-grid form-grid--2"><Input label="Full name" autoComplete="name" {...p.field("name")} error={p.error("name")} /><Input label="Phone" optional type="tel" autoComplete="tel" {...p.field("phone")} error={p.error("phone")} /></div>
        <Input label="Email address" readOnly hint="Contact support to change your email address." type="email" autoComplete="email" {...p.field("email")} error={p.error("email")} />
        <h3 className="field__label" style={{ marginTop: 8 }}>Email preferences</h3>
        <Checkbox label="New arrivals and style inspiration" name="news" checked={p.values.news} onChange={p.field("news").onChange} />
        <Checkbox label="Offers and sale previews" name="offers" checked={p.values.offers} onChange={p.field("offers").onChange} />
        <div><Button type="submit" loading={p.submitting}>Save changes</Button></div>
      </form>
      <form className="card form-grid" noValidate onSubmit={savePw}>
        <h2 className="h3" style={{ fontSize: "1.125rem" }}>Change password</h2>
        {pw.formError && <Notice tone="error" icon="alert" role="alert">{pw.formError}</Notice>}
        <PasswordInput label="Current password" autoComplete="current-password" {...pw.field("current")} error={pw.error("current")} />
        <div className="form-grid form-grid--2"><PasswordInput label="New password" autoComplete="new-password" hint="At least 8 characters with a number." {...pw.field("next")} error={pw.error("next")} /><PasswordInput label="Confirm new password" autoComplete="new-password" {...pw.field("confirm")} error={pw.error("confirm")} /></div>
        <div><Button type="submit" variant="secondary" loading={pw.submitting}>Update password</Button></div>
      </form>
      <p className="muted">Contact support to request account deletion or an email change.</p>
    </AccountLayout>
  );
}
