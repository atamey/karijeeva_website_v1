import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Seo from "@/components/seo/Seo";

const SWATCHES = [
  { key: "obsidian",       hex: "#0B0806", text: "bone"     },
  { key: "obsidian-soft",  hex: "#141009", text: "bone"     },
  { key: "parchment",      hex: "#F4ECDB", text: "ink"      },
  { key: "parchment-soft", hex: "#EBE1CC", text: "ink"      },
  { key: "gold",           hex: "#E8A84A", text: "obsidian" },
  { key: "gold-deep",      hex: "#B3802F", text: "bone"     },
  { key: "bone",           hex: "#ECE6D6", text: "ink"      },
  { key: "husk",           hex: "#3A2418", text: "bone"     },
  { key: "ink",            hex: "#14100B", text: "bone"     },
];

export default function DesignSystem() {
  return (
    <>
      <Seo title="Design system · Liquid Gold Noir" description="Karijeeva brand tokens, typography, components." />
      <section className="bg-brand-obsidian text-brand-bone min-h-screen">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-24">
          <p className="font-accent italic text-brand-gold text-xs tracking-[0.35em] uppercase">Liquid Gold Noir</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] text-brand-bone mt-4" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}>
            Design system
          </h1>
          <p className="font-body text-brand-bone/75 text-lg max-w-2xl mt-5 leading-relaxed">
            A rebrand for what comes next — obsidian, parchment, and liquid gold. Single accent, editorial rhythm, ritual restraint.
          </p>

          {/* Palette */}
          <div className="mt-20">
            <p className="font-accent italic text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">Palette</p>
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="ds-palette">
              {SWATCHES.map((s) => (
                <div key={s.key} className="rounded-lg overflow-hidden border border-brand-gold/20">
                  <div className="aspect-[4/3] flex items-end p-4" style={{ background: s.hex, color: s.text === "ink" ? "#14100B" : "#ECE6D6" }}>
                    <div className="font-body text-[10px] uppercase tracking-[0.22em] opacity-80">brand-{s.key}</div>
                  </div>
                  <div className="bg-brand-obsidian-soft px-3 py-2 font-mono text-xs text-brand-bone/70">{s.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="mt-24">
            <p className="font-accent italic text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">Typography</p>
            <div className="space-y-8" data-testid="ds-typography">
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.22em] text-brand-gold mb-2">Display · Fraunces (variable axes opsz 144 · SOFT 100)</p>
                <p className="font-display text-[clamp(3rem,7vw,5.5rem)] text-brand-bone leading-[1.02]" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 0" }}>
                  Pressed cold. Pressed patient.
                </p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.22em] text-brand-gold mb-2">Accent · Instrument Serif italic</p>
                <p className="font-accent italic text-brand-bone/90 text-2xl leading-[1.5] max-w-[42ch]">
                  Nothing more than a coconut, a slow press, and a sealed bottle.
                </p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.22em] text-brand-gold mb-2">Body · Inter Tight</p>
                <p className="font-body text-brand-bone/80 text-base leading-[1.7] max-w-[62ch]">
                  The body face is Inter Tight — a narrower, more editorial cut of Inter. Paired with Fraunces for headlines and Instrument Serif for pull-quotes, it gives us the restrained, magazine-grade voice the brand deserves.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-24">
            <p className="font-accent italic text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">Buttons</p>
            <div className="flex flex-wrap gap-4 items-center" data-testid="ds-buttons">
              <Button variant="primary" size="lg">Primary</Button>
              <Button variant="secondary" size="lg">Secondary</Button>
              <Button variant="ghost" size="lg">Ghost</Button>
              <Button variant="dark" size="lg">Dark</Button>
            </div>
          </div>

          {/* Pillar pattern */}
          <div className="mt-24">
            <p className="font-accent italic text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">Non-negotiables pattern</p>
            <ol className="divide-y divide-brand-gold/15 border-y border-brand-gold/15 max-w-3xl" data-testid="ds-pillars">
              {["Premium","Handpicked","Cold-Pressed","Clean & Hygienic","No Adulteration"].map((label, i) => (
                <li key={label} className="py-6 grid grid-cols-[60px_1fr] gap-6 items-baseline">
                  <span className="font-display text-brand-gold text-3xl" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80" }}>{["I","II","III","IV","V"][i]}</span>
                  <p className="font-display text-brand-bone text-xl">{label}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Film beat preview */}
          <div className="mt-24">
            <p className="font-accent italic text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">Scroll film beat</p>
            <div className="relative aspect-[21/9] overflow-hidden rounded-lg border border-brand-gold/25" data-testid="ds-beat">
              <img src="https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/506acf20706a94344622cd79318326483ecc57c55be7ea43d95159af4d39ae7b.jpeg"
                   alt="Traditional wooden chekku mill"
                   className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-obsidian via-brand-obsidian/50 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="font-accent italic text-brand-gold text-[11px] tracking-[0.4em] uppercase mb-3">Act 4 · Cold-Pressed</p>
                <h3 className="font-display text-[clamp(1.8rem,4vw,3rem)] text-brand-bone leading-[1.05]" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}>
                  Pressed cold. Pressed patient.
                </h3>
                <p className="font-accent italic text-brand-bone/80 mt-2">No heat. No haste. No compromise.</p>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <Button asChild variant="primary"><Link to="/">See the full film on Home →</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
