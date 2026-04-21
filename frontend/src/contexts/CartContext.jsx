import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const CART_KEY = "karijeeva_cart_v1";
const WELCOME_KEY = "karijeeva_welcome_code_v1";
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coupon, setCoupon] = useState(null); // {code, type, final_discount_amount, message}
  const [welcomeCode, setWelcomeCode] = useState(null); // {code, expires_at}

  // Persist cart
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // Watch localStorage for welcome code (set by newsletter signup)
  const loadWelcome = useCallback(() => {
    try {
      const raw = localStorage.getItem(WELCOME_KEY);
      if (!raw) { setWelcomeCode(null); return; }
      const parsed = JSON.parse(raw);
      if (!parsed?.expires_at || new Date(parsed.expires_at) < new Date()) {
        localStorage.removeItem(WELCOME_KEY);
        setWelcomeCode(null);
        return;
      }
      setWelcomeCode(parsed);
    } catch { setWelcomeCode(null); }
  }, []);

  useEffect(() => {
    loadWelcome();
    const onStorage = (e) => { if (e.key === WELCOME_KEY) loadWelcome(); };
    window.addEventListener("storage", onStorage);
    // Re-check every minute to expire the countdown
    const tick = setInterval(loadWelcome, 60000);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(tick); };
  }, [loadWelcome]);

  // ----- Mutators -----
  const addItem = (item) => {
    setItems((cur) => {
      const idx = cur.findIndex((i) => i.variant_id === item.variant_id);
      if (idx >= 0) {
        const next = [...cur];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (item.quantity || 1) };
        return next;
      }
      return [...cur, { ...item, quantity: item.quantity || 1 }];
    });
    setDrawerOpen(true);
    toast.success("Added to basket", { description: `${item.product_name} · ${item.variant_size}` });
  };

  const setQty = (variant_id, quantity) => {
    if (quantity <= 0) return removeItem(variant_id);
    setItems((cur) => cur.map((i) => (i.variant_id === variant_id ? { ...i, quantity } : i)));
  };

  const removeItem = (variant_id) => {
    setItems((cur) => cur.filter((i) => i.variant_id !== variant_id));
  };

  const clear = () => { setItems([]); setCoupon(null); };

  // ----- Coupon -----
  const applyCoupon = async (code) => {
    try {
      const subtotalNow = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
      const { data } = await api.post("/coupons/validate", { code, subtotal: subtotalNow });
      if (data?.valid === false) {
        toast.error(data.message || "Coupon not valid");
        return { ok: false, message: data.message };
      }
      setCoupon(data);
      toast.success(`Applied ${data.code}`, { description: data.message });
      return { ok: true };
    } catch (e) {
      // 404 still comes through as error — server returns body {valid:false, message}
      const body = e?.response?.data;
      if (body && body.valid === false) {
        toast.error(body.message || "Coupon not valid");
        return { ok: false, message: body.message };
      }
      const d = e?.response?.data?.detail;
      const msg = typeof d === "string" ? d : (d?.msg || "Invalid coupon");
      toast.error(msg);
      return { ok: false };
    }
  };
  const removeCoupon = () => { setCoupon(null); };

  // ----- Derived -----
  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discount = coupon ? Math.min(coupon.final_discount_amount || 0, subtotal) : 0;
    const taxable = Math.max(0, subtotal - discount);
    const gst = Math.round(taxable * 0.05 * 100) / 100;
    const shipping = taxable >= 999 || subtotal === 0 ? 0 : 49;
    const total = Math.round((taxable + gst + shipping) * 100) / 100;
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { subtotal, discount, gst, shipping, total, count };
  }, [items, coupon]);

  return (
    <CartContext.Provider
      value={{
        items, totals, coupon, welcomeCode,
        drawerOpen, setDrawerOpen,
        addItem, setQty, removeItem, clear,
        applyCoupon, removeCoupon, reloadWelcome: loadWelcome,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

// Utility for the newsletter hook to write welcome code
export function saveWelcomeCode(code, expiresAt) {
  try {
    localStorage.setItem(
      "karijeeva_welcome_code_v1",
      JSON.stringify({ code, expires_at: expiresAt })
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "karijeeva_welcome_code_v1" }));
  } catch {}
}
