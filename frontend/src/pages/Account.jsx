import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Package, ArrowRight, LogOut } from "lucide-react";
import Seo from "@/components/seo/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_COLOR = {
  pending_payment: "bg-brand-parchment-soft text-brand-obsidian",
  paid:            "bg-brand-gold text-brand-parchment",
  processing:      "bg-brand-obsidian text-brand-gold",
  shipped:         "bg-brand-obsidian text-brand-gold",
  delivered:       "bg-brand-obsidian-soft text-brand-gold",
  cancelled:       "bg-brand-husk/20 text-brand-husk",
  payment_failed:  "bg-brand-husk/30 text-brand-husk",
};

export function Account() {
  const { user, logout } = useAuth();
  if (user === null) return <div className="py-32 text-center font-body text-ink-muted">Loading…</div>;
  if (user === false) return <Navigate to="/login" state={{ from: "/account" }} replace />;
  return (
    <>
      <Seo title="My Account" description="Karijeeva account dashboard." />
      <section className="bg-brand-parchment min-h-[calc(100vh-72px)]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">Welcome back</p>
          <h1 className="text-h1 text-brand-obsidian" data-testid="account-name">{user.name}</h1>
          <p className="font-body text-ink-muted mt-2">{user.email}</p>
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <Link to="/account/orders" className="brand-card p-8 flex items-center gap-5" data-testid="account-orders-link">
              <Package className="w-8 h-8 text-brand-gold" />
              <div>
                <h3 className="font-display text-h4 text-brand-obsidian">My orders</h3>
                <p className="font-body text-sm text-ink-muted">Track, review, reorder.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-gold ml-auto" />
            </Link>
            <button onClick={logout} className="brand-card p-8 flex items-center gap-5 text-left" data-testid="account-logout">
              <LogOut className="w-8 h-8 text-brand-gold" />
              <div>
                <h3 className="font-display text-h4 text-brand-obsidian">Log out</h3>
                <p className="font-body text-sm text-ink-muted">See you soon.</p>
              </div>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (user && user !== false) {
      api.get("/orders/mine").then((r) => setOrders(r.data.orders || [])).catch(() => setOrders([]));
    }
  }, [user]);

  if (user === null) return <div className="py-32 text-center font-body text-ink-muted">Loading…</div>;
  if (user === false) return <Navigate to="/login" state={{ from: "/account/orders" }} replace />;

  return (
    <>
      <Seo title="My Orders" description="Your Karijeeva order history." />
      <section className="bg-brand-parchment min-h-[calc(100vh-72px)]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">Order history</p>
          <h1 className="text-h1 text-brand-obsidian">Your orders</h1>
          {orders === null && <p className="font-body text-ink-muted mt-10">Loading…</p>}
          {orders?.length === 0 && (
            <div className="mt-12 brand-card p-10 text-center">
              <p className="font-display text-h3 text-brand-obsidian">No orders yet.</p>
              <p className="font-body text-ink-muted mt-2">Start with a single bottle.</p>
              <Button asChild variant="primary" className="mt-6"><Link to="/products">Shop oils <ArrowRight /></Link></Button>
            </div>
          )}
          <div className="mt-10 space-y-4" data-testid="orders-list">
            {orders?.map((o) => (
              <div key={o.id} className="brand-card p-6 flex flex-col sm:flex-row sm:items-center gap-4" data-testid={`order-row-${o.order_number}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-display text-lg text-brand-obsidian">{o.order_number}</span>
                    <Badge className={`${STATUS_COLOR[o.status] || "bg-brand-parchment-soft text-brand-obsidian"} border-0 font-body uppercase tracking-widest text-[10px]`}>{o.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="font-body text-xs text-ink-muted">
                    {o.items?.length} item{o.items?.length === 1 ? "" : "s"} · {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-xl text-brand-obsidian">₹{o.total?.toFixed?.(2) ?? o.total}</span>
                  <Button asChild variant="secondary" size="sm"><Link to={`/orders/${o.id}/track?email=${encodeURIComponent(o.guest_email || user.email)}`} data-testid={`order-view-${o.order_number}`}>Track</Link></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
