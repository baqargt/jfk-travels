import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import type { ApiTemporaryLimit } from "@/api/types";
import { fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditTempLimitPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { limitId } = useParams<{ limitId: string }>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("pending");

  const { data: limit, isLoading, error: loadError } = useQuery({
    queryKey: ["temporary-limits", limitId],
    queryFn: () => apiRequest<ApiTemporaryLimit>(`/limits/temporary/${limitId}`),
    enabled: Boolean(limitId),
  });

  useEffect(() => {
    if (!limit) return;
    setAmount(String(Number(limit.amount) || 0));
    setExpiresAt(toLocalInputValue(limit.expiresAt));
    setReason(limit.reason);
    setStatus(limit.status);
  }, [limit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!limitId) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/limits/temporary/${limitId}`, {
        method: "PATCH",
        body: {
          amount: Number(amount) || 0,
          expiresAt: new Date(expiresAt).toISOString(),
          reason: reason.trim(),
          status,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["temporary-limits"] });
      navigate(PATHS.limits.temp, { replace: true });
    } catch (reasonErr) {
      setError(reasonErr instanceof Error ? reasonErr.message : "Temporary limit could not be updated.");
      setSaving(false);
    }
  };

  const editable = limit?.status === "pending" || limit?.status === "active";

  return (
    <>
      <PageHeader
        title="Edit Temp Limit"
        description="Update amount, expiry, reason and status for a pending or active temporary limit."
      />

      {isLoading && <p className="mb-4 text-sm text-slate-500">Loading temporary limit...</p>}
      {loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Temporary limit could not be loaded."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card title="Temporary Limit">
          {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {!editable && limit && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This temporary limit is {limit.status} and can no longer be edited.
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Account">
              <Input value={limit?.accountId?.slice(0, 8) ?? "—"} disabled />
            </FormField>
            <FormField label="Already used" hint="Read-only">
              <Input value={limit ? fmtMoney(Number(limit.used)) : "—"} disabled />
            </FormField>
            <FormField label="Amount" required>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={!editable} />
            </FormField>
            <FormField label="Expires at" required>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} disabled={!editable} />
            </FormField>
            <FormField label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={!editable}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormField>
            <FormField label="Reason" className="sm:col-span-2" required>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} disabled={!editable} />
            </FormField>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="ghost" type="button" onClick={() => navigate(PATHS.limits.temp)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || isLoading || !editable || !reason.trim() || !expiresAt}>
              {saving ? "Saving..." : (
                <>
                  <CircleCheck className="h-4 w-4" />
                  Save Temp Limit
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
