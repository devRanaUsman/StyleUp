// Safe localStorage wrapper (works when storage is blocked / private mode)
const PREFIX = "stylehub:";
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
  },
};
