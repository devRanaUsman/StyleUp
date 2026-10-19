import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "./Icon";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { uiActions } from "../../store/uiSlice";

const root = () => document.getElementById("overlay-root") || document.body;

export function Modal({ open, onClose, title, children, width, labelledBy, className = "" }) {
  const ref = useRef(null);
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div className="modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div ref={ref} className={`modal__panel ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy || (title ? "modal-title" : undefined)} tabIndex={-1} style={width ? { "--modal-w": width } : undefined}>
          <button type="button" className="icon-btn modal__close" aria-label="Close dialog" onClick={onClose}><Icon name="close" size={20} /></button>
          {title && <h2 className="modal__title" id="modal-title">{title}</h2>}
          {children}
        </div>
      </div>
    </>, root());
}

export function Drawer({ open, onClose, title, side = "right", children, footer, headExtra }) {
  const ref = useRef(null);
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <aside ref={ref} className={`drawer drawer--${side}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className="drawer__head"><h2 className="drawer__title">{title}</h2>{headExtra}<button type="button" className="icon-btn" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}><Icon name="close" size={20} /></button></div>
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__foot">{footer}</div>}
      </aside>
    </>, root());
}

export function ToastHost() {
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  const toasts = useSelector((s) => s.ui.toasts);
  const dispatch = useDispatch();
  if(!mounted) return null;
  return createPortal(
    <div className="toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => <Toast key={t.id} toast={t} onClose={() => dispatch(uiActions.dismissToast(t.id))} />)}
    </div>, root());
}
function Toast({ toast, onClose }) {
  useEffect(() => { const id = setTimeout(onClose, toast.duration || 3800); return () => clearTimeout(id); }, []);
  const icon = toast.type === "success" ? "check" : toast.type === "error" ? "alert" : toast.icon || "info";
  return (
    <div className={`toast toast--${toast.type}`} role="status">
      <span className="toast__icon"><Icon name={icon} size={15} strokeWidth={2} /></span>
      <span className="toast__msg">{toast.message}</span>
      {toast.action && <button type="button" className="toast__action" onClick={() => { toast.action.onClick(); onClose(); }}>{toast.action.label}</button>}
      <button type="button" className="toast__close" aria-label="Dismiss notification" onClick={onClose}><Icon name="close" size={14} /></button>
    </div>
  );
}

/** Small helper to dispatch toasts from anywhere */
export const toast = (dispatch, message, opts = {}) => dispatch(uiActions.pushToast({ message, ...opts }));
