import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@/components/navigation";
import Icon, { StarIcon } from "./Icon";
import { money, clamp } from "../../utils/format";

/* ---------------- Button ---------------- */
export function Button({ as, to, href, variant = "primary", size, block, icon, iconRight, loading, className = "", children, ...rest }) {
  const cls = ["btn", `btn--${variant}`, size && `btn--${size}`, block && "btn--block", loading && "btn--loading", className].filter(Boolean).join(" ");
  const inner = (<>{icon && <Icon name={icon} size={18} />}{children}{iconRight && <Icon name={iconRight} size={18} className={variant === "tertiary" ? "btn__arrow" : ""} />}</>);
  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{inner}</a>;
  const Tag = as || "button";
  return <Tag type={Tag === "button" ? rest.type || "button" : undefined} className={cls} aria-busy={loading || undefined} disabled={rest.disabled || loading} {...rest}>{inner}</Tag>;
}

export function IconButton({ icon, label, count, size = 22, small, className = "", as, to, ...rest }) {
  const cls = ["icon-btn", small && "icon-btn--sm", className].filter(Boolean).join(" ");
  const inner = (<><Icon name={icon} size={size} />{count > 0 && <span className="icon-btn__count" aria-hidden="true">{count > 99 ? "99+" : count}</span>}</>);
  const aria = count > 0 ? `${label} (${count})` : label;
  if (to) return <Link to={to} className={cls} aria-label={aria} {...rest}>{inner}</Link>;
  return <button type="button" className={cls} aria-label={aria} {...rest}>{inner}</button>;
}

/* ---------------- Badge ---------------- */
export function Badge({ tone = "", children, className = "" }) {
  return <span className={`badge ${tone ? `badge--${tone}` : ""} ${className}`}>{children}</span>;
}
export function ProductBadges({ product, max = 1 }) {
  const out = [];
  if (product.sale_status && product.discount_percentage) out.push(<Badge key="sale" tone="sale">-{product.discount_percentage}%</Badge>);
  if (product.new_arrival) out.push(<Badge key="new" tone="new">New</Badge>);
  if (product.best_seller && out.length < 1) out.push(<Badge key="best" tone="best">Best Seller</Badge>);
  if (product.availability === "out_of_stock") return <Badge tone="soft">Sold out</Badge>;
  return out.slice(0, max);
}

/* ---------------- Rating ---------------- */
export function Rating({ value = 0, count, size = "", showValue = false, hideCount }) {
  const v = clamp(Number(value) || 0, 0, 5);
  return (
    <span className={`rating ${size ? `rating--${size}` : ""}`} aria-label={`Rated ${v} out of 5${count != null ? ` from ${count} reviews` : ""}`}>
      <span className="rating__stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} fill={clamp(v - i, 0, 1)} size={size === "lg" ? 18 : 14} />)}</span>
      {showValue && <span>{v.toFixed(1)}</span>}
      {!hideCount && count != null && <span className="rating__count">({count.toLocaleString()})</span>}
    </span>
  );
}

/* ---------------- Price ---------------- */
export function Price({ product, regular, sale, size = "", showDiscount = true, currency = "USD" }) {
  const r = product ? product.regular_price : regular;
  const s = product ? product.sale_price : sale;
  const onSale = s != null && s < r;
  const pct = product?.discount_percentage || (onSale ? Math.round((1 - s / r) * 100) : 0);
  return (
    <span className={`price ${onSale ? "price--sale" : ""} ${size ? `price--${size}` : ""}`}>
      <span className="price__current">{money(onSale ? s : r, currency)}</span>
      {onSale && <><span className="price__original"><span className="sr-only">Original price </span>{money(r, currency)}</span>{showDiscount && <span className="price__discount">-{pct}%</span>}</>}
    </span>
  );
}

/* ---------------- Swatches ---------------- */
export function Swatches({ colors = [], value, onChange, small, max, disabledCheck, name = "Color" }) {
  const shown = max ? colors.slice(0, max) : colors;
  const extra = max ? colors.length - shown.length : 0;
  if (!colors.length) return null;
  return (
    <div className="swatches" role={onChange ? "radiogroup" : undefined} aria-label={onChange ? name : undefined}>
      {shown.map((c) => {
        const disabled = disabledCheck ? !disabledCheck(c.name) : false;
        const Tag = onChange ? "button" : "span";
        return (
          <Tag key={c.name} type={onChange ? "button" : undefined} role={onChange ? "radio" : undefined} aria-checked={onChange ? value === c.name : undefined}
            aria-label={`${c.name}${disabled ? " (unavailable)" : ""}`} title={c.name} disabled={disabled || undefined}
            className={`swatch ${small ? "swatch--sm" : ""}`} style={{ "--sw": c.hex }} onClick={onChange ? () => !disabled && onChange(c.name) : undefined} />
        );
      })}
      {extra > 0 && <span className="swatch__more">+{extra}</span>}
    </div>
  );
}

/* ---------------- Sizes ---------------- */
export function SizeSelector({ sizes = [], value, onChange, available }) {
  if (!sizes.length) return null;
  return (
    <div className="sizes" role="radiogroup" aria-label="Size">
      {sizes.map((s) => { const ok = available ? available(s) : true; return (
        <button key={s} type="button" role="radio" aria-checked={value === s} className="size" disabled={!ok} aria-label={`${s}${!ok ? " (out of stock)" : ""}`} onClick={() => ok && onChange(s)}>{s}</button>
      ); })}
    </div>
  );
}

/* ---------------- Quantity ---------------- */
export function Quantity({ value, onChange, min = 1, max = 99, small, label = "Quantity" }) {
  return (
    <div className={`qty ${small ? "qty--sm" : ""}`} role="group" aria-label={label}>
      <button type="button" className="qty__btn" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(clamp(value - 1, min, max))}><Icon name="minus" size={16} /></button>
      <span className="qty__value" aria-live="polite" aria-atomic="true">{value}</span>
      <button type="button" className="qty__btn" aria-label={value >= max ? "Maximum available quantity reached" : "Increase quantity"} disabled={value >= max} onClick={() => onChange(clamp(value + 1, min, max))}><Icon name="plus" size={16} /></button>
    </div>
  );
}

/* ---------------- Breadcrumb ---------------- */
export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb"><ol className="crumbs">
      {items.map((it, i) => { const last = i === items.length - 1; return (
        <li key={i}>{last ? <span aria-current="page">{it.label}</span> : <Link to={it.to}>{it.label}</Link>}</li>
      ); })}
    </ol></nav>
  );
}

/* ---------------- Tabs ---------------- */
export function Tabs({ tabs, value, onChange, pills, label = "Tabs" }) {
  return (
    <div className={`tabs ${pills ? "tabs--pills" : ""}`} role="tablist" aria-label={label}>
      {tabs.map((t) => <button key={t.id} type="button" role="tab" className="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>{t.label}</button>)}
    </div>
  );
}

/* ---------------- Accordion ---------------- */
export function Accordion({ items, defaultOpen = [0], single = false }) {
  const [open, setOpen] = useState(new Set(defaultOpen));
  const base = useId();
  const toggle = (i) => setOpen((s) => { const n = new Set(single ? [] : s); if (s.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <div className="acc">
      {items.filter(Boolean).map((it, i) => (
        <div className="acc__item" key={i}>
          <h3><button type="button" className="acc__btn" aria-expanded={open.has(i)} aria-controls={`${base}-p${i}`} id={`${base}-b${i}`} onClick={() => toggle(i)}>{it.title}<Icon name="chevronDown" size={18} /></button></h3>
          <div className="acc__panel" data-open={open.has(i)} id={`${base}-p${i}`} role="region" aria-labelledby={`${base}-b${i}`}><div><div className="acc__body">{it.content}</div></div></div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Form fields ---------------- */
export function Field({ label, optional, hint, error, children, id: idProp, className = "" }) {
  const auto = useId(); const id = idProp || auto;
  return (
    <div className={`field ${className}`}>
      {label && <label className="field__label" htmlFor={id}>{label}{optional && <span className="opt"> (optional)</span>}</label>}
      {typeof children === "function" ? children(id) : children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error" id={`${id}-error`} role="alert"><Icon name="alert" size={13} />{error}</span>}
    </div>
  );
}
export function Input({ label, optional, hint, error, className = "", ...rest }) {
  return <Field label={label} optional={optional} hint={hint} error={error} className={className}>{(id) => <input id={id} className="input" aria-describedby={error ? `${id}-error` : undefined} aria-invalid={error ? "true" : undefined} {...rest} />}</Field>;
}
export function Textarea({ label, optional, hint, error, ...rest }) {
  return <Field label={label} optional={optional} hint={hint} error={error}>{(id) => <textarea id={id} className="textarea" aria-invalid={error ? "true" : undefined} {...rest} />}</Field>;
}
export function Select({ label, optional, hint, error, options, placeholder, ...rest }) {
  return <Field label={label} optional={optional} hint={hint} error={error}>{(id) => (
    <div className="select-wrap"><select id={id} className="select" aria-invalid={error ? "true" : undefined} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select></div>
  )}</Field>;
}
export function Checkbox({ label, count, className = "", ...rest }) {
  return (<label className={`check ${className}`}><input type="checkbox" {...rest} /><span className="check__box"><Icon name="check" size={12} strokeWidth={3} /></span><span className="check__label">{label}{count != null && <span className="check__count">({count})</span>}</span></label>);
}
export function Radio({ label, className = "", ...rest }) {
  return (<label className={`radio ${className}`}><input type="radio" {...rest} /><span className="radio__dot" /><span className="radio__label">{label}</span></label>);
}
export function PasswordInput({ label, error, hint, ...rest }) {
  const [show, setShow] = useState(false);
  return <Field label={label} error={error} hint={hint}>{(id) => (
    <div className="input-group"><input id={id} type={show ? "text" : "password"} className="input" aria-invalid={error ? "true" : undefined} {...rest} />
      <button type="button" className="icon-btn icon-btn--sm input-group__btn" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow((s) => !s)}><Icon name={show ? "eyeOff" : "eye"} size={18} /></button></div>
  )}</Field>;
}

/* ---------------- Pagination ---------------- */
export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  const push = (n) => nums.push(n);
  if (pages <= 7) for (let i = 1; i <= pages; i++) push(i);
  else { push(1); if (page > 3) push("…"); for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) push(i); if (page < pages - 2) push("…"); push(pages); }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><Icon name="chevronLeft" size={18} /></button>
      {nums.map((n, i) => (n === "…" ? <span key={`e${i}`} className="page-ellipsis" aria-hidden="true">…</span> : <button key={n} type="button" className="page-btn" aria-current={n === page ? "page" : undefined} aria-label={`Page ${n}`} onClick={() => onChange(n)}>{n}</button>))}
      <button type="button" className="page-btn" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><Icon name="chevronRight" size={18} /></button>
    </nav>
  );
}

/* ---------------- Chips ---------------- */
export function Chip({ label, onRemove }) {
  return (<span className="chip">{label}<button type="button" className="chip__x" aria-label={`Remove filter ${label}`} onClick={onRemove}><Icon name="close" size={12} /></button></span>);
}

/* ---------------- Notice ---------------- */
export function Notice({ tone = "", icon, children, role = "status" }) {
  const ic = icon || (tone === "error" ? "alert" : tone === "success" ? "check" : "info");
  return <div className={`notice ${tone ? `notice--${tone}` : ""}`} role={tone === "error" ? "alert" : role}><Icon name={ic} size={16} /><div>{children}</div></div>;
}

/* ---------------- Empty state ---------------- */
export function EmptyState({ icon = "search", title, text, actions }) {
  return (<div className="empty"><div className="empty__icon"><Icon name={icon} size={30} /></div><h2 className="h2">{title}</h2>{text && <p>{text}</p>}{actions && <div className="empty__actions">{actions}</div>}</div>);
}

/* ---------------- Skeletons ---------------- */
export function SkeletonCard() { return (<div className="skel-card" aria-hidden="true"><div className="skel skel-img" /><div className="skel skel-line" style={{ width: "70%" }} /><div className="skel skel-line" style={{ width: "40%" }} /></div>); }
export function SkeletonGrid({ n = 8, className = "product-grid" }) { return <div className={className} aria-busy="true" aria-label="Loading products">{Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} />)}</div>; }
export function SkeletonLines({ n = 3, w = ["100%", "90%", "60%"] }) { return <div className="stack" aria-hidden="true" style={{ "--gap": "8px" }}>{Array.from({ length: n }).map((_, i) => <div key={i} className="skel skel-line" style={{ width: w[i % w.length], marginTop: 8 }} />)}</div>; }

/* ---------------- Product image with fallback & lazy loading ---------------- */
export function ProductImage({ src, srcSet, alt, sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw", className = "", eager, name = "", ...rest }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) return <ImagePlaceholder label={name || alt} className={className} />;
  return <img src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" fetchPriority={eager ? "high" : undefined} onError={() => setFailed(true)} className={`img-cover ${className}`} {...rest} />;
}
export function ImagePlaceholder({ label = "", className = "" }) {
  return (
    <div className={`img-placeholder ${className}`} role="img" aria-label={label ? `${label} image unavailable` : "Image unavailable"}>
      <svg viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="8" y="12" width="48" height="40" rx="4" /><circle cx="24" cy="26" r="5" /><path d="m8 44 14-12 10 9 8-6 16 13" /></svg>
      <span className="img-placeholder__text">{label ? label.split(" ").slice(0, 3).join(" ") : "Image coming soon"}</span>
    </div>
  );
}

/* ---------------- Section header ---------------- */
export function SectionHead({ title, sub, to, linkLabel = "View all", h = "h2" }) {
  const H = h;
  return (<div className="section-head"><div><H className="h2">{title}</H>{sub && <p className="sub">{sub}</p>}</div>{to && <Button variant="tertiary" to={to} iconRight="arrowRight" className="hide-mobile-inline">{linkLabel}</Button>}</div>);
}

/* ---------------- Back to top ---------------- */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => { const h = () => setShow(window.scrollY > 900); h(); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);
  if (!show) return null;
  return <button type="button" className="back-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Icon name="arrowUp" size={18} /></button>;
}

/* ---------------- Trust row ---------------- */
export function TrustGrid({ items, compact }) {
  return (<ul className={`trust-grid ${compact ? "trust-grid--compact" : ""}`}>{items.map((t) => (<li key={t.title} className="trust-item"><span className="trust-item__icon"><Icon name={t.icon} size={22} /></span><div><div className="trust-item__title">{t.title}</div><div className="trust-item__text">{t.text}</div></div></li>))}</ul>);
}

export { Icon };
