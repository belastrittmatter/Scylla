"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

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
    let hydrationTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    // Ensure page background stays dark (#09090B) during smooth scrolling on marketing routes
    // without mutating the root `.dark` class owned by next-themes.
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.classList.add("scylla-landing-page");
    document.body.classList.add("scylla-landing-page");
    document.documentElement.style.backgroundColor = "#09090b";
    document.body.style.backgroundColor = "#09090b";

    const w = window as unknown as GsapWindow;
    const scripts = [
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/all.min.js",
      "/js/main.js",
    ];

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
      const isMain = src === "/js/main.js";

      if (isMain) {
        ensureGsapPluginsRegistered(w);
      } else {
        const isAlreadyLoaded =
          src.includes("gsap") && Boolean(w.gsap && w.ScrollTrigger);
        if (isAlreadyLoaded) {
          ensureGsapPluginsRegistered(w);
          loadScript(index + 1);
          return;
        }

        const inFlight = document.querySelector(
          `script[src="${src}"]`,
        ) as HTMLScriptElement | null;
        if (inFlight) {
          if (inFlight.getAttribute("data-loaded") === "true") {
            ensureGsapPluginsRegistered(w);
            loadScript(index + 1);
          } else {
            inFlight.addEventListener(
              "load",
              () => {
                ensureGsapPluginsRegistered(w);
                if (mounted) loadScript(index + 1);
              },
              { once: true },
            );
          }
          return;
        }
      }

      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.setAttribute("data-landing-script", "true");
      if (isMain) {
        s.setAttribute("data-landing-main", "true");
      }
      s.onload = () => {
        s.setAttribute("data-loaded", "true");
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
      document.documentElement.style.backgroundColor = prevHtmlBg || "";
      document.body.style.backgroundColor = prevBodyBg || "";
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
