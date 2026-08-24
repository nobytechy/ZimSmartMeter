import { useEffect, useState } from "react";

/**
 * Appears once the reader is a screen deep, and sits ABOVE the WhatsApp
 * button in the same right-hand column — deliberately stacked, never
 * overlapping, so both stay tappable on a phone.
 */
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      className={`fixed right-5 bottom-24 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-night/80 text-paper shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-volt/50 hover:text-volt ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
