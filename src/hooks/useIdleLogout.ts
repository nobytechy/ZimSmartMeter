import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Idle session guard: after `idleMs` without interaction, warn the user and
 * start a visible countdown; if they don't respond within `graceMs`, sign
 * them out. Financial dashboards shouldn't sit open and authenticated on an
 * unattended phone — but they also shouldn't vanish without warning.
 *
 * Timers are refs, not state, so activity resets don't re-render the app.
 */
export function useIdleLogout(
  onLogout: () => void,
  { idleMs = 10 * 60_000, graceMs = 60_000 } = {},
) {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoutRef = useRef(onLogout);
  useEffect(() => {
    logoutRef.current = onLogout;
  }, [onLogout]);

  const clearAll = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (graceTimer.current) clearInterval(graceTimer.current);
    idleTimer.current = null;
    graceTimer.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    setWarning(true);
    setSecondsLeft(Math.round(graceMs / 1000));
    graceTimer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearAll();
          setWarning(false);
          logoutRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [graceMs, clearAll]);

  const reset = useCallback(() => {
    clearAll();
    setWarning(false);
    idleTimer.current = setTimeout(startCountdown, idleMs);
  }, [clearAll, idleMs, startCountdown]);

  useEffect(() => {
    // reset() sets a timer and clears the warning flag — safe on mount.
    // oxlint-disable-next-line react/set-state-in-effect
    reset();
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    const onActivity = () => {
      // Once the warning is up, only the explicit button dismisses it —
      // a stray scroll shouldn't silently cancel a security countdown.
      if (!graceTimer.current) reset();
    };
    for (const e of events) window.addEventListener(e, onActivity, { passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, onActivity);
      clearAll();
    };
  }, [reset, clearAll]);

  return { warning, secondsLeft, staySignedIn: reset };
}
