import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Pencil, TrendingUp, Wallet } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import LedgerTable from "@/features/limits/components/LedgerTable";
import LimitSummaryCards from "@/features/limits/components/LimitSummaryCards";
import AdjustLimitModal from "@/features/limits/components/AdjustLimitModal";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { loadAccounts, loadLedger } from "@/features/limits/financeApi";
import { apiStatus, type FinancialAccount } from "@/api/types";
import { fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

export default function CreditLimitPage() {
  const [modal, setModal] = useState(false);
  const { data: accounts = [] } = useQuery({
    queryKey: ["financial-accounts", "credit"],
    queryFn: () => loadAccounts("credit"),
  });
  const account = accounts[0];
  const { data: ledger = [] } = useQuery({
    queryKey: ["ledger", account?.id],
    queryFn: () => loadLedger(account?.id),
    enabled: Boolean(account),
  });
  const limit = accounts.reduce((sum, item) => sum + Number(item.limitAmount), 0);
  const available = accounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const utilized = Math.max(0, limit - available);
  const utilization = limit ? Math.round((utilized / limit) * 100) : 0;

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
      header: "Available",
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
        <Link to={PATHS.limits.editCreditAccount(item.id)} title="Edit credit account">
          <Button variant="ghost" size="icon" className="!h-8 !w-8 text-slate-400 hover:text-brand-600">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Credit Limit"
        description="Credit utilization, settlements and approval-controlled limit changes."
        actions={
          <Button onClick={() => setModal(true)}>
            <TrendingUp className="h-4 w-4" />
            Adjust Limits
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Credit Limit" value={fmtMoney(limit)} note="Organization ceiling" icon={TrendingUp} tone="blue" />
        <StatCard label="Utilized" value={fmtMoney(utilized)} note={`${utilization}% of ceiling`} icon={CalendarClock} tone="amber" />
        <StatCard label="Available" value={fmtMoney(available)} note="Available for reservations" icon={Wallet} tone="emerald" />
        <StatCard label="Accounts" value={String(accounts.length)} note="Active credit accounts" icon={CalendarClock} tone="violet" />
      </div>
      <div className="mb-6">
        <LimitSummaryCards
          cards={[
            { label: "Utilization", value: `${utilization}%`, bar: { used: utilized, total: limit, color: "bg-brand-500" } },
            { label: "Headroom", value: fmtMoney(available), bar: { used: available, total: limit, color: "bg-emerald-500" } },
            { label: "Posted Entries", value: String(ledger.length), sub: "Latest account ledger" },
            { label: "Workflow", value: "Approval", sub: "Requester cannot self-approve" },
          ]}
        />
      </div>
      <div className="mb-6">
        <DataTable
          columns={columns}
          data={accounts}
          rowKey={(item) => item.id}
          searchPlaceholder="Search credit accounts..."
          searchKeys={["id", "currency", "status"]}
          emptyTitle="No credit accounts"
          emptyMessage="Create a credit account to manage credit limits."
        />
      </div>
      <LedgerTable entries={ledger} />
      <AdjustLimitModal open={modal} onClose={() => setModal(false)} mode="credit" />
    </>
  );
}
