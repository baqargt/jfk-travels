import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Plus, Wallet } from "lucide-react";
import LedgerTable from "@/features/limits/components/LedgerTable";
import LimitSummaryCards from "@/features/limits/components/LimitSummaryCards";
import AdjustLimitModal from "@/features/limits/components/AdjustLimitModal";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { loadAccounts, loadLedger } from "@/features/limits/financeApi";
import { fmtMoney } from "@/lib/utils";

export default function CashLimitPage() {
  const [modal, setModal] = useState(false);
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ["financial-accounts", "cash"], queryFn: () => loadAccounts("cash") });
  const account = accounts[0];
  const { data: ledger = [] } = useQuery({ queryKey: ["ledger", account?.id], queryFn: () => loadLedger(account?.id), enabled: Boolean(account) });
  const allocated = Number(account?.limitAmount ?? 0);
  const balance = Number(account?.balance ?? 0);
  const used = Math.max(0, allocated - balance);

  return <>
    <PageHeader title="Cash Limit" description="Cash float allocation and append-only ledger." />
    <LimitSummaryCards cards={[
      { label: "Configured Limit", value: fmtMoney(allocated), sub: "Current account ceiling" },
      { label: "Utilized", value: fmtMoney(used), bar: { used, total: allocated, color: "bg-emerald-500" } },
      { label: "Available Balance", value: fmtMoney(balance), sub: isLoading ? "Loading..." : `${accounts.length} cash account(s)` },
      { label: "Ledger Entries", value: String(ledger.length), sub: "Latest 100 entries" },
    ]} actions={<><Button onClick={() => setModal(true)}><Plus className="h-4 w-4" />Allocate Funds</Button><Button variant="secondary" disabled><ArrowDownToLine className="h-4 w-4" />Recall via reversal</Button></>} />
    <LedgerTable entries={ledger} />
    <p className="mt-3 flex items-center gap-1.5 px-1 text-xs text-slate-400"><Wallet className="h-3.5 w-3.5" />Balances update from PostgreSQL after every posted ledger entry.</p>
    <AdjustLimitModal open={modal} onClose={() => setModal(false)} mode="cash" />
  </>;
}
