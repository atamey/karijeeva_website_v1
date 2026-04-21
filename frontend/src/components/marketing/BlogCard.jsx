import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BlogCard({ post, featured = false }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      data-testid={`blog-card-${post.slug}`}
      className={`group brand-card overflow-hidden flex ${featured ? "flex-col md:flex-row" : "flex-col"}`}
    >
      <div className={`${featured ? "md:w-1/2 aspect-[4/3] md:aspect-auto" : "aspect-[16/10]"} overflow-hidden bg-brand-parchment-soft`}>
        <img
          src={post.cover_image}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className={`p-6 ${featured ? "md:w-1/2 md:p-10" : ""} flex-1 flex flex-col`}>
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-brand-parchment-soft text-brand-obsidian border-0 font-body tracking-widest uppercase text-[10px]">
            {post.category}
          </Badge>
          <span className="inline-flex items-center gap-1 font-body text-xs text-ink-muted">
            <Clock className="w-3 h-3" /> {post.read_time_min} min read
          </span>
        </div>
        <h3 className={`${featured ? "text-h2" : "text-h4"} font-display text-brand-obsidian leading-tight mb-3`}>
          {post.title}
        </h3>
        <p className="font-body text-sm text-ink-muted line-clamp-3 flex-1">
          {post.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-body text-xs text-ink-muted">By {post.author}</span>
          <span className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold">
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}
