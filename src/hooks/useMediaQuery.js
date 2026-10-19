import { useEffect, useState } from "react";
export function useMediaQuery(q) {
  const get = () => (typeof window !== "undefined" ? window.matchMedia(q).matches : false);
  const [m, setM] = useState(false);
  useEffect(() => { const mq = window.matchMedia(q); const h = (e) => setM(e.matches); setM(mq.matches); mq.addEventListener("change", h); return () => mq.removeEventListener("change", h); }, [q]);
  return m;
}
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
export const useIsTablet = () => useMediaQuery("(min-width: 768px)");
