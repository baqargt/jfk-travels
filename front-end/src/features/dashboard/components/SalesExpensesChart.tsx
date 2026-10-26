import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/PageHeader";
import { salesExpenses } from "@/lib/mockCharts";
import { fmtMoneyCompact } from "@/lib/utils";
import { CHART, ChartTip, axisTick, tooltipStyle } from "./chartTheme";

export default function SalesExpensesChart() {
  return (
    <Card title="Total Sales & Expenses" description="Monthly performance · last 12 months">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={salesExpenses} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} dy={6} />
          <YAxis
            tickFormatter={(v) => fmtMoneyCompact(Number(v))}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            width={58}
          />
          <Tooltip
            content={
              <ChartTip
                formatter={(v) => fmtMoneyCompact(v)}
              />
            }
            cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
            contentStyle={tooltipStyle}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="sales"
            name="Sales"
            stroke={CHART.brand}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke={CHART.amber}
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
