import { createSlice, createSelector } from "@reduxjs/toolkit";
import { PROMO_CODES, SHIPPING_METHODS, TAX_RATE, FREE_SHIPPING_THRESHOLD } from "../data/catalog";

export const lineKey = (productId, color, size) => `${productId}|${color ?? ""}|${size ?? ""}`;

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [], promo: null, shippingMethod: "standard", lastError: null },
  reducers: {
    hydrate: (s, a) => ({ ...s, ...a.payload }),
    addItem: (s, a) => {
      const { product, color, size, qty = 1, maxStock } = a.payload;
      const key = lineKey(product.product_id, color, size);
      const ex = s.items.find((i) => i.key === key);
      if (ex) ex.qty = Math.min(ex.qty + qty, maxStock ?? 99);
      else s.items.push({ key, productId: product.product_id, slug: product.slug, name: product.product_name, image: product.thumbnail, price: product.sale_price ?? product.regular_price, regularPrice: product.regular_price, color, size, qty: Math.min(qty, maxStock ?? 99), maxStock: maxStock ?? 99, category: product.category_slug, subcategory: product.subcategory_slug });
    },
    setQty: (s, a) => { const it = s.items.find((i) => i.key === a.payload.key); if (it) it.qty = Math.max(1, Math.min(a.payload.qty, it.maxStock)); },
    removeItem: (s, a) => { s.items = s.items.filter((i) => i.key !== a.payload); },
    clear: (s) => { s.items = []; s.promo = null; },
    applyPromo: (s, a) => { s.promo = a.payload; },
    removePromo: (s) => { s.promo = null; },
    setShipping: (s, a) => { s.shippingMethod = a.payload; },
  },
});
export const cartActions = cartSlice.actions;
export default cartSlice;

// ---- selectors ----
export const selectCartItems = (st) => st.cart.items;
export const selectCartCount = (st) => st.cart.items.reduce((n, i) => n + i.qty, 0);
export const selectSubtotal = (st) => st.cart.items.reduce((n, i) => n + i.price * i.qty, 0);
export const selectCartTotals = createSelector([(st)=>st.cart,()=>TAX_RATE,()=>FREE_SHIPPING_THRESHOLD,()=>JSON.stringify(PROMO_CODES),()=>JSON.stringify(SHIPPING_METHODS)], (cart) => {
  const st={cart};
  const subtotal = selectSubtotal(st);
  const promo = st.cart.promo ? PROMO_CODES[st.cart.promo] : null;
  let discount = 0;
  if (promo?.type === "percent") discount = Math.round(subtotal * promo.value) / 100;
  const method = SHIPPING_METHODS.find((m) => m.id === st.cart.shippingMethod) || SHIPPING_METHODS[0];
  let shipping = method.price;
  if (method.freeOver != null && subtotal >= method.freeOver) shipping = 0;
  if (promo?.type === "shipping" && method.id === "standard") shipping = 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * TAX_RATE * 100) / 100;
  const total = Math.round((taxable + shipping + tax) * 100) / 100;
  const toFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  return { subtotal, discount, shipping, tax, total, toFree, method, promoCode: st.cart.promo, promo };
});