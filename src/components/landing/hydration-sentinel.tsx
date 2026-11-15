"use client";

import * as React from "react";

/**
 * Marks one render segment as hydrated. React streams App Router segments
 * separately in dev, so a single flag races: the layout shell can commit
 * before page segments. Two sentinels (shell + page) must both report in
 * before public/js/main.js is allowed to mutate the DOM (GSAP pins,
 * inline styles) — pin-spacers inserted mid-hydration break the diff.
 * Flags clear on unmount so a client-side return visit waits for its own
 * page content instead of reusing stale markers.
 */
export function LandingHydrationSentinel({ part }: { part: "shell" | "page" }) {
  React.useEffect(() => {
    const w = window as unknown as {
      __scyllaHydration?: Partial<Record<"shell" | "page", boolean>>;
    };
    w.__scyllaHydration = { ...w.__scyllaHydration, [part]: true };
    return () => {
      w.__scyllaHydration = { ...w.__scyllaHydration, [part]: false };
    };
  }, [part]);

  return null;
}
