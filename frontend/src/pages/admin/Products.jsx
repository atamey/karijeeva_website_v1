import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Eye, EyeOff, Trash2, Search } from "lucide-react";
import { adminApi, formatINR } from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_PRODUCT = {
  name: "", slug: "", short_desc: "", long_desc: "", category: "wellness",
  tags: [], ingredients: "", gallery: [], is_featured: false, is_new_launch: false, is_active: true,
  variants: [{ size: "500ml", sku: "", price: 499, mrp: 599, stock: 100 }],
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // product or null
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    try { const d = await adminApi.productsList({ q, include_inactive: true }); setProducts(d.products); }
    catch { toast.error("Failed to load products"); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  const toggleDelete = async (p) => {
    if (!window.confirm(`${p.is_active ? "Deactivate" : "Restore"} "${p.name}"?`)) return;
    try { await adminApi.productDelete(p.id); toast.success(p.is_active ? "Deactivated" : "Restored"); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6" data-testid="admin-products">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow text-brand-gold tracking-[0.3em]">Catalog</p>
          <h1 className="font-display text-4xl text-brand-obsidian">Products</h1>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)} data-testid="products-new">
          <Plus className="w-4 h-4" /> New product
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3.5 text-ink-muted" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name/slug/tag" className="h-11 pl-9 bg-white border-brand-gold/30 font-body" />
      </div>

      <div className="bg-white border border-brand-gold/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm font-body" data-testid="products-table">
          <thead className="bg-brand-parchment-soft/40 text-[11px] uppercase tracking-widest text-brand-husk">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Variants</th>
              <th className="px-4 py-3 text-left">Flags</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/10">
            {products.map((p) => (
              <tr key={p.id} data-testid={`product-row-${p.slug}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.gallery?.[0]} alt={p.name} className="w-10 h-10 rounded object-cover bg-brand-parchment-soft" />
                    <div>
                      <div className="font-display text-brand-obsidian">{p.name}</div>
                      <div className="text-xs text-ink-muted">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{p.category}</td>
                <td className="px-4 py-3">
                  {p.variants?.map((v) => (
                    <div key={v.id} className="text-xs">
                      <span className="text-brand-husk">{v.size}</span> · <span className="text-brand-obsidian">{formatINR(v.price)}</span> · <span className="text-ink-muted">{v.stock} in stock</span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3 space-x-1">
                  {p.is_featured && <Badge className="bg-brand-gold/15 text-brand-gold border-0 font-body text-[10px] uppercase tracking-widest">Featured</Badge>}
                  {p.is_new_launch && <Badge className="bg-sky-100 text-sky-700 border-0 font-body text-[10px] uppercase tracking-widest">New</Badge>}
                </td>
                <td className="px-4 py-3">
                  <Badge className={cn("border-0 font-body text-[10px] uppercase tracking-widest", p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600")}>
                    {p.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(p)} data-testid={`product-edit-${p.slug}`}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleDelete(p)} data-testid={`product-toggle-${p.slug}`}>
                    {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && <ProductFormDialog product={EMPTY_PRODUCT} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} isCreate />}
      {editing && <ProductFormDialog product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function ProductFormDialog({ product, onClose, onSaved, isCreate = false }) {
  const [form, setForm] = useState(() => ({ ...product }));
  const [tagsStr, setTagsStr] = useState((product.tags || []).join(", "));
  const [galleryStr, setGalleryStr] = useState((product.gallery || []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [newVar, setNewVar] = useState({ size: "", sku: "", price: 0, mrp: 0, stock: 0 });

  const variants = useMemo(() => form.variants || [], [form.variants]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
        gallery: galleryStr.split("\n").map((u) => u.trim()).filter(Boolean),
      };
      if (isCreate) {
        await adminApi.productCreate(payload);
        toast.success("Product created");
      } else {
        const up = { ...payload };
        delete up.variants;
        await adminApi.productUpdate(product.id, up);
        toast.success("Product updated");
      }
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    } finally { setSaving(false); }
  };

  const addVariant = async () => {
    if (isCreate) {
      setForm((f) => ({ ...f, variants: [...(f.variants || []), newVar] }));
    } else {
      try { await adminApi.variantCreate(product.id, newVar); toast.success("Variant added"); onSaved(); }
      catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    }
    setNewVar({ size: "", sku: "", price: 0, mrp: 0, stock: 0 });
  };

  const updateExistingVariant = async (v, field, val) => {
    if (isCreate) {
      setForm((f) => ({ ...f, variants: f.variants.map((x) => x === v ? { ...x, [field]: val } : x) }));
      return;
    }
    try { await adminApi.variantUpdate(v.id, { [field]: val }); }
    catch { toast.error("Variant update failed"); }
  };

  const removeVariant = async (v) => {
    if (isCreate) {
      setForm((f) => ({ ...f, variants: f.variants.filter((x) => x !== v) }));
      return;
    }
    if (!window.confirm("Delete this variant permanently?")) return;
    try { await adminApi.variantDelete(v.id); toast.success("Variant deleted"); onSaved(); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="product-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-brand-obsidian">{isCreate ? "New product" : `Edit ${product.name}`}</DialogTitle>
          <DialogDescription className="font-body">Slug auto-generates from the name on create and is immutable after.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Name</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} data-testid="product-name" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Slug {!isCreate && <span className="text-brand-gold/60">(read-only)</span>}</label>
              <Input value={form.slug || ""} disabled={!isCreate} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} data-testid="product-slug" />
            </div>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Short description</label>
            <Textarea rows={2} value={form.short_desc} onChange={(e) => setForm((f) => ({ ...f, short_desc: e.target.value }))} />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Long description</label>
            <Textarea rows={4} value={form.long_desc} onChange={(e) => setForm((f) => ({ ...f, long_desc: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="culinary">Culinary</SelectItem>
                  <SelectItem value="gifting">Gifting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Tags (comma separated)</label>
              <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Gallery URLs (one per line)</label>
            <Textarea rows={3} value={galleryStr} onChange={(e) => setGalleryStr(e.target.value)} className="font-mono text-xs" />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-ink-muted">Ingredients</label>
            <Input value={form.ingredients} onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))} />
          </div>
          <div className="flex items-center gap-6 text-sm font-body">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} /> Featured</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_new_launch} onChange={(e) => setForm((f) => ({ ...f, is_new_launch: e.target.checked }))} /> New launch</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active</label>
          </div>

          {/* Variants */}
          <div className="pt-4 border-t border-brand-gold/20">
            <h4 className="font-display text-lg text-brand-obsidian mb-2">Variants</h4>
            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div key={v.id || idx} className="grid grid-cols-[80px_1fr_90px_90px_80px_auto] gap-2 items-center text-sm font-body" data-testid={`variant-row-${idx}`}>
                  <Input defaultValue={v.size} onBlur={(e) => updateExistingVariant(v, "size", e.target.value)} />
                  <Input defaultValue={v.sku} onBlur={(e) => updateExistingVariant(v, "sku", e.target.value)} />
                  <Input type="number" defaultValue={v.price} onBlur={(e) => updateExistingVariant(v, "price", Number(e.target.value))} />
                  <Input type="number" defaultValue={v.mrp} onBlur={(e) => updateExistingVariant(v, "mrp", Number(e.target.value))} />
                  <Input type="number" defaultValue={v.stock} onBlur={(e) => updateExistingVariant(v, "stock", Number(e.target.value))} />
                  <Button variant="ghost" size="sm" onClick={() => removeVariant(v)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
              <div className="grid grid-cols-[80px_1fr_90px_90px_80px_auto] gap-2 items-center text-sm font-body pt-2 border-t border-dashed border-brand-gold/20">
                <Input placeholder="size" value={newVar.size} onChange={(e) => setNewVar((v) => ({ ...v, size: e.target.value }))} />
                <Input placeholder="sku" value={newVar.sku} onChange={(e) => setNewVar((v) => ({ ...v, sku: e.target.value }))} />
                <Input type="number" placeholder="price" value={newVar.price} onChange={(e) => setNewVar((v) => ({ ...v, price: Number(e.target.value) }))} />
                <Input type="number" placeholder="mrp" value={newVar.mrp} onChange={(e) => setNewVar((v) => ({ ...v, mrp: Number(e.target.value) }))} />
                <Input type="number" placeholder="stock" value={newVar.stock} onChange={(e) => setNewVar((v) => ({ ...v, stock: Number(e.target.value) }))} />
                <Button variant="secondary" size="sm" onClick={addVariant} data-testid="variant-add">Add</Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving} data-testid="product-save">{isCreate ? "Create product" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
