import { Link } from "react-router-dom";
import { Leaf, Sparkles, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import Seo, { breadcrumbLd } from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/marketing/ScrollReveal";
import PressStrip from "@/components/marketing/PressStrip";
import { useEffect, useState } from "react";
import { fetchSiteSettings } from "@/lib/api";

const TIMELINE = [
  { year: "Grove", title: "Coastal Karnataka", body: "Single-origin coconuts hand-picked within 48 hours of falling. One belt, three villages, five farmers." },
  { year: "Farm",  title: "De-husking by hand", body: "No mechanical stripping. Each nut cracked open by the women who've done it for decades." },
  { year: "Chekku",title: "Slow-press, <30°C",  body: "Wooden ghani mills. Stainless cold-press screws. No heat, no solvent, no compromise." },
  { year: "Bottle",title: "Food-grade glass",   body: "Every bottle sealed with a pressing date, not just an expiry. 72 hours from press to cap." },
  { year: "You",   title: "Your kitchen",       body: "3–7 day delivery across India. A bottle that remembers where it came from." },
];

const VALUES = [
  { icon: Leaf,       title: "One ingredient", body: "Nothing added. Nothing refined. Nothing hidden." },
  { icon: ShieldCheck,title: "Traceable batches", body: "Every bottle ties to a single 3-day press." },
  { icon: Sparkles,   title: "Small-batch",   body: "We press in litres, not tonnes." },
  { icon: Heart,      title: "Farmer-first",  body: "Direct payment. No middlemen. Ever." },
];

export default function About() {
  const [site, setSite] = useState(null);
  useEffect(() => { fetchSiteSettings().then(setSite).catch(() => {}); }, []);

  return (
    <>
      <Seo
        title="Our story — grove to bottle"
        description="Karijeeva is a single-origin, small-batch coconut oil brand out of coastal Karnataka. Here's the story behind the bottle — the farmers, the chekku mill, and the kitchens we started in."
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])}
      />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/a374c5e1d1a09d972282afa143cd93b70baab8ecf3acdc03183f7a4115e4cd69.jpeg"
          alt="Karijeeva farm at dawn"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11, 8, 6,0.3) 0%, rgba(11, 8, 6,0.85) 100%)" }} />
        <div className="relative max-w-7xl w-full mx-auto px-6 lg:px-10 py-24">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-4">Est. 2019 · Kadle Global</p>
          <h1 className="text-h1 text-brand-parchment max-w-3xl" data-testid="about-headline">
            The long life, <span className="gold-underline">bottled.</span>
          </h1>
          <p className="font-display text-xl sm:text-2xl text-brand-parchment/90 mt-6 max-w-3xl leading-snug" data-testid="about-vision">
            "{site?.vision_statement || "At Karijeeva, we envision a world where wellness is returned to its purest form."}"
          </p>
        </div>
      </section>

      {/* Story intro */}
      <section className="bg-brand-parchment">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-24 text-center">
          <ScrollReveal>
            <p className="eyebrow text-brand-gold tracking-[0.3em] mb-4">Why Karijeeva exists</p>
            <h2 className="text-h2 text-brand-obsidian leading-tight">
              Most oil in India now passes through a factory.
              <br />
              <span className="gold-underline">We thought that was a shame.</span>
            </h2>
            <p className="font-body text-body-lg text-brand-husk/85 mt-8 leading-relaxed">
              In 2019, three cousins from coastal Karnataka — two of us in tech, one still on the farm — began
              pressing coconut oil the way our grandmothers remembered it. No heat, no solvent, no refining, and
              no shortcut. One bottle turned into fifty. Fifty turned into a waiting list. Karijeeva is what that
              waiting list grew into.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-brand-parchment-soft border-y border-brand-gold/15" data-testid="about-timeline">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-24">
          <ScrollReveal>
            <p className="eyebrow text-brand-gold tracking-[0.3em] text-center mb-3">Grove to kitchen</p>
            <h2 className="text-h2 text-brand-obsidian text-center mb-16">Five steps. Zero shortcuts.</h2>
          </ScrollReveal>
          <ol className="space-y-10 relative">
            <div className="absolute left-5 top-3 bottom-3 w-px bg-brand-gold/40" aria-hidden="true" />
            {TIMELINE.map((step, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <li className="relative pl-16">
                  <div className="absolute left-0 top-0 h-11 w-11 rounded-full bg-brand-obsidian text-brand-gold font-display text-lg flex items-center justify-center border-4 border-brand-parchment-soft">
                    {i + 1}
                  </div>
                  <p className="eyebrow text-brand-gold tracking-[0.3em]">{step.year}</p>
                  <h3 className="text-h3 text-brand-obsidian mt-2">{step.title}</h3>
                  <p className="font-body text-body-lg text-brand-husk/80 mt-2">{step.body}</p>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <ScrollReveal>
            <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">The four things we refuse to compromise on</p>
            <h2 className="text-h2 text-brand-obsidian max-w-2xl">Our values.</h2>
          </ScrollReveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 90}>
                <div className="brand-card p-8">
                  <span className="h-12 w-12 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5">
                    <v.icon />
                  </span>
                  <h3 className="font-display text-xl text-brand-obsidian mt-5">{v.title}</h3>
                  <p className="font-body text-sm text-ink-muted mt-2">{v.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Press */}
      <PressStrip logos={site?.press_logos} />

      {/* CTA */}
      <section className="bg-brand-obsidian-soft">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20 text-center">
          <h2 className="text-h2 text-brand-parchment">Cook with us.</h2>
          <p className="font-body text-brand-parchment/70 mt-4 max-w-xl mx-auto">
            Three oils. One ingredient. Start with a bottle and a dosa.
          </p>
          <Button asChild variant="primary" size="lg" className="mt-10">
            <Link to="/products">Shop the oils <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}
