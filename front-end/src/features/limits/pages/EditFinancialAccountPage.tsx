import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import type { ApiBranch, ApiPage, FinancialAccount } from "@/api/types";
import { fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "PKR"] as const;

export default function EditFinancialAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { accountId } = useParams<{ accountId: string }>();
  const isCredit = location.pathname.includes("/limits/credit/");
  const backPath = isCredit ? PATHS.limits.credit : PATHS.limits.cash;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [branchId, setBranchId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [limitAmount, setLimitAmount] = useState("0");
  const [status, setStatus] = useState("active");

  const { data: account, isLoading, error: loadError } = useQuery({
    queryKey: ["financial-accounts", accountId],
    queryFn: () => apiRequest<FinancialAccount>(`/financial-accounts/${accountId}`),
    enabled: Boolean(accountId),
  });
  const { data: branchPage } = useQuery({
    queryKey: ["branches", "account-form"],
    queryFn: () => apiRequest<ApiPage<ApiBranch>>("/branches?page_size=100"),
  });

  useEffect(() => {
    if (!account) return;
    setBranchId(account.branchId ?? "");
    setCurrency(account.currency || "USD");
    setLimitAmount(String(Number(account.limitAmount) || 0));
    setStatus(account.status || "active");
  }, [account]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/financial-accounts/${accountId}`, {
        method: "PATCH",
        body: {
          branchId: branchId || null,
          currency,
          limitAmount: Number(limitAmount) || 0,
          status,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      navigate(backPath, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Account could not be updated.");
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isCredit ? "Edit Credit Account" : "Edit Cash Account"}
        description="Update branch, currency, configured limit and status. Balance remains ledger-driven."
      />

      {isLoading && <p className="mb-4 text-sm text-slate-500">Loading account...</p>}
      {loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Account could not be loaded."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card title="Account Details">
          {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Account type">
              <Input value={account?.accountType ?? (isCredit ? "credit" : "cash")} disabled />
            </FormField>
            <FormField label="Current balance" hint="Read-only · updated by ledger postings">
              <Input value={account ? fmtMoney(Number(account.balance)) : "—"} disabled />
            </FormField>
            <FormField label="Branch">
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Company-wide</option>
                {(branchPage?.items ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Currency">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Configured limit" required>
              <Input type="number" min={0} step="0.01" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} />
            </FormField>
            <FormField label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="ghost" type="button" onClick={() => navigate(backPath)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || isLoading}>
              {saving ? "Saving..." : (
                <>
                  <CircleCheck className="h-4 w-4" />
                  Save Account
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
