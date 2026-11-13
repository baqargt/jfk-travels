import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/PageHeader";
import { CHART, ChartTip, axisTick } from "./chartTheme";

export interface DestinationRow {
  name: string;
  bookings: number;
  amount: number;
}

export default function DestinationsChart({
  data = [],
  days = 30,
}: {
  data?: DestinationRow[];
  days?: number;
}) {
  return (
    <Card title="Top Selling Destinations" description={`Last ${days} days · by bookings`}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} dy={6} interval={0} />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} width={36} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="bookings" name="Bookings" fill={CHART.brand} radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
