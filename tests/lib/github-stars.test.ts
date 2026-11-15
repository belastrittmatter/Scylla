import { describe, it, expect, mock, afterEach } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// next/cache only works inside the Next runtime; neutralize it for unit tests.
mock.module("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

const { fetchGitHubRepoStars, getGitHubRepoStars } =
  await import("@/lib/github-stars");

const ROOT_DIR = process.cwd();
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("GitHub repo stars data source", () => {
  it("returns the star count when the GitHub API responds with a valid repo payload", async () => {
    globalThis.fetch = (async () =>
      Response.json({ stargazers_count: 19 })) as unknown as typeof fetch;

    expect(await fetchGitHubRepoStars()).toBe(19);
  });

  it("returns null when the GitHub API responds with a non-200 status", async () => {
    globalThis.fetch = (async () =>
      Response.json(
        { message: "API rate limit exceeded" },
        { status: 403 },
      )) as unknown as typeof fetch;

    expect(await fetchGitHubRepoStars()).toBeNull();
  });

  it("returns null when the payload does not match the repo schema", async () => {
    globalThis.fetch = (async () =>
      Response.json({ stargazers_count: "many" })) as unknown as typeof fetch;

    expect(await fetchGitHubRepoStars()).toBeNull();
  });

  it("returns null when the GitHub API response is not JSON", async () => {
    globalThis.fetch = (async () =>
      new Response("<html>oops</html>", {
        status: 200,
      })) as unknown as typeof fetch;

    expect(await fetchGitHubRepoStars()).toBeNull();
  });

  it("returns null when the network request fails", async () => {
    globalThis.fetch = (async () => {
      throw new Error("Network failure");
    }) as unknown as typeof fetch;

    expect(await fetchGitHubRepoStars()).toBeNull();
  });

  it("requests the repo API with a JSON Accept header and a timeout signal", async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = (async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedInit = init;
      return Response.json({ stargazers_count: 19 });
    }) as unknown as typeof fetch;

    await fetchGitHubRepoStars();

    const headers = new Headers(capturedInit?.headers);
    expect(headers.get("Accept")).toBe("application/vnd.github+json");
    expect(capturedInit?.signal).toBeInstanceOf(AbortSignal);
  });

  it("exposes the cached wrapper that delegates to the fetch helper", async () => {
    globalThis.fetch = (async () =>
      Response.json({ stargazers_count: 19 })) as unknown as typeof fetch;

    expect(await getGitHubRepoStars()).toBe(19);
  });

  it("caches the star count for an hour via the hours cacheLife profile", () => {
    const source = readFileSync(
      join(ROOT_DIR, "src/lib/github-stars.ts"),
      "utf8",
    );
    expect(source).toContain('"use cache"');
    expect(source).toContain('cacheLife("hours")');
  });
});
