import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";
import { adminApi, formatDate } from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminReviews() {
  const [tab, setTab] = useState("pending");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    try { const d = await adminApi.reviewsList(tab); setRows(d.reviews); setSelected(new Set()); }
    catch { toast.error("Failed to load reviews"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const act = async (id, action, reason) => {
    try { await adminApi.reviewAction(id, action, reason); toast.success(`Review ${action}d`); load(); }
    catch { toast.error("Failed"); }
  };

  const bulkAct = async (action) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await Promise.all(ids.map((id) => adminApi.reviewAction(id, action).catch(() => {})));
    toast.success(`${ids.length} review(s) ${action}d`);
    load();
  };

  const toggle = (id) => {
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6" data-testid="admin-reviews">
      <div>
        <p className="eyebrow text-brand-gold tracking-[0.3em]">Moderation</p>
        <h1 className="font-display text-4xl text-brand-obsidian">Reviews</h1>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 h-9 rounded-pill font-body text-xs tracking-widest uppercase border",
              tab === t.key ? "bg-brand-obsidian text-brand-gold border-brand-obsidian" : "border-brand-gold/30 text-brand-husk hover:border-brand-gold",
            )}
            data-testid={`reviews-tab-${t.key}`}
          >{t.label}</button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="bg-brand-parchment-soft/40 rounded-lg p-3 flex items-center gap-3" data-testid="reviews-bulk-bar">
          <span className="font-body text-sm">{selected.size} selected</span>
          <Button variant="primary" size="sm" onClick={() => bulkAct("approve")} data-testid="reviews-bulk-approve"><Check className="w-4 h-4" /> Approve all</Button>
          <Button variant="secondary" size="sm" onClick={() => bulkAct("reject")} data-testid="reviews-bulk-reject"><X className="w-4 h-4" /> Reject all</Button>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="bg-white border border-brand-gold/20 rounded-lg p-5 flex gap-4" data-testid={`review-card-${r.id}`}>
            <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <Rating value={r.rating} size={14} />
                {r.is_verified_buyer && <Badge className="bg-brand-gold/15 text-brand-gold border-0 font-body text-[10px] uppercase tracking-widest">Verified buyer</Badge>}
                <span className="font-body text-xs text-ink-muted">{r.user_name} · {formatDate(r.created_at)}</span>
                <span className="font-body text-xs text-ink-muted ml-auto">{r.product_slug}</span>
              </div>
              {r.title && <p className="font-display text-brand-obsidian mt-1">{r.title}</p>}
              <p className="font-body text-sm text-brand-husk mt-1">{r.body}</p>
              {r.reject_reason && <p className="font-body text-xs text-red-700 mt-1">Rejected: {r.reject_reason}</p>}
            </div>
            <div className="flex flex-col gap-2">
              {tab !== "approved" && <Button variant="primary" size="sm" onClick={() => act(r.id, "approve")} data-testid={`review-approve-${r.id}`}><Check className="w-4 h-4" /> Approve</Button>}
              {tab !== "rejected" && <Button variant="secondary" size="sm" onClick={() => act(r.id, "reject", window.prompt("Reason (optional):") || "")} data-testid={`review-reject-${r.id}`}><X className="w-4 h-4" /> Reject</Button>}
              <Button variant="ghost" size="sm" onClick={() => window.confirm("Delete review?") && act(r.id, "delete")} data-testid={`review-delete-${r.id}`}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="bg-white border border-brand-gold/20 rounded-lg p-10 text-center font-body text-ink-muted">No reviews in this tab.</p>}
      </div>
    </div>
  );
}
