import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hourglass, Plus, TimerReset } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import AdjustLimitModal from "@/features/limits/components/AdjustLimitModal";
import ExpiryTimer from "@/features/limits/components/ExpiryTimer";
import Button from "@/components/ui/Button";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { loadTemporaryLimits } from "@/features/limits/financeApi";
import type { ApiTemporaryLimit } from "@/api/types";
import { fmtDate, fmtMoney } from "@/lib/utils";

export default function TempLimitPage() {
  const [modal, setModal] = useState(false);
  const { data } = useQuery({ queryKey: ["temporary-limits"], queryFn: loadTemporaryLimits });
  const limits = data?.items ?? [];
  const active = limits.filter((item) => item.status === "active" || item.status === "pending");
  const history = limits.filter((item) => !active.includes(item));
  const total = active.reduce((sum, item) => sum + Number(item.amount), 0);
  const used = active.reduce((sum, item) => sum + Number(item.used), 0);
  const columns: Column<ApiTemporaryLimit>[] = [
    { key: "id", header: "ID", render: (item) => <span className="font-mono text-xs">{item.id.slice(0, 8)}</span> },
    { key: "amount", header: "Amount", render: (item) => fmtMoney(Number(item.amount)) },
    { key: "createdAt", header: "Granted", render: (item) => fmtDate(item.createdAt) },
    { key: "expiresAt", header: "Expiry", render: (item) => fmtDate(item.expiresAt) },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
  ];
  return <>
    <PageHeader title="Temp Limit" description="Approval-controlled temporary credit extensions with automatic expiry." actions={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" />Grant Temp Limit</Button>} />
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Active Extensions" value={String(active.length)} icon={Hourglass} tone="amber" note="including pending" />
      <StatCard label="Total Temp Exposure" value={fmtMoney(total)} icon={TimerReset} tone="rose" note="current requests" />
      <StatCard label="Utilized Right Now" value={fmtMoney(used)} icon={Hourglass} tone="blue" note={`${total ? Math.round((used / total) * 100) : 0}% consumed`} />
    </div>
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {active.map((item) => { const usage = Number(item.amount) ? Math.round((Number(item.used) / Number(item.amount)) * 100) : 0; return <Card key={item.id} bodyClassName="p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{item.reason}</p><p className="text-xs text-slate-500">Account {item.accountId.slice(0, 8)}</p></div><StatusBadge status={item.status} /></div>
        <p className="mt-4 text-xl font-bold tabular-nums">{fmtMoney(Number(item.amount) - Number(item.used))}<span className="ml-1.5 text-xs font-medium text-slate-400">of {fmtMoney(Number(item.amount))}</span></p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${usage}%` }} /></div>
        <div className="mt-4 border-t border-slate-100 pt-4"><ExpiryTimer expiresAt={Date.parse(item.expiresAt)} /></div>
      </Card>; })}
    </div>
    <DataTable columns={columns} data={history} rowKey={(item) => item.id} searchPlaceholder="Search expired limits..." searchKeys={["id", "reason"]} emptyTitle="No expired limits" />
    <AdjustLimitModal open={modal} onClose={() => setModal(false)} mode="temp" />
  </>;
}
