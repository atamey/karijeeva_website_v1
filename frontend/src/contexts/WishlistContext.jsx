import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user === false) { setItems([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get("/wishlist");
      setItems(data.items || []);
    } catch { /* 401 etc. */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const has = (variant_id) => items.some((i) => i.variant_id === variant_id);

  const add = async (variant_id) => {
    if (!user || user === false) {
      toast.error("Log in to save items", { description: "Sign in to keep your wishlist." });
      return { ok: false, needsAuth: true };
    }
    try {
      const { data } = await api.post("/wishlist", { variant_id });
      if (!data.already) {
        setItems((cur) => [{ ...data.item }, ...cur]);
        toast.success("Saved to wishlist");
      } else {
        toast.message("Already in wishlist");
      }
      return { ok: true };
    } catch (e) {
      toast.error("Could not save to wishlist");
      return { ok: false };
    }
  };

  const remove = async (variant_id) => {
    try {
      await api.delete(`/wishlist/${variant_id}`);
      setItems((cur) => cur.filter((i) => i.variant_id !== variant_id));
      return { ok: true };
    } catch {
      toast.error("Could not remove");
      return { ok: false };
    }
  };

  const moveToCart = async (variant_id) => {
    try {
      const { data } = await api.post(`/wishlist/${variant_id}/move-to-cart`);
      setItems((cur) => cur.filter((i) => i.variant_id !== variant_id));
      return { ok: true, cart_item: data.cart_item };
    } catch {
      toast.error("Could not move to cart");
      return { ok: false };
    }
  };

  return (
    <WishlistContext.Provider value={{ items, count: items.length, loading, has, add, remove, moveToCart, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
