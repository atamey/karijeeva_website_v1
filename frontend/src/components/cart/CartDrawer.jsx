import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Plus, Minus, Trash2, Tag, Clock, ArrowRight, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";

function useCountdown(expiresAt) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!expiresAt) { setLeft(""); return; }
    const tick = () => {
      const ms = new Date(expiresAt) - new Date();
      if (ms <= 0) { setLeft("expired"); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

export default function CartDrawer() {
  const {
    items, totals, coupon, welcomeCode,
    drawerOpen, setDrawerOpen,
    setQty, removeItem, applyCoupon, removeCoupon,
  } = useCart();
  const [codeInput, setCodeInput] = useState("");
  const [applying, setApplying] = useState(false);
  const countdown = useCountdown(welcomeCode?.expires_at);
  const navigate = useNavigate();

  useEffect(() => {
    if (drawerOpen && !coupon && welcomeCode?.code && !codeInput) {
      setCodeInput(welcomeCode.code);
    }
  }, [drawerOpen, welcomeCode, coupon, codeInput]);

  const handleApply = async (e) => {
    e?.preventDefault?.();
    if (!codeInput.trim()) return;
    setApplying(true);
    await applyCoupon(codeInput.trim());
    setApplying(false);
  };

  const handleCheckout = () => {
    setDrawerOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className="glass-card border-brand-gold/30 w-full sm:max-w-md flex flex-col p-0"
        data-testid="cart-drawer"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-brand-gold/15">
          <SheetTitle className="font-display text-h3 text-brand-obsidian flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-brand-gold" /> Your Basket
          </SheetTitle>
          <SheetDescription className="font-body text-sm text-ink-muted">
            {totals.count} item{totals.count === 1 ? "" : "s"}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-parchment-soft flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-brand-obsidian" />
            </div>
            <h3 className="font-display text-h4 text-brand-obsidian mt-6">Your basket is empty.</h3>
            <p className="font-body text-sm text-ink-muted mt-2">
              Add a bottle and we'll keep it warm until you're ready.
            </p>
            <Button asChild variant="primary" size="md" className="mt-6" onClick={() => setDrawerOpen(false)}>
              <Link to="/products">Shop the oils <ArrowRight /></Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" data-testid="cart-items">
              {items.map((it) => (
                <div key={it.variant_id} className="flex gap-4 pb-4 border-b border-brand-gold/10 last:border-b-0" data-testid={`cart-item-${it.variant_id}`}>
                  <Link to={`/products/${it.slug}`} onClick={() => setDrawerOpen(false)} className="w-20 h-20 rounded-md overflow-hidden bg-brand-parchment-soft shrink-0">
                    <img src={it.image} alt={it.product_name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${it.slug}`} onClick={() => setDrawerOpen(false)} className="block font-display text-lg text-brand-obsidian leading-tight hover:text-brand-gold">
                      {it.product_name}
                    </Link>
                    <p className="font-body text-xs text-ink-muted mt-1">{it.variant_size} · {it.sku}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center h-9 border border-brand-gold/30 rounded-pill bg-white">
                        <button aria-label="Decrease" className="w-9 h-full text-brand-obsidian hover:text-brand-gold" onClick={() => setQty(it.variant_id, it.quantity - 1)}><Minus className="w-3 h-3 mx-auto" /></button>
                        <span className="w-8 text-center font-display text-sm text-brand-obsidian" data-testid={`cart-qty-${it.variant_id}`}>{it.quantity}</span>
                        <button aria-label="Increase" className="w-9 h-full text-brand-obsidian hover:text-brand-gold" onClick={() => setQty(it.variant_id, it.quantity + 1)}><Plus className="w-3 h-3 mx-auto" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg text-brand-obsidian">₹{it.unit_price * it.quantity}</span>
                        <button aria-label="Remove" onClick={() => removeItem(it.variant_id)} className="text-brand-husk/50 hover:text-brand-gold" data-testid={`cart-remove-${it.variant_id}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon + totals */}
            <div className="px-6 py-4 border-t border-brand-gold/20 bg-brand-parchment/60">
              {/* WELCOME10 pre-fill banner */}
              {welcomeCode && !coupon && countdown && countdown !== "expired" && (
                <div className="mb-3 p-3 rounded-md border border-dashed border-brand-gold/50 bg-white text-center" data-testid="cart-welcome-banner">
                  <p className="eyebrow text-brand-gold tracking-[0.25em]">Your welcome code</p>
                  <p className="font-body text-xs text-brand-husk mt-1">
                    <Clock className="w-3 h-3 inline -mt-0.5 mr-1 text-brand-gold" />
                    Expires in <span className="font-mono text-brand-obsidian" data-testid="welcome-countdown">{countdown}</span>
                  </p>
                </div>
              )}

              {!coupon ? (
                <form onSubmit={handleApply} className="flex gap-2" data-testid="cart-coupon-form">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold" />
                    <Input
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      data-testid="cart-coupon-input"
                      className="h-11 pl-10 bg-white border-brand-gold/30 focus-visible:ring-brand-gold"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="md" loading={applying} disabled={!codeInput}>
                    Apply
                  </Button>
                </form>
              ) : (
                <div className="flex items-center justify-between bg-brand-parchment-soft rounded-md px-4 py-3" data-testid="cart-coupon-applied">
                  <div>
                    <p className="font-display text-lg text-brand-obsidian">{coupon.code}</p>
                    <p className="font-body text-xs text-brand-husk/70">− ₹{coupon.final_discount_amount}</p>
                  </div>
                  <button onClick={removeCoupon} className="text-brand-husk/60 hover:text-brand-gold font-body text-xs uppercase tracking-widest">
                    Remove
                  </button>
                </div>
              )}

              <dl className="mt-5 space-y-2 font-body text-sm">
                <Row label="Subtotal" value={`₹${totals.subtotal.toFixed(2)}`} />
                {totals.discount > 0 && <Row label="Discount" value={`− ₹${totals.discount.toFixed(2)}`} className="text-brand-gold" />}
                <Row label="GST 5%" value={`₹${totals.gst.toFixed(2)}`} />
                <Row label={totals.shipping === 0 ? "Shipping (free)" : "Shipping"} value={totals.shipping === 0 ? "FREE" : `₹${totals.shipping}`} />
                <div className="h-px bg-brand-gold/20 my-2" />
                <Row label={<span className="font-display text-h4 text-brand-obsidian">Total</span>} value={<span className="font-display text-h4 text-brand-obsidian" data-testid="cart-total">₹{totals.total.toFixed(2)}</span>} big />
              </dl>

              <Button
                data-testid="cart-checkout-btn"
                variant="primary" size="lg"
                className="w-full mt-5"
                onClick={handleCheckout}
              >
                Proceed to Checkout <ArrowRight />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, className="", big }) {
  return (
    <div className={`flex items-center justify-between ${big ? "" : ""} ${className}`}>
      <dt className={big ? "" : "text-ink-muted"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
