"use client";

import * as React from "react";

export function LandingScripts() {
  React.useEffect(() => {
    let mounted = true;

    // 1. Ensure landing stylesheet is dynamically attached
    if (!document.getElementById("scylla-landing-css")) {
      const link = document.createElement("link");
      link.id = "scylla-landing-css";
      link.rel = "stylesheet";
      link.href = "/css/landing.css";
      document.head.appendChild(link);
    }

    // Ensure page background stays strictly dark (#09090B) during smooth scrolling
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlDark = document.documentElement.classList.contains("dark");
    const prevBodyDark = document.body.classList.contains("dark");
    document.documentElement.classList.add("dark", "scylla-landing-page");
    document.body.classList.add("dark", "scylla-landing-page");
    document.documentElement.style.backgroundColor = "#09090b";
    document.body.style.backgroundColor = "#09090b";

    const scripts = [
      "/js/gsap-latest-beta.min.js",
      "/js/plugin.js",
      "/js/main.js",
    ];

    // Remove any previously appended instances to avoid duplicate listeners on hot-reload
    const existing = document.querySelectorAll("script[data-landing-script]");
    existing.forEach((el) => el.remove());

    const loadScript = (index: number) => {
      if (!mounted || index >= scripts.length) return;
      const src = scripts[index];

      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.setAttribute("data-landing-script", "true");
      s.onload = () => {
        if (mounted) loadScript(index + 1);
      };
      document.body.appendChild(s);
    };

    loadScript(0);

    return () => {
      mounted = false;

      // 1. Unload landing stylesheet so it doesn't pollute /calendar or app layouts
      const cssLink = document.getElementById("scylla-landing-css");
      if (cssLink) {
        cssLink.remove();
      }

      // 2. Clean up landing classes and background styles
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

      // 3. Kill GSAP ScrollTrigger and ScrollSmoother
      if (typeof window !== "undefined") {
        interface GsapWindow extends Window {
          ScrollTrigger?: {
            getAll: () => Array<{ kill: () => void }>;
          };
          ScrollSmoother?: {
            get: () => { kill: () => void } | null;
          };
        }
        const w = window as unknown as GsapWindow;
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

      const added = document.querySelectorAll("script[data-landing-script]");
      added.forEach((el) => el.remove());
    };
  }, []);

  return null;
}
