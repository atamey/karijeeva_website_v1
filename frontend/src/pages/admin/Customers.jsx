import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Download, Search, ArrowLeft, Mail, Phone } from "lucide-react";
import { adminApi, formatINR, formatDate, STATUS_COLORS } from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AdminCustomers() {
  const [data, setData] = useState({ customers: [], total: 0 });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    try { const d = await adminApi.customersList({ q, page, page_size: 50 }); setData(d); }
    catch { toast.error("Failed to load customers"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, page]);

  return (
    <div className="space-y-6" data-testid="admin-customers">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">People</p>
          <h1 className="font-display text-4xl text-brand-obsidian">Customers</h1>
          <p className="font-body text-sm text-ink-muted mt-1">{data.total} registered</p>
        </div>
        <a href={adminApi.customersCsvUrl()} className="inline-flex items-center gap-2 px-4 h-10 rounded-pill bg-brand-obsidian text-brand-gold font-body text-xs tracking-widest uppercase hover:bg-brand-obsidian-soft">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3.5 text-ink-muted" />
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search email or name" className="h-11 pl-9 bg-white border-brand-gold/30 font-body" />
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm font-body" data-testid="customers-table">
          <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Total spent</th>
              <th className="px-4 py-3 text-left">Last order</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/10">
            {data.customers.map((c) => (
              <tr key={c.id} data-testid={`customer-row-${c.email}`}>
                <td className="px-4 py-3"><Link to={`/admin/customers/${c.id}`} className="font-display text-brand-obsidian hover:text-brand-gold">{c.name}</Link></td>
                <td className="px-4 py-3 text-ink-muted">{c.email}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.orders_count}</td>
                <td className="px-4 py-3 text-right font-display text-brand-obsidian">{formatINR(c.total_spent)}</td>
                <td className="px-4 py-3 text-ink-muted">{c.last_order_at ? formatDate(c.last_order_at) : "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(c.created_at)}</td>
              </tr>
            ))}
            {data.customers.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { adminApi.customerDetail(id).then(setData).catch(() => toast.error("Load failed")); }, [id]);
  if (!data) return <div className="font-body text-ink-muted">Loading…</div>;
  const { user, orders, reviews, wishlist } = data;

  return (
    <div className="space-y-6" data-testid="admin-customer-detail">
      <Link to="/admin/customers" className="inline-flex items-center gap-2 text-brand-husk hover:text-brand-gold font-body text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </Link>

      <div className="bg-white border border-brand-gold/20 rounded-lg p-6">
        <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">Customer</p>
        <h1 className="font-display text-4xl text-brand-obsidian">{user.name}</h1>
        <div className="mt-2 flex flex-wrap gap-5 font-body text-sm text-brand-husk">
          <span className="inline-flex items-center gap-2"><Mail className="w-4 h-4 text-brand-gold" /> {user.email}</span>
          {user.phone && <span className="inline-flex items-center gap-2"><Phone className="w-4 h-4 text-brand-gold" /> {user.phone}</span>}
          <span className="text-ink-muted">Joined {formatDate(user.created_at)}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-gold/20 rounded-lg p-5">
          <h3 className="font-display text-xl text-brand-obsidian mb-3">Orders ({orders.length})</h3>
          <div className="divide-y divide-brand-gold/10">
            {orders.map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-2 hover:bg-brand-parchment-soft/20 rounded px-2 -mx-2">
                <div className="flex-1">
                  <p className="font-display text-brand-obsidian">{o.order_number}</p>
                  <p className="font-body text-xs text-ink-muted">{formatDate(o.created_at)}</p>
                </div>
                <Badge className={`${STATUS_COLORS[o.status] || ""} border-0 font-body text-[10px] uppercase tracking-widest`}>{o.status.replace(/_/g, " ")}</Badge>
                <span className="font-display text-brand-obsidian">{formatINR(o.total)}</span>
              </Link>
            ))}
            {orders.length === 0 && <p className="font-body text-sm text-ink-muted py-4">No orders yet.</p>}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-brand-gold/20 rounded-lg p-5">
            <h3 className="font-display text-xl text-brand-obsidian mb-3">Reviews ({reviews.length})</h3>
            {reviews.map((r) => (
              <div key={r.id} className="text-sm font-body py-1">
                <Badge className="bg-brand-parchment-soft text-brand-obsidian border-0 font-body text-[10px]">{r.rating}★</Badge>
                <span className="ml-2">{r.title || "(no title)"} · {r.is_approved ? "approved" : r.rejected ? "rejected" : "pending"}</span>
              </div>
            ))}
            {reviews.length === 0 && <p className="font-body text-sm text-ink-muted">None.</p>}
          </div>
          <div className="bg-white border border-brand-gold/20 rounded-lg p-5">
            <h3 className="font-display text-xl text-brand-obsidian mb-3">Wishlist ({wishlist.length})</h3>
            {wishlist.map((w) => (
              <p key={w.variant_id} className="font-body text-sm text-brand-husk py-0.5">
                {w.product_snapshot?.name} — {w.product_snapshot?.size}
              </p>
            ))}
            {wishlist.length === 0 && <p className="font-body text-sm text-ink-muted">Empty.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
