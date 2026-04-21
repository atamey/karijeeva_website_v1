import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, VolumeX, Volume2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Seo, { orgLd, websiteLd } from "@/components/seo/Seo";
import { fetchProducts, fetchTestimonials, fetchSiteSettings, fetchBlogList } from "@/lib/api";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/marketing/ProductCard";
import NewsletterSection from "@/components/marketing/NewsletterSection";

gsap.registerPlugin(ScrollTrigger);

const BEATS = [
  {
    img: "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/80a00fdb196e495bd1c7355e2a12c8808785fd9bd0c6d4ca20160d88d3c4ecf8.jpeg",
    alt: "A single whole coconut suspended in amber light against obsidian backdrop.",
    headline: "Where wellness begins.",
    sub: "A single coconut. A single grove. A single truth.",
    pillar: "Premium",
  },
  {
    img: "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/b24302e0f7634178f2632684fb8d9aed5ba2c723a5f95bb48e60c9542ac4dbca.jpeg",
    alt: "Farmer's weathered hands holding freshly picked coconuts from the grove.",
    headline: "Handpicked.",
    sub: "From our groves, by our hands.",
    pillar: "Handpicked",
  },
  {
    img: "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/41e50f834525e8011e812ace07c541f67a37611d1ef2b68f51ec77d56a68fcb6.jpeg",
    alt: "A coconut cracked open, white flesh catching soft light.",
    headline: "Broken open.",
    sub: "Nothing hidden. Nothing added.",
    pillar: "Transparency",
  },
  {
    img: "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/506acf20706a94344622cd79318326483ecc57c55be7ea43d95159af4d39ae7b.jpeg",
    alt: "Traditional wooden chekku mill slowly pressing coconuts into oil.",
    headline: "Pressed cold. Pressed patient.",
    sub: "No heat. No haste. No compromise.",
    pillar: "Cold-Pressed",
  },
  {
    img: "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/8bf15d897c9f16fadcf42ef00a5e1070ab6d170c354bb9265335cf4778d2c452.jpeg",
    alt: "A sealed amber bottle of coconut oil resting beside fresh curry leaves.",
    headline: "Clean. Sealed. Unadulterated.",
    sub: "Sealed at source. Unbroken to your kitchen.",
    pillar: "No Adulteration",
  },
  {
    img: "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/0c66dcac72f2dffdbbd624915e25ebb9c3a77c59018e0fd21c11d7075307de80.jpeg",
    alt: "Liquid gold coconut oil streaming into a glass bottle against deep black.",
    headline: "Pure. Liquid gold.",
    sub: "This is Karijeeva.",
    pillar: "Reveal",
    cta: true,
  },
];

// Split H1 into letter spans for the letter-bloom reveal
function LetterBloom({ text, active, delay = 0 }) {
  return (
    <span className="letter-bloom" aria-label={text}>
      {[...text].map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={ch === " " ? "sp" : ""}
          style={{
            animationDelay: active ? `${delay + i * 25}ms` : "0ms",
            animationPlayState: active ? "running" : "paused",
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

function DustField() {
  const particles = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((i) => (
        <span
          key={i}
          className="dust-particle"
          style={{
            left: `${(i * 7 + 5) % 95}%`,
            top: `${(i * 11 + 25) % 80}%`,
            "--dx": `${(i % 2 ? 1 : -1) * ((i * 9) % 120 + 30)}px`,
            "--dy": `${-80 - (i * 13) % 160}px`,
            "--dur": `${14 + (i * 3) % 22}s`,
            animationDelay: `${(i * 1.3) % 10}s`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
          }}
        />
      ))}
    </div>
  );
}

function ScrollFilm({ activeBeat, setActiveBeat }) {
  const filmRef = useRef(null);
  const [reducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [mobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useLayoutEffect(() => {
    if (reducedMotion || mobile) return;
    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray(".beat-layer");
      // Pin for total 100vh * beats scroll distance
      ScrollTrigger.create({
        trigger: filmRef.current,
        start: "top top",
        end: `+=${BEATS.length * 100}%`,
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const idx = Math.min(BEATS.length - 1, Math.floor(self.progress * BEATS.length));
          setActiveBeat(idx);
        },
      });

      layers.forEach((layer, i) => {
        // Cross-fade per beat
        gsap.fromTo(layer,
          { opacity: 0, scale: 1.05, x: 20 },
          {
            opacity: 1, scale: 1, x: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: filmRef.current,
              start: `top+=${(i) * window.innerHeight} top`,
              end:   `top+=${(i + 0.5) * window.innerHeight} top`,
              scrub: 0.8,
            },
          }
        );
        if (i < layers.length - 1) {
          gsap.to(layer, {
            opacity: 0, filter: "brightness(0.55)",
            ease: "power2.in",
            scrollTrigger: {
              trigger: filmRef.current,
              start: `top+=${(i + 0.7) * window.innerHeight} top`,
              end:   `top+=${(i + 1) * window.innerHeight} top`,
              scrub: 0.6,
            },
          });
        }
      });
    }, filmRef);
    return () => ctx.revert();
  }, [reducedMotion, mobile, setActiveBeat]);

  // MOBILE: scroll-snap fallback
  if (mobile || reducedMotion) {
    return (
      <div
        className="w-full"
        style={reducedMotion ? {} : { scrollSnapType: "y mandatory" }}
        data-testid="film-fallback"
      >
        {BEATS.map((b, i) => (
          <section
            key={i}
            className="relative min-h-screen overflow-hidden bg-brand-obsidian flex items-end"
            style={reducedMotion ? {} : { scrollSnapAlign: "start" }}
            data-testid={`beat-${i + 1}`}
          >
            <img src={b.img} alt={b.alt} loading={i === 0 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-obsidian via-brand-obsidian/60 to-transparent" />
            <div className="relative z-10 max-w-4xl mx-auto px-6 pb-24 pt-32 w-full">
              <p className="eyebrow text-brand-gold tracking-[0.35em] mb-5">
                {b.pillar}
              </p>
              <h2 className="font-display text-[2.4rem] leading-[1.05] text-brand-bone" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}>
                {b.headline}
              </h2>
              <p className="font-display text-brand-bone/80 text-lg mt-4">{b.sub}</p>
              {b.cta && (
                <Button asChild variant="primary" size="lg" className="mt-8">
                  <Link to="/products" data-testid="film-cta">Discover the oils <ArrowRight /></Link>
                </Button>
              )}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div ref={filmRef} className="relative h-screen w-full overflow-hidden bg-brand-obsidian" data-testid="film-desktop">
      {/* Pinned full-bleed image layers */}
      <div className="absolute inset-0">
        {BEATS.map((b, i) => (
          <div
            key={i}
            className="beat-layer absolute inset-0 will-change-[opacity,transform]"
            data-testid={`beat-layer-${i + 1}`}
            aria-hidden={activeBeat !== i}
          >
            <img
              src={b.img}
              alt={b.alt}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-obsidian via-brand-obsidian/50 to-brand-obsidian/20" />
          </div>
        ))}
      </div>

      <DustField />

      {/* Foreground copy — swaps per activeBeat */}
      <div className="relative z-10 h-full max-w-6xl mx-auto px-6 lg:px-10 flex flex-col justify-end pb-24">
        <div key={activeBeat} className="animate-[fadeUp_700ms_cubic-bezier(.22,.61,.36,1)_both]">
          <p className="eyebrow text-brand-gold text-[11px] sm:text-xs tracking-[0.4em] mb-6" data-testid={`beat-pillar-${activeBeat + 1}`}>
            Act {activeBeat + 1} · {BEATS[activeBeat].pillar}
          </p>
          <h2
            className="font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[1.02] text-brand-bone tracking-[-0.02em]"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0, 'WONK' 0" }}
            data-testid={`beat-headline-${activeBeat + 1}`}
          >
            <LetterBloom text={BEATS[activeBeat].headline} active delay={120} />
          </h2>
          <p className="font-display text-brand-bone/85 text-lg sm:text-xl mt-5 max-w-xl">
            {BEATS[activeBeat].sub}
          </p>
          {BEATS[activeBeat].cta && (
            <div className="mt-8">
              <Button asChild variant="primary" size="lg" data-testid="film-cta">
                <Link to="/products">Discover the oils <ArrowRight /></Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Beat dots */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3" aria-hidden="true">
        {BEATS.map((_, i) => (
          <span
            key={i}
            className={`block w-[2px] transition-all duration-500 ${
              i === activeBeat ? "h-10 bg-brand-gold" : "h-4 bg-brand-bone/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

const NON_NEGOTIABLES = [
  { num: "I",   label: "Premium",         line: "Only the top quality coconuts enter the press — graded by hand, every batch." },
  { num: "II",  label: "Handpicked",      line: "From farms we know by name. No middlemen, no shortcuts, no surprises." },
  { num: "III", label: "Cold-Pressed",    line: "Slow traditional pressing below 40°C protects aroma, lauric acid, and soul." },
  { num: "IV",  label: "Clean & Hygienic",line: "Food-grade facility. Stainless steel. Nothing touches the oil but glass and us." },
  { num: "V",   label: "No Adulteration", line: "Single-ingredient. Always. If it isn't coconut, it doesn't belong in the bottle." },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [blog, setBlog] = useState([]);
  const [site, setSite] = useState(null);
  const [activeBeat, setActiveBeat] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchProducts({ featured: true }),
      fetchTestimonials(),
      fetchBlogList(),
      fetchSiteSettings(),
    ]).then(([p, t, b, s]) => {
      setProducts(p.products || []);
      setTestimonials(t.testimonials || []);
      setBlog(b.posts?.slice(0, 3) || []);
      setSite(s || {});
    }).catch(() => {});
  }, []);

  return (
    <>
      <Seo
        title="Liquid Gold. Pressed Cold."
        description="Karijeeva — small-batch cold-pressed coconut oil from Karnataka. Single-ingredient, handpicked, unadulterated. Liquid gold in every bottle."
        image={site?.hero_image}
        jsonLd={[orgLd(), websiteLd()]}
      />

      {/* Skip intro */}
      <a href="#after-film" className="skip-to-content" data-testid="skip-intro">Skip introduction</a>

      {/* THE FILM */}
      <ScrollFilm activeBeat={activeBeat} setActiveBeat={setActiveBeat} />

      <div id="after-film" />

      {/* BESTSELLERS — dark magazine spread */}
      <section className="bg-brand-obsidian py-28" data-testid="home-bestsellers">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
            <div>
              <p className="eyebrow text-brand-gold tracking-[0.35em] mb-4">
                The grove's finest
              </p>
              <h2 className="font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.05] text-brand-bone max-w-2xl"
                  style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}>
                Three oils, <span className="gold-underline text-brand-gold">one promise.</span>
              </h2>
            </div>
            <Button asChild variant="secondary" size="md" className="!border-brand-gold !text-brand-gold hover:!bg-brand-gold hover:!text-brand-obsidian">
              <Link to="/products">View all <ArrowRight /></Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </div>
      </section>

      {/* VISION — parchment editorial break */}
      <section className="bg-brand-parchment py-32" data-testid="home-vision">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="h-px w-24 bg-brand-gold mx-auto mb-10" />
          <p className="eyebrow text-brand-gold tracking-[0.35em] mb-6">Our vision</p>
          <p className="font-display text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.5] text-brand-ink max-w-[38ch] mx-auto">
            {site?.vision_statement || "To return coconut oil to what it always was — a single ingredient, pressed slow, bottled clean, shipped close. Nothing more."}
          </p>
          <div className="h-px w-24 bg-brand-gold mx-auto mt-10" />
        </div>
      </section>

      {/* 5 NON-NEGOTIABLES — ritual list on obsidian */}
      <section className="bg-brand-obsidian py-28" data-testid="home-pillars">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <p className="eyebrow text-brand-gold tracking-[0.35em] mb-5">Our five non-negotiables</p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-brand-bone max-w-2xl mb-16"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}>
            What we will <span className="gold-underline text-brand-gold">never compromise.</span>
          </h2>
          <ol className="divide-y divide-brand-gold/15 border-y border-brand-gold/15">
            {NON_NEGOTIABLES.map((it, i) => (
              <li key={it.num} className="py-8 grid grid-cols-[60px_1fr] md:grid-cols-[80px_220px_1fr] gap-4 md:gap-10 items-start" data-testid={`pillar-${i + 1}`}>
                <span className="font-display text-brand-gold text-3xl md:text-4xl" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}>{it.num}</span>
                <p className="font-display text-brand-bone text-lg md:text-2xl">{it.label}</p>
                <p className="font-body text-brand-bone/75 text-sm md:text-base leading-relaxed col-span-2 md:col-span-1">{it.line}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* REVIEWS — parchment */}
      {testimonials.length > 0 && (
        <section className="bg-brand-parchment py-28" data-testid="home-reviews">
          <div className="max-w-6xl mx-auto px-6 lg:px-10">
            <p className="eyebrow text-brand-gold-deep tracking-[0.35em] mb-3">From those who live with us</p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] text-brand-ink mb-12 max-w-2xl"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}>
              Written in kitchens, <span className="gold-underline">not studios.</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.slice(0, 3).map((r, i) => (
                <figure key={i} className="bg-white/60 border border-brand-gold/20 rounded-lg p-7">
                  <span aria-hidden="true" className="block w-10 h-px bg-brand-gold/60 mb-4" />
                  <blockquote className="font-display text-brand-ink text-lg leading-[1.55]">
                    {r.quote || r.body || r.text}
                  </blockquote>
                  <figcaption className="mt-5 font-body text-xs tracking-widest uppercase text-brand-husk">
                    {r.author || r.user_name || "Karijeeva buyer"}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BLOG PREVIEW */}
      {blog.length > 0 && (
        <section className="bg-brand-obsidian py-28" data-testid="home-blog">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
              <div>
                <p className="eyebrow text-brand-gold tracking-[0.35em] mb-3">The journal</p>
                <h2 className="font-display text-[clamp(2rem,4.5vw,3rem)] text-brand-bone"
                    style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}>
                  Stories from the grove.
                </h2>
              </div>
              <Button asChild variant="secondary" size="md" className="!border-brand-gold !text-brand-gold hover:!bg-brand-gold hover:!text-brand-obsidian">
                <Link to="/blog">Read all <ArrowRight /></Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {blog.map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.slug} className="group block">
                  <div className="aspect-[4/3] overflow-hidden border border-brand-gold/20 rounded-lg bg-brand-obsidian-soft">
                    <img src={post.cover_image || post.image} alt={post.title} loading="lazy" decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <p className="eyebrow text-brand-gold text-[11px] tracking-[0.3em] mt-5">{post.category || "Journal"}</p>
                  <h3 className="font-display text-xl text-brand-bone mt-2 group-hover:text-brand-gold transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      <NewsletterSection />
    </>
  );
}
