import { useState } from "react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ReportFilters from "@/features/reports/components/ReportFilters";
import Tabs from "@/components/ui/Tabs";
import { miscBookings } from "@/lib/mockFinance";
import { fmtDate, fmtMoney } from "@/lib/utils";
import type { MiscBooking } from "@/types";

const serviceVariant: Record<MiscBooking["service"], "blue" | "green" | "violet" | "amber"> = {
  Insurance: "blue",
  Transfer: "amber",
  Sightseeing: "violet",
  Visa: "green",
};

export default function MiscReportsPage() {
  const [tab, setTab] = useState("All");

  const tabs = [
    { id: "All", label: "All Services", count: miscBookings.length },
    ...(["Insurance", "Transfer", "Sightseeing", "Visa"] as const).map((s) => ({
      id: s,
      label: s,
      count: miscBookings.filter((b) => b.service === s).length,
    })),
  ];

  const filtered = tab === "All" ? miscBookings : miscBookings.filter((b) => b.service === tab);

  const columns: Column<MiscBooking>[] = [
    { key: "ref", header: "Reference", className: "font-mono text-xs font-semibold" },
    {
      key: "service",
      header: "Service",
      sortValue: (m) => m.service,
      render: (m) => <Badge variant={serviceVariant[m.service]}>{m.service}</Badge>,
    },
    { key: "provider", header: "Provider" },
    { key: "detail", header: "Details", render: (m) => <span className="text-xs text-slate-500">{m.detail}</span> },
    { key: "pax", header: "Pax", sortValue: (m) => m.pax, className: "!text-center tabular-nums" },
    { key: "date", header: "Date", sortValue: (m) => m.date, render: (m) => fmtDate(m.date) },
    { key: "amount", header: "Amount", sortValue: (m) => m.amount, className: "!text-right font-semibold tabular-nums", render: (m) => fmtMoney(m.amount) },
    { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="MISC Reports"
        description="Combined summaries for insurance, transfers, sightseeing and visa services."
      />
      <div className="mb-4">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <ReportFilters statusOptions={["All statuses", "Confirmed", "Pending", "Completed", "Cancelled"]} />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(m) => m.ref}
        searchPlaceholder="Search provider or reference..."
        searchKeys={["provider", "ref", "detail"]}
      />
    </>
  );
}
