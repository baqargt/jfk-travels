import type { ReactNode } from "react";
import { pct } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LimitSummaryCardsProps {
  cards: {
    label: string;
    value: string;
    sub?: string;
    bar?: { used: number; total: number; color: string };
  }[];
  actions?: ReactNode;
}

export default function LimitSummaryCards({ cards, actions }: LimitSummaryCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{card.value}</p>
          {card.bar && (
            <>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", card.bar.color)}
                  style={{ width: `${pct(card.bar.used, card.bar.total)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{pct(card.bar.used, card.bar.total)}% utilized</p>
            </>
          )}
          {!card.bar && card.sub && <p className="mt-1 text-xs text-slate-400">{card.sub}</p>}
        </div>
      ))}
      {actions && <div className="sm:col-span-2 xl:col-span-4 flex gap-2">{actions}</div>}
    </div>
  );
}
