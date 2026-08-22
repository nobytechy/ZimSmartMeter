/**
 * Feathered accent line — the app's signature divider. The palette blends
 * the utility's world (green, gold, sky, red) into one soft gradient with
 * feathered transparent ends and a faint glow. International in register;
 * drawn entirely from our own tokens.
 */
const blend =
  "bg-[linear-gradient(90deg,transparent,var(--color-credit)_14%,var(--color-volt)_38%,var(--color-sky)_62%,var(--color-danger)_86%,transparent)]";

export default function AccentLine() {
  return (
    <div aria-hidden className="relative h-px w-full">
      <div className={`absolute inset-0 ${blend}`} />
      <div className={`absolute inset-x-0 -top-px h-[3px] ${blend} opacity-40 blur-[3px]`} />
    </div>
  );
}
