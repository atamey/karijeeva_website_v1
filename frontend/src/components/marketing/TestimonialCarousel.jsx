import { useState, useEffect } from "react";
import { Rating } from "@/components/ui/rating";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

export default function TestimonialCarousel({ testimonials = [] }) {
  const [idx, setIdx] = useState(0);
  const safe = testimonials.filter(Boolean);

  useEffect(() => {
    if (safe.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % safe.length), 7000);
    return () => clearInterval(id);
  }, [safe.length]);

  if (!safe.length) return null;
  const t = safe[idx];

  return (
    <section className="bg-brand-parchment-soft" data-testid="testimonials-carousel">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-24">
        <p className="eyebrow text-brand-gold tracking-[0.3em] text-center mb-8">
          From our kitchens
        </p>
        <div className="relative text-center" key={idx}>
          <Quote className="w-10 h-10 text-brand-gold/40 mx-auto mb-6" />
          <p className="font-display text-2xl sm:text-3xl lg:text-4xl text-brand-obsidian leading-relaxed fade-up">
            "{t.quote}"
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <img
              src={t.avatar_url}
              alt={t.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-brand-gold/40"
              loading="lazy"
            />
            <Rating value={t.rating} size={14} />
            <div>
              <div className="font-display text-lg text-brand-obsidian">{t.name}</div>
              <div className="font-body text-xs text-ink-muted uppercase tracking-[0.2em]">
                {t.role} · {t.location}
              </div>
            </div>
          </div>
        </div>

        {safe.length > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              aria-label="Previous testimonial"
              data-testid="testimonials-prev"
              onClick={() => setIdx((i) => (i - 1 + safe.length) % safe.length)}
              className="h-10 w-10 rounded-full border border-brand-gold/40 flex items-center justify-center text-brand-obsidian hover:bg-brand-gold hover:text-brand-parchment transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {safe.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-brand-gold" : "w-1.5 bg-brand-gold/30"}`}
                />
              ))}
            </div>
            <button
              aria-label="Next testimonial"
              data-testid="testimonials-next"
              onClick={() => setIdx((i) => (i + 1) % safe.length)}
              className="h-10 w-10 rounded-full border border-brand-gold/40 flex items-center justify-center text-brand-obsidian hover:bg-brand-gold hover:text-brand-parchment transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
