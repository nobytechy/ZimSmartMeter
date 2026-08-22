/**
 * Original ZimSmartMeter mark: navy tile, golden bolt, green "online" LED.
 * Deliberately our own — no utility's insignia — echoing the app's
 * meter-readout motif (the LED reappears on live meter cards).
 */
export default function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="var(--color-ink)" />
      <path d="M18 5 9 18h5.5L13 27l10-13h-6.5z" fill="var(--color-volt)" />
      <circle cx="25" cy="7" r="3" fill="var(--color-credit)" />
    </svg>
  );
}
