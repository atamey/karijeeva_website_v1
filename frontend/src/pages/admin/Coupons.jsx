import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, BarChart3 } from "lucide-react";
import { adminApi, formatINR, formatDate } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

const EMPTY = { code: "", type: "percent", value: 10, min_order: 499, max_uses: 10000, active: true, expires_at: "", description: "" };

function isExpired(c) {
  if (!c.expires_at) return false;
  try { return new Date(c.expires_at) < new Date(); } catch { return false; }
}
function coveragelabel(c) {
  if (!c.active) return { label: "Inactive", cls: "bg-stone-200 text-stone-600" };
  if (isExpired(c)) return { label: "Expired", cls: "bg-red-100 text-red-700" };
  if (c.used_count >= c.max_uses) return { label: "Used up", cls: "bg-amber-100 text-amber-700" };
  return { label: "Active", cls: "bg-emerald-100 text-emerald-700" };
}

export default function AdminCoupons() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState(null);

  const load = async () => {
    try { const d = await adminApi.couponsList(); setRows(d.coupons); }
    catch { toast.error("Failed"); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try { await adminApi.couponDelete(c.code); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6" data-testid="admin-coupons">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">Discounts</p>
          <h1 className="font-display text-4xl text-brand-obsidian">Coupons</h1>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)} data-testid="coupon-new"><Plus className="w-4 h-4" /> New coupon</Button>
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm font-body" data-testid="coupons-table">
          <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Type / Value</th>
              <th className="px-4 py-3 text-right">Min order</th>
              <th className="px-4 py-3 text-right">Used / Max</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/10">
            {rows.map((c) => {
              const s = coveragelabel(c);
              return (
                <tr key={c.code} data-testid={`coupon-row-${c.code}`}>
                  <td className="px-4 py-3 font-display text-brand-obsidian">{c.code}</td>
                  <td className="px-4 py-3 capitalize">{c.type} · {c.type === "percent" ? `${c.value}%` : formatINR(c.value)}</td>
                  <td className="px-4 py-3 text-right">{formatINR(c.min_order)}</td>
                  <td className="px-4 py-3 text-right">{c.used_count || 0} / {c.max_uses}</td>
                  <td className="px-4 py-3 text-ink-muted">{c.expires_at ? formatDate(c.expires_at) : "—"}</td>
                  <td className="px-4 py-3"><Badge className={`${s.cls} border-0 font-body text-[10px] uppercase tracking-widest`}>{s.label}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={async () => { try { const d = await adminApi.couponStats(c.code); setStats(d); } catch { toast.error("Failed"); } }} data-testid={`coupon-stats-${c.code}`}><BarChart3 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(c)} data-testid={`coupon-edit-${c.code}`}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(c)} data-testid={`coupon-delete-${c.code}`}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-muted">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <CouponDialog
          initial={creating ? EMPTY : editing}
          isCreate={creating}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}

      {stats && (
        <Dialog open onOpenChange={() => setStats(null)}>
          <DialogContent data-testid="coupon-stats-dialog">
            <DialogHeader>
              <DialogTitle className="font-display text-brand-obsidian">{stats.coupon.code} · usage</DialogTitle>
              <DialogDescription className="font-body">{stats.coupon.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 font-body text-sm">
              <div className="flex justify-between"><span className="text-ink-muted">Total uses</span><span className="font-display text-brand-obsidian">{stats.stats.uses}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Discount given</span><span className="font-display text-brand-obsidian">{formatINR(stats.stats.discount_given)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Last used</span><span>{stats.stats.last_used_at ? formatDate(stats.stats.last_used_at, true) : "—"}</span></div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CouponDialog({ initial, isCreate, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.toUpperCase(), value: Number(form.value), min_order: Number(form.min_order), max_uses: Number(form.max_uses) };
      if (!payload.expires_at) delete payload.expires_at;
      if (isCreate) { await adminApi.couponCreate(payload); toast.success("Coupon created"); }
      else { const { code, ...rest } = payload; await adminApi.couponUpdate(initial.code, rest); toast.success("Coupon saved"); }
      onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-testid="coupon-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-brand-obsidian">{isCreate ? "New coupon" : `Edit ${initial.code}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Code</label>
            <Input disabled={!isCreate} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} data-testid="coupon-code" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="h-10" data-testid="coupon-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="flat">Flat (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Value</label>
              <Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Min order (₹)</label>
              <Input type="number" value={form.min_order} onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))} />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Max uses</label>
              <Input type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Expires at (optional)</label>
              <Input type="datetime-local" value={form.expires_at?.slice(0, 16) || ""} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value ? new Date(e.target.value).toISOString() : "" }))} />
            </div>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Customer-facing description</label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 font-body text-sm"><input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Active</label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving} data-testid="coupon-save">{isCreate ? "Create" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
