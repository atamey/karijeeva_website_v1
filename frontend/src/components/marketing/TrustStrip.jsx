import { Leaf, Sparkles, ShieldCheck, Clock } from "lucide-react";

const ICONS = { Leaf, Sparkles, ShieldCheck, Clock };

const DEFAULT_ITEMS = [
  { icon: "Sparkles",    title: "Chekku / Wood-Pressed",  body: "Traditional extraction at <30°C." },
  { icon: "Leaf",        title: "0% Refined",             "body": "No heat, no bleach, no deodoriser." },
  { icon: "ShieldCheck", title: "FSSAI Certified",        "body": "Batch-tested, grove-traceable." },
  { icon: "Clock",       title: "Small-Batch",            "body": "3 days from grove to bottle." },
];

export default function TrustStrip({ items = DEFAULT_ITEMS }) {
  return (
    <section className="bg-brand-obsidian-soft border-y border-brand-gold/25" data-testid="trust-strip">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map((it, i) => {
          const Icon = ICONS[it.icon] || Leaf;
          return (
            <div key={i} className="flex items-start gap-4">
              <span className="h-12 w-12 shrink-0 inline-flex items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold [&_svg]:w-5 [&_svg]:h-5">
                <Icon />
              </span>
              <div>
                <div className="font-display text-xl text-brand-parchment leading-tight">{it.title}</div>
                <div className="font-body text-xs text-brand-parchment/60 mt-1">{it.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
