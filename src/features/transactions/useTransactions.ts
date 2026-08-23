import { useCallback, useEffect, useState } from "react";
import { listTransactions } from "../../services/transactions";
import type { Txn } from "../../services/transactions";

export function useTransactions(limit = 20) {
  const [txns, setTxns] = useState<Txn[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await listTransactions(limit);
    if (err) {
      setError(err);
    } else {
      setTxns(data);
      setError(null);
    }
  }, [limit]);

  useEffect(() => {
    // State updates land after an await inside refresh() — not synchronous.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { txns, loading: txns === null && !error, error, refresh };
}
