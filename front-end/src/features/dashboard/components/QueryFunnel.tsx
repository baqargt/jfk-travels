import { Cell, Funnel, FunnelChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/PageHeader";
import { queryFunnel } from "@/lib/mockCharts";
import { FUNNEL_COLORS, ChartTip } from "./chartTheme";

export default function QueryFunnel() {
  const base = queryFunnel[0]?.value ?? 1;

  return (
    <Card title="Query-wise Status" description="Sales pipeline conversion">
      <ResponsiveContainer width="100%" height={200}>
        <FunnelChart margin={{ top: 4, right: 12, left: 12, bottom: 4 }}>
          <Tooltip content={<ChartTip />} />
          <Funnel dataKey="value" data={queryFunnel} isAnimationActive={false}>
            {queryFunnel.map((entry, i) => (
              <Cell key={entry.stage} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>

      <ul className="mt-3 space-y-1.5">
        {queryFunnel.map((s, i) => (
          <li key={s.stage} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}
            />
            <span className="font-medium text-slate-700">{s.stage}</span>
            <span className="ml-auto tabular-nums font-semibold text-slate-800">{s.value}</span>
            <span className="w-10 text-right tabular-nums text-slate-400">
              {Math.round((s.value / base) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
