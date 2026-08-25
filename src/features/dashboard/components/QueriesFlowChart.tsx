import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/PageHeader";
import { queriesFlow } from "@/lib/mockCharts";
import { CHART, ChartTip, axisTick } from "./chartTheme";

export default function QueriesFlowChart() {
  return (
    <Card title="Month-wise Query Flow" description="Incoming customer queries · trailing 1 year">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={queriesFlow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="queriesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor={CHART.brand} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} dy={6} />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} width={36} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="queries" name="Queries" fill="url(#queriesGradient)" radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
