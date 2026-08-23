import { useState } from "react";
import { CalendarClock, TrendingUp, Wallet } from "lucide-react";
import LedgerTable from "@/features/limits/components/LedgerTable";
import LimitSummaryCards from "@/features/limits/components/LimitSummaryCards";
import AdjustLimitModal from "@/features/limits/components/AdjustLimitModal";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { creditLedger } from "@/lib/mockFinance";
import { limitsOverview } from "@/lib/mockData";
import { fmtDate, fmtMoney } from "@/lib/utils";

const upcoming = [
  { sub: "Downtown Branch", due: "2026-08-26", amount: 18_400, status: "Scheduled" },
  { sub: "Blue Line Travels", due: "2026-08-28", amount: 12_150, status: "Scheduled" },
  { sub: "Gulberg Franchise", due: "2026-08-30", amount: 42_300, status: "Due soon" },
  { sub: "Sky Wings Franchise", due: "2026-08-14", amount: 9_870, status: "Overdue" },
];

export default function CreditLimitPage() {
  const [modal, setModal] = useState(false);
  const { credit } = limitsOverview;
  const available = credit.limit - credit.utilized;

  return (
    <>
      <PageHeader
        title="Credit Limit"
        description="Credit utilization, settlements and limit adjustments per sub company."
        actions={
          <Button onClick={() => setModal(true)}>
            <TrendingUp className="h-4 w-4" />
            Adjust Limits
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Credit Limit" value={fmtMoney(credit.limit)} note="Org-wide ceiling" icon={TrendingUp} tone="blue" />
        <StatCard label="Utilized" value={fmtMoney(credit.utilized)} note={`${Math.round((credit.utilized / credit.limit) * 100)}% of ceiling`} icon={CalendarClock} tone="amber" />
        <StatCard label="Available" value={fmtMoney(available)} note="Before next settlement" icon={Wallet} tone="emerald" />
        <StatCard label="Due This Week" value={fmtMoney(42_300)} note={`Next settlement ${fmtDate(credit.nextDue)}`} icon={CalendarClock} tone="violet" />
      </div>

      <div className="mb-6">
        <LimitSummaryCards
          cards={[
            {
              label: "Utilization",
              value: `${Math.round((credit.utilized / credit.limit) * 100)}%`,
              bar: { used: credit.utilized, total: credit.limit, color: "bg-brand-500" },
            },
            {
              label: "Headroom",
              value: fmtMoney(available),
              bar: { used: available, total: credit.limit, color: "bg-emerald-500" },
            },
            {
              label: "Settled (MTD)",
              value: fmtMoney(262_800),
              sub: "12 settlement cycles",
            },
            {
              label: "Avg. Days to Pay",
              value: "6.2 days",
              sub: "Contractual target: 7 days",
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Upcoming Settlements" bodyClassName="p-0" className="xl:col-span-1">
          <ul className="divide-y divide-slate-100">
            {upcoming.map((u) => (
              <li key={u.sub} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{u.sub}</p>
                  <p className="text-xs text-slate-500">
                    Due {fmtDate(u.due)} · <span className="font-semibold tabular-nums">{fmtMoney(u.amount)}</span>
                  </p>
                </div>
                <StatusBadge status={u.status === "Overdue" ? "Overdue" : u.status === "Due soon" ? "Pending" : "Confirmed"} />
              </li>
            ))}
          </ul>
        </Card>

        <div className="xl:col-span-2">
          <LedgerTable entries={creditLedger} />
        </div>
      </div>

      <AdjustLimitModal open={modal} onClose={() => setModal(false)} mode="credit" />
    </>
  );
}
