import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi, formatDate } from "@/lib/adminApi";
import { Input } from "@/components/ui/input";

export default function AdminAudit() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ action: "", admin_email: "", target_type: "" });
  useEffect(() => {
    const params = {};
    Object.keys(filters).forEach((k) => { if (filters[k]) params[k] = filters[k]; });
    adminApi.auditList(params).then((d) => setRows(d.logs)).catch(() => toast.error("Load failed"));
  }, [filters]);
  return (
    <div className="space-y-6" data-testid="admin-audit">
      <div>
        <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase">Accountability</p>
        <h1 className="font-display text-4xl text-brand-obsidian">Audit log</h1>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-3xl">
        <Input placeholder="Action contains" value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} />
        <Input placeholder="Admin email" value={filters.admin_email} onChange={(e) => setFilters((f) => ({ ...f, admin_email: e.target.value }))} />
        <Input placeholder="Target type" value={filters.target_type} onChange={(e) => setFilters((f) => ({ ...f, target_type: e.target.value }))} />
      </div>
      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Admin</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Target</th>
              <th className="px-4 py-3 text-left">Diff</th>
              <th className="px-4 py-3 text-left">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/10">
            {rows.map((l) => (
              <tr key={l.id} data-testid={`audit-row-${l.id}`}>
                <td className="px-4 py-2 text-ink-muted">{formatDate(l.created_at, true)}</td>
                <td className="px-4 py-2">{l.admin_email}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-2 text-xs">{l.target_type} · <span className="text-ink-muted">{l.target_id}</span></td>
                <td className="px-4 py-2 text-xs text-ink-muted font-mono">{JSON.stringify(l.diff)}</td>
                <td className="px-4 py-2 text-xs text-ink-muted">{l.ip}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">No log entries match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
