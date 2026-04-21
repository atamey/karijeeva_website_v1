import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Rating } from "@/components/ui/rating";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatApiError } from "@/lib/errors";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "5",   label: "5★" },
  { key: "4",   label: "4★" },
  { key: "photos", label: "With photos", disabled: true },
  { key: "verified", label: "Verified only" },
];

const SORTS = [
  { value: "helpful", label: "Most helpful" },
  { value: "newest",  label: "Newest" },
  { value: "high",    label: "Highest rated" },
  { value: "low",     label: "Lowest rated" },
];

function initials(name) {
  if (!name) return "K";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function displayName(name) {
  if (!name) return "Karijeeva Buyer";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export default function ReviewsBlock({ product, user, onSubmitted }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("helpful");
  const [form, setForm] = useState({ rating: 0, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);

  const reviews = product.reviews || [];

  const histogram = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
    const total = reviews.length || 0;
    const avg = total === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / total;
    return { counts, total, avg };
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (filter === "5") list = list.filter((r) => r.rating === 5);
    if (filter === "4") list = list.filter((r) => r.rating === 4);
    if (filter === "verified") list = list.filter((r) => r.is_verified_buyer);
    switch (sort) {
      case "newest":  list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")); break;
      case "high":    list.sort((a, b) => b.rating - a.rating || (b.created_at || "").localeCompare(a.created_at || "")); break;
      case "low":     list.sort((a, b) => a.rating - b.rating || (b.created_at || "").localeCompare(a.created_at || "")); break;
      default:        list.sort((a, b) => b.rating - a.rating || (b.created_at || "").localeCompare(a.created_at || "")); break;
    }
    return list;
  }, [reviews, filter, sort]);

  // Validation per Phase 4 brief
  const titleValid = form.title.length >= 4 && form.title.length <= 80;
  const bodyValid  = form.body.length  >= 20 && form.body.length  <= 1500;
  const ratingValid = form.rating >= 1 && form.rating <= 5;
  const canSubmit = titleValid && bodyValid && ratingValid;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) { toast.error("Please complete all fields"); return; }
    setSubmitting(true);
    try {
      await api.post("/reviews", {
        product_id: product.slug,
        rating: form.rating,
        title: form.title,
        body: form.body,
      });
      toast.success("Thank you — your review is being moderated.");
      setForm({ rating: 0, title: "", body: "" });
      onSubmitted?.();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Could not submit review"));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="brand-card p-8 border-0 bg-white max-w-4xl mx-auto" data-testid="reviews-block" id="reviews">
      {/* Summary */}
      <div className="grid md:grid-cols-[260px_1fr] gap-10 pb-8 border-b border-brand-gold/15">
        <div className="text-center md:text-left">
          <div className="font-display text-[64px] leading-none text-brand-obsidian" data-testid="reviews-avg">
            {histogram.avg.toFixed(1)}
          </div>
          <Rating value={histogram.avg} size={22} />
          <p className="font-body text-sm text-ink-muted mt-2">
            Based on {histogram.total} review{histogram.total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-2" data-testid="reviews-histogram">
          {[5, 4, 3, 2, 1].map((star) => {
            const c = histogram.counts[star] || 0;
            const pct = histogram.total === 0 ? 0 : Math.round((c / histogram.total) * 100);
            return (
              <div key={star} className="flex items-center gap-3 text-sm font-body">
                <span className="w-6 text-right text-brand-husk">{star}★</span>
                <div className="flex-1 h-2 bg-brand-parchment-soft/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gold transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                    data-testid={`reviews-hist-bar-${star}`}
                  />
                </div>
                <span className="w-14 text-right text-ink-muted tabular-nums">{pct}% ({c})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter chips + sort */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between" data-testid="reviews-controls">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              disabled={f.disabled}
              onClick={() => !f.disabled && setFilter(f.key)}
              data-testid={`reviews-filter-${f.key}`}
              className={cn(
                "px-3.5 h-8 rounded-pill font-body text-xs tracking-wider uppercase transition border",
                f.disabled
                  ? "border-brand-gold/15 text-ink-muted/50 cursor-not-allowed bg-brand-parchment-soft/30"
                  : filter === f.key
                    ? "bg-brand-obsidian text-brand-gold border-brand-obsidian"
                    : "bg-transparent text-brand-husk border-brand-gold/30 hover:border-brand-gold",
              )}
            >
              {f.label}
              {f.disabled && <span className="ml-2 text-[9px] text-brand-gold/70 normal-case tracking-normal">coming soon</span>}
            </button>
          ))}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-[200px] font-body text-sm border-brand-gold/30 bg-brand-parchment" data-testid="reviews-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => <SelectItem key={s.value} value={s.value} className="font-body text-sm">{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Review list */}
      <div className="mt-6 space-y-6" data-testid="reviews-list">
        {filtered.length === 0 ? (
          <p className="font-body text-ink-muted text-center py-10">
            {reviews.length === 0 ? "No written reviews yet. Be the first." : "No reviews match this filter."}
          </p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="pb-6 border-b border-brand-gold/10 last:border-b-0 flex gap-4" data-testid={`reviews-row-${r.id}`}>
              <div className="w-11 h-11 shrink-0 rounded-full bg-brand-obsidian text-brand-gold font-display text-sm flex items-center justify-center">
                {initials(r.user_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-display text-brand-obsidian">{displayName(r.user_name)}</span>
                  {r.is_verified_buyer && (
                    <Badge className="bg-brand-gold/15 text-brand-gold border-0 font-body tracking-widest uppercase text-[10px]">
                      <Check className="w-3 h-3" /> Verified buyer
                    </Badge>
                  )}
                  <span className="font-body text-xs text-ink-muted ml-auto">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </span>
                </div>
                <div className="mt-2"><Rating value={r.rating} size={14} /></div>
                {r.title && <p className="font-display text-lg text-brand-obsidian mt-2 leading-tight">{r.title}</p>}
                <p className="font-body text-sm text-brand-husk mt-2 leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit form */}
      <div className="mt-10 pt-8 border-t border-brand-gold/15">
        {!user ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="font-body text-sm text-ink-muted">Log in to write a review.</p>
            <Button asChild variant="secondary"><Link to="/login" state={{ from: `/products/${product.slug}` }}>Log in to review</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" data-testid="reviews-form">
            <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">Write a review</p>

            <div>
              <label className="font-body text-xs uppercase tracking-[0.2em] text-ink-muted block mb-2">Your rating</label>
              <Rating
                value={form.rating} interactive
                onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                size={26} data-testid="reviews-form-rating"
              />
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-[0.2em] text-ink-muted block mb-2">Headline</label>
              <Input
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={80} placeholder="e.g. Beautiful aroma, worth every rupee"
                className="h-11 bg-white border-brand-gold/30 font-body"
                data-testid="reviews-form-title"
              />
              <div className="mt-1 flex justify-between text-xs font-body text-ink-muted">
                <span className={cn(!titleValid && form.title.length > 0 && "text-brand-husk/70")}>
                  {form.title.length < 4 ? "Min 4 characters" : titleValid ? "Looking good" : "Max 80 characters"}
                </span>
                <span>{form.title.length}/80</span>
              </div>
            </div>

            <div>
              <label className="font-body text-xs uppercase tracking-[0.2em] text-ink-muted block mb-2">Your review</label>
              <Textarea
                rows={5} value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                maxLength={1500}
                placeholder="Aroma, how you cooked with it, how it felt on a cast-iron tawa…"
                className="bg-white border-brand-gold/30 font-body"
                data-testid="reviews-form-body"
              />
              <div className="mt-1 flex justify-between text-xs font-body text-ink-muted">
                <span>{form.body.length < 20 ? "Min 20 characters" : bodyValid ? "Looks great" : "Max 1500 characters"}</span>
                <span>{form.body.length}/1500</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" loading={submitting} disabled={!canSubmit} data-testid="reviews-form-submit">
                Submit review
              </Button>
              <p className="font-body text-xs text-ink-muted flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 opacity-50" /> Photo uploads coming soon
              </p>
            </div>
            <p className="font-body text-xs text-ink-muted">
              Only verified buyers of this product can post. Reviews are moderated before publishing.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
