import { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import type { MqttClient } from "mqtt";
import { glass } from "../components/ui";
import { useMeters } from "../features/meters/useMeters";
import { recordReading, setMeterPresence } from "../services/telemetry";
import type { Meter } from "../types/meter";
import { formatMeterNumber } from "../utils/meterNumber";

/**
 * The browser becomes the device. On Start it connects to a public MQTT
 * broker over TLS websockets with a Last-Will of `offline` (crash-honest
 * presence), announces `online` (retained), then every 5 seconds:
 * generates a realistic reading, PUBLISHES it on the meter's telemetry
 * topic, and persists it via record_reading() — which drains the balance.
 *
 * Accelerated mode maps each 5s tick to ~50 simulated minutes so the
 * drain is visible in a demo, not a fortnight.
 *
 * Public broker = development-grade transport, namespaced topics, no
 * secrets on the wire — exactly as the README's limitations promise.
 */

const BROKER = "wss://broker.emqx.io:8084/mqtt";
const topic = (meterNumber: string, leaf: string) =>
  `zimsmartmeter/demo/${meterNumber}/${leaf}`;

type Tick = { at: string; powerW: number; kwh: number; balance: number };

export default function Simulator() {
  const { meters } = useMeters();
  const [meterId, setMeterId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [accel, setAccel] = useState(true);
  const [connected, setConnected] = useState(false);
  const [gauges, setGauges] = useState({ v: 0, a: 0, w: 0 });
  const [session, setSession] = useState(0); // kWh drained this session
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<MqttClient | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const powerRef = useRef(600); // random-walked between ticks

  const meter: Meter | undefined =
    (meters ?? []).find((m) => m.id === meterId) ?? (meters ?? [])[0];

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const c = clientRef.current;
    if (c && meter) {
      c.publish(
        topic(meter.meter_number, "status"),
        JSON.stringify({ status: "offline" }),
        { retain: true },
      );
      c.end(true);
    }
    clientRef.current = null;
    setConnected(false);
    setRunning(false);
    if (meter) void setMeterPresence(meter.id, false);
  }

  // Leaving the page is stopping the device.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => stop, []);

  function start() {
    if (!meter || running) return;
    setError(null);
    setRunning(true);
    setSession(0);
    setTicks([]);

    const client = mqtt.connect(BROKER, {
      clean: true,
      connectTimeout: 8000,
      will: {
        topic: topic(meter.meter_number, "status"),
        payload: JSON.stringify({ status: "offline" }),
        retain: true,
        qos: 0,
      },
    });
    clientRef.current = client;

    client.on("connect", () => {
      setConnected(true);
      client.publish(
        topic(meter.meter_number, "status"),
        JSON.stringify({ status: "online" }),
        { retain: true },
      );
      void setMeterPresence(meter.id, true);

      timerRef.current = setInterval(() => {
        // random-walk the household load between 300 and 1200 W
        powerRef.current = Math.min(
          1200,
          Math.max(300, powerRef.current + (Math.random() - 0.5) * 220),
        );
        const powerW = Math.round(powerRef.current);
        const voltage = Math.round((228 + Math.random() * 10) * 10) / 10;
        const currentA = Math.round((powerW / voltage) * 100) / 100;
        // 5 real seconds; ×600 ≈ 50 simulated minutes per tick
        const seconds = accel ? 3000 : 5;
        const kwh = Math.round(((powerW * seconds) / 3.6e6) * 1000) / 1000;

        client.publish(
          topic(meter.meter_number, "telemetry"),
          JSON.stringify({
            meter: meter.meter_number,
            voltage,
            current: currentA,
            power: powerW,
            energyKwh: kwh,
            at: new Date().toISOString(),
          }),
        );

        setGauges({ v: voltage, a: currentA, w: powerW });
        void recordReading(meter.id, voltage, currentA, powerW, kwh).then(
          (res) => {
            if (!res.ok) {
              setError(res.reason ?? "ingest failed");
              return;
            }
            setSession((s) => Math.round((s + kwh) * 1000) / 1000);
            setTicks((prev) =>
              [
                {
                  at: new Date().toLocaleTimeString("en-GB"),
                  powerW,
                  kwh,
                  balance: res.balance_kwh ?? 0,
                },
                ...prev,
              ].slice(0, 8),
            );
          },
        );
      }, 5000);
    });

    client.on("error", (e) => {
      setError(`Broker: ${e.message}`);
      stop();
    });
  }

  return (
    <div className="flex w-full flex-col gap-6 pt-6 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight">Meter simulator</h1>

      <p className="text-[15px] leading-relaxed text-mist">
        This page <span className="text-paper">is</span> the smart meter: it
        connects to a public MQTT broker, announces itself with a Last-Will
        (pull the plug and the broker says{" "}
        <span className="font-mono">offline</span> for it), publishes
        telemetry every 5 seconds, and drains the balance you bought.
      </p>

      <div className={`${glass} flex flex-col gap-4 p-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={meter?.id ?? ""}
            onChange={(e) => setMeterId(e.target.value)}
            disabled={running}
            className="rounded-xl border border-white/15 bg-night px-3 py-2.5 font-mono text-sm text-paper"
          >
            {(meters ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname ?? formatMeterNumber(m.meter_number)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-mist">
            <input
              type="checkbox"
              checked={accel}
              onChange={(e) => setAccel(e.target.checked)}
              disabled={running}
              className="accent-[#f5c518]"
            />
            Accelerated ×600
          </label>
          {running ? (
            <button
              type="button"
              onClick={stop}
              className="ml-auto rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/5"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={!meter}
              className="ml-auto rounded-xl bg-volt px-5 py-2.5 text-sm font-semibold text-ink active:brightness-95 disabled:opacity-60"
            >
              Start device
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-widest uppercase">
          <span
            className={`flex items-center gap-1.5 ${connected ? "text-phosphor" : "text-mist"}`}
          >
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${connected ? "bg-phosphor motion-safe:animate-pulse" : "bg-mist"}`}
            />
            {connected ? "connected" : "idle"}
          </span>
          <span className="text-mist">· broker.emqx.io · wss</span>
          {meter && (
            <span className="truncate text-mist">
              · {topic(meter.meter_number, "telemetry")}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Voltage", gauges.v.toFixed(1), "V"],
            ["Current", gauges.a.toFixed(2), "A"],
            ["Power", String(gauges.w), "W"],
          ] as const
        ).map(([label, value, unit]) => (
          <div key={label} className="rounded-xl bg-lcd p-4 font-mono">
            <div className="text-[10px] tracking-widest text-mist uppercase">
              {label}
            </div>
            <div className="mt-1 text-2xl text-phosphor">
              {value} <span className="text-sm">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`${glass} p-5`}>
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] tracking-widest text-mist uppercase">
            Tick log · drained this session {session.toFixed(3)} kWh
          </h2>
        </div>
        <div className="mt-2 flex flex-col font-mono text-xs">
          {ticks.length === 0 && (
            <p className="py-4 text-center text-mist">
              Start the device and readings appear here.
            </p>
          )}
          {ticks.map((t, i) => (
            <div
              key={`${t.at}-${i}`}
              className="flex justify-between border-t border-white/10 py-2 first:border-t-0"
            >
              <span className="text-mist">{t.at}</span>
              <span>{t.powerW} W</span>
              <span>-{t.kwh.toFixed(3)} kWh</span>
              <span className="text-phosphor">{t.balance.toFixed(1)} kWh</span>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-flare">{error}</p>}
    </div>
  );
}
