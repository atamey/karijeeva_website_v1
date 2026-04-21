import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { adminApi, formatINR, formatDate, STATUS_COLORS } from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  "all", "pending_payment", "paid", "processing", "shipped",
  "out_for_delivery", "delivered", "cancelled", "refunded", "payment_failed",
];

export default function AdminOrders() {
  const [filters, setFilters] = useState({ status: "all", q: "", from_date: "", to_date: "", page: 1 });
  const [data, setData] = useState({ orders: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { ...filters, page_size: 25 };
      Object.keys(params).forEach((k) => { if (!params[k] || params[k] === "all") delete params[k]; });
      const d = await adminApi.ordersList(params);
      setData(d);
    } catch { toast.error("Failed to load orders"); } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters]);

  return (
    <div className="space-y-6" data-testid="admin-orders-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow text-brand-gold tracking-[0.3em]">Operations</p>
          <h1 className="font-display text-4xl text-brand-obsidian">Orders</h1>
          <p className="font-body text-sm text-ink-muted mt-1">{data.total} total</p>
        </div>
        <a
          href={adminApi.ordersCsvUrl({ ...(filters.status !== "all" && { status: filters.status }), ...(filters.from_date && { from_date: filters.from_date }), ...(filters.to_date && { to_date: filters.to_date }) })}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-pill bg-brand-obsidian text-brand-gold font-body text-xs tracking-widest uppercase hover:bg-brand-obsidian-soft"
          data-testid="orders-export-csv"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg p-4 grid grid-cols-1 md:grid-cols-5 gap-3" data-testid="orders-filters">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-ink-muted" />
          <Input
            placeholder="Search by order #, email, phone, name"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
            className="h-11 pl-9 bg-brand-parchment border-brand-gold/30 font-body"
            data-testid="orders-search"
          />
        </div>
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}>
          <SelectTrigger className="h-11 bg-brand-parchment border-brand-gold/30 font-body" data-testid="orders-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="font-body">{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={filters.from_date} onChange={(e) => setFilters((f) => ({ ...f, from_date: e.target.value, page: 1 }))} className="h-11 bg-brand-parchment border-brand-gold/30 font-body" />
        <Input type="date" value={filters.to_date} onChange={(e) => setFilters((f) => ({ ...f, to_date: e.target.value, page: 1 }))} className="h-11 bg-brand-parchment border-brand-gold/30 font-body" />
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body" data-testid="orders-table">
            <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gold/10">
              {data.orders.map((o) => (
                <tr key={o.id} className="hover:bg-brand-parchment-soft/15" data-testid={`order-row-${o.order_number}`}>
                  <td className="px-4 py-3"><Link to={`/admin/orders/${o.id}`} className="font-display text-brand-obsidian hover:text-brand-gold">{o.order_number}</Link></td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="text-brand-husk">{o.address_snapshot?.full_name || "—"}</div>
                    <div className="text-xs text-ink-muted">{o.guest_email || "—"}</div>
                  </td>
                  <td className="px-4 py-3"><Badge className={`${STATUS_COLORS[o.status] || ""} border-0 font-body text-[10px] uppercase tracking-widest`}>{o.status.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3 text-right tabular-nums">{o.items?.length || 0}</td>
                  <td className="px-4 py-3 text-right font-display text-brand-obsidian">{formatINR(o.total)}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{(o.razorpay_payment_id || o.razorpay_order_id || "").slice(-12)}</td>
                </tr>
              ))}
              {!loading && data.orders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-ink-muted">No orders match your filters.</td></tr>
              )}
              {loading && <tr><td colSpan={7} className="px-4 py-16 text-center text-ink-muted">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-body text-xs text-ink-muted">Page {filters.page} of {Math.max(1, Math.ceil(data.total / 25))}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Prev</Button>
          <Button variant="ghost" size="sm" disabled={filters.page * 25 >= data.total} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</Button>
        </div>
      </div>
    </div>
  );
}
