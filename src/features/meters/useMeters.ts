import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { listMeters } from "../../services/meters";
import type { Meter } from "../../types/meter";

export function useMeters() {
  const [meters, setMeters] = useState<Meter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await listMeters();
    if (err) {
      setError(err);
    } else {
      setMeters(data);
      setError(null);
    }
  }, []);

  useEffect(() => {
    // State updates land after an await inside refresh() — not synchronous.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Live balance/status: Realtime UPDATEs patch the row in place.
  // Numerics arrive as strings over the wire — coerce before rendering.
  useEffect(() => {
    const channel = supabase
      .channel("meters-rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "meters" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setMeters((prev) =>
            prev
              ? prev.map((m) =>
                  m.id === row.id
                    ? {
                        ...m,
                        balance_kwh: Number(row.balance_kwh),
                        status: row.status as Meter["status"],
                        last_seen_at: (row.last_seen_at as string) ?? null,
                        nickname: (row.nickname as string) ?? m.nickname,
                      }
                    : m,
                )
              : prev,
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return { meters, loading: meters === null && !error, error, refresh };
}
