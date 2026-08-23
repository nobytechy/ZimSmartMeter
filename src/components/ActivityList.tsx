import type { Txn } from "../services/transactions";
import { shortDateTime } from "../utils/format";

const labels: Record<Txn["type"], string> = {
  purchase: "Purchase",
  credit: "Meter credit",
  adjustment: "Adjustment",
};

function Value({ txn }: { txn: Txn }) {
  if (txn.type === "credit" && txn.kwh !== null) {
    return (
      <span className="font-mono text-sm text-phosphor">
        +{txn.kwh.toFixed(1)} kWh
      </span>
    );
  }
  if (txn.amount_usd !== null) {
    return (
      <span className="font-mono text-sm text-paper">
        ${txn.amount_usd.toFixed(2)}
      </span>
    );
  }
  return null;
}

/** The ledger, rendered: what happened, its reference, what it was worth. */
export default function ActivityList({ txns }: { txns: Txn[] }) {
  if (txns.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-mist">
        No activity yet — buy electricity and the ledger starts here.
      </p>
    );
  }
  return (
    <div className="flex flex-col">
      {txns.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-3 border-t border-white/10 py-3 first:border-t-0"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium">{labels[t.type]}</div>
            <div className="truncate font-mono text-xs text-mist">
              {t.ref ?? "—"} · {shortDateTime(t.created_at)}
            </div>
          </div>
          <Value txn={t} />
        </div>
      ))}
    </div>
  );
}
