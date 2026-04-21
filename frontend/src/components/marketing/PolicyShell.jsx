import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Seo, { breadcrumbLd } from "@/components/seo/Seo";

/**
 * PolicyShell — shared layout for long-form legal pages (Privacy, Terms,
 * Shipping, Returns, Cookie). Obsidian hero + parchment body, sticky
 * TOC on desktop, gold-rule dividers between sections.
 *
 * sections: [{ id, title, body (ReactNode) }]
 */
export default function PolicyShell({
  seoTitle,
  seoDescription,
  title,
  kicker = "Policy",
  lastUpdated,
  breadcrumb = [],
  sections = [],
  footerNote,
  testid,
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  return (
    <>
      <Seo
        title={seoTitle || title}
        description={seoDescription}
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, ...breadcrumb])}
      />

      <section className="bg-brand-obsidian text-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-24" data-testid={testid}>
          <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">
            {kicker}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-parchment max-w-4xl">
            {title}
          </h1>
          {lastUpdated && (
            <p className="font-body text-xs tracking-[0.2em] uppercase text-brand-parchment/55 mt-6">
              Last updated · {lastUpdated}
            </p>
          )}
        </div>
      </section>

      <section className="bg-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20 grid lg:grid-cols-[240px_1fr] gap-12 lg:gap-20">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="font-body text-xs tracking-[0.25em] uppercase text-brand-gold mb-4">
                In this policy
              </p>
              <ul className="space-y-2">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`font-body text-sm leading-snug transition-colors ${
                        activeId === s.id
                          ? "text-brand-obsidian font-semibold"
                          : "text-brand-husk/70 hover:text-brand-obsidian"
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Body */}
          <article className="max-w-[65ch] font-body text-brand-husk leading-relaxed space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="font-display text-2xl sm:text-3xl text-brand-obsidian mb-4">
                  {i + 1}. {s.title}
                </h2>
                <div className="space-y-4 text-brand-husk">{s.body}</div>
                {i < sections.length - 1 && (
                  <hr className="mt-10 border-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
                )}
              </section>
            ))}

            {footerNote && (
              <p className="mt-12 pt-8 border-t border-brand-gold/25 font-accent italic text-sm text-brand-husk/75">
                {footerNote}
              </p>
            )}

            <p className="text-xs uppercase tracking-[0.25em] text-brand-gold pt-2">
              <Link to="/contact" className="hover:underline">Questions? Write to us →</Link>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
