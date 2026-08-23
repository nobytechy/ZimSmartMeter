import { Suspense, lazy } from "react";

const Simulator = lazy(() => import("./Simulator"));

/** Code-split wrapper: mqtt.js loads only when the device page is opened. */
export default function SimulatorRoute() {
  return (
    <Suspense
      fallback={
        <p className="pt-16 text-center font-mono text-sm text-mist">…</p>
      }
    >
      <Simulator />
    </Suspense>
  );
}
