import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayUsage } from "../features/consumption/simulated";

const tick = {
  fill: "var(--color-mist)",
  fontSize: 10,
  fontFamily: "IBM Plex Mono, monospace",
};

/** Night-themed daily-usage bars. Data source is the caller's business. */
export default function ConsumptionChart({ data }: { data: DayUsage[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="day" tick={tick} tickLine={false} axisLine={false} interval={1} />
          <YAxis tick={tick} tickLine={false} axisLine={false} unit="" />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.06)" }}
            contentStyle={{
              background: "var(--color-lcd)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12,
              color: "var(--color-paper)",
            }}
            formatter={(value) => [`${value} kWh`, "used"]}
          />
          <Bar dataKey="kwh" fill="var(--color-sky)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
