"use client";

import * as React from "react";

interface GsapWindow extends Window {
  gsap?: {
    registerPlugin?: (...plugins: unknown[]) => void;
    core?: {
      globals?: (name: string, value: unknown) => void;
    };
  };
  ScrollTrigger?: {
    getAll: () => Array<{ kill: () => void }>;
    refresh?: () => void;
  };
  ScrollSmoother?: {
    get: () => { kill: () => void } | null;
  };
  DrawSVGPlugin?: unknown;
  MorphSVGPlugin?: unknown;
  SplitText?: unknown;
}

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
  React.useEffect(() => {
    let mounted = true;

    // Ensure page background stays strictly dark (#09090B) during smooth scrolling
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlDark = document.documentElement.classList.contains("dark");
    const prevBodyDark = document.body.classList.contains("dark");
    document.documentElement.classList.add("dark", "scylla-landing-page");
    document.body.classList.add("dark", "scylla-landing-page");
    document.documentElement.style.backgroundColor = "#09090b";
    document.body.style.backgroundColor = "#09090b";

    const w = window as unknown as GsapWindow;
    const scripts = [
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/all.min.js",
      "/js/main.js",
    ];

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

    const startScripts = () => {
      if (!mounted) return;
      loadScript(0);
    };

    const cssLink = document.getElementById(
      "scylla-landing-css",
    ) as HTMLLinkElement | null;
    if (cssLink && !cssLink.sheet) {
      cssLink.addEventListener("load", startScripts, { once: true });
      cssLink.addEventListener("error", startScripts, { once: true });
    } else {
      startScripts();
    }

    return () => {
      mounted = false;
      if (cssLink) {
        cssLink.removeEventListener("load", startScripts);
        cssLink.removeEventListener("error", startScripts);
      }

      // Clean up landing classes and background styles
      document.documentElement.classList.remove("scylla-landing-page");
      document.body.classList.remove("overflow-hidden", "scylla-landing-page");
      if (!prevHtmlDark) {
        document.documentElement.classList.remove("dark");
      }
      if (!prevBodyDark) {
        document.body.classList.remove("dark");
      }
      document.documentElement.style.backgroundColor = prevHtmlBg || "";
      document.body.style.backgroundColor = prevBodyBg || "";

      // Kill GSAP ScrollTrigger and ScrollSmoother
      if (typeof window !== "undefined") {
        if (w.ScrollTrigger) {
          try {
            w.ScrollTrigger.getAll().forEach((t) => t.kill());
          } catch (_e) {
            // Ignore GSAP cleanup error
          }
        }
        if (w.ScrollSmoother) {
          try {
            const sm = w.ScrollSmoother.get();
            if (sm) sm.kill();
          } catch (_e) {
            // Ignore GSAP cleanup error
          }
        }
      }

      const addedMain = document.querySelectorAll("script[data-landing-main]");
      addedMain.forEach((el) => el.remove());
    };
  }, []);

  return null;
}
