import { useState } from "react";
import { Link } from "@/components/navigation";
import Icon from "../../components/ui/Icon";
import { Button, Input } from "../../components/ui";
import { useSeo } from "../../hooks/useSeo";
import { useForm } from "../../hooks/useForm";
import { rules } from "../../utils/validation";
import authService from "../../services/authService";

export default function ForgotPassword() {
  useSeo({ title: "Reset password", path: "/forgot-password", noindex: true });
  const [sent, setSent] = useState("");
  const f = useForm({ email: "" }, { email: [rules.required("Email"), rules.email()] });
  const submit = f.handleSubmit(async (v) => { await authService.forgotPassword(v.email); setSent(v.email); });
  return (
    <div className="container auth">
      {sent ? (
        <div className="empty" style={{ padding: "8px 0" }}><div className="empty__icon"><Icon name="mail" size={28} /></div><h1 className="h2">Check your inbox</h1><p>If an account exists for <b>{sent}</b>, we've sent a link to reset your password. It expires in 30 minutes.</p><div className="empty__actions"><Button to="/login">Back to sign in</Button><Button variant="secondary" onClick={() => setSent("")}>Use a different email</Button></div></div>
      ) : (
        <>
          <h1 className="h1">Reset your password</h1>
          <p className="auth__lead">Enter the email you signed up with and we'll send you a reset link.</p>
          <form className="auth__form" noValidate onSubmit={submit}>
            <Input label="Email address" type="email" autoComplete="email" inputMode="email" {...f.field("email")} error={f.error("email")} />
            <Button type="submit" size="lg" block loading={f.submitting}>Send reset link</Button>
          </form>
          <p className="auth__switch"><Link to="/login" className="link">Back to sign in</Link></p>
        </>
      )}
    </div>
  );
}
