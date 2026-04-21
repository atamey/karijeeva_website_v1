import { Link, Navigate } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Seo from "@/components/seo/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

export default function Wishlist() {
  const { user } = useAuth();
  const { items, loading, remove, moveToCart } = useWishlist();
  const { addItem } = useCart();

  if (user === null) return <div className="py-32 text-center font-body text-ink-muted">Loading…</div>;
  if (user === false) return <Navigate to="/login" state={{ from: "/wishlist" }} replace />;

  const handleMove = async (variant_id) => {
    const res = await moveToCart(variant_id);
    if (res.ok && res.cart_item) {
      addItem(res.cart_item);
    }
  };

  return (
    <>
      <Seo title="Your wishlist" description="The Karijeeva oils you're saving for later." />
      <section className="bg-brand-parchment min-h-[calc(100vh-72px)]" data-testid="wishlist-page">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase mb-3">Saved for later</p>
              <h1 className="text-h1 text-brand-obsidian">Your wishlist</h1>
              <p className="font-body text-ink-muted mt-2">
                {items.length === 0 ? "Nothing saved yet." : `${items.length} item${items.length === 1 ? "" : "s"} waiting for a weekend.`}
              </p>
            </div>
            <Button asChild variant="secondary"><Link to="/products">Browse oils <ArrowRight /></Link></Button>
          </div>

          {loading && <p className="font-body text-ink-muted mt-10">Loading your saved oils…</p>}

          {!loading && items.length === 0 && (
            <div className="mt-16 brand-card p-14 text-center max-w-xl mx-auto" data-testid="wishlist-empty">
              <div className="mx-auto w-16 h-16 rounded-full border-2 border-brand-gold/60 flex items-center justify-center text-brand-gold">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="font-display text-h3 text-brand-obsidian mt-6">Your wishlist is empty.</h3>
              <p className="font-body text-ink-muted mt-3">Discover our three cold-pressed oils and save your favourite for later.</p>
              <Button asChild variant="primary" size="lg" className="mt-8">
                <Link to="/products" data-testid="wishlist-empty-cta">Discover our oils <ArrowRight /></Link>
              </Button>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="wishlist-grid">
              {items.map((it) => (
                <div key={it.variant_id} className="brand-card overflow-hidden" data-testid={`wishlist-item-${it.variant_id}`}>
                  <Link to={`/products/${it.product_slug}`} className="block aspect-square bg-brand-parchment-soft overflow-hidden">
                    <img src={it.image} alt={it.product_name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </Link>
                  <div className="p-5">
                    <p className="font-accent italic text-brand-gold text-[11px] tracking-[0.25em] uppercase">{it.variant_size}</p>
                    <h3 className="font-display text-xl text-brand-obsidian leading-tight mt-1">
                      <Link to={`/products/${it.product_slug}`}>{it.product_name}</Link>
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-2xl text-brand-obsidian">₹{it.price}</span>
                      {it.mrp > it.price && <span className="font-body text-sm text-ink-muted line-through">₹{it.mrp}</span>}
                      {!it.in_stock && <span className="font-body text-[11px] text-brand-husk/70 uppercase tracking-widest ml-auto">Out of stock</span>}
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <Button
                        variant="primary" size="sm" className="flex-1"
                        disabled={!it.in_stock}
                        onClick={() => handleMove(it.variant_id)}
                        data-testid={`wishlist-move-${it.variant_id}`}
                      >
                        <ShoppingBag /> Move to cart
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => remove(it.variant_id)}
                        aria-label="Remove from wishlist"
                        data-testid={`wishlist-remove-${it.variant_id}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
