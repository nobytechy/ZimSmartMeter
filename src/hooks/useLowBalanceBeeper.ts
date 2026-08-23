import { useEffect, useRef } from "react";
import type { Meter } from "../types/meter";

/**
 * The authentic prepaid-meter low-credit beeper, synthesized — a piezo-ish
 * square wave, no audio files. Patterns:
 *   low  (≤10 kWh): tiiiii-ti      every 8s
 *   zero (0 kWh):   tiiiii-ti-ti   every 4s
 * Browsers gate audio behind a user gesture: the first tap/keypress arms
 * the context, then the meter complains exactly like the real thing.
 */

function tone(ctx: AudioContext, at: number, dur: number, freq = 2600) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.12, at + 0.01);
  gain.gain.setValueAtTime(0.12, at + Math.max(dur - 0.02, 0.02));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function useLowBalanceBeeper(meters: Meter[] | null, enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const min =
    meters && meters.length > 0
      ? Math.min(...meters.map((m) => m.balance_kwh))
      : Infinity;
  const level: "zero" | "low" | null =
    min <= 0 ? "zero" : min <= 10 ? "low" : null;

  useEffect(() => {
    if (!enabled || !level) return;
    const ctx = (ctxRef.current ??= new AudioContext());

    const arm = () => {
      void ctx.resume();
    };
    if (ctx.state === "suspended") {
      window.addEventListener("pointerdown", arm, { once: true });
      window.addEventListener("keydown", arm, { once: true });
    }

    const cycle = () => {
      if (ctx.state !== "running") return;
      const t = ctx.currentTime + 0.03;
      tone(ctx, t, 0.8); //  tiiiii
      tone(ctx, t + 0.95, 0.18); //  ti
      if (level === "zero") tone(ctx, t + 1.2, 0.18); //  ti
    };

    cycle();
    const id = setInterval(cycle, level === "zero" ? 4000 : 8000);
    return () => {
      clearInterval(id);
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, [level, enabled]);
}
