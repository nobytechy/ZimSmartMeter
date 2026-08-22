/**
 * A slim seven-stripe band in the national colors — the quiet signature
 * that marks this as a Zimbabwean app, the way official documents carry a
 * color band. Rendered from our own tokens; no emblem, no insignia.
 */
const stripes = [
  "bg-credit",
  "bg-volt",
  "bg-danger",
  "bg-coal",
  "bg-danger",
  "bg-volt",
  "bg-credit",
];

export default function NationalBand() {
  return (
    <div aria-hidden className="-mx-5 flex h-1">
      {stripes.map((color, i) => (
        <span key={i} className={`flex-1 ${color}`} />
      ))}
    </div>
  );
}
