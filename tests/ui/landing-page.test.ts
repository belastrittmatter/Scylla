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
  it("removes unused duplicate files (src/styles/landing.css, video-modal.tsx, about-video.tsx, about.mp4, ai_agent, local gsap/plugin bundles)", () => {
    expect(existsSync(join(ROOT_DIR, "src/styles/landing.css"))).toBe(false);
    expect(
      existsSync(join(ROOT_DIR, "src/components/landing/video-modal.tsx")),
    ).toBe(false);
    expect(
      existsSync(join(ROOT_DIR, "src/components/landing/about-video.tsx")),
    ).toBe(false);
    expect(
      existsSync(
        join(ROOT_DIR, "src/components/landing/task-board-preview.tsx"),
      ),
    ).toBe(true);
    expect(existsSync(join(ROOT_DIR, "public/media/about.mp4"))).toBe(false);
    expect(existsSync(join(ROOT_DIR, "public/images/ai_agent"))).toBe(false);
    expect(existsSync(join(ROOT_DIR, "public/fonts"))).toBe(false);
    expect(
      existsSync(join(ROOT_DIR, "public/js/gsap-latest-beta.min.js")),
    ).toBe(false);
    expect(existsSync(join(ROOT_DIR, "public/js/plugin.js"))).toBe(false);
  });

  it("extracts HardLink with window.location.replace and Next.js CSS cache note and uses it across landing components", () => {
    const hardLinkContent = readFileSync(
      join(ROOT_DIR, "src/components/landing/hard-link.tsx"),
      "utf8",
    );
    expect(hardLinkContent).toContain("window.location.replace");
    expect(hardLinkContent).toContain("Next.js caches CSS");

    const sidebarContent = readFileSync(
      join(ROOT_DIR, "src/components/layout/app-sidebar.tsx"),
      "utf8",
    );
    expect(sidebarContent).toContain("window.location.replace");
    expect(sidebarContent).toContain("Next.js caches CSS");

    const landingComponents = [
      "src/components/landing/header.tsx",
      "src/components/landing/hero.tsx",
      "src/components/landing/task-board-preview.tsx",
      "src/components/landing/cta-banner.tsx",
      "src/components/landing/footer.tsx",
      "src/components/landing/pricing.tsx",
      "src/components/landing/use-cases.tsx",
      "src/components/landing/process-steps.tsx",
      "src/components/landing/integrations.tsx",
    ];

    for (const relPath of landingComponents) {
      const content = readFileSync(join(ROOT_DIR, relPath), "utf8");
      expect(content).toContain("HardLink");
    }
  });

  it("standardizes on Landing* named exports without redundant double alias exports", () => {
    const indexContent = readFileSync(
      join(ROOT_DIR, "src/components/landing/index.ts"),
      "utf8",
    );
    expect(indexContent).toContain("LandingTaskBoardPreview");
    expect(indexContent).not.toContain("AboutVideo");
    expect(indexContent).not.toMatch(/\bexport\s*\{\s*Landing\w+\s*,\s*\w+/);
  });

  it("points all sign-in CTAs to /auth/sign-in and redirects /sign-in to /auth/sign-in", () => {
    const headerHtml = renderToString(React.createElement(LandingHeader));
    const ctaHtml = renderToString(React.createElement(LandingCtaBanner));
    const pricingHtml = renderToString(React.createElement(LandingPricing));

    expect(headerHtml).toContain('href="/auth/sign-in"');
    expect(headerHtml).not.toContain('href="/sign-in"');

    expect(ctaHtml).toContain('href="/auth/sign-in"');
    expect(ctaHtml).not.toContain('href="/sign-in"');

    expect(pricingHtml).toContain('href="/auth/sign-in"');
    expect(pricingHtml).not.toContain('href="/sign-in"');

    const signInPage = readFileSync(
      join(ROOT_DIR, "src/app/sign-in/page.tsx"),
      "utf8",
    );
    expect(signInPage).toContain('redirect("/auth/sign-in")');
    expect(signInPage).not.toContain("AuthLayoutShell");
  });

  it("controls pricing monthly/yearly toggle via React state and maps over PRICING_PLANS", () => {
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

    const pricingSource = readFileSync(
      join(ROOT_DIR, "src/components/landing/pricing.tsx"),
      "utf8",
    );
    expect(pricingSource).toContain("PRICING_PLANS.map");

    const footerSource = readFileSync(
      join(ROOT_DIR, "src/components/landing/footer.tsx"),
      "utf8",
    );
    expect(footerSource).toContain("FOOTER_COLUMNS.map");

    const mainJs = readFileSync(join(ROOT_DIR, "public/js/main.js"), "utf8");
    expect(mainJs).not.toContain('getElementById("priceToggle")');
  });

  it("prunes dead template code and Swiper from public/js/main.js while keeping GSAP animations", () => {
    const mainJs = readFileSync(join(ROOT_DIR, "public/js/main.js"), "utf8");
    const lineCount = mainJs.split("\n").length;

    expect(lineCount).toBeLessThan(700);
    expect(mainJs).toContain('document.addEventListener("DOMContentLoaded"');
    expect(mainJs.trimStart().startsWith("(function")).toBe(true);
    expect(mainJs.trimEnd().endsWith("})();")).toBe(true);
    expect(mainJs).toContain("registerGsapPlugins();");
    expect(mainJs).not.toContain("Swiper");
    expect(mainJs).not.toContain("initLogoSlider");
    expect(mainJs).not.toContain("isotope");
    expect(mainJs).not.toContain("aboutVideoPreview");
    expect(mainJs).not.toContain('origin: "');
    expect(mainJs).toContain('transformOrigin: "top right"');
  });

  it("loads GSAP from CDN in LandingScripts without unused Swiper script", () => {
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
    expect(landingScripts).not.toContain("swiper");
    expect(landingScripts).not.toContain("Swiper");
    expect(landingScripts).not.toContain("/js/gsap-latest-beta.min.js");
    expect(landingScripts).not.toContain("/js/plugin.js");
  });

  it("removes Swiper, unused blog prose styles, and unused utility rules from public/css/landing.css while preserving cascade layers", () => {
    const landingCss = readFileSync(
      join(ROOT_DIR, "public/css/landing.css"),
      "utf8",
    );
    const lineCount = landingCss.split("\n").length;

    expect(lineCount).toBeLessThan(3500);
    expect(landingCss).not.toContain(".swiper-container");
    expect(landingCss).not.toContain(".article-content");
    expect(landingCss).toContain("@layer theme, base, components, utilities;");
    expect(landingCss).toContain("@layer base");
    expect(landingCss).toContain("@layer utilities");
    expect(landingCss).toContain(".scylla-landing {");
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
