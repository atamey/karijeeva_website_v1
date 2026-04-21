import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Youtube, Leaf, ShieldCheck, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNewsletter } from "@/components/marketing/NewsletterSection";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Products",   to: "/#products" },
      { label: "Coconut Oil 500ml", to: "/#products" },
      { label: "Bulk Orders",    to: "/#contact" },
      { label: "Gifting",        to: "/#products" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story",      to: "/#about" },
      { label: "The Process",    to: "/#about" },
      { label: "Sustainability", to: "/#about" },
      { label: "Recipes",        to: "/#recipes" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact",        to: "/#contact" },
      { label: "Shipping",       to: "/#contact" },
      { label: "Returns",        to: "/#contact" },
      { label: "FAQ",            to: "/#contact" },
      { label: "Design System",  to: "/design-system" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const { subscribe, loading, modal } = useNewsletter();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const res = await subscribe(email, "footer");
    if (res?.ok) setEmail("");
  };

  return (
    <>
    <footer className="relative bg-brand-obsidian-soft text-brand-parchment" data-testid="footer">
      {/* Trust strip */}
      <div className="border-b border-brand-gold/25">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <TrustBadge icon={<Leaf />}       label="100% Natural"   sub="No additives ever" />
          <TrustBadge icon={<ShieldCheck/>} label="FSSAI Certified" sub="Lic · 10012345678" />
          <TrustBadge icon={<Sparkles/>}    label="Cold-Pressed"   sub="Traditional method" />
          <TrustBadge icon={<Leaf />}       label="Farm Direct"    sub="Karnataka sourced" />
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Brand + newsletter */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-brand-gold" />
            <span className="font-display text-3xl text-brand-gold tracking-wide">Karijeeva</span>
          </div>
          <p className="font-accent italic text-brand-parchment/75 text-sm mb-8 leading-relaxed max-w-sm">
            "Kadi jeeva — the long life, bottled at dawn in small batches of
            cold-pressed coconut oil."
          </p>

          <form onSubmit={handleSubscribe} className="space-y-3" data-testid="newsletter-form">
            <label
              htmlFor="newsletter-email"
              className="block font-body text-xs tracking-[0.25em] uppercase text-brand-gold"
            >
              Join our dawn letter
            </label>
            <div className="flex gap-2">
              <Input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                data-testid="newsletter-email-input"
                className="h-12 bg-brand-parchment/10 border-brand-gold/30 text-brand-parchment placeholder:text-brand-parchment/45 focus-visible:ring-brand-gold focus-visible:border-brand-gold rounded-pill px-5"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                data-testid="newsletter-submit"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Join</span>
              </Button>
            </div>
            <p className="font-body text-xs text-brand-parchment/55">
              Monthly. Recipes, harvest notes, early access.
            </p>
          </form>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-body text-xs tracking-[0.25em] uppercase text-brand-gold mb-5">
              {col.title}
            </h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="font-body text-small text-brand-parchment/75 hover:text-brand-gold transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="border-t border-brand-gold/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-accent italic text-xs text-brand-parchment/55 tracking-[0.2em] uppercase">
            © {new Date().getFullYear()} Kadle Global Pvt Ltd · Made in Bharat
          </span>

          {/* Payment icons (text placeholders, on-brand) */}
          <div className="flex items-center gap-3 font-body text-xs tracking-widest text-brand-parchment/60">
            <span>VISA</span>
            <span className="text-brand-gold/50">·</span>
            <span>MASTERCARD</span>
            <span className="text-brand-gold/50">·</span>
            <span>UPI</span>
            <span className="text-brand-gold/50">·</span>
            <span>RAZORPAY</span>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-2">
            <SocialBtn label="Instagram"><Instagram /></SocialBtn>
            <SocialBtn label="Facebook"><Facebook /></SocialBtn>
            <SocialBtn label="Twitter"><Twitter /></SocialBtn>
            <SocialBtn label="YouTube"><Youtube /></SocialBtn>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-xs text-brand-parchment/45">
          <Link to="/#privacy" className="hover:text-brand-gold">Privacy</Link>
          <Link to="/#terms" className="hover:text-brand-gold">Terms</Link>
          <Link to="/#shipping" className="hover:text-brand-gold">Shipping Policy</Link>
          <Link to="/#refund" className="hover:text-brand-gold">Refund Policy</Link>
        </div>
      </div>
    </footer>
    {modal}
    </>
  );
}

function TrustBadge({ icon, label, sub }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold [&_svg]:w-5 [&_svg]:h-5">
        {icon}
      </span>
      <div>
        <div className="font-display text-lg text-brand-parchment leading-tight">{label}</div>
        <div className="font-body text-xs text-brand-parchment/55">{sub}</div>
      </div>
    </div>
  );
}

function SocialBtn({ children, label }) {
  return (
    <button
      aria-label={label}
      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-brand-gold/30 text-brand-parchment/80 hover:text-brand-gold hover:border-brand-gold transition-colors [&_svg]:w-4 [&_svg]:h-4"
    >
      {children}
    </button>
  );
}
