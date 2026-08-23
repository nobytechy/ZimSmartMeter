export type Meter = {
  id: string;
  meter_number: string;
  nickname: string | null;
  balance_kwh: number;
  status: "online" | "offline";
  last_seen_at: string | null;
  created_at: string;
};
