import { Link } from "react-router-dom";
import { Mail, Sparkles } from "lucide-react";
import EditorialShell, { EditorialH2, EditorialH3, GoldRule } from "@/components/marketing/EditorialShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { useSiteSettings, pick } from "@/lib/siteSettings";
import { api, postContact } from "@/lib/api";

const IMG_FARM = "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/a374c5e1d1a09d972282afa143cd93b70baab8ecf3acdc03183f7a4115e4cd69.jpeg";
const IMG_PRESS = "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/506acf20706a94344622cd79318326483ecc57c55be7ea43d95159af4d39ae7b.jpeg";
const IMG_HERO = "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/7f8868067560a2333d0283c82b4ade885325035e1c89441e6cde6988ea0ebdd0.jpeg";

// ─────────────────────────────────────────────────────────────────────
// The Farm
// ─────────────────────────────────────────────────────────────────────
export function TheFarm() {
  return (
    <EditorialShell
      testid="page-the-farm"
      kicker="Provenance"
      title="The Farm"
      subtitle="Handpicked from named grove partners on the Konkan and Karnataka coast — where the soil is red, the rain is honest, and the coconut is still an heirloom crop."
      heroImage={IMG_FARM}
      seoTitle="The Farm — Where Karijeeva Begins"
      seoDescription="Meet the coconut groves and the farming families behind every bottle of Karijeeva. Single-origin, traceable, hand-picked — from Coastal Karnataka and Kerala."
      breadcrumb={[{ name: "The Farm", path: "/the-farm" }]}
    >
      <p>
        Karijeeva doesn't come from a factory. It comes from a strip of the Indian coast
        two hundred kilometres long and no more than forty kilometres wide — the Konkan
        and Malabar coast, where laterite soil meets monsoon rain and coconut trees grow
        tall enough to lean into the Arabian Sea. Every bottle you open can be traced back
        to a named grove partner, a named week, and a named press.
      </p>

      <EditorialH2 id="groves">Our groves</EditorialH2>
      <p>
        We work with a small circle of family-owned groves across <strong>Udupi, Dakshina
        Kannada, and North Kerala</strong>. These aren't plantations — they're mixed-use
        farms where coconut grows alongside areca, pepper vines, and cardamom understory.
        The canopy is diverse, the soil is alive, and the yield is lower than on a
        monoculture estate. That is deliberate. A fully-matured coconut from a mixed grove
        has a different aroma than one that was fast-grown on a single-crop farm. You can
        taste that difference in the tempering pan.
      </p>

      <EditorialH2 id="farmers">Our farmers</EditorialH2>
      <p>
        The families we buy from are third- and fourth-generation farmers. We pay above
        market rate because the oil we want requires a specific harvest schedule — only
        fully-matured coconuts (11 months on the tree, minimum) — and that schedule costs
        farmers yield. We pay upfront in rupees, on agreed weekly drops, with no
        middleman.
      </p>
      <p>
        In 2026 our active partner list is six families across three districts. We name
        them on the batch label when they are willing; three of the six prefer to remain
        anonymous and we respect that.
      </p>

      <EditorialH2 id="harvest">Harvest philosophy</EditorialH2>
      <p>
        A coconut is ready when the outer husk turns fully brown and the inner kernel is
        firm, not tender. Industrial oil extractors want maximum yield, so they harvest
        anything that looks ready. We don't. Under-ripe kernels press thin, cloudy oil
        with less aroma and a shorter shelf life; over-ripe kernels start to ferment and
        turn rancid fast. The window is narrow and the only person who can judge it is
        the farmer with forty years on that grove.
      </p>

      <EditorialH2 id="traceability">Traceability</EditorialH2>
      <p>
        Every batch of Karijeeva oil carries a three-character <strong>batch code</strong>
        on the bottle (e.g. <em>KRJ-K7</em>). That code links to:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>The grove family who harvested the coconuts</li>
        <li>The week of harvest</li>
        <li>The press (cold-press or chekku)</li>
        <li>The pressing date and the bottling date</li>
      </ul>
      <p>
        We publish a plain-English traceability note on <Link to="/contact" className="underline hover:text-brand-gold">request</Link> —
        write to us with your batch code and we will tell you which grove your oil came
        from.
      </p>

      <GoldRule />

      <EditorialH2 id="a-day">A day on the farm</EditorialH2>
      <p>
        The tree-climber arrives before six. A good climber on a good tree brings down
        thirty coconuts in under an hour. The coconuts land on a woven palm mat, not the
        ground. By nine, the morning's harvest is in the shade of the farmhouse, husk
        still on.
      </p>
      <p>
        By noon, the husks have been separated, the shells cracked, and the kernel is
        drying on coir mats in open shade — never in direct sun, because sun-drying
        introduces oxidative compounds we don't want. By the third day, the kernel is at
        the right moisture content for the press. By day four or five, the kernel is
        bagged and sent to our press partner within a fifty-kilometre radius.
      </p>
      <p>
        Oil is bottled within forty-eight hours of pressing. From the tree to your door,
        nothing in the chain takes longer than a fortnight. That is the whole promise.
      </p>

      <p className="pt-6 text-xs uppercase tracking-[0.25em] text-brand-gold">
        <Link to="/cold-press-process" className="hover:underline">Read next — the cold-press process →</Link>
      </p>
    </EditorialShell>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cold-Press Process
// ─────────────────────────────────────────────────────────────────────
export function ColdPressProcess() {
  return (
    <EditorialShell
      testid="page-cold-press-process"
      kicker="Craft"
      title="The Cold-Press Process"
      subtitle="Pressed under 40°C in small batches, bottled within 48 hours — no solvents, no bleaching, no deodorising, no hydrogenation. Ever."
      heroImage={IMG_PRESS}
      seoTitle="The Cold-Press Process — How Karijeeva Oil Is Made"
      seoDescription="A temperature-controlled, chemical-free, six-step cold-press process — and why it matters for aroma, lauric acid, and the way the oil behaves in your tempering pan."
      breadcrumb={[{ name: "Cold-Press Process", path: "/cold-press-process" }]}
    >
      <p>
        Most supermarket coconut oil is refined, bleached, and deodorised — a three-step
        process called RBD that strips the oil to a neutral, colourless liquid with a
        long shelf life. What you lose is what the coconut actually tasted like. We don't
        RBD. We don't use solvents. We don't heat above 40°C. Here is what we do instead.
      </p>

      <EditorialH2 id="why-cold">Why cold-pressed?</EditorialH2>
      <p>
        Coconut oil contains around 50% <strong>lauric acid</strong> — a medium-chain
        fatty acid that survives high heat. That is why our oil is perfectly fine for
        tempering and deep-frying. What does <em>not</em> survive high heat are the
        aroma compounds and the polyphenols. Industrial extraction heats the kernel to
        80–100°C; we keep it under 40°C. The chemistry is what it is; the aroma is what
        most customers actually buy the oil for, and it is what industrial extraction
        kills first.
      </p>

      <EditorialH2 id="chekku">The wooden chekku vs the modern press</EditorialH2>
      <p>
        We use two presses. Our flagship line is extracted on a modern <strong>cold
        screw-press</strong> — stainless steel, temperature-controlled, enclosed, clean.
        Our premium line is extracted on a traditional <strong>wooden chekku</strong>
        (Kannada for ghani), driven by a single bullock walking a slow circle. The
        chekku is ten times slower, produces one-fifth the volume, and costs about 2×
        per litre to operate. The oil it makes is slightly more aromatic and slightly
        cloudier — because the wood holds trace oils from previous batches, the way a
        cast-iron tawa does. It is the oil our grandmothers grew up with.
      </p>

      <EditorialH2 id="steps">Six steps, from kernel to bottle</EditorialH2>
      <EditorialH3 id="step-1">1. Selection</EditorialH3>
      <p>
        Only fully-matured kernels from our named grove partners (see <Link to="/the-farm" className="underline">The Farm</Link>). Any
        kernel with a hairline mould spot or under-ripe softness is rejected at this
        stage. Typical rejection rate: 8–12%.
      </p>
      <EditorialH3 id="step-2">2. Grating and drying</EditorialH3>
      <p>
        Kernels are grated and shade-dried on coir mats to the target moisture content
        (~4%). No kiln, no sun-drying, no mechanical dehydration.
      </p>
      <EditorialH3 id="step-3">3. First press</EditorialH3>
      <p>
        The grated kernel enters the press. On the screw-press, the extraction chamber
        is jacketed with cold water so the oil never exceeds 38°C. On the chekku, the
        pressing happens at ambient temperature — it almost never crosses 30°C.
      </p>
      <EditorialH3 id="step-4">4. Natural settling</EditorialH3>
      <p>
        The raw oil sits in food-grade stainless tanks for 48 hours. Any fine kernel
        particulate settles to the bottom under gravity — no centrifuges, no clay-bed
        filtration.
      </p>
      <EditorialH3 id="step-5">5. Muslin filtration</EditorialH3>
      <p>
        A triple-pass through food-grade muslin. Nothing more complicated than that. The
        finished oil is clear to the eye, with the faint coconut haze you would expect
        from an unrefined oil.
      </p>
      <EditorialH3 id="step-6">6. Bottling</EditorialH3>
      <p>
        Bottling happens in a food-safe room within 48 hours of pressing. Each bottle is
        date-coded, batch-coded, and sealed with a tamper-evident foil. Glass
        apothecary bottles with recycled kraft packaging — <strong>no plastic in contact
        with the oil, ever</strong>.
      </p>

      <GoldRule />

      <EditorialH2 id="never">What we never do</EditorialH2>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li><strong>No chemical solvents</strong> (no hexane, no acetone — we rely on mechanical pressure alone)</li>
        <li><strong>No bleaching clay</strong> (the oil keeps its natural colour and its natural polyphenols)</li>
        <li><strong>No deodorising steam</strong> (the aroma is the whole point)</li>
        <li><strong>No hydrogenation</strong> (zero trans fats)</li>
        <li><strong>No blending</strong> (every batch is single-origin; nothing from other oils is added)</li>
      </ul>

      <EditorialH2 id="testing">Our testing protocol</EditorialH2>
      <p>
        Each batch is tested in-house for moisture, free fatty acid (FFA), and peroxide
        value before bottling. Every third batch is sent to an FSSAI-empanelled
        third-party lab for full analysis including smoke point and lauric acid. The
        lab report for your batch is available on request.
      </p>
      <p>Typical values you can expect:</p>
      <ul className="list-disc pl-6 space-y-1 my-4">
        <li>Moisture: &lt; 0.1%</li>
        <li>FFA: &lt; 0.15%</li>
        <li>Peroxide value: &lt; 2 meq/kg</li>
        <li>Smoke point: 177°C (unrefined virgin)</li>
        <li>Lauric acid: 48–52%</li>
      </ul>

      <p className="pt-6 text-xs uppercase tracking-[0.25em] text-brand-gold">
        <Link to="/products" className="hover:underline">Taste the result — shop the oils →</Link>
      </p>
    </EditorialShell>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sustainability
// ─────────────────────────────────────────────────────────────────────
export function Sustainability() {
  const settings = useSiteSettings();
  const supportEmail = pick(settings, "support_email");
  return (
    <EditorialShell
      testid="page-sustainability"
      kicker="Footprint"
      title="Sustainability"
      subtitle="A small brand with a slow supply chain — a short distance between the grove and your kitchen, and a commitment to leaving both better than we found them."
      heroImage={IMG_HERO}
      seoTitle="Sustainability at Karijeeva"
      seoDescription="Regenerative farming, recyclable glass apothecary bottles, zero-waste production, and a measurable 2027 target for FSC-certified packaging and 50% solar-powered pressing."
      breadcrumb={[{ name: "Sustainability", path: "/sustainability" }]}
    >
      <p>
        We are a small brand and we have to earn the premium you pay. Part of that
        premium pays for farming and packaging choices that most mass brands can't
        afford to make. Here is a plain-language accounting of what we currently do,
        what we plan to do by 2027, and where we are still short.
      </p>

      <EditorialH2 id="farming">Regenerative farming</EditorialH2>
      <p>
        All of our partner groves are mixed-use — coconut alongside areca, pepper, and
        cardamom. Mixed farming builds topsoil, holds water, and supports pollinators.
        Three of our six partners also raise indigenous Malnad Gidda cattle, and the
        manure closes the loop in their groves. We do not buy from monoculture
        plantations or cleared-forest land.
      </p>

      <EditorialH2 id="packaging">Packaging</EditorialH2>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li><strong>Glass apothecary bottles</strong> — recyclable infinitely, no plastic in contact with the oil.</li>
        <li><strong>Recycled kraft outer box</strong> — made from 85% post-consumer recycled pulp.</li>
        <li><strong>Soy-based inks</strong> on every label.</li>
        <li><strong>Zero plastic wraps.</strong> We use paper tape, not plastic, on outer cartons.</li>
      </ul>

      <EditorialH2 id="carbon">Carbon footprint</EditorialH2>
      <p>
        Our shortest supply chain segment is also the longest cost saving: the grove,
        the press, and the packing house are within a <strong>fifty-kilometre radius</strong>
        on the Karnataka coast. From there the finished bottle ships by road across
        India. We have not yet done a formal lifecycle assessment (LCA) — it is on our
        2026 agenda.
      </p>

      <EditorialH2 id="zero-waste">Zero-waste production</EditorialH2>
      <p>
        Every coconut produces four by-products, and we have a use for each:
      </p>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li><strong>Coir (husk fibre)</strong> — sold back to the grove for composting and mulch.</li>
        <li><strong>Shell</strong> — used as biofuel by local tile kilns.</li>
        <li><strong>Coconut meal (press-cake)</strong> — sold to dairy farmers as high-quality cattle feed.</li>
        <li><strong>Coconut water</strong> — collected at the packing house and sold locally as a fresh beverage.</li>
      </ul>
      <p>
        Nothing goes to landfill from our supply chain.
      </p>

      <EditorialH2 id="community">Community</EditorialH2>
      <p>
        We pay our grove partners a fixed floor price that is 15–20% above the open
        APMC market rate, on weekly settlement, with no credit-period. We also fund a
        small quarterly <strong>skills programme</strong> for the women in our grove
        families — currently in soap-making and basket-weaving, run in partnership with
        a local women's cooperative.
      </p>

      <GoldRule />

      <EditorialH2 id="2027">Our 2027 goals</EditorialH2>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li><strong>100% FSC-certified</strong> kraft packaging (currently 85% recycled, uncertified).</li>
        <li><strong>50% of pressing powered by on-site solar.</strong> Rooftop install planned at our primary press partner for Q3 2026.</li>
        <li><strong>Published LCA</strong> — a full carbon footprint report per bottle, audited.</li>
        <li><strong>Doubled grove partners</strong> — from 6 to 12 families, prioritising those transitioning from monoculture.</li>
      </ul>

      <p className="pt-4">
        We are at the start of this journey, not the end. If you find something we
        could do better, write to us at <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a> — we read every note.
      </p>
    </EditorialShell>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Press
// ─────────────────────────────────────────────────────────────────────
export function Press() {
  const settings = useSiteSettings();
  const logos = settings.press_logos || [
    { name: "Vogue India",   subtitle: "A new Indian luxury." },
    { name: "Femina",        subtitle: "The bottle your kitchen was waiting for." },
    { name: "The Hindu",     subtitle: "A revival of chekku oil, done right." },
    { name: "Times Food",    subtitle: "Deeply honest, deeply aromatic." },
    { name: "Mint Lounge",   subtitle: "The quiet luxury of a single-ingredient brand." },
  ];
  return (
    <EditorialShell
      testid="page-press"
      kicker="In the press"
      title="Press & Features"
      subtitle="Journalists and editors who have written about us. We are new, and we are grateful."
      heroImage={IMG_HERO}
      seoTitle="Press & Features — Karijeeva"
      seoDescription="A selection of press features and pull-quotes about Karijeeva cold-pressed coconut oil. For press inquiries, write to press@karijeeva.in."
      breadcrumb={[{ name: "Press", path: "/press" }]}
    >
      <div className="grid sm:grid-cols-2 gap-6 not-prose">
        {logos.map((p, i) => (
          <div key={i} className="border border-brand-gold/20 bg-white/60 rounded-lg p-6">
            <p className="font-display text-2xl text-brand-obsidian tracking-wide">{p.name}</p>
            <p className="font-display text-brand-husk mt-3 leading-relaxed">
              &ldquo;{p.subtitle}&rdquo;
            </p>
            <a href="/" className="mt-4 inline-block text-xs uppercase tracking-[0.25em] text-brand-gold hover:underline">
              Read feature →
            </a>
          </div>
        ))}
      </div>

      <GoldRule />

      <EditorialH2 id="inquiries">For press inquiries</EditorialH2>
      <p>
        Write to <a className="underline" href="mailto:press@karijeeva.in">press@karijeeva.in</a> with
        your publication, your deadline, and the angle you are pursuing. We typically
        respond within one working day.
      </p>
      <p>
        Samples can be couriered on request; high-resolution brand assets, grove
        photography, and founder quotes are available in our press kit.
      </p>
      <p className="not-prose">
        <button
          type="button"
          onClick={() => toast.info("Press kit launches with our public PR — coming soon.")}
          title="Coming soon"
          data-testid="press-kit-download"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-pill border border-brand-gold/40 text-brand-obsidian hover:bg-brand-gold hover:text-brand-obsidian transition-colors font-body text-xs uppercase tracking-[0.25em]"
        >
          <Sparkles className="w-4 h-4" /> Download press kit (soon)
        </button>
      </p>
    </EditorialShell>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Careers
// ─────────────────────────────────────────────────────────────────────
export function Careers() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!email || !message) { toast.error("Email + a short note, please."); return; }
    setLoading(true);
    try {
      await postContact({ name: email.split("@")[0], email, subject: "Careers interest", message });
      toast.success("Thanks — we'll be in touch when we're hiring.");
      setEmail(""); setMessage("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't send. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <EditorialShell
      testid="page-careers"
      kicker="Careers"
      title="Join the ritual"
      subtitle="We're a small team building a slow brand. No roles are actively open right now — but we're always keen to meet curious people who care about craft."
      heroImage={IMG_HERO}
      seoTitle="Careers — Karijeeva"
      seoDescription="Work with Karijeeva. No open roles today, but we'd love to hear from curious, craft-minded people who care about food and design."
      breadcrumb={[{ name: "Careers", path: "/careers" }]}
    >
      <EditorialH2 id="values">Our values</EditorialH2>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li><strong>Craft over scale.</strong> Slow is fine. Rushed isn't.</li>
        <li><strong>Transparency by default.</strong> Batch codes, lab reports, honest copy.</li>
        <li><strong>Pay farmers first, marketing last.</strong></li>
        <li><strong>Read a lot.</strong> Cookbooks, history, anything that isn't LinkedIn.</li>
      </ul>

      <EditorialH2 id="how">How we work</EditorialH2>
      <p>
        Remote-first across India, hybrid out of Bengaluru for anyone local. Small
        team, flat structure, fewer meetings than you would expect. We ship weekly,
        reflect monthly, and take the first week of January off because the year will
        still be there when we get back.
      </p>

      <EditorialH2 id="look-for">What we look for</EditorialH2>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>A point of view on craft — in food, design, engineering, whatever your field.</li>
        <li>Writing that sounds like a person, not a template.</li>
        <li>Comfort with slower, fewer, better.</li>
        <li>Kindness. Always.</li>
      </ul>

      <EditorialH2 id="perks">Perks</EditorialH2>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>Flexible work — choose your hours, own your calendar.</li>
        <li>A bottle of Karijeeva oil every month for life, on the house.</li>
        <li>₹30,000/year learning budget — books, courses, conferences, your call.</li>
        <li>Extended parental leave (six months primary, three secondary).</li>
      </ul>

      <GoldRule />

      <div className="not-prose bg-brand-parchment-soft border border-brand-gold/20 rounded-lg p-6 sm:p-8">
        <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">
          Keep in touch
        </p>
        <h3 className="font-display text-2xl text-brand-obsidian">Tell us about you</h3>
        <p className="font-body text-sm text-brand-husk/80 mt-2 mb-6">
          Drop your email and a short note. We'll reach out when a role opens that
          suits you.
        </p>
        <form onSubmit={submit} className="space-y-4" data-testid="careers-form">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 placeholder="your@email.com" required
                 className="h-11 bg-white border-brand-gold/30" data-testid="careers-email" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="What kind of role are you imagining? What craft do you care about?"
                    rows={5} required data-testid="careers-note"
                    className="w-full rounded-md bg-white border border-brand-gold/30 p-3 font-body text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold" />
          <Button type="submit" variant="primary" loading={loading} data-testid="careers-submit">
            <Mail className="w-4 h-4 mr-2" /> Send interest
          </Button>
        </form>
      </div>
    </EditorialShell>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Gift Cards (MOCKED — waitlist only)
// ─────────────────────────────────────────────────────────────────────
export function GiftCards() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error("Your email, please."); return; }
    setLoading(true);
    try {
      await api.post("/newsletter/subscribe", { email, source: "gift_cards_waitlist" });
      toast.success("You're on the list — we'll email when gift cards launch.");
      setEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't subscribe. Try again.");
    } finally { setLoading(false); }
  };

  const denoms = [500, 1000, 2500, 5000];

  return (
    <EditorialShell
      testid="page-gift-cards"
      kicker="Coming soon"
      title="The ritual, gifted."
      subtitle="A bottle of cold-pressed coconut oil is a hand-written note in oil. Gift cards launch this season — join the waitlist and we'll tell you first."
      heroImage={IMG_HERO}
      seoTitle="Gift Cards — Karijeeva (coming soon)"
      seoDescription="Karijeeva gift cards — a ₹500 / ₹1,000 / ₹2,500 / ₹5,000 denomination toward our cold-pressed oils and wood-pressed chekku oil. Launching soon."
      breadcrumb={[{ name: "Gift Cards", path: "/gift-cards" }]}
    >
      <div className="not-prose bg-brand-parchment-soft border border-brand-gold/25 rounded-lg p-4 sm:p-5 flex items-start gap-3 text-sm text-brand-husk mb-10">
        <Sparkles className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
        <span>
          <strong className="font-semibold">Coming soon.</strong> Gift cards are not yet live
          for checkout. Join the waitlist below and we'll email you the minute they launch.
        </span>
      </div>

      <div className="not-prose grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
        {denoms.map((d) => (
          <div key={d}
               className="aspect-[4/5] rounded-lg bg-brand-obsidian text-brand-parchment border border-brand-gold/30 flex flex-col items-center justify-center p-6 shadow-soft">
            <p className="eyebrow tracking-[0.25em] text-brand-gold">Karijeeva</p>
            <p className="font-display text-3xl mt-2 text-brand-parchment">₹{d.toLocaleString("en-IN")}</p>
            <p className="font-body text-xs text-brand-parchment/60 mt-auto">Digital gift card</p>
          </div>
        ))}
      </div>

      <p>
        The gift card will arrive as a beautifully typeset email with a one-time code and
        a personal note. Redeemable against any Karijeeva oil — the flagship virgin
        cold-pressed, the wood-pressed chekku, or the family pack. Valid for twelve months.
      </p>

      <GoldRule />

      <div className="not-prose bg-white border border-brand-gold/20 rounded-lg p-6 sm:p-8">
        <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">
          Waitlist
        </p>
        <h3 className="font-display text-2xl text-brand-obsidian">Notify me when gift cards launch</h3>
        <form onSubmit={submit} className="mt-6 flex gap-2" data-testid="gift-waitlist-form">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 placeholder="your@email.com" required data-testid="gift-waitlist-email"
                 className="h-11 bg-white border-brand-gold/30" />
          <Button type="submit" variant="primary" loading={loading} data-testid="gift-waitlist-submit">
            Join waitlist
          </Button>
        </form>
      </div>
    </EditorialShell>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Subscribe & Save (MOCKED — waitlist only)
// ─────────────────────────────────────────────────────────────────────
export function SubscribeSave() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error("Your email, please."); return; }
    setLoading(true);
    try {
      await api.post("/newsletter/subscribe", { email, source: "subscribe_save_waitlist" });
      toast.success("You're on the list — Subscribe & Save launches soon.");
      setEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't subscribe. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <EditorialShell
      testid="page-subscribe-save"
      kicker="Launching soon"
      title="Never run out. Save 15%."
      subtitle="A bottle at your door every month, at 15% off. Skip anytime, pause anytime, cancel with one click."
      heroImage={IMG_HERO}
      seoTitle="Subscribe & Save — Karijeeva (launching soon)"
      seoDescription="Subscribe to Karijeeva cold-pressed coconut oil — 30/60/90-day delivery, 15% off every order, free shipping, skip or cancel anytime. Join the waitlist."
      breadcrumb={[{ name: "Subscribe & Save", path: "/subscribe-save" }]}
    >
      <div className="not-prose bg-brand-parchment-soft border border-brand-gold/25 rounded-lg p-4 sm:p-5 flex items-start gap-3 text-sm text-brand-husk mb-10">
        <Sparkles className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
        <span>
          <strong className="font-semibold">Launching soon.</strong> Subscriptions are on
          our next release. Join the waitlist — we'll open it to you first.
        </span>
      </div>

      <EditorialH2 id="how">How it works</EditorialH2>
      <ul className="list-disc pl-6 space-y-2 my-4">
        <li>Pick your cadence — every <strong>30, 60, or 90 days</strong>.</li>
        <li><strong>15% off every bottle</strong> for the life of the subscription.</li>
        <li><strong>Free shipping</strong> on every subscription order, no minimum.</li>
        <li><strong>Skip, pause, or cancel anytime</strong> from your account page — no email to support needed.</li>
        <li><strong>Founder's batch access</strong> — early access to our small-batch wood-pressed runs before they go on sale to the public.</li>
      </ul>

      <EditorialH2 id="why">Why subscribe?</EditorialH2>
      <p>
        The aroma of cold-pressed coconut oil is best in the first six weeks after opening
        the bottle. A predictable bottle a month (for a 500 ml user) or a bottle every two
        months (for a 1 L user) means you're always cooking with fresh oil — not the
        bottle that has been in the cupboard since the last sadya.
      </p>

      <GoldRule />

      <div className="not-prose bg-white border border-brand-gold/20 rounded-lg p-6 sm:p-8">
        <p className="eyebrow text-brand-gold tracking-[0.3em] mb-3">
          Waitlist
        </p>
        <h3 className="font-display text-2xl text-brand-obsidian">Tell me when Subscribe &amp; Save launches</h3>
        <form onSubmit={submit} className="mt-6 flex gap-2" data-testid="subsave-waitlist-form">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 placeholder="your@email.com" required data-testid="subsave-waitlist-email"
                 className="h-11 bg-white border-brand-gold/30" />
          <Button type="submit" variant="primary" loading={loading} data-testid="subsave-waitlist-submit">
            Join waitlist
          </Button>
        </form>
      </div>
    </EditorialShell>
  );
}
