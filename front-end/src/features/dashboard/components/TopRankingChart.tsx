import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/PageHeader";
import type { RankRow } from "@/lib/mockCharts";
import { fmtNumber } from "@/lib/utils";
import { CHART, ChartTip, axisTick } from "./chartTheme";

interface TopRankingChartProps {
  title: string;
  description?: string;
  data: RankRow[];
  color?: string;
}

export default function TopRankingChart({ title, description, data, color = CHART.brand }: TopRankingChartProps) {
  const rows = [...data].reverse();

  return (
    <Card title={title} description={description ?? "Ranked by bookings"}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 34, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={CHART.gridLine} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={116}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
          />
          <Tooltip content={<ChartTip formatter={(v) => fmtNumber(v)} />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="bookings" name="Bookings" fill={color} radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false}>
            <LabelList dataKey="bookings" position="right" fontSize={10} fill="#94a3b8" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
