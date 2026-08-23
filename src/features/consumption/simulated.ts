/**
 * Simulated daily-usage series — HONESTY FIRST: this is a clearly labelled
 * preview so the dashboard has shape before Phase 2, when real MQTT
 * telemetry lands in meter_readings and this module is replaced by a
 * query. Deterministic per meter (seeded from the meter id) so the chart
 * is stable across reloads instead of jittering randomly.
 */
export type DayUsage = { day: string; kwh: number };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const dayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
});

export function simulatedDailyUsage(meterId: string, days = 14): DayUsage[] {
  const rand = mulberry32(hashId(meterId));
  const out: DayUsage[] = [];
  const base = 5 + rand() * 5; // 5–10 kWh/day household baseline
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? 1.35 : 1;
    const noise = 0.75 + rand() * 0.5;
    out.push({
      day: dayLabel.format(d),
      kwh: Math.round(base * weekend * noise * 10) / 10,
    });
  }
  return out;
}
