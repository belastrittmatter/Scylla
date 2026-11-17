import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, mock, afterEach } from "bun:test";

// next/cache only works inside the Next runtime; neutralize it for unit tests.
mock.module("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));

const { fetchGitHubRepoStars } = await import("@/lib/github-stars");
const { LandingGithubStarsBadge } =
  await import("@/components/landing/github-stars-badge");

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("GitHub stars", () => {
  it("returns null when the GitHub API errors", async () => {
    globalThis.fetch = (async () =>
      Response.json({}, { status: 403 })) as unknown as typeof fetch;
    expect(await fetchGitHubRepoStars()).toBeNull();
  });

  it("renders the badge with a compact count, and a plain GitHub link without one", () => {
    const withCount = renderToString(
      React.createElement(LandingGithubStarsBadge, { stars: 1234 }),
    );
    expect(withCount).toContain(
      'href="https://github.com/belastrittmatter/Scylla"',
    );
    expect(withCount).toContain("1.2K");

    const without = renderToString(
      React.createElement(LandingGithubStarsBadge, { stars: null }),
    );
    expect(without).toContain("GitHub");
    expect(without).not.toContain("stars on GitHub");
  });
});
