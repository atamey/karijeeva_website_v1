import { useEffect, useState } from "react";
import Seo, { breadcrumbLd } from "@/components/seo/Seo";
import { fetchRecipes } from "@/lib/api";
import RecipeCard from "@/components/marketing/RecipeCard";
import ScrollReveal from "@/components/marketing/ScrollReveal";

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  useEffect(() => { fetchRecipes().then((d) => setRecipes(d.recipes || [])); }, []);

  return (
    <>
      <Seo
        title="Recipes from our kitchen"
        description="Six recipes your grandmother probably made — each built around a single bottle of Karijeeva cold-pressed coconut oil. Dosa, avial, chutney, thenga sadam, beef fry, and coconut barfi."
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Recipes", path: "/recipes" }])}
      />
      <section className="bg-brand-parchment-soft border-b border-brand-gold/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
          <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase mb-3">In the kitchen</p>
          <h1 className="text-h1 text-brand-obsidian">Recipes from our <span className="gold-underline">grandmothers.</span></h1>
          <p className="font-body text-body-lg text-ink-muted mt-5 max-w-2xl">
            Dosa at dawn, avial on Onam, a quiet coconut barfi on a Sunday. Cook with the bottle.
          </p>
        </div>
      </section>
      <section className="bg-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="recipes-grid">
            {recipes.map((r, i) => (
              <ScrollReveal key={r.slug} delay={i * 80}>
                <RecipeCard recipe={r} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
