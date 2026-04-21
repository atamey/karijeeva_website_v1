import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";

export default function RecipeCard({ recipe, className="" }) {
  return (
    <Link
      to={`/recipes/${recipe.slug}`}
      data-testid={`recipe-card-${recipe.slug}`}
      className={`group brand-card overflow-hidden flex flex-col ${className}`}
    >
      <div className="aspect-[4/3] overflow-hidden bg-brand-parchment-soft">
        <img
          src={recipe.hero_image}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        {recipe.cook_time_min && (
          <div className="flex items-center gap-1 text-brand-gold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-body text-xs tracking-widest uppercase">
              {recipe.cook_time_min} min
            </span>
          </div>
        )}
        <h3 className="font-display text-h4 text-brand-obsidian leading-tight mb-2">
          {recipe.title}
        </h3>
        <p className="font-body text-sm text-ink-muted line-clamp-2 flex-1">
          {recipe.short_desc}
        </p>
        <span className="mt-4 font-body text-xs tracking-[0.2em] uppercase text-brand-gold inline-flex items-center gap-1">
          Cook this <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
