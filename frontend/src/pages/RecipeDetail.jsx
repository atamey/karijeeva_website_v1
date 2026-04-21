import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import Seo, { breadcrumbLd } from "@/components/seo/Seo";
import { fetchRecipe } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScrollReveal from "@/components/marketing/ScrollReveal";

export default function RecipeDetail() {
  const { slug } = useParams();
  const [recipe, setRecipe] = useState(null);
  useEffect(() => { fetchRecipe(slug).then(setRecipe).catch(() => setRecipe(false)); }, [slug]);

  if (recipe === false) {
    return <div className="max-w-3xl mx-auto py-32 px-6 text-center">
      <h1 className="text-h2 text-brand-obsidian">Recipe not found.</h1>
      <Button asChild variant="primary" className="mt-6"><Link to="/recipes">All recipes</Link></Button>
    </div>;
  }
  if (!recipe) return <div className="py-40 text-center font-body text-ink-muted">Loading recipe…</div>;

  return (
    <>
      <Seo
        title={recipe.title}
        description={recipe.short_desc}
        image={recipe.hero_image}
        jsonLd={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Recipes", path: "/recipes" },
          { name: recipe.title, path: `/recipes/${slug}` },
        ])}
      />

      <section className="relative aspect-[16/9] max-h-[60vh] overflow-hidden bg-brand-parchment-soft">
        <img src={recipe.hero_image} alt={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(11, 8, 6,0.85))" }} />
        <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-6 lg:px-10 pb-10 text-brand-parchment">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">Recipe</p>
          <h1 className="text-h1 max-w-3xl leading-[1.05]">{recipe.title}</h1>
          {recipe.cook_time_min && (
            <p className="mt-4 inline-flex items-center gap-2 font-body text-brand-parchment/80">
              <Clock className="w-4 h-4 text-brand-gold" /> {recipe.cook_time_min} minutes
            </p>
          )}
        </div>
      </section>

      <section className="bg-brand-parchment">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16 grid md:grid-cols-5 gap-12">
          <aside className="md:col-span-2">
            <ScrollReveal>
              <h2 className="font-display text-h3 text-brand-obsidian">Ingredients</h2>
              <ul className="mt-6 space-y-3 font-body text-brand-husk/85">
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-gold mt-2.5" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
              {recipe.pairs_with_product && (
                <div className="mt-10 brand-card p-6" data-testid="recipe-pairs-with">
                  <p className="eyebrow text-brand-gold tracking-[0.3em] mb-2">Made with</p>
                  <h3 className="font-display text-xl text-brand-obsidian leading-tight">{recipe.pairs_with_product.name}</h3>
                  <p className="font-body text-xs text-ink-muted mt-2 line-clamp-2">{recipe.pairs_with_product.short_desc}</p>
                  <Button asChild variant="dark" size="sm" className="mt-5">
                    <Link to={`/products/${recipe.pairs_with_product.slug}`}>Shop this oil <ArrowRight /></Link>
                  </Button>
                </div>
              )}
            </ScrollReveal>
          </aside>

          <div className="md:col-span-3">
            <ScrollReveal>
              <h2 className="font-display text-h3 text-brand-obsidian">Method</h2>
              <ol className="mt-6 space-y-8">
                {recipe.steps?.map((step, i) => (
                  <li key={i} className="flex gap-5">
                    <span className="h-10 w-10 shrink-0 rounded-full bg-brand-obsidian text-brand-gold font-display text-lg flex items-center justify-center">{i + 1}</span>
                    <p className="font-body text-body-lg text-brand-husk/90 pt-1.5">{step}</p>
                  </li>
                ))}
              </ol>
            </ScrollReveal>

            <div className="mt-12 flex flex-wrap gap-2">
              {recipe.tags?.map((t) => (
                <Badge key={t} variant="outline" className="border-brand-gold/40 text-brand-husk font-body uppercase tracking-widest text-[10px]">
                  #{t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
