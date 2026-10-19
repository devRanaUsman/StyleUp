import { useEffect } from "react";
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Traps focus inside ref while active, restores focus on close, closes on Escape, locks body scroll. */
export function useFocusTrap(ref, active, onClose, { lockScroll = true, initialFocus } = {}) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current; if (!el) return;
    const prev = document.activeElement;
    if (lockScroll) document.body.classList.add("no-scroll");
    const focusFirst = () => { const target = initialFocus?.current || el.querySelector(FOCUSABLE); (target || el).focus({ preventScroll: true }); };
    const t = setTimeout(focusFirst, 20);
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== "Tab") return;
      const nodes = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) { e.preventDefault(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); if (lockScroll) document.body.classList.remove("no-scroll"); prev?.focus?.({ preventScroll: true }); };
  }, [active]);
}
