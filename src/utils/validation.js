export const rules = {
  required: (label = "This field") => (v) => (v == null || String(v).trim() === "" ? `${label} is required.` : ""),
  email: () => (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Please enter a valid email address." : ""),
  phone: () => (v) => (v && !/^[+\d][\d\s().-]{6,19}$/.test(v.trim()) ? "Please enter a valid phone number." : ""),
  postal: () => (v) => (v && !/^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(v.trim()) ? "Please enter a valid postal code." : ""),
  minLen: (n, label = "This field") => (v) => (v && v.length < n ? `${label} must be at least ${n} characters.` : ""),
  maxLen: (n, label = "This field") => (v) => (v && v.length > n ? `${label} must be under ${n} characters.` : ""),
  card: () => (v) => {
    const s = (v || "").replace(/\s+/g, "");
    if (!/^\d{13,19}$/.test(s)) return "Please enter a valid card number.";
    let sum = 0, dbl = false;
    for (let i = s.length - 1; i >= 0; i--) { let d = +s[i]; if (dbl) { d *= 2; if (d > 9) d -= 9; } sum += d; dbl = !dbl; }
    return sum % 10 ? "Please enter a valid card number." : "";
  },
  expiry: () => (v) => {
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec((v || "").trim());
    if (!m) return "Use MM/YY format.";
    const mm = +m[1], yy = 2000 + +m[2];
    if (mm < 1 || mm > 12) return "Please enter a valid month.";
    const now = new Date();
    if (yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1)) return "This card has expired.";
    return "";
  },
  cvc: () => (v) => (!/^\d{3,4}$/.test((v || "").trim()) ? "Please enter a valid security code." : ""),
  match: (other, label = "Passwords") => (v, all) => (v !== all[other] ? `${label} do not match.` : ""),
  password: () => (v) => (v && (v.length < 8 || !/\d/.test(v)) ? "Use at least 8 characters including a number." : ""),
};

export function validate(values, schema) {
  const errors = {};
  for (const [name, validators] of Object.entries(schema)) {
    for (const fn of validators) {
      const msg = fn(values[name], values);
      if (msg) { errors[name] = msg; break; }
    }
  }
  return errors;
}

export const formatCard = (v) => (v || "").replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
export const formatExpiry = (v) => { const s = (v || "").replace(/\D/g, "").slice(0, 4); return s.length > 2 ? `${s.slice(0, 2)}/${s.slice(2)}` : s; };
export const cardBrand = (v) => { const s = (v || "").replace(/\D/g, ""); if (/^4/.test(s)) return "Visa"; if (/^5[1-5]|^2[2-7]/.test(s)) return "Mastercard"; if (/^3[47]/.test(s)) return "American Express"; return "Card"; };
