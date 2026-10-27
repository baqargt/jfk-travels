import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { apiRequest } from "@/api/client";
import type { FinancialAccount } from "@/api/types";
import Dropdown from "@/components/ui/Dropdown";
import { fmtMoney, fmtMoneyCompact, pct } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import { cn } from "@/lib/utils";

function LimitBar({
  label,
  used,
  total,
  color,
  footer,
}: {
  label: string;
  used: number;
  total: number;
  color: string;
  footer?: string;
}) {
  const percentage = pct(used, total);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-[11px] text-slate-500 tabular-nums">
          {fmtMoneyCompact(used)} / {fmtMoney(total)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percentage}%` }} />
      </div>
      {footer && <p className="mt-1 text-[10px] text-slate-400">{footer}</p>}
    </div>
  );
}

export default function LimitsWidget() {
  const { data: accounts = [] } = useQuery({
    queryKey: ["financial-accounts"],
    queryFn: () => apiRequest<FinancialAccount[]>("/financial-accounts"),
  });
  const cashAccounts = accounts.filter((account) => account.accountType === "cash");
  const creditAccounts = accounts.filter((account) => account.accountType === "credit");
  const cashTotal = cashAccounts.reduce((sum, account) => sum + Number(account.limitAmount), 0);
  const cashAvailable = cashAccounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const creditTotal = creditAccounts.reduce((sum, account) => sum + Number(account.limitAmount), 0);
  const creditAvailable = creditAccounts.reduce((sum, account) => sum + Number(account.balance), 0);

  return (
    <Dropdown
      panelClassName="w-80"
      trigger={
        <span className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-left transition-colors hover:bg-slate-50">
          <Wallet className="h-4 w-4 text-brand-600" />
          <span className="hidden leading-tight sm:block">
            <span className="block text-[10px] font-medium text-slate-400 uppercase">Cash left</span>
            <span className="block text-xs font-bold text-slate-800 tabular-nums">{fmtMoney(cashAvailable)}</span>
          </span>
        </span>
      }
    >
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Limit Overview</p>
          <a href={PATHS.limits.credit} className="text-xs font-medium text-brand-600 hover:underline">Manage</a>
        </div>
        <div className="space-y-3.5">
          <LimitBar
            label="Cash Limit"
            used={Math.max(cashTotal - cashAvailable, 0)}
            total={cashTotal || 1}
            color="bg-emerald-500"
            footer={`${fmtMoney(cashAvailable)} available`}
          />
          <LimitBar
            label="Credit Limit"
            used={Math.max(creditTotal - creditAvailable, 0)}
            total={creditTotal || 1}
            color="bg-brand-500"
            footer={`${fmtMoney(creditAvailable)} available`}
          />
          <LimitBar
            label="Temp Limits"
            used={0}
            total={1}
            color="bg-amber-500"
            footer="Temporary extensions require approval"
          />
        </div>
      </div>
    </Dropdown>
  );
}
