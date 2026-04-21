import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { adminApi, formatDate } from "@/lib/adminApi";
import { Input } from "@/components/ui/input";

export default function AdminNewsletter() {
  const [subs, setSubs] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    adminApi.newsletterList({ q }).then((d) => setSubs(d.subscribers)).catch(() => toast.error("Load failed"));
  }, [q]);
  return (
    <div className="space-y-6" data-testid="admin-newsletter">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">Subscribers</p>
          <h1 className="font-display text-4xl text-brand-obsidian">Newsletter</h1>
          <p className="font-body text-sm text-ink-muted mt-1">{subs.length} subscribers</p>
        </div>
        <a href={adminApi.newsletterCsvUrl()} className="inline-flex items-center gap-2 px-4 h-10 rounded-pill bg-brand-obsidian text-brand-gold font-body text-xs tracking-widest uppercase">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3.5 text-ink-muted" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email" className="h-11 pl-9 bg-white border-brand-gold/30 font-body" />
      </div>
      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm font-body" data-testid="newsletter-table">
          <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
            <tr><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Source</th><th className="px-4 py-3 text-left">Subscribed</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/10">
            {subs.map((s) => (
              <tr key={s.id || s.email}>
                <td className="px-4 py-2 text-brand-husk">{s.email}</td>
                <td className="px-4 py-2 capitalize text-ink-muted">{s.source}</td>
                <td className="px-4 py-2 text-ink-muted">{formatDate(s.subscribed_at, true)}</td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={3} className="px-4 py-12 text-center text-ink-muted">No subscribers.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
