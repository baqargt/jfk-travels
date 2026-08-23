import { Search } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import ReportFilters from "@/features/reports/components/ReportFilters";
import { airTickets } from "@/lib/mockReports";
import { fmtDate, fmtMoney } from "@/lib/utils";
import type { AirTicket } from "@/types";

export default function AirReportsPage() {
  const columns: Column<AirTicket>[] = [
    { key: "ticket", header: "Ticket No.", className: "font-mono text-xs font-semibold" },
    { key: "pnr", header: "PNR", className: "font-mono text-xs" },
    { key: "passenger", header: "Passenger", render: (t) => <span className="font-medium text-slate-900">{t.passenger}</span> },
    {
      key: "airline",
      header: "Flight",
      sortValue: (t) => t.airline,
      render: (t) => (
        <span className="text-xs">
          {t.airline} <span className="font-semibold">{t.flight}</span>
        </span>
      ),
    },
    { key: "route", header: "Route", className: "font-mono text-xs" },
    { key: "depart", header: "Departure", sortValue: (t) => t.depart, render: (t) => fmtDate(t.depart) },
    { key: "cabin", header: "Cabin" },
    { key: "fare", header: "Fare", sortValue: (t) => t.fare, className: "!text-right tabular-nums", render: (t) => fmtMoney(t.fare) },
    { key: "taxes", header: "Taxes", sortValue: (t) => t.taxes, className: "!text-right tabular-nums text-slate-500", render: (t) => fmtMoney(t.taxes) },
    { key: "total", header: "Total", sortValue: (t) => t.total, className: "!text-right font-semibold tabular-nums", render: (t) => fmtMoney(t.total) },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Air Reports"
        description="Full ticketing breakdown with PNR-level search across all GDS bookings."
      />
      <ReportFilters statusOptions={["All statuses", "Issued", "Void", "Exchanged", "Refunded"]} />

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Jump to PNR or ticket number..." className="pl-9" />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={airTickets}
        rowKey={(t) => t.ticket}
        searchPlaceholder="Search PNR, passenger, ticket..."
        searchKeys={["pnr", "passenger", "ticket", "airline"]}
      />
    </>
  );
}
