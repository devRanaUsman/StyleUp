import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "@/components/navigation";
import { Button } from "../ui";
import { uiActions } from "../../store/uiSlice";

export default function CookieBanner() {
  const consent = useSelector((s) => s.ui.cookieConsent);
  const dispatch = useDispatch();
  const [manage, setManage] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: true, marketing: false });
  if (consent) return null;
  const save = (p) => dispatch(uiActions.setCookieConsent({ essential: true, ...p, at: new Date().toISOString() }));
  return (
    <div className="cookie" role="dialog" aria-label="Cookie preferences" aria-live="polite">
      <p>We use cookies to keep your cart, remember preferences and understand how the site is used. <Link to="/privacy" className="link">Privacy policy</Link></p>
      {manage && (
        <div className="cookie__prefs">
          <div className="cookie__pref"><span>Essential<small>Cart, sign-in and security. Always on.</small></span><button type="button" className="switch" role="switch" aria-checked="true" aria-label="Essential cookies (required)" disabled /></div>
          <div className="cookie__pref"><span>Analytics<small>Helps us improve the store.</small></span><button type="button" className="switch" role="switch" aria-checked={prefs.analytics} aria-label="Analytics cookies" onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))} /></div>
          <div className="cookie__pref"><span>Marketing<small>Personalised offers.</small></span><button type="button" className="switch" role="switch" aria-checked={prefs.marketing} aria-label="Marketing cookies" onClick={() => setPrefs((p) => ({ ...p, marketing: !p.marketing }))} /></div>
        </div>
      )}
      <div className="cookie__actions">
        <Button size="sm" onClick={() => save({ analytics: true, marketing: true })}>Accept all</Button>
        <Button size="sm" variant="secondary" onClick={() => save({ analytics: false, marketing: false })}>Reject optional</Button>
        {manage ? <Button size="sm" variant="secondary" onClick={() => save(prefs)}>Save preferences</Button> : <Button size="sm" variant="ghost" onClick={() => setManage(true)}>Manage preferences</Button>}
      </div>
    </div>
  );
}
