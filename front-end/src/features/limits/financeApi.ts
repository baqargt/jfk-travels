import { apiRequest } from "@/api/client";
import type { ApiLedgerEntry, ApiPage, ApiTemporaryLimit, FinancialAccount } from "@/api/types";
import type { LedgerEntry } from "@/types";

export async function loadAccounts(type?: "cash" | "credit") {
  const accounts = await apiRequest<FinancialAccount[]>("/financial-accounts");
  return type ? accounts.filter((account) => account.accountType === type) : accounts;
}

export async function loadLedger(accountId?: string): Promise<LedgerEntry[]> {
  if (!accountId) return [];
  const page = await apiRequest<ApiPage<ApiLedgerEntry>>(`/financial-accounts/${accountId}/ledger?page_size=100`);
  return page.items.map((entry) => ({
    date: entry.date,
    reference: entry.reference,
    description: entry.description,
    debit: Number(entry.debit),
    credit: Number(entry.credit),
    balance: Number(entry.balance),
  }));
}

export const loadTemporaryLimits = () => apiRequest<ApiPage<ApiTemporaryLimit>>("/limits/temporary?page_size=100");
