import { Link } from "react-router-dom";
import Seo, { breadcrumbLd } from "@/components/seo/Seo";

/**
 * EditorialShell — shared obsidian-hero → parchment-body layout for
 * brand content pages (The Farm, Cold-Press Process, Sustainability,
 * Press, Careers, Gift Cards, Subscribe & Save).
 *
 * Props:
 *   kicker    — small uppercase eyebrow (Inter Tight, wide tracking)
 *   title     — H1 (Fraunces display)
 *   subtitle  — H2 lede (upright Fraunces, never italic)
 *   heroImage — full-bleed hero image URL
 *   seoTitle, seoDescription, breadcrumb ([{name, path}])
 *   children  — body content (prose-styled)
 */
export default function EditorialShell({
  kicker,
  title,
  subtitle,
  heroImage,
  seoTitle,
  seoDescription,
  breadcrumb = [],
  children,
  testid,
}) {
  return (
    <>
      <Seo
        title={seoTitle || title}
        description={seoDescription}
        image={heroImage}
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, ...breadcrumb])}
      />

      {/* Obsidian hero */}
      <section
        className="relative bg-brand-obsidian text-brand-parchment overflow-hidden"
        data-testid={testid}
      >
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-obsidian via-brand-obsidian/70 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
          {kicker && (
            <p className="eyebrow text-brand-gold tracking-[0.3em] mb-5">
              {kicker}
            </p>
          )}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-parchment leading-tight max-w-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="font-display text-brand-parchment/80 text-lg sm:text-xl mt-6 max-w-2xl">
              {subtitle}
            </p>
          )}

          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <nav className="mt-12 flex flex-wrap gap-2 items-center text-xs font-body tracking-widest uppercase text-brand-parchment/50">
              <Link to="/" className="hover:text-brand-gold">Home</Link>
              {breadcrumb.map((b, i) => (
                <span key={b.path} className="flex items-center gap-2">
                  <span className="text-brand-gold/60">/</span>
                  {i === breadcrumb.length - 1 ? (
                    <span className="text-brand-gold">{b.name}</span>
                  ) : (
                    <Link to={b.path} className="hover:text-brand-gold">{b.name}</Link>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>
      </section>

      {/* Parchment body */}
      <section className="bg-brand-parchment">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
          <article className="prose-editorial font-body text-brand-husk text-body-lg leading-relaxed space-y-7">
            {children}
          </article>
        </div>
      </section>
    </>
  );
}

/** Gold hairline divider used between sections in editorial/legal pages. */
export const GoldRule = () => (
  <hr className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
);

/** Section heading used inside prose-editorial. */
export const EditorialH2 = ({ children, id }) => (
  <h2
    id={id}
    className="font-display text-3xl sm:text-4xl text-brand-obsidian mt-10 mb-4 scroll-mt-28"
  >
    {children}
  </h2>
);

export const EditorialH3 = ({ children, id }) => (
  <h3
    id={id}
    className="font-display text-xl sm:text-2xl text-brand-obsidian mt-8 mb-3 scroll-mt-28"
  >
    {children}
  </h3>
);
