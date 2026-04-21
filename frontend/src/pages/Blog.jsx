import { useEffect, useState } from "react";
import Seo, { breadcrumbLd } from "@/components/seo/Seo";
import { fetchBlogList } from "@/lib/api";
import BlogCard from "@/components/marketing/BlogCard";
import ScrollReveal from "@/components/marketing/ScrollReveal";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "culinary", label: "Culinary" },
  { id: "wellness", label: "Wellness" },
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [cat, setCat] = useState("all");

  useEffect(() => {
    fetchBlogList(cat === "all" ? undefined : cat)
      .then((d) => setPosts(d.posts || []));
  }, [cat]);

  const [featured, ...rest] = posts;

  return (
    <>
      <Seo
        title="The Karijeeva journal"
        description="Recipes, culinary notes, and wellness essays from the Karijeeva kitchens. New writing every two weeks."
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])}
      />

      <section className="bg-brand-parchment-soft border-b border-brand-gold/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">The journal</p>
          <h1 className="text-h1 text-brand-obsidian">Stories from the kitchen.</h1>
          <p className="font-body text-body-lg text-ink-muted mt-5 max-w-2xl">
            Recipes we return to. Essays we've earned. Harvest notes from the grove.
          </p>

          <div className="mt-10 flex flex-wrap gap-2" data-testid="blog-filter-chips">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                data-testid={`blog-filter-${c.id}`}
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
        </div>
      </section>

      <section className="bg-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 space-y-16">
          {featured && (
            <ScrollReveal>
              <BlogCard post={featured} featured />
            </ScrollReveal>
          )}
          {rest.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="blog-grid">
              {rest.map((p, i) => (
                <ScrollReveal key={p.slug} delay={i * 80}>
                  <BlogCard post={p} />
                </ScrollReveal>
              ))}
            </div>
          )}
          {!posts.length && (
            <p className="font-body text-ink-muted">No stories in this category yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
