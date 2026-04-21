import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Seo, { breadcrumbLd } from "@/components/seo/Seo";
import { fetchProducts } from "@/lib/api";
import ProductCard from "@/components/marketing/ProductCard";
import ScrollReveal from "@/components/marketing/ScrollReveal";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "wellness", label: "Wellness" },
  { id: "culinary", label: "Culinary" },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts({
      category: cat === "all" ? undefined : cat,
      sort,
    })
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [cat, sort]);

  const heading = useMemo(() => {
    if (cat === "wellness") return "Wellness oils";
    if (cat === "culinary") return "Culinary oils";
    return "All Karijeeva oils";
  }, [cat]);

  return (
    <>
      <Seo
        title="Shop cold-pressed coconut oil online"
        description="The complete Karijeeva collection: virgin cold-pressed, wood-pressed chekku, and family-size cooking coconut oil. Small-batch, single-origin, delivered across India."
        jsonLd={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
        ])}
      />

      {/* Page header */}
      <section className="bg-brand-parchment-soft border-b border-brand-gold/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="font-body text-sm text-brand-husk/70 hover:text-brand-gold">
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-body text-sm text-brand-obsidian">Products</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <p className="eyebrow text-brand-gold tracking-[0.3em] mt-8 mb-3">
            The collection
          </p>
          <h1 className="text-h1 text-brand-obsidian" data-testid="products-heading">{heading}</h1>
          <p className="font-body text-body-lg text-ink-muted mt-5 max-w-xl">
            Three oils. One ingredient. Zero compromise — every bottle comes with a pressing date.
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="bg-brand-parchment border-b border-brand-gold/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" data-testid="products-filter-chips">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                data-testid={`filter-chip-${c.id}`}
                onClick={() => setCat(c.id)}
                className={cn(
                  "px-5 h-10 rounded-pill font-body text-xs tracking-[0.2em] uppercase border transition-colors",
                  cat === c.id
                    ? "bg-brand-obsidian text-brand-gold border-brand-obsidian"
                    : "bg-transparent text-brand-husk border-brand-gold/30 hover:border-brand-gold"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body text-xs uppercase tracking-[0.2em] text-ink-muted">Sort</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger data-testid="products-sort" className="w-[200px] h-10 bg-white border-brand-gold/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Highest rated</SelectItem>
                <SelectItem value="price-asc">Price · Low to High</SelectItem>
                <SelectItem value="price-desc">Price · High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          {loading ? (
            <p className="font-body text-ink-muted">Loading oils...</p>
          ) : products.length === 0 ? (
            <p className="font-body text-ink-muted">No products found for this filter.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
              {products.map((p, i) => (
                <ScrollReveal key={p.slug} delay={i * 90}>
                  <ProductCard product={p} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
