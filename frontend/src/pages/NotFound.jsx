import { Link } from "react-router-dom";
import { Home, ArrowRight } from "lucide-react";
import Seo from "@/components/seo/Seo";

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" description="The page you are looking for doesn't exist. Discover our oils and stories instead." />
      <section className="min-h-[60vh] bg-brand-parchment flex items-center" data-testid="not-found-page">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">404</p>
          <h1 className="font-display text-5xl sm:text-6xl text-brand-obsidian mt-3 leading-tight">This page is off the shelf.</h1>
          <p className="font-body text-brand-husk mt-5 leading-relaxed">
            We couldn't find what you're looking for. Perhaps a cold-pressed oil, a recipe, or the story behind our craft will tempt you instead.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-pill bg-brand-obsidian text-brand-gold font-body text-xs tracking-widest uppercase hover:bg-brand-obsidian-soft" data-testid="notfound-home">
              <Home className="w-4 h-4" /> Back home
            </Link>
            <Link to="/products" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-pill border border-brand-gold/40 text-brand-obsidian hover:bg-brand-gold/10 font-body text-xs tracking-widest uppercase" data-testid="notfound-shop">
              Discover our oils <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
