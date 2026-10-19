import { createSlice } from "@reduxjs/toolkit";
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { ids: [] },
  reducers: {
    hydrate: (s, a) => ({ ...s, ...a.payload }),
    toggle: (s, a) => { const id = a.payload; s.ids = s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids]; },
    remove: (s, a) => { s.ids = s.ids.filter((x) => x !== a.payload); },
    clear: (s) => { s.ids = []; },
  },
});
export const wishlistActions = wishlistSlice.actions;
export default wishlistSlice;
export const selectWishlistIds = (st) => st.wishlist.ids;
export const selectInWishlist = (id) => (st) => st.wishlist.ids.includes(id);
