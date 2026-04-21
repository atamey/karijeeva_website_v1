import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { PackageSearch, ArrowRight } from "lucide-react";
import Seo, { breadcrumbLd } from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export default function TrackOrder() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/orders/mine").then((r) => setMyOrders((r.data?.orders || []).slice(0, 5))).catch(() => {});
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    const on = orderNumber.trim();
    const em = email.trim().toLowerCase();
    if (!on || !em) {
      toast.error("We need both your order number and the email used at checkout.");
      return;
    }
    setLoading(true);
    try {
      // Resolve order number → order id via list (users own) or by trying the id field directly.
      // Friendlier path: attempt GET /orders/{on}?email=em (our API accepts id OR order_number is not supported;
      // we first try as id, on failure tell the user we couldn't find it).
      const res = await api.get(`/orders/${encodeURIComponent(on)}`, { params: { email: em } }).catch(() => null);
      if (!res?.data?.id) {
        toast.error("We couldn't find that order. Double-check your order number and the email used at checkout.");
        setLoading(false);
        return;
      }
      nav(`/orders/${res.data.id}/track?email=${encodeURIComponent(em)}`);
    } catch {
      toast.error("We couldn't find that order. Double-check your order number and the email used at checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Track your order"
        description="Track a Karijeeva order with your order number and email. Logged-in customers can also jump straight to a recent order."
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Track Order", path: "/track-order" }])}
      />

      <section className="bg-brand-obsidian text-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20" data-testid="page-track-order">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-4">Order lookup</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-parchment max-w-3xl">
            Track your order
          </h1>
          <p className="font-display text-brand-parchment/80 text-lg mt-5 max-w-xl">
            Two fields. No sign-in required.
          </p>
        </div>
      </section>

      <section className="bg-brand-parchment">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16 space-y-10">
          {user && myOrders.length > 0 && (
            <div>
              <p className="font-body text-xs tracking-[0.25em] uppercase text-brand-gold mb-4">
                Your recent orders
              </p>
              <ul className="space-y-2">
                {myOrders.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={`/orders/${o.id}/track`}
                      data-testid={`track-quickpick-${o.order_number}`}
                      className="group flex items-center justify-between gap-4 p-4 rounded-lg border border-brand-gold/20 bg-white hover:border-brand-gold transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <PackageSearch className="w-4 h-4 text-brand-gold" />
                        <span className="font-body text-brand-obsidian font-medium">{o.order_number}</span>
                        <span className="font-body text-xs uppercase tracking-widest text-brand-husk/70">
                          {o.status?.replace(/_/g, " ")}
                        </span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form
            onSubmit={submit}
            data-testid="track-order-form"
            className="bg-white border border-brand-gold/25 rounded-lg p-6 sm:p-8 space-y-5 shadow-soft"
          >
            <div>
              <label className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold block mb-2">
                Order number
              </label>
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="KRJ-20260214-XXXX"
                required
                data-testid="track-order-number"
                className="h-11 bg-white border-brand-gold/30 focus-visible:ring-brand-gold"
              />
            </div>
            <div>
              <label className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold block mb-2">
                Email used at checkout
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                data-testid="track-order-email"
                className="h-11 bg-white border-brand-gold/30 focus-visible:ring-brand-gold"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              data-testid="track-order-submit"
              className="w-full sm:w-auto"
            >
              Track order
            </Button>
            <p className="font-body text-xs text-brand-husk/75 pt-2">
              Tip: your order number starts with <code>KRJ-</code> and is in the confirmation email we sent when payment was captured.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
