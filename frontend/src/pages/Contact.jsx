import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Mail, Phone, Clock } from "lucide-react";

import Seo, { breadcrumbLd } from "@/components/seo/Seo";
import { postContact } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ScrollReveal from "@/components/marketing/ScrollReveal";

export default function Contact() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email, and message");
      return;
    }
    setLoading(true);
    try {
      await postContact(form);
      toast.success("Message received — we'll write back within a day.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not send. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Contact Karijeeva"
        description="Write to Karijeeva — for wholesale, partnerships, or a recipe question. We respond within one working day."
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])}
      />

      <section className="bg-brand-parchment-soft border-b border-brand-gold/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
          <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase mb-3">Say hello</p>
          <h1 className="text-h1 text-brand-obsidian">We'd love to <span className="gold-underline">hear from you.</span></h1>
          <p className="font-body text-body-lg text-ink-muted mt-5 max-w-2xl">
            Wholesale enquiries, recipe questions, the occasional love-letter. We read every message.
          </p>
        </div>
      </section>

      <section className="bg-brand-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-3 gap-14">
          {/* Form */}
          <form onSubmit={onSubmit} className="lg:col-span-2 space-y-5" data-testid="contact-form">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Name *">
                <Input data-testid="contact-name" required value={form.name} onChange={set("name")} placeholder="Your name" className="h-11 bg-white border-brand-gold/30 focus-visible:ring-brand-gold" />
              </Field>
              <Field label="Email *">
                <Input data-testid="contact-email" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" className="h-11 bg-white border-brand-gold/30 focus-visible:ring-brand-gold" />
              </Field>
              <Field label="Phone">
                <Input data-testid="contact-phone" value={form.phone} onChange={set("phone")} placeholder="+91 98XXX XXXXX" className="h-11 bg-white border-brand-gold/30 focus-visible:ring-brand-gold" />
              </Field>
              <Field label="Subject">
                <Input data-testid="contact-subject" value={form.subject} onChange={set("subject")} placeholder="Wholesale / Partnership / Recipe" className="h-11 bg-white border-brand-gold/30 focus-visible:ring-brand-gold" />
              </Field>
            </div>
            <Field label="Message *">
              <Textarea data-testid="contact-message" required rows={7} value={form.message} onChange={set("message")} placeholder="Tell us about your enquiry..." className="bg-white border-brand-gold/30 focus-visible:ring-brand-gold" />
            </Field>
            <Button type="submit" variant="primary" size="lg" loading={loading} data-testid="contact-submit">
              Send message
            </Button>
          </form>

          {/* Sidebar */}
          <aside className="space-y-8">
            <ScrollReveal>
              <InfoRow icon={MapPin} title="Address" body={"Kadle Global Pvt Ltd\n42 Indiranagar 6th Main\nBengaluru 560038"} />
              <InfoRow icon={Mail} title="Email" body="hello@karijeeva.in" />
              <InfoRow icon={Phone} title="Phone" body="+91 80 4567 2890" />
              <InfoRow icon={Clock} title="Hours" body="Mon–Sat · 10 AM – 6 PM IST" />
            </ScrollReveal>

            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-brand-gold/20 shadow-soft">
              <iframe
                title="Karijeeva Bengaluru office"
                src="https://www.openstreetmap.org/export/embed.html?bbox=77.6395%2C12.9665%2C77.6535%2C12.9805&amp;layer=mapnik&amp;marker=12.9735%2C77.6465"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="font-body text-xs tracking-[0.2em] uppercase text-ink-muted">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, title, body }) {
  return (
    <div className="flex gap-4 mb-6">
      <span className="h-10 w-10 shrink-0 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4">
        <Icon />
      </span>
      <div>
        <p className="font-body text-xs uppercase tracking-[0.2em] text-brand-gold">{title}</p>
        <p className="font-body text-brand-husk mt-1 whitespace-pre-line leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
