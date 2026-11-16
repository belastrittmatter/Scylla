import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LandingHeader } from "@/components/landing/header";
import { LandingCtaBanner } from "@/components/landing/cta-banner";
import { LandingFooter } from "@/components/landing/footer";
import { config as proxyConfig } from "@/proxy";

const ROOT_DIR = process.cwd();

describe("Landing page", () => {
  it("points all sign-in CTAs to /auth/sign-in and redirects /sign-in to /auth/sign-in", () => {
    const headerHtml = renderToString(React.createElement(LandingHeader));
    const ctaHtml = renderToString(React.createElement(LandingCtaBanner));

    expect(headerHtml).toContain('href="/auth/sign-in"');
    expect(headerHtml).not.toContain('href="/sign-in"');
    expect(ctaHtml).toContain('href="/auth/sign-in"');
    expect(ctaHtml).not.toContain('href="/sign-in"');

    const signInPage = readFileSync(
      join(ROOT_DIR, "src/app/sign-in/page.tsx"),
      "utf8",
    );
    expect(signInPage).toContain('redirect("/auth/sign-in")');
  });

  it("links the legal pages from the footer", () => {
    const footerHtml = renderToString(React.createElement(LandingFooter));
    for (const href of ["/privacy", "/terms", "/ai-policy"]) {
      expect(footerHtml).toContain(`href="${href}"`);
    }
  });

  it("does not use window.location.replace in the app sidebar", () => {
    const sidebarContent = readFileSync(
      join(ROOT_DIR, "src/components/layout/app-sidebar.tsx"),
      "utf8",
    );
    expect(sidebarContent).not.toContain("window.location.replace");
    expect(sidebarContent).toContain('href="/calendar"');
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
