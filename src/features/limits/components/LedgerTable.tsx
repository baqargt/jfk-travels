import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { fmtDate, fmtMoney } from "@/lib/utils";
import type { LedgerEntry } from "@/types";

export default function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  const columns: Column<LedgerEntry>[] = [
    { key: "date", header: "Date", sortValue: (e) => e.date, render: (e) => fmtDate(e.date) },
    { key: "reference", header: "Reference", className: "font-mono text-xs font-semibold" },
    { key: "description", header: "Description", render: (e) => <span className="text-slate-600">{e.description}</span> },
    {
      key: "debit",
      header: "Debit",
      sortValue: (e) => e.debit,
      className: "!text-right tabular-nums",
      render: (e) => (e.debit > 0 ? <span className="text-rose-600">-{fmtMoney(e.debit)}</span> : <span className="text-slate-300">—</span>),
    },
    {
      key: "credit",
      header: "Credit",
      sortValue: (e) => e.credit,
      className: "!text-right tabular-nums",
      render: (e) => (e.credit > 0 ? <span className="text-emerald-700">+{fmtMoney(e.credit)}</span> : <span className="text-slate-300">—</span>),
    },
    {
      key: "balance",
      header: "Balance",
      sortValue: (e) => e.balance,
      className: "!text-right font-semibold tabular-nums",
      render: (e) => fmtMoney(e.balance),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={entries}
      rowKey={(e) => e.reference}
      searchPlaceholder="Search ledger..."
      searchKeys={["reference", "description"]}
      initialPageSize={8}
      pageSizeOptions={[8, 16, 32]}
    />
  );
}
