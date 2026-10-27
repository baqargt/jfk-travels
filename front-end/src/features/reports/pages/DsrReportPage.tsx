import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ReportFilters from "@/features/reports/components/ReportFilters";
import { getDsrReports } from "@/features/reports/reportApi";
import { fmtDate, fmtMoney } from "@/lib/utils";
import type { DsrRow } from "@/types";

export default function DsrReportPage() {
  const { data: dsrRows = [], isLoading, error } = useQuery({ queryKey: ["reports", "dsr"], queryFn: getDsrReports });
  const agents = [...new Set(dsrRows.map((row) => row.agent).filter((name) => name !== "—"))];
  const columns: Column<DsrRow>[] = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
    { key: "pnr", header: "PNR", className: "font-mono text-xs font-semibold" },
    { key: "passenger", header: "Passenger", render: (r) => <span className="font-medium text-slate-900">{r.passenger}</span> },
    { key: "airline", header: "Airline" },
    { key: "route", header: "Route", className: "font-mono text-xs" },
    { key: "fare", header: "Base Fare", sortValue: (r) => r.fare, className: "!text-right tabular-nums", render: (r) => fmtMoney(r.fare) },
    { key: "markup", header: "Markup", sortValue: (r) => r.markup, className: "!text-right tabular-nums text-emerald-700", render: (r) => `+${fmtMoney(r.markup)}` },
    { key: "commission", header: "Comm.", sortValue: (r) => r.commission, className: "!text-right tabular-nums text-brand-700", render: (r) => `+${fmtMoney(r.commission)}` },
    { key: "net", header: "Net Sold", sortValue: (r) => r.net, className: "!text-right font-semibold tabular-nums", render: (r) => fmtMoney(r.net) },
    { key: "agent", header: "Agent" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const totals = dsrRows.reduce(
    (acc, r) => ({ fare: acc.fare + r.fare, markup: acc.markup + r.markup, net: acc.net + r.net }),
    { fare: 0, markup: 0, net: 0 },
  );

  return (
    <>
      <PageHeader
        title="Daily Sales Report"
        description="Ticket-by-ticket sales with markup and commission breakdown per agent."
      />
      <ReportFilters
        agents={agents}
        statusOptions={["All statuses", "Ticketed", "Hold", "Void", "Refunded"]}
      />

      <DataTable
        columns={columns}
        data={dsrRows}
        rowKey={(r) => r.pnr + r.passenger}
        searchable={false}
        searchPlaceholder=""
        emptyTitle="No sales in this period"
      />
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading daily sales report...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error instanceof Error ? error.message : "Report could not be loaded."}</p>}

      <div className="mt-4 flex flex-wrap justify-end gap-x-8 gap-y-1 px-2 text-xs text-slate-500">
        <span>
          Base fares <span className="ml-1 font-bold text-slate-800 tabular-nums">{fmtMoney(totals.fare)}</span>
        </span>
        <span>
          Total markup <span className="ml-1 font-bold text-emerald-700 tabular-nums">+{fmtMoney(totals.markup)}</span>
        </span>
        <span>
          Net sold <span className="ml-1 font-bold text-slate-900 tabular-nums">{fmtMoney(totals.net)}</span>
        </span>
      </div>
    </>
  );
}
