import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LandingHeader } from "@/components/landing/header";
import { LandingCtaBanner } from "@/components/landing/cta-banner";
import { LandingPricing } from "@/components/landing/pricing";
import { config as proxyConfig } from "@/proxy";

const ROOT_DIR = process.cwd();

describe("Landing Page & Review Fixes", () => {
  it("removes unused duplicate files (src/styles/landing.css, video-modal.tsx, about.mp4)", () => {
    expect(existsSync(join(ROOT_DIR, "src/styles/landing.css"))).toBe(false);
    expect(
      existsSync(join(ROOT_DIR, "src/components/landing/video-modal.tsx")),
    ).toBe(false);
    expect(existsSync(join(ROOT_DIR, "public/media/about.mp4"))).toBe(false);
  });

  it("uses standard Next.js Links without window.location.replace across landing and sidebar components", () => {
    const filesToCheck = [
      "src/components/landing/header.tsx",
      "src/components/landing/hero.tsx",
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
      expect(content).not.toContain("window.location.replace");
    }

    const sidebarContent = readFileSync(
      join(ROOT_DIR, "src/components/layout/app-sidebar.tsx"),
      "utf8",
    );
    expect(sidebarContent).toContain('render={<Link href="/calendar" />}');
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

  it("uses DOMContentLoaded in public/js/main.js onReady instead of infinite recursion", () => {
    const mainJs = readFileSync(join(ROOT_DIR, "public/js/main.js"), "utf8");
    expect(mainJs).toContain('document.addEventListener("DOMContentLoaded"');
  });

  it("restores prior dark class state in LandingScripts cleanup and avoids dual CSS link injection", () => {
    const landingScripts = readFileSync(
      join(ROOT_DIR, "src/components/landing/landing-scripts.tsx"),
      "utf8",
    );
    const marketingLayout = readFileSync(
      join(ROOT_DIR, "src/app/(marketing)/layout.tsx"),
      "utf8",
    );

    expect(landingScripts).toContain('classList.remove("dark")');
    expect(marketingLayout).not.toContain('id="scylla-landing-css"');
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
