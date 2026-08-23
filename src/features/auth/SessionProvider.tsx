import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import { SessionContext } from "./sessionContext";
import type { SessionState } from "./sessionContext";

/**
 * One subscription to auth state, at the root. Everything below reads the
 * session from context instead of asking Supabase again. `loading` exists
 * so guards don't bounce a signed-in user to /login during the first read.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
  });

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setState({ session: data.session, loading: false }));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setState({ session, loading: false }),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}
