import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";
import Seo, { breadcrumbLd, faqLd } from "@/components/seo/Seo";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useSiteSettings, pick } from "@/lib/siteSettings";

const CATEGORY_ORDER = [
  ["product", "Product"],
  ["orders", "Orders &amp; Shipping"],
  ["shipping", "Orders &amp; Shipping"],
  ["returns", "Returns"],
  ["subscriptions", "Subscriptions"],
  ["ingredients", "Ingredients &amp; Safety"],
  ["wellness", "Ingredients &amp; Safety"],
  ["cooking", "Ingredients &amp; Safety"],
  ["account", "Account &amp; Security"],
];

function groupLabel(key) {
  const m = CATEGORY_ORDER.find(([k]) => k === key);
  return m ? m[1] : (key || "General");
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState([]);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const settings = useSiteSettings();
  const supportEmail = pick(settings, "support_email");

  useEffect(() => {
    api.get("/faqs").then((r) => setFaqs(r.data?.faqs || [])).catch(() => setFaqs([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) =>
        (f.question || "").toLowerCase().includes(q) ||
        (f.answer || "").toLowerCase().includes(q) ||
        (f.category || "").toLowerCase().includes(q),
    );
  }, [faqs, query]);

  const groups = useMemo(() => {
    const g = new Map();
    for (const f of filtered) {
      const label = groupLabel(f.category);
      if (!g.has(label)) g.set(label, []);
      g.get(label).push(f);
    }
    // Preserve CATEGORY_ORDER ordering, with unknown groups at the end
    const ordered = [];
    const seen = new Set();
    for (const [, label] of CATEGORY_ORDER) {
      if (g.has(label) && !seen.has(label)) {
        ordered.push([label, g.get(label)]);
        seen.add(label);
      }
    }
    for (const [label, arr] of g) {
      if (!seen.has(label)) ordered.push([label, arr]);
    }
    return ordered;
  }, [filtered]);

  return (
    <>
      <Seo
        title="Frequently Asked Questions"
        description="Everything you wanted to know about Karijeeva cold-pressed coconut oil — product, orders, shipping, returns, subscriptions, account, and safety."
        jsonLd={[
          breadcrumbLd([{ name: "Home", path: "/" }, { name: "FAQs", path: "/faqs" }]),
          ...(filtered.length ? [faqLd(filtered)] : []),
        ]}
      />

      <section className="bg-brand-obsidian text-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-24" data-testid="page-faqs">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-4">Help centre</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-parchment max-w-4xl">
            Frequently Asked Questions
          </h1>
          <p className="font-display text-brand-parchment/80 text-lg sm:text-xl mt-6 max-w-2xl">
            {faqs.length} questions, honest answers. Can't find yours?
            <Link to="/contact" className="underline decoration-brand-gold/50 underline-offset-4 ml-1 hover:decoration-brand-gold">Write to us</Link>.
          </p>

          <div className="mt-10 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-parchment/60" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              data-testid="faq-search"
              className="pl-11 h-12 bg-brand-parchment/10 border-brand-gold/30 text-brand-parchment placeholder:text-brand-parchment/55 focus-visible:ring-brand-gold focus-visible:border-brand-gold rounded-pill"
            />
          </div>
        </div>
      </section>

      <section className="bg-brand-parchment">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-16 space-y-12">
          {groups.length === 0 && (
            <p className="font-body text-brand-husk">
              No questions match &ldquo;{query}&rdquo;. <button onClick={() => setQuery("")} className="underline hover:text-brand-gold">Clear search</button>.
            </p>
          )}
          {groups.map(([label, items]) => (
            <div key={label}>
              <h2 className="font-display text-2xl text-brand-obsidian mb-5" dangerouslySetInnerHTML={{ __html: label }} />
              <ul className="divide-y divide-brand-gold/20 border-t border-b border-brand-gold/20">
                {items.map((f) => {
                  const open = openId === f.id;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : f.id)}
                        className="w-full text-left py-5 flex items-start gap-4 group"
                        aria-expanded={open}
                        data-testid={`faq-q-${f.id}`}
                      >
                        <span className="flex-1 font-display text-lg text-brand-obsidian leading-snug group-hover:text-brand-gold transition-colors">
                          {f.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-brand-gold shrink-0 mt-1 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <div className="pb-5 pr-10 font-body text-brand-husk leading-relaxed">
                          {f.answer}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="pt-8 text-sm text-brand-husk/75 font-body">
            Still need help? Write to{" "}
            <a className="underline hover:text-brand-gold" href={`mailto:${supportEmail}`} data-testid="faq-support-email">
              {supportEmail}
            </a>{" "}
            or hit the <Link to="/contact" className="underline hover:text-brand-gold">contact form</Link>.
          </div>
        </div>
      </section>
    </>
  );
}
