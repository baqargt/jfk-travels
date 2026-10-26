import { useState } from "react";
import { Hourglass, Plus, TimerReset } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import AdjustLimitModal from "@/features/limits/components/AdjustLimitModal";
import ExpiryTimer from "@/features/limits/components/ExpiryTimer";
import Button from "@/components/ui/Button";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { tempLimits } from "@/lib/mockFinance";
import { fmtDate, fmtMoney } from "@/lib/utils";

const history = [
  { id: "TMP-289", subCompany: "Airport Counter", amount: 15_000, grantedAt: "2026-07-28", expiredAt: "2026-08-04", status: "Expired" },
  { id: "TMP-291", subCompany: "Downtown Branch", amount: 30_000, grantedAt: "2026-08-02", expiredAt: "2026-08-09", status: "Expired" },
  { id: "TMP-295", subCompany: "Clifton Branch", amount: 10_000, grantedAt: "2026-08-09", expiredAt: "2026-08-16", status: "Expired" },
];

export default function TempLimitPage() {
  const [modal, setModal] = useState(false);

  const historyColumns: Column<(typeof history)[number]>[] = [
    { key: "id", header: "ID", className: "font-mono text-xs font-semibold" },
    { key: "subCompany", header: "Sub Company" },
    { key: "amount", header: "Amount", sortValue: (h) => h.amount, className: "!text-right font-semibold tabular-nums", render: (h) => fmtMoney(h.amount) },
    { key: "grantedAt", header: "Granted", sortValue: (h) => h.grantedAt, render: (h) => fmtDate(h.grantedAt) },
    { key: "expiredAt", header: "Expired", sortValue: (h) => h.expiredAt, render: (h) => fmtDate(h.expiredAt) },
    { key: "status", header: "Status", render: (h) => <StatusBadge status={h.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Temp Limit"
        description="Temporary credit extensions with automatic expiry — no manual revocation needed."
        actions={
          <Button onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" />
            Grant Temp Limit
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active Extensions" value={String(tempLimits.length)} icon={Hourglass} tone="amber" note="auto-expiring" />
        <StatCard label="Total Temp Exposure" value={fmtMoney(85_000)} icon={TimerReset} tone="rose" note="above standard limits" />
        <StatCard label="Utilized Right Now" value={fmtMoney(36_450)} icon={Hourglass} tone="blue" note={`${Math.round((36450 / 85000) * 100)}% consumed`} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tempLimits.map((t) => {
          const usage = Math.round((t.used / t.amount) * 100);
          return (
            <Card key={t.id} bodyClassName="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{t.subCompany}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{t.reason}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <p className="mt-4 text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                {fmtMoney(t.amount - t.used)}
                <span className="ml-1.5 text-xs font-medium text-slate-400">of {fmtMoney(t.amount)}</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${usage > 80 ? "bg-rose-500" : "bg-amber-500"}`}
                  style={{ width: `${usage}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {fmtMoney(t.used)} used · granted {fmtDate(t.grantedAt)}
              </p>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <ExpiryTimer expiresAt={t.expiresAt} />
                <Button variant="secondary" size="sm" onClick={() => setModal(true)}>
                  Extend
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <DataTable
        columns={historyColumns}
        data={history}
        rowKey={(h) => h.id}
        searchPlaceholder="Search expired limits..."
        searchKeys={["id", "subCompany"]}
        emptyTitle="No history"
      />

      <AdjustLimitModal open={modal} onClose={() => setModal(false)} mode="temp" />
    </>
  );
}
