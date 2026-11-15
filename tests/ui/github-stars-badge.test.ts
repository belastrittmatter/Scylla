import * as React from "react";
import { renderToString, renderToReadableStream } from "react-dom/server";
import { describe, it, expect, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// next/cache only works inside the Next runtime; neutralize it for unit tests.
mock.module("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

// Star counts come from the server; pin them so hero rendering is deterministic.
mock.module("@/lib/github-stars", () => ({
  GITHUB_REPO_URL: "https://github.com/belastrittmatter/Scylla",
  fetchGitHubRepoStars: async () => 42,
  getGitHubRepoStars: async () => 42,
}));

const { LandingGithubStarsBadge } =
  await import("@/components/landing/github-stars-badge");
const { LandingHero } = await import("@/components/landing/hero");

const ROOT_DIR = process.cwd();
const REPO_URL = "https://github.com/belastrittmatter/Scylla";

async function renderToHtml(element: React.ReactElement): Promise<string> {
  const stream = await renderToReadableStream(element);
  let html = "";
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    html += new TextDecoder().decode(value);
  }
  return html;
}

describe("GitHub stars badge", () => {
  it("renders a repo link with the compact star count when the count is available", () => {
    const html = renderToString(
      React.createElement(LandingGithubStarsBadge, { stars: 19 }),
    );

    expect(html).toContain(`href="${REPO_URL}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('aria-label="19 stars on GitHub"');
    expect(html).toContain(">19<");
  });

  it("formats large star counts with compact notation", () => {
    const html = renderToString(
      React.createElement(LandingGithubStarsBadge, { stars: 1234 }),
    );

    expect(html).toContain("1.2K");
  });

  it("falls back to a count-less GitHub badge when the star count is unavailable", () => {
    const html = renderToString(
      React.createElement(LandingGithubStarsBadge, { stars: null }),
    );

    expect(html).toContain(`href="${REPO_URL}"`);
    expect(html).toContain("GitHub");
    expect(html).not.toContain("stars on GitHub");
  });
});

describe("Landing hero GitHub badge wiring", () => {
  it("renders the badge inside the hero call-to-action row", async () => {
    const html = await renderToHtml(React.createElement(LandingHero));

    expect(html).toContain(`href="${REPO_URL}"`);
    expect(html).toContain('aria-label="42 stars on GitHub"');
    expect(html).toContain('href="/auth/sign-in"');
  });

  it("converts the hero to an async server component that fetches stars", () => {
    const heroSource = readFileSync(
      join(ROOT_DIR, "src/components/landing/hero.tsx"),
      "utf8",
    );
    const badgeSource = readFileSync(
      join(ROOT_DIR, "src/components/landing/github-stars-badge.tsx"),
      "utf8",
    );

    expect(heroSource).not.toContain('"use client"');
    expect(heroSource).toContain("getGitHubRepoStars");
    expect(heroSource).toContain("LandingGithubStarsBadge");
    expect(badgeSource).toContain("GITHUB_REPO_URL");
  });
});
