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
import { fmtMoneyCompact } from "@/lib/utils";
import { CHART, ChartTip, axisTick, tooltipStyle } from "./chartTheme";

export interface SalesPoint {
  date?: string;
  label: string;
  sales: number;
}

export default function SalesExpensesChart({
  data = [],
  days = 30,
}: {
  data?: SalesPoint[];
  days?: number;
}) {
  const first = data[0]?.label;
  const last = data[data.length - 1]?.label;
  const description =
    first && last
      ? `Daily totals · ${first} – ${last} (${data.length} days)`
      : `Daily totals · last ${days} days`;

  return (
    <Card title="Total Sales" description={description}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            dy={6}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(v) => fmtMoneyCompact(Number(v))}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            width={58}
          />
          <Tooltip
            content={<ChartTip formatter={(v) => fmtMoneyCompact(v)} />}
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
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
