import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, SearchX, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { BookingResult } from "@/types";

interface ResultsGridProps {
  results: BookingResult[];
  loading: boolean;
  onBook?: (result: BookingResult) => void;
  onReset: () => void;
}

const PAGE_SIZE = 12;

const pageList = (current: number, total: number): (number | "ellipsis")[] => {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const valid = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const output: (number | "ellipsis")[] = [];
  valid.forEach((page, index) => {
    if (index > 0 && page - valid[index - 1] > 1) output.push("ellipsis");
    output.push(page);
  });
  return output;
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-slate-200" /><div className="flex-1 space-y-2"><div className="h-3.5 w-2/3 rounded bg-slate-200" /><div className="h-3 w-1/2 rounded bg-slate-100" /></div></div>
      <div className="mt-4 grid grid-cols-2 gap-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-8 rounded bg-slate-100" />)}</div>
      <div className="mt-4 h-9 rounded-lg bg-slate-200" />
    </div>
  );
}

export default function ResultsGrid({ results, loading, onBook, onReset }: ResultsGridProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const start = results.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, results.length);
  const visibleResults = results.slice(start - 1, end);

  useEffect(() => setPage(1), [results]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  if (loading) {
    return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <EmptyState
          icon={SearchX}
          title="No matching options found"
          message="Try changing or clearing one or more search filters."
          action={<Button type="button" variant="secondary" onClick={onReset}>Reset filters</Button>}
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleResults.map((result) => (
          <article key={result.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h3 className="truncate text-sm font-bold text-slate-900">{result.title}</h3><p className="mt-0.5 truncate text-xs text-slate-500">{result.subtitle}</p></div>
              {typeof result.rating === "number" && <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700"><Star className="h-3 w-3 fill-emerald-600 stroke-emerald-600" />{result.rating.toFixed(1)}</span>}
            </div>
            {result.badge && <Badge variant={result.badge === "Cheapest" ? "green" : result.badge === "Luxury" || result.badge === "Honeymoon" ? "violet" : "blue"} className="mt-3 w-fit">{result.badge}</Badge>}
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-4">
              {result.meta.map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{key}</dt><dd className="truncate text-xs font-medium text-slate-700">{value}</dd></div>)}
            </dl>
            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
              <p><span className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">${result.price.toLocaleString()}</span>{result.unit && <span className="ml-0.5 text-xs text-slate-400">{result.unit}</span>}</p>
              <Button size="sm" title={onBook ? `Book ${result.title}` : "Book this option (demo)"} onClick={() => onBook?.(result)}>Book <ArrowRight className="h-3.5 w-3.5" /></Button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
        <span>Showing <strong className="text-slate-700">{start}–{end}</strong> of <strong className="text-slate-700">{results.length}</strong> results</span>
        <nav className="flex items-center gap-1" aria-label="Booking results pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          {pageList(page, pageCount).map((item, index) => item === "ellipsis" ? <span key={`ellipsis-${index}`} className="px-1 text-slate-400">…</span> : (
            <button key={item} type="button" onClick={() => setPage(item)} aria-current={page === item ? "page" : undefined} className={cn("grid h-8 min-w-8 place-items-center rounded-md px-2 font-medium", page === item ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100")}>{item}</button>
          ))}
          <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </nav>
      </div>
    </>
  );
}
