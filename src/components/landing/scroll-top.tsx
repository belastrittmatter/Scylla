"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

/** Floating scroll-to-top control — appears after the first viewport. */
export function LandingScrollTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-[90] flex size-11 items-center justify-center rounded-full border bg-[var(--sl-surface)] text-[var(--sl-ink)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-[#ea580c] hover:bg-[#ea580c] hover:text-white cursor-pointer ${
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-3"
      }`}
    >
      <ArrowUp className="size-4" aria-hidden="true" />
    </button>
  );
}
