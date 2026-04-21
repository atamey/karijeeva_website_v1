import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Gold 5-star rating display.
 * - Read-only display (value 0..max).
 * - Optional `onChange(newValue)` makes it interactive.
 */
export function Rating({ value = 0, max = 5, size = 18, interactive = false, onChange, className, ...props }) {
  const stars = Array.from({ length: max });
  return (
    <div
      role={interactive ? "radiogroup" : "img"}
      aria-label={`Rating: ${value} out of ${max}`}
      className={cn("inline-flex items-center gap-1", className)}
      data-testid="brand-rating"
      {...props}
    >
      {stars.map((_, i) => {
        const filled = i < Math.round(value);
        const Icon = (
          <Star
            width={size}
            height={size}
            className={cn(
              "transition-colors",
              filled ? "fill-brand-gold text-brand-gold" : "fill-transparent text-brand-gold/40"
            )}
            strokeWidth={1.5}
          />
        );
        return interactive ? (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={filled}
            onClick={() => onChange?.(i + 1)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded"
          >
            {Icon}
          </button>
        ) : (
          <span key={i}>{Icon}</span>
        );
      })}
    </div>
  );
}
