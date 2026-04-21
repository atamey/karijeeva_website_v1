import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Every key the admin form is allowed to patch — kept flat so the backend
// SettingsPatch and the footer's useSiteSettings() read from one shape.
const TEXT_FIELDS = [
  // Hero / editorial
  { key: "hero_headline",      label: "Hero headline",        rows: 1 },
  { key: "hero_sub",           label: "Hero sub-copy",        rows: 2 },
  { key: "hero_image",         label: "Hero image URL",       rows: 1 },
  { key: "tagline",            label: "Tagline (short)",      rows: 2 },
  { key: "vision_statement",   label: "Vision statement",     rows: 6 },
];

const COMPANY_FIELDS = [
  { key: "company_name",       label: "Company name" },
  { key: "cin",                label: "CIN" },
  { key: "registered_address", label: "Registered address" },
  { key: "fssai_license",      label: "FSSAI licence number" },
  { key: "parent_site_url",    label: "Parent site URL" },
];

const CONTACT_FIELDS = [
  { key: "support_email",      label: "Support email" },
  { key: "legal_email",        label: "Legal email" },
  { key: "privacy_email",      label: "Privacy / DPO email" },
  { key: "support_phone",      label: "Support phone" },
  { key: "hours_ist",          label: "Operating hours (IST)" },
];

const SOCIAL_FIELDS = [
  { key: "instagram_url", label: "Instagram URL" },
  { key: "facebook_url",  label: "Facebook URL" },
  { key: "youtube_url",   label: "YouTube URL" },
  { key: "whatsapp_url",  label: "WhatsApp URL" },
  { key: "linkedin_url",  label: "LinkedIn URL" },
];

export default function AdminSettings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.settingsGet().then(setForm).catch(() => toast.error("Load failed"));
  }, []);

  if (!form) return <div className="font-body text-ink-muted">Loading…</div>;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const updateContact = (k) => (e) =>
    setForm((f) => ({ ...f, contact: { ...(f.contact || {}), [k]: e.target.value } }));

  const save = async () => {
    setSaving(true);
    try {
      const patch = {};
      [...TEXT_FIELDS, ...COMPANY_FIELDS, ...CONTACT_FIELDS, ...SOCIAL_FIELDS].forEach(
        ({ key }) => { if (form[key] !== undefined) patch[key] = form[key] ?? ""; }
      );
      patch.contact = form.contact || {};
      await adminApi.settingsPatch(patch);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6" data-testid="admin-settings">
      <div>
        <p className="eyebrow text-brand-gold tracking-[0.3em]">Site</p>
        <h1 className="font-display text-4xl text-brand-obsidian">Settings</h1>
        <p className="font-body text-sm text-ink-muted mt-1">
          Changes publish immediately to the public storefront, the footer, legal pages, and invoices.
        </p>
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg p-6 space-y-5 max-w-3xl">
        <SectionHeading>Editorial</SectionHeading>
        {TEXT_FIELDS.map(({ key, label, rows }) => (
          <Field key={key} label={label}>
            {rows > 1 ? (
              <Textarea rows={rows} value={form[key] || ""} onChange={update(key)} data-testid={`settings-${key}`} />
            ) : (
              <Input value={form[key] || ""} onChange={update(key)} data-testid={`settings-${key}`} />
            )}
          </Field>
        ))}

        <SectionHeading>Company</SectionHeading>
        {COMPANY_FIELDS.map(({ key, label }) => (
          <Field key={key} label={label}>
            <Input value={form[key] || ""} onChange={update(key)} data-testid={`settings-${key}`} />
          </Field>
        ))}

        <SectionHeading>Contact</SectionHeading>
        {CONTACT_FIELDS.map(({ key, label }) => (
          <Field key={key} label={label}>
            <Input value={form[key] || ""} onChange={update(key)} data-testid={`settings-${key}`} />
          </Field>
        ))}
        <Field label="Contact — legacy address (also shown on invoices)">
          <Input value={form.contact?.address || ""} onChange={updateContact("address")} data-testid="settings-contact-address" />
        </Field>
        <Field label="Contact — legacy email (invoices)">
          <Input value={form.contact?.email || ""} onChange={updateContact("email")} data-testid="settings-contact-email" />
        </Field>
        <Field label="Contact — legacy phone (invoices)">
          <Input value={form.contact?.phone || ""} onChange={updateContact("phone")} data-testid="settings-contact-phone" />
        </Field>

        <SectionHeading>Social</SectionHeading>
        {SOCIAL_FIELDS.map(({ key, label }) => (
          <Field key={key} label={label}>
            <Input value={form[key] || ""} onChange={update(key)} data-testid={`settings-${key}`} />
          </Field>
        ))}

        <div className="pt-4">
          <Button variant="primary" onClick={save} loading={saving} data-testid="settings-save">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h3 className="font-display text-xl text-brand-obsidian pt-4 border-t border-brand-gold/20">{children}</h3>
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
