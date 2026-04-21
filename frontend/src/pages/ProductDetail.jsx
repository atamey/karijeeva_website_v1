import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Heart, Leaf, ShieldCheck, Sparkles, ChefHat,
  Minus, Plus,
} from "lucide-react";

import Seo, { breadcrumbLd, productLd } from "@/components/seo/Seo";
import { fetchProduct } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ReviewsBlock from "@/components/marketing/ReviewsBlock";
import RecipeCard from "@/components/marketing/RecipeCard";
import ScrollReveal from "@/components/marketing/ScrollReveal";
import { cn } from "@/lib/utils";

const ICONS = { Leaf, ShieldCheck, Sparkles, ChefHat, Heart };

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuth();
  const { has: wishHas, add: wishAdd, remove: wishRemove } = useWishlist();

  const loadProduct = () => fetchProduct(slug).then((p) => {
    setProduct(p);
    setVariant((curr) => curr || p.variants?.find((v) => v.size === "500ml") || p.variants?.[0]);
  }).catch(() => setProduct(false));

  useEffect(() => {
    setActiveImg(0); setQty(1); setVariant(null);
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 640);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (product === false) {
    return (
      <div className="max-w-3xl mx-auto py-32 px-6 text-center">
        <h1 className="text-h2 text-brand-obsidian">Oil not found.</h1>
        <Button asChild variant="primary" className="mt-6">
          <Link to="/products">Back to collection</Link>
        </Button>
      </div>
    );
  }
  if (!product) return <div className="py-40 text-center font-body text-ink-muted">Loading oil…</div>;

  const gallery = product.gallery || [];
  const discount = variant && variant.mrp > variant.price
    ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!variant) return;
    addItem({
      variant_id: variant.id,
      product_id: product.id || product.slug,
      product_name: product.name,
      variant_size: variant.size,
      sku: variant.sku,
      image: gallery[0],
      unit_price: variant.price,
      mrp: variant.mrp,
      slug: product.slug,
      quantity: qty,
    });
  };
  const handleWishlist = async () => {
    if (!variant) return;
    if (!user) {
      // guest: redirect to login with intent
      navigate("/login", { state: { from: `/products/${slug}`, intent: "wishlist" } });
      return;
    }
    if (wishHas(variant.id)) {
      await wishRemove(variant.id);
    } else {
      await wishAdd(variant.id);
    }
  };
  const wishlisted = variant ? wishHas(variant.id) : false;

  return (
    <>
      <Seo
        title={product.name}
        description={product.short_desc}
        image={gallery[0]}
        type="product"
        jsonLd={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: product.name, path: `/products/${slug}` },
          ]),
          productLd(product, product.price_range?.min, product.price_range?.max),
        ]}
      />

      {/* Breadcrumb */}
      <section className="bg-brand-parchment border-b border-brand-gold/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/" className="font-body text-sm text-brand-husk/70 hover:text-brand-gold">Home</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/products" className="font-body text-sm text-brand-husk/70 hover:text-brand-gold">Products</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage className="font-body text-sm text-brand-obsidian">{product.name}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      {/* PDP grid */}
      <section className="bg-brand-parchment" data-testid="pdp-main">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-brand-parchment-soft border border-brand-gold/15" data-testid="pdp-gallery">
              <img
                src={gallery[activeImg]}
                alt={`${product.name} — view ${activeImg + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110 cursor-zoom-in"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  data-testid={`pdp-thumb-${i}`}
                  className={cn(
                    "aspect-square rounded-md overflow-hidden border-2 transition-all",
                    i === activeImg ? "border-brand-gold" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <img src={src} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
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

            <h1 className="text-h2 text-brand-obsidian leading-tight" data-testid="pdp-name">{product.name}</h1>
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2">
              <Rating value={product.avg_rating} size={16} />
              <span className="font-body text-sm text-ink-muted hover:text-brand-gold">
                {product.avg_rating?.toFixed(1)} · {product.review_count?.toLocaleString()} reviews
              </span>
            </a>
            <p className="font-body text-body-lg text-brand-husk/80 mt-5 leading-relaxed">
              {product.short_desc}
            </p>

            {/* Variants */}
            <div className="mt-8">
              <span className="font-body text-xs uppercase tracking-[0.25em] text-ink-muted">Size</span>
              <div className="mt-3 flex flex-wrap gap-3" data-testid="pdp-variants">
                {product.variants?.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v)}
                    data-testid={`pdp-variant-${v.size}`}
                    className={cn(
                      "px-6 h-12 rounded-pill font-body text-sm tracking-widest uppercase border-2 transition-all",
                      variant?.id === v.id
                        ? "bg-brand-obsidian text-brand-gold border-brand-obsidian"
                        : "bg-transparent text-brand-husk border-brand-gold/30 hover:border-brand-gold"
                    )}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            {variant && (
              <div className="mt-8 flex items-baseline gap-3" data-testid="pdp-price">
                <span className="font-display text-h2 text-brand-obsidian">₹{variant.price}</span>
                {variant.mrp > variant.price && (
                  <>
                    <span className="font-body text-lg text-ink-muted line-through">₹{variant.mrp}</span>
                    <Badge className="bg-brand-gold text-brand-parchment border-0 font-body tracking-widest uppercase text-[10px]">
                      {discount}% off
                    </Badge>
                  </>
                )}
              </div>
            )}
            <p className="font-body text-xs text-ink-muted mt-1">Inclusive of all taxes · Free shipping above ₹799</p>

            {/* Qty + CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center border border-brand-gold/30 rounded-pill h-12 bg-white" data-testid="pdp-qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-12 h-full flex items-center justify-center text-brand-obsidian hover:text-brand-gold">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-display text-lg text-brand-obsidian">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="w-12 h-full flex items-center justify-center text-brand-obsidian hover:text-brand-gold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button variant="primary" size="lg" onClick={handleAddToCart} data-testid="pdp-add-to-cart" className="flex-1 sm:flex-none">
                <ShoppingBag /> Add to cart
              </Button>
              <Button variant="secondary" size="lg" onClick={handleWishlist} data-testid="pdp-wishlist" aria-label="Wishlist" className={cn(wishlisted && "bg-brand-gold/15 text-brand-gold border-brand-gold")}>
                <Heart className={cn(wishlisted && "fill-brand-gold")} />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 pt-8 border-t border-brand-gold/15 grid grid-cols-3 gap-4">
              {[
                { icon: "Leaf", t: "100% Natural" },
                { icon: "ShieldCheck", t: "FSSAI Certified" },
                { icon: "Sparkles", t: "Single Origin" },
              ].map((b) => {
                const I = ICONS[b.icon];
                return (
                  <div key={b.t} className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold [&_svg]:w-4 [&_svg]:h-4"><I /></span>
                    <span className="font-body text-xs tracking-wide text-brand-husk">{b.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-brand-parchment-soft border-y border-brand-gold/15" data-testid="pdp-tabs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <Tabs defaultValue="benefits" className="w-full">
            <TabsList className="bg-white border border-brand-gold/20 h-auto p-1 flex-wrap">
              {["benefits", "how-to-use", "ingredients", "reviews", "faq"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  data-testid={`pdp-tab-${t}`}
                  className="data-[state=active]:bg-brand-obsidian data-[state=active]:text-brand-gold font-body tracking-wide uppercase text-xs px-5 py-2"
                >
                  {t.replace("-", " ")}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="benefits" className="mt-8 grid sm:grid-cols-2 gap-6">
              {(product.benefits || []).map((b, i) => {
                const I = ICONS[b.icon] || Leaf;
                return (
                  <div key={i} className="brand-card p-6 flex gap-4 border-0 shadow-soft bg-white">
                    <span className="h-11 w-11 shrink-0 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"><I /></span>
                    <div>
                      <h4 className="font-display text-xl text-brand-obsidian leading-tight">{b.title}</h4>
                      <p className="font-body text-sm text-ink-muted mt-1">{b.body}</p>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="how-to-use" className="mt-8">
              <ol className="space-y-4 max-w-2xl">
                {(product.how_to_use || []).map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="h-8 w-8 shrink-0 rounded-full bg-brand-gold text-brand-parchment font-display text-sm flex items-center justify-center">{i + 1}</span>
                    <span className="font-body text-brand-husk pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-8">
              <p className="font-body text-body-lg text-brand-husk/85 max-w-2xl">{product.ingredients}</p>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8" id="reviews">
              <ReviewsBlock product={product} user={user} onSubmitted={loadProduct} />
            </TabsContent>

            <TabsContent value="faq" className="mt-8 max-w-2xl">
              <Accordion type="single" collapsible>
                {(product.related_faqs || []).map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-brand-gold/20">
                    <AccordionTrigger className="font-display text-lg text-brand-obsidian text-left">{f.question}</AccordionTrigger>
                    <AccordionContent className="font-body text-ink-muted">{f.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Pairs Well With */}
      {product.pairs_with_recipes?.length > 0 && (
        <section className="bg-brand-parchment" data-testid="pdp-pairs-with">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <ScrollReveal>
              <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase mb-3">
                In the kitchen
              </p>
              <h2 className="text-h2 text-brand-obsidian max-w-2xl">
                Pairs beautifully <span className="gold-underline">with.</span>
              </h2>
              <p className="font-body text-body-lg text-ink-muted mt-4 max-w-xl">
                Three recipes we cook most often with this oil.
              </p>
            </ScrollReveal>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {product.pairs_with_recipes.slice(0, 3).map((r, i) => (
                <ScrollReveal key={r.slug} delay={i * 90}>
                  <RecipeCard recipe={r} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky mobile add-to-cart */}
      {showStickyBar && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-brand-parchment border-t border-brand-gold/30 px-4 py-3 flex items-center gap-3 shadow-elevated"
          data-testid="pdp-sticky-bar"
        >
          <div className="flex-1">
            <div className="font-display text-xl text-brand-obsidian leading-none">₹{variant?.price}</div>
            <div className="font-body text-xs text-ink-muted">{product.name} · {variant?.size}</div>
          </div>
          <Button variant="primary" size="md" onClick={handleAddToCart}>
            <ShoppingBag /> Add
          </Button>
        </div>
      )}
    </>
  );
}
