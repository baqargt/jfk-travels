import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/api/client";
import type { FinancialAccount } from "@/api/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";

interface AdjustLimitModalProps {
  open: boolean;
  onClose: () => void;
  mode: "cash" | "credit" | "temp";
}

const titles: Record<AdjustLimitModalProps["mode"], { title: string; submit: string }> = {
  cash: { title: "Allocate Cash", submit: "Allocate Funds" },
  credit: { title: "Request Credit Limit Change", submit: "Submit Request" },
  temp: { title: "Request Temporary Limit", submit: "Submit for Approval" },
};

export default function AdjustLimitModal({ open, onClose, mode }: AdjustLimitModalProps) {
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useQuery({
    queryKey: ["financial-accounts"],
    queryFn: () => apiRequest<FinancialAccount[]>("/financial-accounts"),
    enabled: open,
  });
  const choices = useMemo(
    () => accounts.filter((account) => account.accountType === (mode === "cash" ? "cash" : "credit")),
    [accounts, mode],
  );
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accountId && choices[0]) setAccountId(choices[0].id);
  }, [accountId, choices]);

  const close = () => {
    setAmount("");
    setDate("");
    setReason("");
    setRemarks("");
    setError("");
    onClose();
  };

  const submit = async () => {
    if (!accountId || Number(amount) <= 0 || !reason) {
      setError("Account, amount and reason are required.");
      return;
    }
    if (mode === "temp" && !date) {
      setError("Temporary limit expiry date is required.");
      return;
    }
    setSaving(true);
    setError("");
    const fullReason = remarks.trim() ? `${reason}: ${remarks.trim()}` : reason;
    try {
      if (mode === "cash") {
        await apiRequest(`/financial-accounts/${accountId}/allocate`, {
          method: "POST",
          body: { amount: Number(amount), reason: fullReason },
        });
      } else if (mode === "credit") {
        await apiRequest("/limits/adjustments", {
          method: "POST",
          body: { accountId, newLimit: Number(amount), reason: fullReason },
        });
      } else {
        await apiRequest("/limits/temporary", {
          method: "POST",
          body: { accountId, amount: Number(amount), expiresAt: new Date(`${date}T23:59:59Z`).toISOString(), reason: fullReason },
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financial-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["ledger"] }),
        queryClient.invalidateQueries({ queryKey: ["temporary-limits"] }),
      ]);
      close();
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : "Request could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const t = titles[mode];
  return (
    <Modal
      open={open}
      onClose={close}
      title={t.title}
      subtitle={mode === "cash" ? "Cash allocations are audited immediately." : "A different Manager or Administrator must approve this request."}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={saving}>{saving ? "Saving..." : t.submit}</Button>
        </>
      }
    >
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Financial account" required className="sm:col-span-2">
          <Select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            <option value="">Select account...</option>
            {choices.map((account) => (
              <option key={account.id} value={account.id}>{account.accountType.toUpperCase()} · {account.currency} · {account.branchId ?? "Company"}</option>
            ))}
          </Select>
        </FormField>
        <FormField label={mode === "credit" ? "New limit (USD)" : "Amount (USD)"} required>
          <Input type="number" min={0.01} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
        </FormField>
        {mode === "temp" && (
          <FormField label="Expiry date" required>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </FormField>
        )}
        <FormField label="Reason" required className="sm:col-span-2">
          <Select value={reason} onChange={(event) => setReason(event.target.value)}>
            <option value="" disabled>Select a reason...</option>
            {["Operational float top-up", "Festive / peak season demand", "Group booking handling", "Corporate account overflow", "Other"].map((value) => <option key={value}>{value}</option>)}
          </Select>
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Context for the finance approver..." />
        </FormField>
      </div>
    </Modal>
  );
}
