import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { Check, Package, ArrowRight, Truck } from "lucide-react";
import Seo from "@/components/seo/Seo";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function OrderConfirmed() {
  const { order_id } = useParams();
  const [search] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");
  const firedRef = useRef(false);

  useEffect(() => {
    const email = search.get("email");
    const qs = email ? `?email=${encodeURIComponent(email)}` : "";
    api.get(`/orders/${order_id}${qs}`)
      .then((r) => setOrder(r.data))
      .catch(() => setErr("Could not load order"));
  }, [order_id, search]);

  useEffect(() => {
    if (order && order.status === "paid" && !firedRef.current) {
      firedRef.current = true;
      const dur = 3 * 1000;
      const end = Date.now() + dur;
      const colors = ["#E8A84A", "#0B0806", "#E8A84A", "#EBE1CC"];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [order]);

  if (err) return <div className="py-32 text-center font-body text-ink-muted">{err}</div>;
  if (!order) return <div className="py-32 text-center font-body text-ink-muted">Loading your order…</div>;

  const eta = new Date(Date.now() + 6 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "long" });

  return (
    <>
      <Seo title={`Order ${order.order_number}`} description="Thank you for your Karijeeva order." />
      <section className="bg-brand-parchment min-h-screen" data-testid="order-confirmed">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex w-16 h-16 rounded-full bg-brand-obsidian items-center justify-center mb-6">
              <Check className="w-8 h-8 text-brand-gold" strokeWidth={2.5} />
            </div>
            <p className="font-accent italic text-brand-gold text-sm tracking-[0.3em] uppercase mb-3">Order confirmed</p>
            <h1 className="text-h1 text-brand-obsidian leading-tight">Thank you.</h1>
            <p className="font-body text-body-lg text-ink-muted mt-4">Your basket is on its way to the grove. A confirmation email is already headed to you.</p>
            <p className="font-display text-h4 text-brand-obsidian mt-6" data-testid="order-number">{order.order_number}</p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 gap-4">
            <div className="brand-card p-6 flex gap-4">
              <Truck className="w-6 h-6 text-brand-gold shrink-0" />
              <div>
                <p className="font-accent italic text-xs tracking-[0.25em] uppercase text-brand-gold">Expected delivery</p>
                <p className="font-display text-lg text-brand-obsidian">By {eta}</p>
                <p className="font-body text-xs text-ink-muted mt-1">Dispatched in 24–48 hours</p>
              </div>
            </div>
            <div className="brand-card p-6 flex gap-4">
              <Package className="w-6 h-6 text-brand-gold shrink-0" />
              <div>
                <p className="font-accent italic text-xs tracking-[0.25em] uppercase text-brand-gold">Shipping to</p>
                <p className="font-display text-lg text-brand-obsidian leading-tight">{order.address_snapshot?.full_name}</p>
                <p className="font-body text-xs text-ink-muted mt-1">
                  {order.address_snapshot?.city}, {order.address_snapshot?.state} {order.address_snapshot?.pincode}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 brand-card p-8">
            <h3 className="font-display text-xl text-brand-obsidian mb-4">In your order</h3>
            <div className="space-y-3">
              {order.items?.map((i, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <img src={i.image} className="w-12 h-12 rounded-md object-cover bg-brand-parchment-soft" alt={i.product_name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-brand-obsidian">{i.product_name}</p>
                    <p className="font-body text-xs text-ink-muted">{i.variant_size} × {i.quantity}</p>
                  </div>
                  <span className="font-display text-brand-obsidian">₹{i.total_price}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-brand-gold/20 my-6" />
            <div className="flex items-center justify-between">
              <span className="font-display text-h4 text-brand-obsidian">Total paid</span>
              <span className="font-display text-h4 text-brand-obsidian">₹{order.total?.toFixed?.(2) ?? order.total}</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="primary" size="lg">
              <Link to={`/orders/${order.id}/track${search.get("email") ? `?email=${encodeURIComponent(search.get("email"))}` : ""}`} data-testid="order-track-link">Track order <ArrowRight /></Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/products">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
