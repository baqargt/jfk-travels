import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/PageHeader";
import { fmtNumber, pct } from "@/lib/utils";
import { PIE_COLORS, ChartTip } from "./chartTheme";

interface SourceRow { name: string; value: number }

export default function QuerySourcePie({ data = [] }: { data?: SourceRow[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card title="Query Source" description={`Where ${total.toLocaleString()} queries came from`}>
      <div className="relative">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Tooltip content={<ChartTip />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center pb-1">
          <div className="text-center">
            <p className="text-lg font-bold tabular-nums text-slate-900">{fmtNumber(total)}</p>
            <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Total</p>
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {data.map((s, i) => (
          <li key={s.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="font-medium text-slate-700">{s.name}</span>
            <span className="ml-auto tabular-nums font-semibold text-slate-800">{s.value}</span>
            <span className="w-9 text-right tabular-nums text-slate-400">{pct(s.value, total)}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
