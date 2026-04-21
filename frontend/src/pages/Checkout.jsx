import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Check, MapPin, CreditCard, User, ChevronLeft } from "lucide-react";

import Seo from "@/components/seo/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { api } from "@/lib/api";
import { formatApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Lakshadweep","Puducherry",
];

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
function loadRazorpay() {
  return new Promise((res) => {
    if (document.getElementById("rzp-js")) return res(true);
    const s = document.createElement("script");
    s.id = "rzp-js"; s.src = RAZORPAY_SCRIPT;
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

const EMPTY_ADDRESS = {
  full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India",
};

export default function Checkout() {
  const { user } = useAuth();
  const { items, totals, coupon, clear } = useCart();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [guestEmail, setGuestEmail] = useState("");
  const [address, setAddress] = useState(() => ({
    ...EMPTY_ADDRESS,
    full_name: user?.name || "",
  }));
  const [pinLoading, setPinLoading] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Empty cart guard
  useEffect(() => {
    if (items.length === 0) {
      toast.message("Your basket is empty.");
      nav("/products", { replace: true });
    }
  }, [items.length, nav]);

  // Prefill name when auth loads
  useEffect(() => {
    if (user && !address.full_name) setAddress((a) => ({ ...a, full_name: user.name }));
  }, [user]); // eslint-disable-line

  const setField = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  const onPinBlur = async () => {
    const pin = (address.pincode || "").trim();
    if (!/^\d{6}$/.test(pin)) return;
    setPinLoading(true);
    try {
      const { data } = await api.get(`/geo/pincode/${pin}`);
      setAddress((a) => ({ ...a, city: a.city || data.city, state: a.state || data.state }));
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail, "Could not look up pincode"));
    } finally { setPinLoading(false); }
  };

  const validateStep1 = () => {
    const email = user?.email || guestEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Valid email required"); return false; }
    const required = ["full_name", "phone", "line1", "city", "state", "pincode"];
    for (const k of required) if (!String(address[k] || "").trim()) { toast.error(`${k.replace("_", " ")} is required`); return false; }
    if (!/^\d{6}$/.test(address.pincode)) { toast.error("Pincode must be 6 digits"); return false; }
    if (!/^\d{10,13}$/.test(address.phone.replace(/\D/g, ""))) { toast.error("Valid phone required"); return false; }
    return true;
  };

  const placeOrder = async () => {
    setPlacing(true);
    const body = {
      items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      address,
      guest_email: user ? null : guestEmail.trim().toLowerCase(),
      guest_phone: user ? null : address.phone,
      coupon_code: coupon?.code || null,
    };
    try {
      const { data } = await api.post("/orders/create", body);
      const ok = await loadRazorpay();
      if (!ok) { toast.error("Could not load Razorpay"); setPlacing(false); return; }
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Karijeeva",
        description: `Order ${data.order_number}`,
        order_id: data.razorpay_order_id,
        prefill: {
          name: address.full_name,
          email: user?.email || guestEmail,
          contact: address.phone,
        },
        theme: { color: "#0B0806" },
        handler: async (resp) => {
          try {
            await api.post("/orders/verify", {
              order_id: data.order_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            const email = user?.email || guestEmail.trim().toLowerCase();
            clear();
            try { localStorage.removeItem("karijeeva_welcome_code_v1"); } catch {}
            nav(`/orders/${data.order_id}/confirmed?email=${encodeURIComponent(email)}`, { replace: true });
          } catch (err) {
            toast.error(formatApiError(err?.response?.data?.detail, "Payment verification failed"));
          } finally { setPlacing(false); }
        },
        modal: {
          ondismiss: () => { toast.message("Checkout closed — order saved as pending."); setPlacing(false); },
        },
      });
      rzp.on("payment.failed", (r) => {
        toast.error(r?.error?.description || "Payment failed");
        setPlacing(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Could not create order"));
      setPlacing(false);
    }
  };

  return (
    <>
      <Seo title="Checkout" description="Secure checkout — Razorpay test mode." />
      <section className="bg-brand-parchment min-h-screen">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
          {/* Step bar */}
          <div className="flex items-center justify-between gap-4 mb-10" data-testid="checkout-steps">
            {[
              { n: 1, label: "Contact + Address", Icon: User },
              { n: 2, label: "Order review",      Icon: MapPin },
              { n: 3, label: "Payment",           Icon: CreditCard },
            ].map(({ n, label, Icon }, i, arr) => (
              <div key={n} className="flex-1 flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-2",
                  step >= n ? "bg-brand-obsidian border-brand-obsidian text-brand-gold" : "bg-white border-brand-gold/40 text-brand-husk/50"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={cn("font-body text-sm hidden sm:block", step >= n ? "text-brand-obsidian" : "text-ink-muted")}>{label}</span>
                {i < arr.length - 1 && <div className={cn("flex-1 h-px", step > n ? "bg-brand-obsidian" : "bg-brand-gold/25")} />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              {step === 1 && (
                <div className="space-y-5" data-testid="checkout-step-1">
                  <h2 className="text-h3 text-brand-obsidian">Contact & shipping</h2>
                  {!user && (
                    <>
                      <Input type="email" placeholder="Email for order confirmation" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} data-testid="checkout-guest-email" className="h-11 bg-white border-brand-gold/30" />
                      <p className="font-body text-xs text-ink-muted">Have an account? <Link to="/login" state={{ from: "/checkout" }} className="text-brand-gold underline">Log in</Link> for faster checkout.</p>
                    </>
                  )}
                  {user && (
                    <p className="font-body text-sm text-ink-muted">Shipping for <strong className="text-brand-obsidian">{user.name}</strong> · {user.email}</p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input placeholder="Full name" value={address.full_name} onChange={setField("full_name")} data-testid="checkout-name" className="h-11 bg-white border-brand-gold/30" />
                    <Input placeholder="Phone" value={address.phone} onChange={setField("phone")} data-testid="checkout-phone" className="h-11 bg-white border-brand-gold/30" />
                  </div>
                  <Input placeholder="Address line 1" value={address.line1} onChange={setField("line1")} data-testid="checkout-line1" className="h-11 bg-white border-brand-gold/30" />
                  <Input placeholder="Address line 2 (optional)" value={address.line2} onChange={setField("line2")} data-testid="checkout-line2" className="h-11 bg-white border-brand-gold/30" />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <Input placeholder="Pincode" value={address.pincode} onChange={setField("pincode")} onBlur={onPinBlur} maxLength={6} data-testid="checkout-pincode" className="h-11 bg-white border-brand-gold/30" />
                      {pinLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-xs text-brand-gold">looking up…</span>}
                    </div>
                    <Input placeholder="City" value={address.city} onChange={setField("city")} data-testid="checkout-city" className="h-11 bg-white border-brand-gold/30" />
                    <Select value={address.state} onValueChange={(v) => setAddress((a) => ({ ...a, state: v }))}>
                      <SelectTrigger data-testid="checkout-state" className="h-11 bg-white border-brand-gold/30"><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="primary" size="lg" onClick={() => validateStep1() && setStep(2)} className="w-full sm:w-auto" data-testid="checkout-step1-next">
                    Continue to review <ArrowRight />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6" data-testid="checkout-step-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}><ChevronLeft className="w-3 h-3" /> Edit address</Button>
                  <h2 className="text-h3 text-brand-obsidian">Review your order</h2>
                  <div className="brand-card p-6 bg-white">
                    <p className="eyebrow tracking-[0.25em] text-brand-gold mb-2">Ship to</p>
                    <p className="font-body text-sm text-brand-husk leading-relaxed">
                      <strong>{address.full_name}</strong> · {address.phone}<br />
                      {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
                      {address.city}, {address.state} {address.pincode}<br />
                      {address.country}
                    </p>
                  </div>
                  <div className="brand-card p-6 bg-white space-y-3">
                    {items.map((i) => (
                      <div key={i.variant_id} className="flex items-center gap-4 pb-3 border-b border-brand-gold/10 last:border-0 last:pb-0">
                        <img src={i.image} className="w-14 h-14 rounded-md object-cover bg-brand-parchment-soft" alt={i.product_name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-brand-obsidian">{i.product_name}</p>
                          <p className="font-body text-xs text-ink-muted">{i.variant_size} × {i.quantity}</p>
                        </div>
                        <span className="font-display text-brand-obsidian">₹{i.unit_price * i.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="primary" size="lg" onClick={() => setStep(3)} className="w-full sm:w-auto" data-testid="checkout-step2-next">
                    Place order <ArrowRight />
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6" data-testid="checkout-step-3">
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}><ChevronLeft className="w-3 h-3" /> Back to review</Button>
                  <h2 className="text-h3 text-brand-obsidian">Pay securely</h2>
                  <p className="font-body text-ink-muted">We use Razorpay (test mode). Supported: card, UPI, netbanking, wallets.</p>
                  <Button variant="primary" size="lg" onClick={placeOrder} loading={placing} className="w-full sm:w-auto" data-testid="checkout-pay-btn">
                    Pay ₹{totals.total.toFixed(2)} <ArrowRight />
                  </Button>
                  <p className="font-body text-xs text-ink-muted flex items-start gap-2"><Check className="w-3 h-3 mt-0.5" /> Signature-verified on our server. Tampered payments are automatically rejected.</p>
                </div>
              )}
            </div>

            {/* Totals sidebar */}
            <aside className="lg:col-span-1 brand-card p-6 h-fit lg:sticky lg:top-24" data-testid="checkout-summary">
              <h3 className="font-display text-xl text-brand-obsidian">Order summary</h3>
              <dl className="mt-5 space-y-2 font-body text-sm">
                <Row label="Items" value={items.reduce((s, i) => s + i.quantity, 0)} />
                <Row label="Subtotal" value={`₹${totals.subtotal.toFixed(2)}`} />
                {coupon && <Row label={`Coupon ${coupon.code}`} value={`− ₹${totals.discount.toFixed(2)}`} className="text-brand-gold" />}
                <Row label="GST 5%" value={`₹${totals.gst.toFixed(2)}`} />
                <Row label={totals.shipping === 0 ? "Shipping (free)" : "Shipping"} value={totals.shipping === 0 ? "FREE" : `₹${totals.shipping}`} />
                <div className="h-px bg-brand-gold/25 my-2" />
                <Row label={<span className="font-display text-h4 text-brand-obsidian">Total</span>} value={<span className="font-display text-h4 text-brand-obsidian">₹{totals.total.toFixed(2)}</span>} />
              </dl>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ label, value, className="" }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <dt>{label}</dt><dd>{value}</dd>
    </div>
  );
}
