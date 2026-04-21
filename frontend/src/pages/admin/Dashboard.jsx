import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee, ShoppingBag, Percent, Boxes, Star, Inbox, Mail, Users,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { adminApi, formatINR, formatDate, STATUS_COLORS } from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";

function Kpi({ icon: Icon, label, value, sub, accent, testId }) {
  return (
    <div className="bg-white border border-brand-gold/20 rounded-lg p-5" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-body text-[11px] uppercase tracking-widest text-ink-muted">{label}</p>
          <p className="font-display text-3xl text-brand-obsidian mt-1 truncate">{value}</p>
          {sub && <p className="font-body text-xs text-ink-muted mt-0.5">{sub}</p>}
        </div>
        <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${accent || "bg-brand-parchment-soft text-brand-obsidian"} [&_svg]:w-4 [&_svg]:h-4`}>
          <Icon />
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [latest, setLatest] = useState({ orders: [], pending_reviews: [] });

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => {});
    adminApi.trend(30).then((r) => setTrend(r.trend || [])).catch(() => {});
    adminApi.latest().then(setLatest).catch(() => {});
  }, []);

  if (!stats) return <div className="font-body text-ink-muted">Loading dashboard…</div>;

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div>
        <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">Overview</p>
        <h1 className="font-display text-4xl text-brand-obsidian">Dashboard</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi testId="kpi-revenue" icon={IndianRupee} label="Revenue (all time)" value={formatINR(stats.revenue_all_time)} sub={`Today: ${formatINR(stats.revenue_today)}`} accent="bg-emerald-50 text-emerald-700" />
        <Kpi testId="kpi-orders"  icon={ShoppingBag} label="Orders" value={stats.total_orders} sub={`Paid: ${stats.paid_orders} · Pending: ${stats.pending_payment_orders}`} accent="bg-amber-50 text-amber-700" />
        <Kpi testId="kpi-aov"     icon={Percent} label="Avg order value" value={formatINR(stats.aov)} sub={`Paid rate: ${stats.conversion_pct}%`} accent="bg-brand-gold/15 text-brand-gold" />
        <Kpi testId="kpi-low-stock" icon={Boxes} label="Low stock (≤10)" value={stats.low_stock_count} sub="Needs restock" accent="bg-red-50 text-red-700" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi testId="kpi-reviews" icon={Star} label="Reviews pending" value={stats.pending_reviews_count} accent="bg-yellow-50 text-yellow-700" />
        <Kpi testId="kpi-requests" icon={Inbox} label="Open requests" value={stats.open_requests_count} accent="bg-orange-50 text-orange-700" />
        <Kpi testId="kpi-messages" icon={Mail} label="New messages" value={stats.new_messages_count} accent="bg-sky-50 text-sky-700" />
        <Kpi testId="kpi-subs" icon={Users} label="Subscribers" value={stats.newsletter_count} accent="bg-violet-50 text-violet-700" />
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg p-6">
        <h2 className="font-display text-xl text-brand-obsidian">Revenue · last 30 days</h2>
        <div className="mt-5 h-64" data-testid="dashboard-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8A84A" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E8A84A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(232, 168, 74,0.12)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5)} stroke="#3A2418" fontSize={11} />
              <YAxis stroke="#3A2418" fontSize={11} />
              <Tooltip contentStyle={{ background: "#F4ECDB", borderRadius: 8, border: "1px solid rgba(232, 168, 74,0.3)", fontFamily: "Inter" }} formatter={(v) => formatINR(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#E8A84A" strokeWidth={2} fill="url(#gold)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-gold/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-brand-obsidian">Latest orders</h2>
            <Link to="/admin/orders" className="font-body text-xs uppercase tracking-widest text-brand-gold hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-brand-gold/10">
            {latest.orders.length === 0 && <p className="font-body text-sm text-ink-muted py-6">No orders yet.</p>}
            {latest.orders.map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3 hover:bg-brand-parchment-soft/20 rounded px-2 -mx-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-brand-obsidian">{o.order_number}</p>
                  <p className="font-body text-xs text-ink-muted">{o.guest_email || "—"} · {formatDate(o.created_at)}</p>
                </div>
                <Badge className={`${STATUS_COLORS[o.status] || ""} border-0 font-body text-[10px] uppercase tracking-widest`}>
                  {o.status.replace(/_/g, " ")}
                </Badge>
                <span className="font-display text-brand-obsidian">{formatINR(o.total)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-brand-gold/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-brand-obsidian">Reviews awaiting moderation</h2>
            <Link to="/admin/reviews" className="font-body text-xs uppercase tracking-widest text-brand-gold hover:underline">Moderate</Link>
          </div>
          <div className="divide-y divide-brand-gold/10">
            {latest.pending_reviews.length === 0 && <p className="font-body text-sm text-ink-muted py-6">Nothing pending. Nice work.</p>}
            {latest.pending_reviews.map((r) => (
              <div key={r.id} className="py-3">
                <p className="font-display text-brand-obsidian text-sm">{r.title || "(no title)"}</p>
                <p className="font-body text-xs text-ink-muted">{r.user_name} · {r.rating}★ · {formatDate(r.created_at)}</p>
                <p className="font-body text-sm text-brand-husk mt-1 line-clamp-2">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
