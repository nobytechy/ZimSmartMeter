import ActivityList from "../components/ActivityList";
import { glass } from "../components/ui";
import { useTransactions } from "../features/transactions/useTransactions";

/** The full ledger — every purchase and credit, newest first. */
export default function Activity() {
  const { txns, loading, error } = useTransactions(100);
  return (
    <div className="flex w-full flex-col gap-6 pt-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>

      </div>
      <div className={`${glass} p-5`}>
        {loading && (
          <p className="py-6 text-center font-mono text-sm text-mist">…</p>
        )}
        {error && <p className="text-sm text-flare">{error}</p>}
        {txns && <ActivityList txns={txns} />}
      </div>
    </div>
  );
}
