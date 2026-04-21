import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Instagram, Facebook, Youtube, Linkedin, Leaf, ShieldCheck, Sparkles, Send, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNewsletter } from "@/components/marketing/NewsletterSection";
import { useSiteSettings, pick } from "@/lib/siteSettings";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Oils",            to: "/products" },
      { label: "Culinary Oils",       to: "/products?category=culinary" },
      { label: "Wellness Oils",       to: "/products?category=wellness" },
      { label: "New Arrivals",        to: "/products?sort=newest" },
      { label: "Gift Cards",          to: "/gift-cards" },
      { label: "Subscribe & Save",    to: "/subscribe-save" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story",           to: "/about" },
      { label: "The Farm",            to: "/the-farm" },
      { label: "The Cold-Press Process", to: "/cold-press-process" },
      { label: "Sustainability",      to: "/sustainability" },
      { label: "Press & Features",    to: "/press" },
      { label: "Careers",             to: "/careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact",             to: "/contact" },
      { label: "FAQs",                to: "/faqs" },
      { label: "Shipping & Delivery", to: "/shipping-policy" },
      { label: "Returns & Refunds",   to: "/returns-policy" },
      { label: "Track Order",         to: "/track-order" },
      { label: "Order Lookup",        to: "/track-order" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const { subscribe, loading, modal } = useNewsletter();
  const settings = useSiteSettings();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const res = await subscribe(email, "footer");
    if (res?.ok) setEmail("");
  };

  const year = new Date().getFullYear();
  const company = pick(settings, "company_name");
  const cin = pick(settings, "cin");
  const fssai = pick(settings, "fssai_license");
  const supportEmail = pick(settings, "support_email");
  const legalEmail = pick(settings, "legal_email");
  const supportPhone = pick(settings, "support_phone");
  const hoursIst = pick(settings, "hours_ist");
  const registeredAddress = pick(settings, "registered_address");
  const parentSite = pick(settings, "parent_site_url");
  const instagram = pick(settings, "instagram_url");
  const facebook = pick(settings, "facebook_url");
  const youtube = pick(settings, "youtube_url");
  const whatsapp = pick(settings, "whatsapp_url");
  const linkedin = pick(settings, "linkedin_url");
  const telHref = (supportPhone || "").replace(/[^+\d]/g, "");

  return (
    <>
      <footer className="relative bg-brand-obsidian-soft text-brand-parchment" data-testid="footer">
        {/* Trust strip */}
        <div className="border-b border-brand-gold/25">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <TrustBadge icon={<ShieldCheck />} label="FSSAI Certified" sub={`Lic · ${fssai}`} />
            <TrustBadge icon={<Leaf />}        label="100% Natural"   sub="Single ingredient oil" />
            <TrustBadge icon={<Sparkles />}    label="Cold-Pressed"   sub="Pressed under 40°C" />
            <TrustBadge icon={<Leaf />}        label="Farm Direct"    sub="Karnataka coast" />
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
            <p className="font-display text-brand-parchment/75 text-sm mb-8 leading-relaxed max-w-sm">
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

            {/* Reach us — phone, email, hours, micro-address */}
            <div className="mt-8 space-y-2 font-body text-xs text-brand-parchment/75">
              <p className="tracking-[0.25em] uppercase text-brand-gold/90">Reach us</p>
              {supportEmail && (
                <p>
                  <a
                    data-testid="footer-support-email"
                    href={`mailto:${supportEmail}`}
                    className="hover:text-brand-gold transition-colors"
                  >{supportEmail}</a>
                </p>
              )}
              {supportPhone && (
                <p>
                  <a
                    data-testid="footer-support-phone"
                    href={`tel:${telHref}`}
                    className="hover:text-brand-gold transition-colors"
                  >{supportPhone}</a>
                </p>
              )}
              {hoursIst && (
                <p data-testid="footer-hours" className="text-brand-parchment/55">{hoursIst}</p>
              )}
              {registeredAddress && (
                <p data-testid="footer-registered-address" className="text-brand-parchment/50 leading-relaxed pt-1">
                  {registeredAddress}
                </p>
              )}
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 mt-6">
              <SocialLink href={instagram} label="Instagram"><Instagram /></SocialLink>
              <SocialLink href={facebook} label="Facebook"><Facebook /></SocialLink>
              <SocialLink href={youtube} label="YouTube"><Youtube /></SocialLink>
              <SocialLink href={whatsapp} label="WhatsApp"><MessageCircle /></SocialLink>
              <SocialLink href={linkedin} label="LinkedIn"><Linkedin /></SocialLink>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-body text-xs tracking-[0.25em] uppercase text-brand-gold mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label + l.to}>
                    <Link
                      to={l.to}
                      data-testid={`footer-link-${l.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
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

        {/* Bottom row — payments + legal + © */}
        <div className="border-t border-brand-gold/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <span
              className="eyebrow text-brand-parchment/55 tracking-[0.2em] leading-relaxed"
              data-testid="footer-copyright"
            >
              © {year} A brand by{" "}
              {parentSite ? (
                <a
                  href={parentSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-gold transition-colors"
                  data-testid="footer-parent-link"
                >{company}</a>
              ) : (
                <span>{company}</span>
              )}
              {" "}· CIN: <span data-testid="footer-cin">{cin}</span> · All rights reserved
            </span>

            <div className="flex items-center gap-3 font-body text-xs tracking-widest text-brand-parchment/60">
              <span>VISA</span>
              <span className="text-brand-gold/50">·</span>
              <span>MASTERCARD</span>
              <span className="text-brand-gold/50">·</span>
              <span>UPI</span>
              <span className="text-brand-gold/50">·</span>
              <span>RAZORPAY</span>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-xs text-brand-parchment/45">
            <Link data-testid="footer-link-privacy"  to="/privacy-policy"  className="hover:text-brand-gold">Privacy Policy</Link>
            <Link data-testid="footer-link-terms"    to="/terms"           className="hover:text-brand-gold">Terms of Service</Link>
            <Link data-testid="footer-link-shipping" to="/shipping-policy" className="hover:text-brand-gold">Shipping Policy</Link>
            <Link data-testid="footer-link-refund"   to="/returns-policy"  className="hover:text-brand-gold">Refund & Cancellation</Link>
            <Link data-testid="footer-link-cookies"  to="/cookie-policy"   className="hover:text-brand-gold">Cookie Policy</Link>
            {legalEmail && (
              <a
                href={`mailto:${legalEmail}`}
                data-testid="footer-legal-email"
                className="hover:text-brand-gold"
              >Legal inquiries</a>
            )}
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

function SocialLink({ href, children, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      data-testid={`footer-social-${label.toLowerCase()}`}
      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-brand-gold/30 text-brand-parchment/80 hover:text-brand-gold hover:border-brand-gold transition-colors [&_svg]:w-4 [&_svg]:h-4"
    >
      {children}
    </a>
  );
}
