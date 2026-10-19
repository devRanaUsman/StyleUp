import { createSlice } from "@reduxjs/toolkit";
const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, isAuthenticated: false, loading: true },
  reducers: {
    setUser: (s, a) => { s.user = a.payload; s.isAuthenticated = !!a.payload; s.loading = false; },
    logout: (s) => { s.user = null; s.isAuthenticated = false; s.loading = false; },
    setLoading: (s, a) => { s.loading = a.payload; },
  },
});
export const authActions = authSlice.actions;
export default authSlice;
