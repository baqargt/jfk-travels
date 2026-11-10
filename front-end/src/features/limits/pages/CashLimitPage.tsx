import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Pencil, Plus, Wallet } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import LedgerTable from "@/features/limits/components/LedgerTable";
import LimitSummaryCards from "@/features/limits/components/LimitSummaryCards";
import AdjustLimitModal from "@/features/limits/components/AdjustLimitModal";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { loadAccounts, loadLedger } from "@/features/limits/financeApi";
import { apiStatus, type FinancialAccount } from "@/api/types";
import { fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

export default function CashLimitPage() {
  const [modal, setModal] = useState(false);
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["financial-accounts", "cash"],
    queryFn: () => loadAccounts("cash"),
  });
  const account = accounts[0];
  const { data: ledger = [] } = useQuery({
    queryKey: ["ledger", account?.id],
    queryFn: () => loadLedger(account?.id),
    enabled: Boolean(account),
  });
  const allocated = accounts.reduce((sum, item) => sum + Number(item.limitAmount), 0);
  const balance = accounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const used = Math.max(0, allocated - balance);

  const columns: Column<FinancialAccount>[] = [
    {
      key: "id",
      header: "Account",
      render: (item) => <span className="font-mono text-xs">{item.id.slice(0, 8)}</span>,
    },
    { key: "currency", header: "Currency" },
    {
      key: "limitAmount",
      header: "Limit",
      className: "tabular-nums",
      render: (item) => fmtMoney(Number(item.limitAmount)),
    },
    {
      key: "balance",
      header: "Balance",
      className: "tabular-nums",
      render: (item) => fmtMoney(Number(item.balance)),
    },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={apiStatus(item.status)} /> },
    {
      key: "actions",
      header: "",
      headerClassName: "!text-right",
      className: "!text-right",
      render: (item) => (
        <Link to={PATHS.limits.editCashAccount(item.id)} title="Edit cash account">
          <Button variant="ghost" size="icon" className="!h-8 !w-8 text-slate-400 hover:text-brand-600">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Cash Limit" description="Cash float allocation and append-only ledger." />
      <LimitSummaryCards
        cards={[
          { label: "Configured Limit", value: fmtMoney(allocated), sub: "Current account ceiling" },
          { label: "Utilized", value: fmtMoney(used), bar: { used, total: allocated, color: "bg-emerald-500" } },
          { label: "Available Balance", value: fmtMoney(balance), sub: isLoading ? "Loading..." : `${accounts.length} cash account(s)` },
          { label: "Ledger Entries", value: String(ledger.length), sub: "Latest 100 entries" },
        ]}
        actions={
          <>
            <Button onClick={() => setModal(true)}>
              <Plus className="h-4 w-4" />
              Allocate Funds
            </Button>
            <Button variant="secondary" disabled>
              <ArrowDownToLine className="h-4 w-4" />
              Recall via reversal
            </Button>
          </>
        }
      />
      <div className="mb-6">
        <DataTable
          columns={columns}
          data={accounts}
          rowKey={(item) => item.id}
          searchPlaceholder="Search cash accounts..."
          searchKeys={["id", "currency", "status"]}
          emptyTitle="No cash accounts"
          emptyMessage="Create a cash account to start allocating funds."
        />
      </div>
      <LedgerTable entries={ledger} />
      <p className="mt-3 flex items-center gap-1.5 px-1 text-xs text-slate-400">
        <Wallet className="h-3.5 w-3.5" />
        Balances update from PostgreSQL after every posted ledger entry.
      </p>
      <AdjustLimitModal open={modal} onClose={() => setModal(false)} mode="cash" />
    </>
  );
}
