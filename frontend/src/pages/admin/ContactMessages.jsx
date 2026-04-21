import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { adminApi, formatDate } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = ["all", "new", "read", "resolved"];
const CLR = { new: "bg-amber-100 text-amber-800", read: "bg-sky-100 text-sky-800", resolved: "bg-emerald-100 text-emerald-700" };

export default function AdminContactMessages() {
  const [tab, setTab] = useState("new");
  const [rows, setRows] = useState([]);
  const load = async () => {
    try { const d = await adminApi.contactList(tab === "all" ? undefined : tab); setRows(d.messages); }
    catch { toast.error("Failed"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const mark = async (id, status) => {
    try { await adminApi.contactUpdate(id, status); toast.success("Updated"); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6" data-testid="admin-contact">
      <div>
        <p className="eyebrow text-brand-gold tracking-[0.3em]">Inbox</p>
        <h1 className="font-display text-4xl text-brand-obsidian">Contact messages</h1>
      </div>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            "px-4 h-9 rounded-pill font-body text-xs tracking-widest uppercase border",
            tab === t ? "bg-brand-obsidian text-brand-gold border-brand-obsidian" : "border-brand-gold/30 text-brand-husk hover:border-brand-gold",
          )} data-testid={`contact-tab-${t}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="bg-white border border-brand-gold/20 rounded-lg p-5" data-testid={`contact-card-${m.id}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-display text-brand-obsidian">{m.name}</p>
              <span className="font-body text-sm text-ink-muted">{m.email}</span>
              {m.phone && <span className="font-body text-sm text-ink-muted">{m.phone}</span>}
              <Badge className={`${CLR[m.status] || ""} border-0 font-body text-[10px] uppercase tracking-widest`}>{m.status}</Badge>
              <span className="font-body text-xs text-ink-muted ml-auto">{formatDate(m.created_at, true)}</span>
            </div>
            {m.subject && <p className="font-display text-brand-obsidian mt-2">{m.subject}</p>}
            <p className="font-body text-sm text-brand-husk mt-1 whitespace-pre-wrap">{m.message}</p>
            <div className="mt-3 flex gap-2">
              <Button asChild variant="primary" size="sm"><a href={`mailto:${m.email}?subject=Re:${encodeURIComponent(m.subject || "your Karijeeva enquiry")}`}><Mail className="w-4 h-4" /> Reply</a></Button>
              {m.status !== "read" && <Button variant="secondary" size="sm" onClick={() => mark(m.id, "read")} data-testid={`contact-mark-read-${m.id}`}>Mark read</Button>}
              {m.status !== "resolved" && <Button variant="ghost" size="sm" onClick={() => mark(m.id, "resolved")} data-testid={`contact-mark-resolved-${m.id}`}>Resolve</Button>}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="bg-white border border-brand-gold/20 rounded-lg p-10 text-center font-body text-ink-muted">No messages in this tab.</p>}
      </div>
    </div>
  );
}
