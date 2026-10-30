import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import MarketingLayout from "@/app/(marketing)/layout";
import { LandingHeader } from "@/components/landing/header";
import { LandingCtaBanner } from "@/components/landing/cta-banner";
import { LandingPricing } from "@/components/landing/pricing";
import { config as proxyConfig } from "@/proxy";

const ROOT_DIR = process.cwd();

describe("Landing Page & Review Fixes", () => {
  it("removes unused duplicate files (src/styles/landing.css, video-modal.tsx, about.mp4, ai_agent, local gsap/plugin bundles)", () => {
    expect(existsSync(join(ROOT_DIR, "src/styles/landing.css"))).toBe(false);
    expect(
      existsSync(join(ROOT_DIR, "src/components/landing/video-modal.tsx")),
    ).toBe(false);
    expect(existsSync(join(ROOT_DIR, "public/media/about.mp4"))).toBe(false);
    expect(existsSync(join(ROOT_DIR, "public/images/ai_agent"))).toBe(false);
    expect(existsSync(join(ROOT_DIR, "public/fonts"))).toBe(false);
    expect(
      existsSync(join(ROOT_DIR, "public/js/gsap-latest-beta.min.js")),
    ).toBe(false);
    expect(existsSync(join(ROOT_DIR, "public/js/plugin.js"))).toBe(false);
  });

  it("uses window.location.replace with a Next.js CSS cache note across landing and sidebar components", () => {
    const filesToCheck = [
      "src/components/landing/header.tsx",
      "src/components/landing/hero.tsx",
      "src/components/landing/about-video.tsx",
      "src/components/landing/cta-banner.tsx",
      "src/components/landing/footer.tsx",
      "src/components/landing/pricing.tsx",
      "src/components/landing/use-cases.tsx",
      "src/components/landing/process-steps.tsx",
      "src/components/landing/integrations.tsx",
      "src/components/layout/app-sidebar.tsx",
    ];

    for (const relPath of filesToCheck) {
      const content = readFileSync(join(ROOT_DIR, relPath), "utf8");
      expect(content).toContain("window.location.replace");
      expect(content).toContain("Next.js caches CSS");
    }
  });

  it("points all sign-in CTAs to /auth/sign-in consistently", () => {
    const headerHtml = renderToString(React.createElement(LandingHeader));
    const ctaHtml = renderToString(React.createElement(LandingCtaBanner));
    const pricingHtml = renderToString(React.createElement(LandingPricing));

    expect(headerHtml).toContain('href="/auth/sign-in"');
    expect(headerHtml).not.toContain('href="/sign-in"');

    expect(ctaHtml).toContain('href="/auth/sign-in"');
    expect(ctaHtml).not.toContain('href="/sign-in"');

    expect(pricingHtml).toContain('href="/auth/sign-in"');
    expect(pricingHtml).not.toContain('href="/sign-in"');
  });

  it("controls pricing monthly/yearly toggle via React state instead of imperative DOM mutation", () => {
    const monthlyHtml = renderToString(React.createElement(LandingPricing));
    expect(monthlyHtml).toContain("$19");
    expect(monthlyHtml).toContain("$49");
    expect(monthlyHtml).toContain("$99");
    expect(monthlyHtml).toContain("/mo");

    const yearlyHtml = renderToString(
      React.createElement(LandingPricing, { defaultYearly: true }),
    );
    expect(yearlyHtml).toContain("$190");
    expect(yearlyHtml).toContain("$490");
    expect(yearlyHtml).toContain("$990");
    expect(yearlyHtml).toContain("/year");

    const mainJs = readFileSync(join(ROOT_DIR, "public/js/main.js"), "utf8");
    expect(mainJs).not.toContain('getElementById("priceToggle")');
  });

  it("uses DOMContentLoaded in public/js/main.js onReady and wraps script in IIFE without unguarded Swiper calls", () => {
    const mainJs = readFileSync(join(ROOT_DIR, "public/js/main.js"), "utf8");
    expect(mainJs).toContain('document.addEventListener("DOMContentLoaded"');
    expect(mainJs.trimStart().startsWith("(function")).toBe(true);
    expect(mainJs.trimEnd().endsWith("})();")).toBe(true);
    expect(mainJs).toContain(
      'if (typeof Swiper === "undefined" || !document.querySelector(selector))',
    );
    expect(mainJs).toContain("registerGsapPlugins();");
    expect(mainJs).not.toContain('origin: "');
    expect(mainJs).toContain('transformOrigin: "bottom left"');
  });

  it("renders landing stylesheet in MarketingLayout for SSR first-load and avoids duplicate link injection in LandingScripts", () => {
    const landingScripts = readFileSync(
      join(ROOT_DIR, "src/components/landing/landing-scripts.tsx"),
      "utf8",
    );
    const layoutHtml = renderToString(
      React.createElement(
        MarketingLayout,
        null,
        React.createElement("div", null, "content"),
      ),
    );

    expect(layoutHtml).toContain('href="/css/landing.css"');
    expect(landingScripts).toContain('classList.remove("dark")');
    expect(landingScripts).toContain(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/all.min.js",
    );
    expect(landingScripts).toContain(
      "https://cdnjs.cloudflare.com/ajax/libs/Swiper/5.4.5/js/swiper.min.js",
    );
    expect(landingScripts).not.toContain("/js/gsap-latest-beta.min.js");
    expect(landingScripts).not.toContain("/js/plugin.js");
    expect(landingScripts).not.toContain('createElement("link")');
    expect(landingScripts).not.toContain("cssLink.remove()");
  });

  it("scopes public/css/landing.css theme variables and base resets to .scylla-landing to prevent conflicts with globals.css", () => {
    const landingCss = readFileSync(
      join(ROOT_DIR, "public/css/landing.css"),
      "utf8",
    );

    expect(landingCss).not.toMatch(/@layer theme\s*\{\s*:root/);
    expect(landingCss).toMatch(/@layer theme\s*\{\s*\.scylla-landing\s*\{/);
    expect(landingCss).toContain(":where(.scylla-landing)");
    expect(landingCss).toContain("fonts.googleapis.com/css2");
    expect(landingCss).not.toContain('url("/fonts/');
  });

  it("configures db:seed to use bun run src/db/seed.ts in package.json", () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT_DIR, "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.["db:seed"]).toBe("bun run src/db/seed.ts");
  });

  it("excludes static media, css, and js assets in proxy matcher and handles /sign-in redirect", () => {
    const matcher = proxyConfig.matcher[0];
    expect(matcher).toContain("css");
    expect(matcher).toContain("js");
    expect(matcher).toContain("mp4");
    expect(matcher).toContain("webm");

    const proxySource = readFileSync(join(ROOT_DIR, "src/proxy.ts"), "utf8");
    expect(proxySource).toContain('pathname === "/sign-in"');
  });
});
