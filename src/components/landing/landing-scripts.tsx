"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const CDN_GSAP_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/all.min.js";

// Shared across effect restarts: whichever run resolves the CDN (or its
// local fallback) wins, and every waiting effect proceeds. A second
// execution of the vendor bundle would overwrite window.gsap.
let gsapLoadPromise: Promise<boolean> | null = null;

function ensureGsap(w: {
  gsap?: unknown;
  ScrollTrigger?: unknown;
}): Promise<boolean> {
  if (w.gsap && w.ScrollTrigger) return Promise.resolve(true);
  if (!gsapLoadPromise) {
    gsapLoadPromise = new Promise<boolean>((resolve) => {
      const cdn = document.createElement("script");
      cdn.src = CDN_GSAP_URL;
      cdn.async = false;
      cdn.onload = () => resolve(true);
      cdn.onerror = () => {
        const local = document.createElement("script");
        local.src = "/js/gsap-all.min.js";
        local.async = false;
        local.onload = () => resolve(true);
        local.onerror = () => resolve(false);
        document.body.appendChild(local);
      };
      document.body.appendChild(cdn);
    });
  }
  return gsapLoadPromise;
}

interface GsapWindow extends Window {
  gsap?: {
    registerPlugin?: (...plugins: unknown[]) => void;
    core?: {
      globals?: (name: string, value: unknown) => void;
    };
  };
  ScrollTrigger?: {
    getAll: () => Array<{ kill: (revert?: boolean) => void }>;
    refresh?: () => void;
  };
  ScrollSmoother?: {
    get: () => { kill: () => void } | null;
  };
  DrawSVGPlugin?: unknown;
  MorphSVGPlugin?: unknown;
  SplitText?: unknown;
  __scyllaLandingCleanup?: () => void;
}

const MARKETING_PATHS = new Set(["/"]);

function ensureGsapPluginsRegistered(w: GsapWindow) {
  if (w.gsap && typeof w.gsap.registerPlugin === "function") {
    const plugins = [
      w.ScrollTrigger,
      w.ScrollSmoother,
      w.DrawSVGPlugin,
      w.MorphSVGPlugin,
      w.SplitText,
    ].filter(Boolean);
    if (plugins.length > 0) {
      w.gsap.registerPlugin(...plugins);
    }
    if (w.gsap.core && typeof w.gsap.core.globals === "function") {
      if (w.ScrollTrigger) {
        w.gsap.core.globals("ScrollTrigger", w.ScrollTrigger);
      }
      if (w.ScrollSmoother) {
        w.gsap.core.globals("ScrollSmoother", w.ScrollSmoother);
      }
    }
  }
}

export function LandingScripts() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (pathname && !MARKETING_PATHS.has(pathname)) {
      return;
    }

    let mounted = true;
    const w = window as unknown as GsapWindow;
    let hydrationTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    // Mark the landing route so scoped CSS controls the page background
    // (light/dark handled by the .dark class owned by next-themes).
    document.documentElement.classList.add("scylla-landing-page");
    document.body.classList.add("scylla-landing-page");

    const scripts = [CDN_GSAP_URL, "/js/main.js"];

    // Clean up any previous landing script state before re-initializing
    if (typeof w.__scyllaLandingCleanup === "function") {
      try {
        w.__scyllaLandingCleanup();
      } catch (_e) {
        // Ignore cleanup error
      }
    }

    // Only remove previously appended main.js instances; never remove/re-append CDN vendor scripts
    // so React Strict Mode remounts do not execute all.min.js twice and overwrite window.gsap.
    const existingMain = document.querySelectorAll("script[data-landing-main]");
    existingMain.forEach((el) => el.remove());

    const loadScript = (index: number) => {
      if (!mounted || index >= scripts.length) return;
      const src = scripts[index];

      if (src === CDN_GSAP_URL) {
        // Singleton promise: effect restarts and double mounts share one
        // load, and the local fallback result reaches every waiting caller.
        ensureGsap(w).then((ok) => {
          if (ok) ensureGsapPluginsRegistered(w);
          else document.documentElement.classList.remove("gsap-pending");
          if (mounted) loadScript(index + 1);
        });
        return;
      }

      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.setAttribute("data-landing-script", "true");
      if (src === "/js/main.js") {
        s.setAttribute("data-landing-main", "true");
        // Fail open: without main.js the gsap-pending class would keep the
        // hero and CTA hidden forever.
        s.onerror = () => {
          document.documentElement.classList.remove("gsap-pending");
        };
      }
      s.onload = () => {
        ensureGsapPluginsRegistered(w);
        if (mounted) loadScript(index + 1);
      };
      document.body.appendChild(s);
    };

    // Wait one animation frame after mount/hydration before loading GSAP and main.js
    rafId = window.requestAnimationFrame(() => {
      if (!mounted) return;
      hydrationTimer = setTimeout(() => {
        if (mounted) loadScript(0);
      }, 0);
    });

    return () => {
      mounted = false;
      if (hydrationTimer !== null) {
        clearTimeout(hydrationTimer);
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      if (typeof w.__scyllaLandingCleanup === "function") {
        try {
          w.__scyllaLandingCleanup();
        } catch (_e) {
          // Ignore cleanup error
        }
      }

      // Kill GSAP ScrollSmoother FIRST, then ScrollTrigger
      if (typeof window !== "undefined") {
        if (w.ScrollSmoother) {
          try {
            const sm = w.ScrollSmoother.get();
            if (sm) sm.kill();
          } catch (_e) {
            // Ignore GSAP cleanup error
          }
        }
        if (w.ScrollTrigger) {
          try {
            w.ScrollTrigger.getAll().forEach((t) => t.kill(true));
          } catch (_e) {
            // Ignore GSAP cleanup error
          }
        }
      }

      // Clean up landing classes and inline styles left by ScrollSmoother / GSAP
      document.documentElement.classList.remove("scylla-landing-page");
      document.body.classList.remove(
        "overflow-hidden",
        "scylla-landing-page",
        "menu-overlay",
      );
      document.documentElement.style.removeProperty("height");
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("height");
      document.body.style.removeProperty("overflow");

      const addedMain = document.querySelectorAll("script[data-landing-main]");
      addedMain.forEach((el) => el.remove());
    };
  }, [pathname]);

  return null;
}
