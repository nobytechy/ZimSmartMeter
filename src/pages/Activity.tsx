import { Link } from "react-router";
import ActivityList from "../components/ActivityList";
import { glass } from "../components/ui";
import { useTransactions } from "../features/transactions/useTransactions";

/** The full ledger — every purchase and credit, newest first. */
export default function Activity() {
  const { txns, loading, error } = useTransactions(100);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pt-8 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <Link
          to="/app"
          className="text-sm text-mist underline underline-offset-4"
        >
          Dashboard
        </Link>
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
