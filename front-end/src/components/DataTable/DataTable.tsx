import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  ArrowUpDown,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Input";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
  toolbarActions?: ReactNode;
  emptyMessage?: string;
  emptyTitle?: string;
  compact?: boolean;
}

type SortDir = "asc" | "desc";

function pageList(current: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const pages = new Set<number>([1, count, current - 1, current, current + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of list) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  searchable = true,
  searchPlaceholder = "Search...",
  searchKeys,
  pageSizeOptions = [10, 25, 50],
  initialPageSize,
  toolbarActions,
  emptyTitle = "No records found",
  emptyMessage = "Try adjusting your search or filters to find what you're looking for.",
  compact = false,
}: DataTableProps<T>) {
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebounce(rawQuery, 250);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize ?? pageSizeOptions[0]);
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({ key: null, dir: "asc" });

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q));
      }
      return Object.values(row).some((v) =>
        typeof v === "object" ? JSON.stringify(v).toLowerCase().includes(q) : String(v ?? "").toLowerCase().includes(q),
      );
    });
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const val = col.sortValue ?? ((row: T) => String((row as Record<string, unknown>)[col.key] ?? ""));
    const sortedCopy = [...filtered];
    sortedCopy.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sortedCopy;
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const start = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, sorted.length);
  const visible = sorted.slice(start - 1, end);

  const toggleSort = (key: string) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {(searchable || toolbarActions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          {searchable ? (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              />
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {toolbarActions}
            <Select
              aria-label="Rows per page"
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="!w-auto !py-1.5 !pr-8 text-xs"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 whitespace-nowrap",
                    compact && "!py-2.5",
                    col.headerClassName,
                  )}
                >
                  {(() => {
                    const sample = data[0];
                    const sortable = !!col.sortValue || (!!sample && col.key in sample);
                    return sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 uppercase transition-colors hover:text-slate-800"
                      >
                        {col.header}
                        {sort.key === col.key ? (
                          sort.dir === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    );
                  })()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50/70">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-slate-700",
                      compact && "!py-2.5",
                      col.className,
                    )}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} message={data.length > 0 ? "No rows match your search." : emptyMessage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>
          Showing <span className="font-semibold text-slate-700">{start}</span>–
          <span className="font-semibold text-slate-700">{end}</span> of{" "}
          <span className="font-semibold text-slate-700">{sorted.length}</span> results
        </span>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageList(page, pageCount).map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "grid h-8 min-w-8 place-items-center rounded-md px-2 font-medium transition-colors",
                  p === page
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
            className="grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
