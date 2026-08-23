import { ArrowRight, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { BookingResult } from "@/types";

interface ResultsGridProps {
  results: BookingResult[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-slate-100" />
        ))}
      </div>
      <div className="mt-4 h-9 rounded-lg bg-slate-200" />
    </div>
  );
}

export default function ResultsGrid({ results, loading }: ResultsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {results.map((r) => (
        <article
          key={r.id}
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-900">{r.title}</h3>
              <p className="mt-0.5 truncate text-xs text-slate-500">{r.subtitle}</p>
            </div>
            {typeof r.rating === "number" && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
                <Star className="h-3 w-3 fill-emerald-600 stroke-emerald-600" />
                {r.rating.toFixed(1)}
              </span>
            )}
          </div>

          {r.badge && (
            <Badge variant={r.badge === "Cheapest" ? "green" : r.badge === "Luxury" || r.badge === "Honeymoon" ? "violet" : "blue"} className="mt-3 w-fit">
              {r.badge}
            </Badge>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-4">
            {r.meta.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{k}</dt>
                <dd className="truncate text-xs font-medium text-slate-700">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <p>
              <span className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">
                ${r.price.toLocaleString()}
              </span>
              {r.unit && <span className="ml-0.5 text-xs text-slate-400">{r.unit}</span>}
            </p>
            <Button size="sm" title="Book this option (demo)">
              Book
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
