import { useState } from "react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ReportFilters from "@/features/reports/components/ReportFilters";
import Tabs from "@/components/ui/Tabs";
import StatCard from "@/components/ui/StatCard";
import { Undo2, CircleCheck, Clock, Ban } from "lucide-react";
import { refunds } from "@/lib/mockFinance";
import { fmtDate, fmtMoney } from "@/lib/utils";
import type { RefundRecord } from "@/types";

export default function RefundReportsPage() {
  const [tab, setTab] = useState("All");

  const counts = {
    All: refunds.length,
    Pending: refunds.filter((r) => r.status === "Pending").length,
    Approved: refunds.filter((r) => r.status === "Approved").length,
    Rejected: refunds.filter((r) => r.status === "Rejected").length,
  };

  const filtered = tab === "All" ? refunds : refunds.filter((r) => r.status === tab);

  const columns: Column<RefundRecord>[] = [
    { key: "id", header: "Refund ID", className: "font-mono text-xs font-semibold" },
    { key: "pnr", header: "PNR / Booking", className: "font-mono text-xs" },
    { key: "passenger", header: "Passenger", render: (r) => <span className="font-medium text-slate-900">{r.passenger}</span> },
    { key: "reason", header: "Reason", render: (r) => <span className="text-xs text-slate-500">{r.reason}</span> },
    { key: "requestedOn", header: "Requested", sortValue: (r) => r.requestedOn, render: (r) => fmtDate(r.requestedOn) },
    { key: "amount", header: "Paid", sortValue: (r) => r.amount, className: "!text-right tabular-nums", render: (r) => fmtMoney(r.amount) },
    { key: "penalty", header: "Penalty", sortValue: (r) => r.penalty, className: "!text-right tabular-nums text-rose-600", render: (r) => (r.penalty > 0 ? `-${fmtMoney(r.penalty)}` : "—") },
    { key: "netRefund", header: "Net Refund", sortValue: (r) => r.netRefund, className: "!text-right font-semibold tabular-nums", render: (r) => fmtMoney(r.netRefund) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "approver", header: "Approver", render: (r) => r.approver ?? <span className="text-xs text-slate-400">Awaiting review</span> },
  ];

  return (
    <>
      <PageHeader
        title="Refund Reports"
        description="Track pending, approved and rejected refund requests with penalty breakdown."
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Review" value={String(counts.Pending)} icon={Clock} tone="amber" note="awaiting decision" />
        <StatCard label="Approved (MTD)" value={String(counts.Approved)} icon={CircleCheck} tone="emerald" note={fmtMoney(refunds.filter((r) => r.status === "Approved").reduce((s, r) => s + r.netRefund, 0))} />
        <StatCard label="Rejected (MTD)" value={String(counts.Rejected)} icon={Ban} tone="rose" note="penalties retained" />
      </div>

      <div className="mb-4">
        <Tabs
          tabs={[
            { id: "All", label: "All", count: counts.All },
            { id: "Pending", label: "Pending", count: counts.Pending },
            { id: "Approved", label: "Approved", count: counts.Approved },
            { id: "Rejected", label: "Rejected", count: counts.Rejected },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <ReportFilters statusOptions={["All statuses", "Pending", "Approved", "Rejected"]} />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        searchPlaceholder="Search PNR, passenger or reason..."
        searchKeys={["pnr", "passenger", "reason"]}
        emptyTitle="No refunds in this view"
        emptyMessage="Requests appear here as soon as customers submit them."
      />

      <p className="mt-3 flex items-center gap-1.5 px-1 text-xs text-slate-400">
        <Undo2 className="h-3.5 w-3.5" />
        Net refund = amount paid − airline/supplier penalties.
      </p>
    </>
  );
}
