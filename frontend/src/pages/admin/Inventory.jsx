import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Search, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, formatINR, formatDate } from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function stockClass(stock) {
  if (stock <= 10) return "bg-red-100 text-red-700";
  if (stock <= 25) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function AdminInventory() {
  const [variants, setVariants] = useState([]);
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try { const d = await adminApi.inventoryList({ q, low_only: lowOnly }); setVariants(d.variants); }
    catch { toast.error("Failed to load inventory"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, lowOnly]);

  return (
    <div className="space-y-6" data-testid="admin-inventory">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow text-brand-gold tracking-[0.3em]">Stock</p>
          <h1 className="font-display text-4xl text-brand-obsidian">Inventory</h1>
        </div>
        <Button asChild variant="secondary"><Link to="/admin/inventory/logs"><ScrollText className="w-4 h-4" /> View audit log</Link></Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-md flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-ink-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SKU / product slug" className="h-11 pl-9 bg-white border-brand-gold/30 font-body" />
        </div>
        <label className="flex items-center gap-2 text-sm font-body text-brand-husk">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} data-testid="inventory-low-only" /> Low stock only
        </label>
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm font-body" data-testid="inventory-table">
          <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Size</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">MRP</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/10">
            {variants.map((v) => (
              <tr key={v.id} data-testid={`inventory-row-${v.sku}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={v.product_image} alt="" className="w-8 h-8 rounded object-cover bg-brand-parchment-soft" />
                    <span className="font-display text-brand-obsidian">{v.product_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{v.size}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">{v.sku}</td>
                <td className="px-4 py-3 text-right">{formatINR(v.price)}</td>
                <td className="px-4 py-3 text-right text-ink-muted line-through">{formatINR(v.mrp)}</td>
                <td className="px-4 py-3 text-right">
                  <Badge className={cn("border-0 font-body text-[10px] uppercase tracking-widest", stockClass(v.stock))}>
                    {v.stock <= 10 && <AlertTriangle className="w-3 h-3" />}
                    {v.stock}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(v)} data-testid={`inventory-edit-${v.sku}`}>Adjust</Button>
                </td>
              </tr>
            ))}
            {variants.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-muted">No variants match your filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <AdjustDialog variant={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function AdjustDialog({ variant, onClose, onSaved }) {
  const [stock, setStock] = useState(variant.stock);
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await adminApi.inventoryUpdate(variant.id, { new_stock: Number(stock), reason, note });
      toast.success("Stock updated");
      onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-testid="inventory-adjust-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-brand-obsidian">Adjust stock — {variant.sku}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">New stock level</label>
            <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} data-testid="adjust-stock" />
            <p className="text-xs text-ink-muted mt-1">Current: {variant.stock} · Change: {Number(stock) - variant.stock}</p>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-10" data-testid="adjust-reason"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">Restock</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="audit">Audit correction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea rows={2} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving} data-testid="adjust-save">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ reason: "", variant_id: "" });

  const load = async () => {
    try {
      const params = {};
      if (filters.reason) params.reason = filters.reason;
      if (filters.variant_id) params.variant_id = filters.variant_id;
      const d = await adminApi.inventoryLogs(params); setLogs(d.logs);
    } catch { toast.error("Failed to load logs"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters]);

  return (
    <div className="space-y-6" data-testid="admin-inventory-logs">
      <div>
        <p className="eyebrow text-brand-gold tracking-[0.3em]">Audit</p>
        <h1 className="font-display text-4xl text-brand-obsidian">Inventory logs</h1>
      </div>
      <div className="flex gap-3">
        <Select value={filters.reason || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, reason: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-10 w-[200px]"><SelectValue placeholder="All reasons" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reasons</SelectItem>
            <SelectItem value="restock">Restock</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="audit">Audit</SelectItem>
            <SelectItem value="sale">Sale</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Filter by variant id" value={filters.variant_id} onChange={(e) => setFilters((f) => ({ ...f, variant_id: e.target.value }))} className="h-10 max-w-sm" />
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Variant</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-right">New stock</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">By</th>
              <th className="px-4 py-3 text-left">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/10">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-ink-muted">{formatDate(l.created_at, true)}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.variant_id?.slice(0, 8)}</td>
                <td className={cn("px-4 py-2 text-right font-display", l.change > 0 ? "text-emerald-600" : "text-red-700")}>{l.change > 0 ? `+${l.change}` : l.change}</td>
                <td className="px-4 py-2 text-right">{l.new_stock ?? "—"}</td>
                <td className="px-4 py-2 capitalize">{l.reason}</td>
                <td className="px-4 py-2 text-ink-muted">{l.admin_email || "system"}</td>
                <td className="px-4 py-2 text-ink-muted">{l.note}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-muted">No logs yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
