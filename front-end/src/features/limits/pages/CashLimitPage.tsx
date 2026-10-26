import { useState } from "react";
import { ArrowDownToLine, Plus, Wallet } from "lucide-react";
import LedgerTable from "@/features/limits/components/LedgerTable";
import LimitSummaryCards from "@/features/limits/components/LimitSummaryCards";
import AdjustLimitModal from "@/features/limits/components/AdjustLimitModal";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { cashLedger } from "@/lib/mockFinance";
import { limitsOverview } from "@/lib/mockData";
import { fmtMoney } from "@/lib/utils";

export default function CashLimitPage() {
  const [modal, setModal] = useState(false);
  const { cash } = limitsOverview;
  const remaining = cash.allocated - cash.used;

  return (
    <>
      <PageHeader
        title="Cash Limit"
        description="Cash float allocation and ledger across the organization."
      />

      <LimitSummaryCards
        cards={[
          {
            label: "Total Allocated",
            value: fmtMoney(cash.allocated),
            sub: "Across all branches & franchises",
          },
          {
            label: "Utilized",
            value: fmtMoney(cash.used),
            bar: { used: cash.used, total: cash.allocated, color: "bg-emerald-500" },
          },
          {
            label: "Available Balance",
            value: fmtMoney(remaining),
            sub: "Ready for instant allocation",
          },
          {
            label: "Avg. Daily Burn",
            value: fmtMoney(8_420),
            sub: "Trailing 30-day average",
          },
        ]}
        actions={
          <>
            <Button onClick={() => setModal(true)}>
              <Plus className="h-4 w-4" />
              Allocate Funds
            </Button>
            <Button variant="secondary">
              <ArrowDownToLine className="h-4 w-4" />
              Recall to Head Office
            </Button>
          </>
        }
      />

      <LedgerTable entries={cashLedger} />

      <p className="mt-3 flex items-center gap-1.5 px-1 text-xs text-slate-400">
        <Wallet className="h-3.5 w-3.5" />
        Balances update in real time as bookings settle against allocated floats.
      </p>

      <AdjustLimitModal open={modal} onClose={() => setModal(false)} mode="cash" />
    </>
  );
}
