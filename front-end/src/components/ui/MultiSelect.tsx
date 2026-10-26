import { useRef, useState, useMemo } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = true,
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const remove = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  const selectedLabels = value.map((v) => options.find((o) => o.value === v)?.label ?? v);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-[38px] w-full items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-left text-sm shadow-sm transition-colors",
          "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          open && "border-brand-500 ring-2 ring-brand-500/20",
          className,
        )}
      >
        <div className="flex flex-1 flex-wrap gap-1">
          {selectedLabels.length === 0 && <span className="text-slate-400">{placeholder}</span>}
          {selectedLabels.map((label, i) => (
            <span
              key={value[i]}
              className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 ring-inset"
            >
              {label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(value[i]);
                }}
                className="rounded-full hover:bg-brand-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {searchable && (
            <div className="border-b border-slate-100 p-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500/20"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No options found</p>}
            {filtered.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    checked ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded border transition-colors",
                      checked ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white",
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}