import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  Check, Package, Truck, MapPin, Clock, Home, Shield, Download, ChevronRight,
} from "lucide-react";
import Seo from "@/components/seo/Seo";
import { api, API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OrderRequestDialog from "@/components/marketing/OrderRequestDialog";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "ordered",          label: "Ordered",          icon: Check },
  { key: "paid",             label: "Paid",             icon: Shield },
  { key: "processing",       label: "Packed",           icon: Package },
  { key: "shipped",          label: "Shipped",          icon: Truck },
  { key: "out_for_delivery", label: "Out for delivery", icon: MapPin },
  { key: "delivered",        label: "Delivered",        icon: Home },
];

const STATUS_REACHED = {
  pending_payment:   ["ordered"],
  paid:              ["ordered", "paid"],
  processing:        ["ordered", "paid", "processing"],
  shipped:           ["ordered", "paid", "processing", "shipped"],
  out_for_delivery:  ["ordered", "paid", "processing", "shipped", "out_for_delivery"],
  delivered:         ["ordered", "paid", "processing", "shipped", "out_for_delivery", "delivered"],
  cancelled:         ["ordered"],
};

export default function OrderTrack() {
  const { order_id } = useParams();
  const [search] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");
  const [openDlg, setOpenDlg] = useState(null); // "cancel" | "return" | null
  const firedRef = useRef(false);

  const email = search.get("email") || "";
  const emailQs = email ? `?email=${encodeURIComponent(email)}` : "";

  useEffect(() => {
    api.get(`/orders/${order_id}${emailQs}`)
      .then((r) => setOrder(r.data))
      .catch(() => setErr("Could not load order"));
  }, [order_id, emailQs]);

  const reached = useMemo(() => {
    if (!order) return new Set();
    return new Set(STATUS_REACHED[order.status] || []);
  }, [order]);

  useEffect(() => {
    if (order?.status === "delivered" && !firedRef.current) {
      firedRef.current = true;
      const end = Date.now() + 2500;
      const colors = ["#E8A84A", "#0B0806", "#E8A84A", "#EBE1CC"];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [order]);

  if (err) return <div className="py-32 text-center font-body text-ink-muted" data-testid="track-err">{err}</div>;
  if (!order) return <div className="py-32 text-center font-body text-ink-muted">Loading your order…</div>;

  const canCancel = ["paid", "processing", "pending_payment"].includes(order.status);
  const canReturn = order.status === "delivered";
  const invoiceUrl = `${API}/orders/${order_id}/invoice.html${emailQs}`;

  return (
    <>
      <Seo title={`Track ${order.order_number}`} description="Live tracking for your Karijeeva order." />
      <section className="bg-brand-parchment min-h-[calc(100vh-72px)]" data-testid="order-track">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">Order tracking</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-h1 text-brand-obsidian leading-tight" data-testid="track-order-number">{order.order_number}</h1>
              <p className="font-body text-ink-muted mt-2">
                Placed {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-brand-parchment-soft text-brand-obsidian border-0 font-body uppercase tracking-widest text-[10px]">
                {order.status.replace(/_/g, " ")}
              </Badge>
              <a
                href={invoiceUrl} target="_blank" rel="noreferrer"
                data-testid="track-invoice-link"
                className="inline-flex items-center gap-2 font-body text-sm text-brand-obsidian hover:text-brand-gold underline underline-offset-4 decoration-brand-gold/40 decoration-1"
              >
                <Download className="w-4 h-4" /> Invoice
              </a>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-12 brand-card p-8" data-testid="track-timeline">
            <ol className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {STEPS.map((step, i) => {
                const done = reached.has(step.key);
                const current = done && !reached.has(STEPS[i + 1]?.key);
                const Icon = step.icon;
                return (
                  <li key={step.key} className="relative flex flex-col items-center text-center" data-testid={`track-step-${step.key}`}>
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors [&_svg]:w-5 [&_svg]:h-5",
                        done
                          ? "bg-brand-gold border-brand-gold text-brand-parchment"
                          : "bg-brand-parchment border-brand-gold/30 text-brand-gold/40",
                        current && "ring-4 ring-brand-gold/20",
                      )}
                    >
                      <Icon />
                    </div>
                    <span className={cn(
                      "mt-3 font-body text-[11px] uppercase tracking-widest",
                      done ? "text-brand-obsidian" : "text-ink-muted/60",
                    )}>
                      {step.label}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "hidden lg:block absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-[2px]",
                          reached.has(STEPS[i + 1].key) ? "bg-brand-gold" : "bg-brand-gold/20",
                        )}
                      />
                    )}
                  </li>
                );
              })}
            </ol>

            {order.status === "shipped" && order.tracking && (
              <div className="mt-8 pt-6 border-t border-brand-gold/15 flex flex-wrap items-center justify-between gap-3" data-testid="track-awb">
                <div className="font-body text-sm text-brand-husk">
                  <strong>{order.tracking.carrier || "Partner courier"}</strong>
                  <span className="text-ink-muted"> · AWB {order.tracking.awb}</span>
                </div>
                {order.tracking.url && (
                  <a href={order.tracking.url} target="_blank" rel="noreferrer" className="font-body text-sm text-brand-obsidian hover:text-brand-gold underline decoration-brand-gold/40 underline-offset-4">
                    Track on carrier site <ChevronRight className="w-4 h-4 inline-block" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Items + address + totals */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="brand-card p-6">
              <h3 className="font-display text-lg text-brand-obsidian flex items-center gap-2 mb-4"><Package className="w-5 h-5 text-brand-gold" /> Items</h3>
              <div className="space-y-4">
                {order.items?.map((i, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img src={i.image} alt={i.product_name} className="w-12 h-12 rounded-md object-cover bg-brand-parchment-soft" />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-brand-obsidian leading-tight">{i.product_name}</p>
                      <p className="font-body text-xs text-ink-muted">{i.variant_size} × {i.quantity}</p>
                    </div>
                    <span className="font-display text-brand-obsidian">₹{i.total_price}</span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-brand-gold/20 my-5" />
              <div className="space-y-1.5 font-body text-sm">
                <div className="flex justify-between"><span className="text-ink-muted">Subtotal</span><span>₹{order.subtotal}</span></div>
                {(order.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-brand-obsidian"><span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span><span>−₹{order.discount_amount}</span></div>
                )}
                <div className="flex justify-between"><span className="text-ink-muted">GST (5%)</span><span>₹{order.gst_amount}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Shipping</span><span>₹{order.shipping_amount || 0}</span></div>
                <div className="flex justify-between pt-2 border-t border-brand-gold/20 font-display text-lg text-brand-obsidian mt-2">
                  <span>Total</span><span>₹{order.total?.toFixed?.(2) ?? order.total}</span>
                </div>
              </div>
            </div>

            <div className="brand-card p-6">
              <h3 className="font-display text-lg text-brand-obsidian flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-brand-gold" /> Ship to</h3>
              <p className="font-display text-brand-obsidian text-lg leading-tight">{order.address_snapshot?.full_name}</p>
              <p className="font-body text-sm text-brand-husk mt-1 leading-relaxed">
                {order.address_snapshot?.line1}{order.address_snapshot?.line2 ? `, ${order.address_snapshot.line2}` : ""}<br/>
                {order.address_snapshot?.city}, {order.address_snapshot?.state} {order.address_snapshot?.pincode}<br/>
                {order.address_snapshot?.country || "India"}<br/>
                <span className="text-ink-muted">{order.address_snapshot?.phone}</span>
              </p>
              <div className="mt-6 pt-5 border-t border-brand-gold/15">
                <h4 className="eyebrow text-brand-gold tracking-[0.25em] mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Need help?</h4>
                <p className="font-body text-sm text-brand-husk mb-3">We typically respond within 24 hours.</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm"><Link to="/contact">Contact support</Link></Button>
                  {canCancel && (
                    <Button variant="ghost" size="sm" onClick={() => setOpenDlg("cancel")} data-testid="track-request-cancel">Request cancellation</Button>
                  )}
                  {canReturn && (
                    <Button variant="ghost" size="sm" onClick={() => setOpenDlg("return")} data-testid="track-request-return">Request return</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <OrderRequestDialog
        open={!!openDlg}
        type={openDlg}
        orderId={order_id}
        email={email}
        onClose={() => setOpenDlg(null)}
      />
    </>
  );
}
