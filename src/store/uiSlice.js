import { createSlice } from "@reduxjs/toolkit";
let toastId = 0;
const uiSlice = createSlice({
  name: "ui",
  initialState: { cartOpen: false, menuOpen: false, searchOpen: false, modal: null, toasts: [], cookieConsent: null, recentSearches: [], recentlyViewed: [] },
  reducers: {
    hydrate: (s, a) => ({ ...s, ...a.payload }),
    openCart: (s) => { s.cartOpen = true; s.menuOpen = false; s.searchOpen = false; },
    closeCart: (s) => { s.cartOpen = false; },
    openMenu: (s) => { s.menuOpen = true; s.cartOpen = false; s.searchOpen = false; },
    closeMenu: (s) => { s.menuOpen = false; },
    openSearch: (s) => { s.searchOpen = true; s.menuOpen = false; s.cartOpen = false; },
    closeSearch: (s) => { s.searchOpen = false; },
    openModal: (s, a) => { s.modal = a.payload; },
    closeModal: (s) => { s.modal = null; },
    closeAll: (s) => { s.cartOpen = false; s.menuOpen = false; s.searchOpen = false; s.modal = null; },
    pushToast: (s, a) => { s.toasts.push({ id: ++toastId, type: "info", ...a.payload }); if (s.toasts.length > 3) s.toasts.shift(); },
    dismissToast: (s, a) => { s.toasts = s.toasts.filter((t) => t.id !== a.payload); },
    setCookieConsent: (s, a) => { s.cookieConsent = a.payload; },
    addRecentSearch: (s, a) => { const q = a.payload.trim(); if (!q) return; s.recentSearches = [q, ...s.recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6); },
    clearRecentSearches: (s) => { s.recentSearches = []; },
    addRecentlyViewed: (s, a) => { s.recentlyViewed = [a.payload, ...s.recentlyViewed.filter((x) => x !== a.payload)].slice(0, 12); },
  },
});
export const uiActions = uiSlice.actions;
export default uiSlice;
