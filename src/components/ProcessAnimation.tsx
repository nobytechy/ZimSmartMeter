import { useEffect, useRef, useState } from "react";

/**
 * The product story as a 7-second loop: a payment leaves the phone,
 * passes verification exactly once (a duplicate literally bounces off),
 * and lands on the meter — LED goes green, balance counts up.
 *
 * Pure SVG + one requestAnimationFrame loop, zero libraries. Respects
 * prefers-reduced-motion by rendering the completed scene, static.
 */

const T = 7; // seconds per loop

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => v * v * (3 - 2 * v); // smoothstep
const seg = (s: number, from: number, to: number) =>
  ease(clamp01((s - from) / (to - from)));

export default function ProcessAnimation() {
  const [s, setS] = useState(T); // start on the completed frame
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return; // static completed scene
    }
    let start = performance.now();
    const tick = (now: number) => {
      setS(((now - start) / 1000) % T);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  // ── choreography ─────────────────────────────────────────
  const chip = seg(s, 0.2, 0.7); // "$20.00" pops over the phone
  const t1 = seg(s, 1.0, 2.5); // packet: phone → shield
  const check = seg(s, 2.5, 3.3); // verification tick draws
  const ghost = seg(s, 2.7, 3.2); // duplicate approaches…
  const ghostDie = seg(s, 3.2, 3.9); // …and bounces off, crossed out
  const t2 = seg(s, 3.5, 5.0); // packet: shield → meter
  const charge = seg(s, 5.0, 6.5); // LED, balance, bars

  const packetX =
    s < 3.5 ? 92 + (286 - 92) * t1 : 334 + (498 - 334) * t2;
  const packetVisible = s >= 1.0 && !(s >= 2.5 && s < 3.5) && s < 6.0;
  const balance = (58.8 * charge).toFixed(1);
  const bars = Math.round(4 * charge);

  return (
    <svg
      viewBox="0 0 640 220"
      role="img"
      aria-label="A payment leaves the phone, is verified exactly once, and credits the meter automatically."
      className="w-full"
    >
      {/* ── connecting lines ── */}
      <line x1="92" y1="110" x2="286" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <line x1="334" y1="110" x2="498" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <line x1="92" y1="110" x2={92 + (286 - 92) * t1} y2="110" stroke="var(--color-volt)" strokeWidth="2" opacity="0.8" />
      <line x1="334" y1="110" x2={334 + (498 - 334) * t2} y2="110" stroke="var(--color-volt)" strokeWidth="2" opacity="0.8" />

      {/* ── phone ── */}
      <rect x="40" y="62" width="52" height="96" rx="10" fill="var(--color-lcd)" stroke="rgba(255,255,255,0.18)" />
      <rect x="47" y="72" width="38" height="68" rx="4" fill="rgba(255,255,255,0.05)" />
      <circle cx="66" cy="150" r="3.5" fill="rgba(255,255,255,0.25)" />
      <text x="66" y="112" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="18" fill="var(--color-volt)">$</text>
      {/* amount chip */}
      <g opacity={chip} transform={`translate(0 ${6 * (1 - chip)})`}>
        <rect x="34" y="30" width="64" height="22" rx="6" fill="var(--color-volt)" />
        <text x="66" y="45" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="12" fontWeight="600" fill="var(--color-ink)">$20.00</text>
      </g>

      {/* ── the payment packet ── */}
      {packetVisible && (
        <g>
          <circle cx={packetX} cy="110" r="10" fill="var(--color-volt)" opacity="0.22" />
          <circle cx={packetX} cy="110" r="4.5" fill="var(--color-volt)" />
        </g>
      )}

      {/* ── verification node ── */}
      <circle cx="310" cy="110" r="24" fill="rgba(255,255,255,0.05)" stroke={check > 0 ? "var(--color-credit)" : "rgba(255,255,255,0.18)"} strokeWidth="2" />
      <polyline
        points="300,110 307,118 322,100"
        fill="none"
        stroke="var(--color-phosphor)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="34"
        strokeDashoffset={34 * (1 - check)}
      />
      {/* the duplicate: approaches, bounces, crossed out */}
      {ghost > 0 && ghostDie < 1 && (
        <g opacity={1 - ghostDie}>
          <circle
            cx={250 + 32 * ghost - 14 * ghostDie}
            cy={150 - 24 * ghost + 10 * ghostDie}
            r="4"
            fill="var(--color-mist)"
          />
          {ghostDie > 0 && (
            <text
              x={252 + 32 * ghost}
              y={146 - 24 * ghost}
              fontFamily="IBM Plex Mono, monospace"
              fontSize="13"
              fontWeight="700"
              fill="var(--color-flare)"
            >
              ×
            </text>
          )}
        </g>
      )}

      {/* ── meter ── */}
      <rect x="500" y="64" width="104" height="92" rx="10" fill="var(--color-lcd)" stroke="rgba(255,255,255,0.18)" />
      <text x="512" y="84" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="2" fill="var(--color-mist)">BALANCE</text>
      <text x="512" y="112" fontFamily="IBM Plex Mono, monospace" fontSize="22" fill="var(--color-phosphor)">{balance}</text>
      <text x="512" y="126" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="var(--color-mist)">kWh</text>
      <circle cx="590" cy="78" r="4" fill={charge > 0.1 ? "var(--color-phosphor)" : "var(--color-mist)"}>
        {charge > 0.1 && (
          <animate attributeName="opacity" values="1;0.5;1" dur="1.6s" repeatCount="indefinite" />
        )}
      </circle>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={512 + i * 22}
          y="136"
          width="16"
          height="8"
          rx="2"
          fill={i < bars ? "var(--color-credit)" : "rgba(255,255,255,0.10)"}
        />
      ))}

      {/* ── labels ── */}
      <text x="66" y="192" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="1.5" fill="var(--color-mist)">PAY</text>
      <text x="310" y="192" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="1.5" fill="var(--color-mist)">VERIFY · ONCE ONLY</text>
      <text x="552" y="192" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="1.5" fill="var(--color-mist)">CREDITED</text>
    </svg>
  );
}
