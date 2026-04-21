import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { useCart } from "@/contexts/CartContext";

/**
 * ProductCard — hover-reveal Quick Add adds the first (smallest) variant to cart.
 */
export default function ProductCard({ product, index = 0 }) {
  const hero = product.gallery?.[0];
  const lowest = product.price_range?.min ?? 0;
  const highest = product.price_range?.max ?? 0;
  const firstVariant = product.variants?.[0];
  const { addItem } = useCart();

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    addItem({
      variant_id: firstVariant.id,
      product_id: product.id || product.slug,
      product_name: product.name,
      variant_size: firstVariant.size,
      sku: firstVariant.sku,
      image: hero,
      unit_price: firstVariant.price,
      mrp: firstVariant.mrp,
      slug: product.slug,
      quantity: 1,
    });
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group brand-card overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-parchment-soft">
        <img
          src={hero}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.is_featured && (
            <Badge className="bg-brand-gold text-brand-parchment border-0 font-body tracking-widest uppercase text-[10px]">
              <Sparkles className="w-3 h-3" /> Bestseller
            </Badge>
          )}
          {product.is_new_launch && (
            <Badge className="bg-brand-obsidian text-brand-gold border-0 font-body tracking-widest uppercase text-[10px]">
              New Launch
            </Badge>
          )}
          <Badge className="bg-brand-parchment-soft text-brand-obsidian border-0 font-body tracking-widest uppercase text-[10px]">
            <Leaf className="w-3 h-3" /> Cold-Pressed
          </Badge>
        </div>

        {/* Hover quick-add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <Button
            onClick={handleQuickAdd}
            variant="primary"
            size="md"
            className="w-full"
            data-testid={`product-card-quickadd-${product.slug}`}
          >
            <ShoppingBag /> Quick Add
          </Button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-display text-h4 text-brand-obsidian leading-tight">
            {product.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Rating value={product.avg_rating} size={14} />
          <span className="font-body text-xs text-ink-muted">
            {product.avg_rating?.toFixed(1)} · {product.review_count?.toLocaleString()} reviews
          </span>
        </div>
        <p className="font-body text-sm text-ink-muted line-clamp-2 flex-1">
          {product.short_desc}
        </p>
        <div className="mt-4 pt-4 border-t border-brand-gold/15 flex items-end justify-between">
          <div>
            <span className="font-display text-h4 text-brand-obsidian">
              ₹{lowest}
            </span>
            {highest !== lowest && (
              <span className="font-body text-xs text-ink-muted ml-1">
                — ₹{highest}
              </span>
            )}
          </div>
          <span className="font-body text-xs uppercase tracking-[0.2em] text-brand-gold">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
