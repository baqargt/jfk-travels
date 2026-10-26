import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
            active === tab.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800",
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                active === tab.id ? "bg-brand-50 text-brand-700" : "bg-slate-200 text-slate-500",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
