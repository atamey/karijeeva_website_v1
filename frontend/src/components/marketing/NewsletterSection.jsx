import { useState } from "react";
import { toast } from "sonner";
import { postNewsletter } from "@/lib/api";
import { saveWelcomeCode } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, Sparkles, PartyPopper } from "lucide-react";

/**
 * useNewsletter — shared hook. Both the footer form and the home "Join our letter"
 * section call this; a successful brand-new subscription opens the welcome modal.
 */
export function useNewsletter() {
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState(null); // {code, desc}
  const [copied, setCopied] = useState(false);

  const subscribe = async (email, source = "footer") => {
    const clean = (email || "").trim();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast.error("Please enter a valid email");
      return { ok: false };
    }
    setLoading(true);
    try {
      const data = await postNewsletter(clean, source);
      if (data?.already_subscribed) {
        toast.success("You're already on our list — thanks!", {
          description: "Look out for a harvest note soon.",
        });
        return { ok: true, already: true };
      }
      if (data?.welcome_code) {
        setWelcome({ code: data.welcome_code, desc: data.discount_desc, expires_at: data.expires_at });
        const exp = data.expires_at || new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        saveWelcomeCode(data.welcome_code, exp);
        return { ok: true, welcome: true };
      }
      toast.success("You're on the list. Welcome to Karijeeva.");
      return { ok: true };
    } catch (e) {
      toast.error(e?.response?.data?.detail?.[0]?.msg || "Could not subscribe. Try again.");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!welcome?.code) return;
    try {
      await navigator.clipboard.writeText(welcome.code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard blocked — please copy manually.");
    }
  };

  const modal = (
    <Dialog open={!!welcome} onOpenChange={(o) => !o && setWelcome(null)}>
      <DialogContent className="bg-brand-parchment border-brand-gold/40 max-w-md" data-testid="newsletter-welcome-modal">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-brand-gold/15 flex items-center justify-center mb-2">
            <PartyPopper className="w-7 h-7 text-brand-gold" />
          </div>
          <DialogTitle className="font-display text-h3 text-brand-obsidian text-center">
            Welcome to the grove.
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-ink-muted text-center">
            Your first-order code is waiting below.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 p-6 rounded-lg border-2 border-dashed border-brand-gold/50 bg-white text-center">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-2">
            {welcome?.desc || "Your welcome code"}
          </p>
          <button
            onClick={copyCode}
            data-testid="newsletter-copy-code"
            className="inline-flex items-center gap-3 font-display text-h2 text-brand-obsidian tracking-[0.12em] hover:text-brand-obsidian-soft transition-colors"
          >
            <span>{welcome?.code}</span>
            {copied ? <Check className="w-6 h-6 text-brand-gold" /> : <Copy className="w-5 h-5 text-brand-gold" />}
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setWelcome(null)} className="w-full sm:w-auto">
            Close
          </Button>
          <Button asChild variant="primary" className="w-full sm:w-auto">
            <a href="/products">Shop now <Sparkles className="w-4 h-4" /></a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { subscribe, loading, welcome, modal };
}

/**
 * NewsletterSection — full-width newsletter block for home page.
 */
export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const { subscribe, loading, modal } = useNewsletter();

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await subscribe(email, "home_section");
    if (res.ok) setEmail("");
  };

  return (
    <>
      <section className="relative bg-brand-obsidian overflow-hidden" data-testid="home-newsletter-section">
        <div className="absolute inset-0 pointer-events-none opacity-30"
             style={{ background: "radial-gradient(circle at 70% 30%, rgba(232, 168, 74,0.35), transparent 60%)" }} />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-10 py-24 text-center">
          <p className="eyebrow text-brand-gold tracking-[0.3em] mb-4">
            Dawn letter
          </p>
          <h2 className="text-h2 text-brand-parchment">
            Stories from the grove.
            <br />
            <span className="text-brand-gold">Straight to your kitchen.</span>
          </h2>
          <p className="font-body text-brand-parchment/75 mt-6 max-w-xl mx-auto">
            Monthly — recipes, harvest notes, early access to new presses.
            Subscribe now and get <strong className="text-brand-gold">10% off</strong> your first bottle.
          </p>
          <form onSubmit={onSubmit} className="mt-10 max-w-md mx-auto flex gap-3" data-testid="home-newsletter-form">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              data-testid="home-newsletter-email"
              className="h-12 bg-brand-parchment/10 border-brand-gold/30 text-brand-parchment placeholder:text-brand-parchment/45 focus-visible:ring-brand-gold focus-visible:border-brand-gold rounded-pill px-5"
            />
            <Button type="submit" variant="primary" size="md" loading={loading} data-testid="home-newsletter-submit">
              Claim 10% off
            </Button>
          </form>
        </div>
      </section>
      {modal}
    </>
  );
}
