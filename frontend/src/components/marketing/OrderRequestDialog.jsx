import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const REASONS = [
  "Changed my mind",
  "Wrong product",
  "Damaged packaging",
  "Quality issue",
  "Delivery delay",
  "Other",
];

export default function OrderRequestDialog({ open, type, orderId, email = "", onClose }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = type === "return" ? "Request a return" : "Request cancellation";
  const copy = type === "return"
    ? "Tell us what went wrong and we'll get back within 24 hours with pickup details."
    : "If it hasn't shipped yet we'll cancel and issue a full refund. Please share a reason.";

  const submit = async () => {
    if (!reason) { toast.error("Please pick a reason"); return; }
    setSubmitting(true);
    try {
      const qs = email ? `?email=${encodeURIComponent(email)}` : "";
      await api.post(`/orders/${orderId}/request${qs}`, { type, reason, note });
      toast.success("We've received your request", { description: "Our team will respond within 24 hours." });
      setReason(""); setNote("");
      onClose?.();
    } catch (e) {
      const d = e?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not submit request");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent data-testid="order-request-dialog" className="bg-brand-parchment border-brand-gold/25">
        <DialogHeader>
          <p className="eyebrow text-brand-gold tracking-[0.3em]">Order {type === "return" ? "return" : "cancellation"}</p>
          <DialogTitle className="font-display text-h3 text-brand-obsidian">{title}</DialogTitle>
          <DialogDescription className="font-body text-brand-husk">{copy}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="font-body text-xs uppercase tracking-[0.2em] text-ink-muted">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-2 h-11 bg-white border-brand-gold/30 font-body" data-testid="order-request-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r} className="font-body">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-[0.2em] text-ink-muted">Notes (optional)</label>
            <Textarea
              rows={4} placeholder="Anything we should know?"
              value={note} maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2 bg-white border-brand-gold/30 font-body"
              data-testid="order-request-note"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Keep the order</Button>
          <Button variant="primary" onClick={submit} loading={submitting} data-testid="order-request-submit">
            {type === "return" ? "Submit return request" : "Submit cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
