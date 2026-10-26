import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "blue" | "emerald" | "amber" | "rose" | "violet";

const tones: Record<Tone, string> = {
  blue: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
  change?: string;
  up?: boolean;
  note?: string;
}

export default function StatCard({ label, value, icon: Icon, tone = "blue", change, up = true, note }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {(change || note) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold",
                up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
              )}
            >
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change}
            </span>
          )}
          {note && <span className="text-slate-400">{note}</span>}
        </div>
      )}
    </div>
  );
}
