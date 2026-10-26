import type { CSSProperties } from "react";

export const CHART = {
  brand: "#2563eb",
  brandLight: "#93c5fd",
  emerald: "#10b981",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  slateMuted: "#cbd5e1",
  gridLine: "#f1f5f9",
  tick: "#94a3b8",
};

export const PIE_COLORS = [CHART.brand, CHART.emerald, CHART.amber, CHART.violet, CHART.rose, CHART.cyan];

export const FUNNEL_COLORS = ["#1d4ed8", "#2563eb", "#60a5fa", "#93c5fd", "#bfdbfe"];

export const tooltipStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.15)",
  fontSize: "12px",
  padding: "8px 12px",
};

export const axisTick = { fontSize: 11, fill: CHART.tick };

export function ChartTip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string | number;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      {label !== undefined && <p className="mb-1 text-xs font-semibold text-slate-700">{label}</p>}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <p key={i} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-slate-800">
              {formatter && typeof entry.value === "number" ? formatter(entry.value) : entry.value}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
