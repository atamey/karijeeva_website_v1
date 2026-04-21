import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Printer, Download, Truck, RotateCcw, Banknote } from "lucide-react";
import { adminApi, formatINR, formatDate, STATUS_COLORS } from "@/lib/adminApi";
import { api, API } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const STATUS_OPTIONS = [
  "pending_payment", "paid", "processing", "shipped",
  "out_for_delivery", "delivered", "cancelled", "refunded",
];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [ship, setShip] = useState({ open: false, awb: "", carrier: "", url: "", note: "" });
  const [refund, setRefund] = useState({ open: false, amount_paise: 0, reason: "", notes: "" });
  const [csvOpen, setCsvOpen] = useState(false);

  const load = async () => {
    try { const d = await adminApi.orderDetail(id); setData(d); setStatus(d.order.status); }
    catch { toast.error("Failed to load order"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!data) return <div className="font-body text-ink-muted">Loading order…</div>;
  const { order, payment_attempts, requests } = data;

  const applyStatus = async () => {
    try {
      await adminApi.orderStatus(order.id, status, note);
      toast.success(`Status set to ${status}`);
      setConfirm(false); setNote("");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };

  const applyShipping = async () => {
    if (!ship.awb || !ship.carrier) { toast.error("AWB & carrier required"); return; }
    try {
      await adminApi.orderShipping(order.id, { awb: ship.awb, carrier: ship.carrier, url: ship.url, note: ship.note });
      toast.success("Shipping details saved");
      setShip({ open: false, awb: "", carrier: "", url: "", note: "" });
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const openRefund = () => {
    setRefund({ open: true, amount_paise: Math.round((order.total || 0) * 100), reason: "", notes: "" });
  };
  const applyRefund = async () => {
    try {
      const res = await api.post(`/admin/orders/${order.id}/refund`, {
        amount_paise: Number(refund.amount_paise),
        reason: refund.reason,
        notes: refund.notes ? { note: refund.notes } : undefined,
      });
      toast.success(`Refund processed · ${res.data.refund.id}`);
      setRefund({ open: false, amount_paise: 0, reason: "", notes: "" });
      load();
    } catch (e) {
      const d = e?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Refund failed");
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-order-detail">
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-brand-husk hover:text-brand-gold font-body text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow text-brand-gold tracking-[0.3em]">Order</p>
          <h1 className="font-display text-4xl text-brand-obsidian" data-testid="order-number">{order.order_number}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge className={`${STATUS_COLORS[order.status] || ""} border-0 font-body text-[10px] uppercase tracking-widest`}>{order.status.replace(/_/g, " ")}</Badge>
            <span className="font-body text-sm text-ink-muted">{formatDate(order.created_at, true)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`${API}/orders/${order.id}/invoice.html${order.guest_email ? `?email=${encodeURIComponent(order.guest_email)}` : ""}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 h-10 rounded-pill border border-brand-gold/40 text-brand-obsidian hover:bg-brand-gold/10 font-body text-xs tracking-widest uppercase">
            <Printer className="w-4 h-4" /> Invoice
          </a>
          <a href={`${API}/admin/orders/export.csv?from_date=${order.created_at.slice(0,10)}&to_date=${order.created_at.slice(0,10)}`} onClick={() => setCsvOpen(true)} className="inline-flex items-center gap-2 px-4 h-10 rounded-pill border border-brand-gold/40 text-brand-obsidian hover:bg-brand-gold/10 font-body text-xs tracking-widest uppercase">
            <Download className="w-4 h-4" /> CSV
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white border border-brand-gold/20 rounded-lg p-6">
            <h2 className="font-display text-xl text-brand-obsidian mb-4">Items</h2>
            <div className="divide-y divide-brand-gold/10">
              {order.items?.map((i, idx) => (
                <div key={idx} className="flex items-center gap-4 py-3">
                  <img src={i.image} alt={i.product_name} className="w-12 h-12 rounded-md object-cover bg-brand-parchment-soft" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-brand-obsidian">{i.product_name}</p>
                    <p className="font-body text-xs text-ink-muted">{i.variant_size} · {i.sku} · qty {i.quantity}</p>
                  </div>
                  <span className="font-display text-brand-obsidian">{formatINR(i.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-brand-gold/20 my-4" />
            <div className="space-y-1.5 font-body text-sm">
              <div className="flex justify-between"><span className="text-ink-muted">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              {order.discount_amount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount ({order.coupon_code})</span><span>−{formatINR(order.discount_amount)}</span></div>}
              <div className="flex justify-between"><span className="text-ink-muted">GST</span><span>{formatINR(order.gst_amount)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Shipping</span><span>{formatINR(order.shipping_amount)}</span></div>
              <div className="flex justify-between pt-2 border-t border-brand-gold/20 font-display text-lg text-brand-obsidian mt-2"><span>Total</span><span>{formatINR(order.total)}</span></div>
            </div>
          </div>

          {/* Payment attempts audit */}
          <div className="bg-white border border-brand-gold/20 rounded-lg p-6">
            <h2 className="font-display text-xl text-brand-obsidian mb-4">Payment attempts ({payment_attempts.length})</h2>
            {payment_attempts.length === 0 ? (
              <p className="font-body text-sm text-ink-muted">No failed attempts logged.</p>
            ) : (
              <div className="divide-y divide-brand-gold/10 font-body text-sm">
                {payment_attempts.map((a) => (
                  <div key={a.id} className="py-2 flex items-start gap-3">
                    <Badge className="bg-red-50 text-red-700 border-0 font-body text-[10px] uppercase tracking-widest">Failed</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-brand-obsidian">{a.attempted_payment_id}</p>
                      <p className="text-xs text-ink-muted">{formatDate(a.created_at, true)}</p>
                      <p className="text-xs text-brand-husk">{a.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Requests */}
          {requests.length > 0 && (
            <div className="bg-white border border-brand-gold/20 rounded-lg p-6">
              <h2 className="font-display text-xl text-brand-obsidian mb-4 flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Customer requests</h2>
              <div className="divide-y divide-brand-gold/10">
                {requests.map((r) => (
                  <div key={r.id} className="py-2 text-sm font-body">
                    <span className="font-display capitalize text-brand-obsidian">{r.type}</span> — {r.reason}
                    <Badge className="ml-2 bg-amber-100 text-amber-800 border-0 font-body text-[10px] uppercase tracking-widest">{r.status}</Badge>
                    {r.note && <p className="text-xs text-ink-muted mt-0.5">{r.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Customer + address */}
          <div className="bg-white border border-brand-gold/20 rounded-lg p-5">
            <h3 className="eyebrow text-brand-gold tracking-[0.3em] mb-2">Customer</h3>
            <p className="font-display text-brand-obsidian">{order.address_snapshot?.full_name}</p>
            <p className="font-body text-sm text-brand-husk">{order.guest_email || "—"}</p>
            <p className="font-body text-sm text-ink-muted mt-2 leading-relaxed">
              {order.address_snapshot?.line1}{order.address_snapshot?.line2 ? `, ${order.address_snapshot.line2}` : ""}<br/>
              {order.address_snapshot?.city}, {order.address_snapshot?.state} {order.address_snapshot?.pincode}
            </p>
          </div>

          {/* Status transition */}
          <div className="bg-white border border-brand-gold/20 rounded-lg p-5" data-testid="order-status-card">
            <h3 className="eyebrow text-brand-gold tracking-[0.3em] mb-3">Change status</h3>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 bg-brand-parchment border-brand-gold/30 font-body" data-testid="status-select"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="font-body">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="primary" size="sm" className="mt-3 w-full" onClick={() => setConfirm(true)} disabled={status === order.status} data-testid="status-apply">Apply</Button>
            {["paid", "processing", "shipped", "out_for_delivery", "delivered"].includes(order.status) && order.razorpay_payment_id && (
              <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={openRefund} data-testid="refund-open">
                <Banknote className="w-4 h-4" /> Refund via Razorpay
              </Button>
            )}
            {status === "refunded" && <p className="mt-2 text-[11px] font-body text-ink-muted">Use the Refund button above — this runs against Razorpay.</p>}
          </div>

          {/* Shipping */}
          <div className="bg-white border border-brand-gold/20 rounded-lg p-5" data-testid="shipping-card">
            <h3 className="eyebrow text-brand-gold tracking-[0.3em] mb-3 flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Shipping</h3>
            {order.tracking ? (
              <div className="font-body text-sm">
                <p><strong>{order.tracking.carrier}</strong> · <span className="text-ink-muted">{order.tracking.awb}</span></p>
                {order.tracking.url && <a className="text-brand-gold text-xs underline" href={order.tracking.url} target="_blank" rel="noreferrer">Track on carrier</a>}
              </div>
            ) : (
              <p className="font-body text-xs text-ink-muted">No shipping info yet.</p>
            )}
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setShip((s) => ({ ...s, open: true }))} data-testid="shipping-edit">
              {order.tracking ? "Update" : "Add"} shipping
            </Button>
          </div>

          <div className="bg-white border border-brand-gold/20 rounded-lg p-5 font-body text-xs text-ink-muted">
            <p className="mb-1">Razorpay order: <span className="text-brand-husk">{order.razorpay_order_id || "—"}</span></p>
            <p>Payment id: <span className="text-brand-husk">{order.razorpay_payment_id || "—"}</span></p>
          </div>
        </div>
      </div>

      {/* Status confirm modal */}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-brand-obsidian">Confirm status change</DialogTitle>
            <DialogDescription className="font-body">
              Change <strong>{order.order_number}</strong> from <em>{order.status}</em> to <strong>{status}</strong>?
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Optional internal note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="font-body" />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="primary" onClick={applyStatus} data-testid="status-confirm">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping dialog */}
      <Dialog open={ship.open} onOpenChange={(v) => setShip((s) => ({ ...s, open: v }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-brand-obsidian">Shipping details</DialogTitle>
            <DialogDescription className="font-body">Saving sets the order to <strong>shipped</strong>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="AWB / tracking number" value={ship.awb} onChange={(e) => setShip((s) => ({ ...s, awb: e.target.value }))} data-testid="shipping-awb" />
            <Input placeholder="Carrier (e.g. Delhivery, Bluedart)" value={ship.carrier} onChange={(e) => setShip((s) => ({ ...s, carrier: e.target.value }))} data-testid="shipping-carrier" />
            <Input placeholder="Tracking URL (optional)" value={ship.url} onChange={(e) => setShip((s) => ({ ...s, url: e.target.value }))} data-testid="shipping-url" />
            <Textarea rows={2} placeholder="Internal note (optional)" value={ship.note} onChange={(e) => setShip((s) => ({ ...s, note: e.target.value }))} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShip((s) => ({ ...s, open: false }))}>Cancel</Button>
            <Button variant="primary" onClick={applyShipping} data-testid="shipping-save">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Refund dialog */}
      <Dialog open={refund.open} onOpenChange={(v) => setRefund((r) => ({ ...r, open: v }))}>
        <DialogContent data-testid="refund-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-brand-obsidian">Refund — {order.order_number}</DialogTitle>
            <DialogDescription className="font-body">This calls the Razorpay refund API immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Amount (₹)</label>
              <Input
                type="number" min={1}
                value={Math.round(refund.amount_paise / 100)}
                onChange={(e) => setRefund((r) => ({ ...r, amount_paise: Math.round(Number(e.target.value) * 100) }))}
                data-testid="refund-amount"
              />
              <p className="text-xs text-ink-muted mt-1">Order total: {formatINR(order.total)} · Partial refunds supported</p>
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Reason</label>
              <Select value={refund.reason} onValueChange={(v) => setRefund((r) => ({ ...r, reason: v }))}>
                <SelectTrigger className="h-10" data-testid="refund-reason"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Damaged in transit">Damaged in transit</SelectItem>
                  <SelectItem value="Wrong product">Wrong product</SelectItem>
                  <SelectItem value="Quality issue">Quality issue</SelectItem>
                  <SelectItem value="Customer request">Customer request</SelectItem>
                  <SelectItem value="Duplicate charge">Duplicate charge</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea rows={3} placeholder="Internal notes (optional)" value={refund.notes} onChange={(e) => setRefund((r) => ({ ...r, notes: e.target.value }))} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRefund((r) => ({ ...r, open: false }))}>Cancel</Button>
            <Button variant="primary" onClick={applyRefund} data-testid="refund-confirm">Process refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
