import { useCallback, useEffect, useState } from "react";
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

  return { meters, loading: meters === null && !error, error, refresh };
}
