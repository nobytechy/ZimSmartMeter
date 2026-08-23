import { Link } from "react-router";
import type { Meter } from "../types/meter";
import { formatMeterNumber } from "../utils/meterNumber";
import { glass } from "./ui";

/** One meter, rendered the way its owner knows it: as an LCD readout. */
export default function MeterCard({ meter }: { meter: Meter }) {
  const online = meter.status === "online";
  return (
    <div className={`${glass} p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="truncate font-mono text-sm">
          {meter.nickname ?? formatMeterNumber(meter.meter_number)}
        </span>
        <span
          className={`flex items-center gap-1.5 font-mono text-[11px] tracking-widest uppercase ${
            online ? "text-phosphor" : "text-mist"
          }`}
        >
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${
              online ? "bg-phosphor motion-safe:animate-pulse" : "bg-mist"
            }`}
          />
          {meter.status}
        </span>
      </div>
      <div className="rounded-xl bg-lcd p-4 font-mono">
        <div className="text-[11px] tracking-widest text-mist uppercase">
          Balance
        </div>
        <div className="mt-1 text-3xl font-medium text-phosphor">
          {meter.balance_kwh.toFixed(1)} <span className="text-base">kWh</span>
        </div>
      </div>
      {meter.nickname && (
        <p className="mt-2 font-mono text-xs text-mist">
          {formatMeterNumber(meter.meter_number)}
        </p>
      )}
      <Link
        to={`/app/meters/${meter.id}/buy`}
        className="mt-3 block rounded-lg bg-credit py-2.5 text-center text-sm font-semibold text-white active:bg-credit-deep"
      >
        Buy electricity
      </Link>
    </div>
  );
}
