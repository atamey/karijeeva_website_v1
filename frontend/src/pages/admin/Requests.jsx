import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { adminApi, formatDate } from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_CLR = {
  open:       "bg-amber-100 text-amber-800",
  in_review:  "bg-sky-100 text-sky-800",
  resolved:   "bg-emerald-100 text-emerald-700",
  declined:   "bg-stone-200 text-stone-700",
};
const TABS = ["all", "open", "in_review", "resolved", "declined"];

export default function AdminRequests() {
  const [tab, setTab] = useState("open");
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try { const d = await adminApi.requestsList(tab === "all" ? undefined : tab); setRows(d.requests); }
    catch { toast.error("Failed to load"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  return (
    <div className="space-y-6" data-testid="admin-requests">
      <div>
        <p className="eyebrow text-brand-gold tracking-[0.3em]">Queue</p>
        <h1 className="font-display text-4xl text-brand-obsidian">Cancellations & returns</h1>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            "px-4 h-9 rounded-pill font-body text-xs tracking-widest uppercase border",
            tab === t ? "bg-brand-obsidian text-brand-gold border-brand-obsidian" : "border-brand-gold/30 text-brand-husk hover:border-brand-gold",
          )} data-testid={`requests-tab-${t}`}>{t.replace("_", " ")}</button>
        ))}
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm font-body" data-testid="requests-table">
          <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/10">
            {rows.map((r) => (
              <tr key={r.id} data-testid={`request-row-${r.id}`}>
                <td className="px-4 py-3"><Link to={`/admin/orders/${r.order_id}`} className="font-display text-brand-obsidian hover:text-brand-gold">{r.order_number}</Link></td>
                <td className="px-4 py-3 capitalize">{r.type}</td>
                <td className="px-4 py-3">{r.reason}<br/><span className="text-xs text-ink-muted">{r.note}</span></td>
                <td className="px-4 py-3"><Badge className={`${STATUS_CLR[r.status] || ""} border-0 font-body text-[10px] uppercase tracking-widest`}>{r.status.replace("_", " ")}</Badge></td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => setEditing(r)} data-testid={`request-manage-${r.id}`}>Manage</Button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">No requests in this tab.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <RequestDialog req={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function RequestDialog({ req, onClose, onSaved }) {
  const [status, setStatus] = useState(req.status);
  const [note, setNote] = useState(req.admin_note || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await adminApi.requestUpdate(req.id, { status, admin_note: note }); toast.success("Updated"); onSaved(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-testid="request-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-brand-obsidian">Manage {req.type} · {req.order_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="font-body text-sm"><strong>Customer reason:</strong> {req.reason}</p>
          {req.note && <p className="font-body text-sm text-ink-muted">{req.note}</p>}
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10" data-testid="request-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea rows={3} placeholder="Internal note" value={note} onChange={(e) => setNote(e.target.value)} data-testid="request-note" />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving} data-testid="request-save">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
