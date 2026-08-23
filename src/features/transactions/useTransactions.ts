import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
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

  useEffect(() => {
    const channel = supabase
      .channel("txns-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setTxns((prev) =>
            prev
              ? [
                  {
                    id: row.id as string,
                    type: row.type as Txn["type"],
                    amount_usd:
                      row.amount_usd === null ? null : Number(row.amount_usd),
                    kwh: row.kwh === null ? null : Number(row.kwh),
                    ref: (row.ref as string) ?? null,
                    meter_id: (row.meter_id as string) ?? null,
                    created_at: row.created_at as string,
                  },
                  ...prev,
                ].slice(0, limit)
              : prev,
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [limit]);

  return { txns, loading: txns === null && !error, error, refresh };
}
