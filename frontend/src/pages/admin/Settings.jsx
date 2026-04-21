import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdminSettings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { adminApi.settingsGet().then(setForm).catch(() => toast.error("Load failed")); }, []);

  if (!form) return <div className="font-body text-ink-muted">Loading…</div>;
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const updateContact = (k) => (e) => setForm((f) => ({ ...f, contact: { ...(f.contact || {}), [k]: e.target.value } }));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.settingsPatch({
        tagline: form.tagline,
        vision_statement: form.vision_statement,
        hero_headline: form.hero_headline,
        hero_sub: form.hero_sub,
        hero_image: form.hero_image,
        contact: form.contact,
      });
      toast.success("Settings saved");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6" data-testid="admin-settings">
      <div>
        <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">Site</p>
        <h1 className="font-display text-4xl text-brand-obsidian">Settings</h1>
        <p className="font-body text-sm text-ink-muted mt-1">Changes publish immediately to the public storefront.</p>
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg p-6 space-y-5 max-w-3xl">
        <Field label="Hero headline"><Input value={form.hero_headline || ""} onChange={update("hero_headline")} /></Field>
        <Field label="Hero sub-copy"><Textarea rows={2} value={form.hero_sub || ""} onChange={update("hero_sub")} /></Field>
        <Field label="Hero image URL"><Input value={form.hero_image || ""} onChange={update("hero_image")} /></Field>
        <Field label="Tagline (short)"><Textarea rows={2} value={form.tagline || ""} onChange={update("tagline")} /></Field>
        <Field label="Vision statement (long)"><Textarea rows={6} value={form.vision_statement || ""} onChange={update("vision_statement")} data-testid="settings-vision" /></Field>

        <h3 className="font-display text-xl text-brand-obsidian pt-4 border-t border-brand-gold/20">Contact</h3>
        <Field label="Address"><Input value={form.contact?.address || ""} onChange={updateContact("address")} /></Field>
        <Field label="Email"><Input value={form.contact?.email || ""} onChange={updateContact("email")} /></Field>
        <Field label="Phone"><Input value={form.contact?.phone || ""} onChange={updateContact("phone")} /></Field>
        <Field label="Hours"><Input value={form.contact?.hours || ""} onChange={updateContact("hours")} /></Field>

        <div className="pt-4">
          <Button variant="primary" onClick={save} loading={saving} data-testid="settings-save">Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="font-body text-xs uppercase tracking-widest text-ink-muted block mb-2">{label}</label>
      {children}
    </div>
  );
}
