import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account } from "@/db/schema";
import { GithubAuthService } from "@/services/github/github-auth-service";
import {
  createGithubFixture,
  type GithubFixture,
} from "../test-utils/github-fixtures";
import { mockGithubApi } from "../test-utils/mock-github-api";

const ENV_KEYS = ["GITHUB_TOKEN", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"];
const savedEnv: Record<string, string | undefined> = {};
let fixture: GithubFixture | null = null;
let restoreFetch: (() => void) | null = null;

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(async () => {
  restoreFetch?.();
  restoreFetch = null;
  await fixture?.cleanup();
  fixture = null;
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

const API = "https://api.github.com/user";

describe("GithubAuthService.resolveToken and fetchWithAuth", () => {
  test("uses the user's account token and standard headers", async () => {
    fixture = await createGithubFixture();
    const mock = mockGithubApi([{ method: "GET", path: "/user" }]);
    restoreFetch = mock.restore;

    expect(await GithubAuthService.resolveToken(fixture.userId)).toBe(
      "gho_test_token",
    );
    const res = await GithubAuthService.fetchWithAuth(
      API,
      { headers: { "X-Custom": "1" } },
      fixture.userId,
    );
    expect(res.status).toBe(200);
    const h = mock.calls[0].headers;
    expect(h.get("authorization")).toBe("Bearer gho_test_token");
    expect(h.get("accept")).toBe("application/vnd.github+json");
    expect(h.get("x-github-api-version")).toBe("2022-11-28");
    expect(h.get("user-agent")).toBe("Scylla-GitHub-Integration");
    expect(h.get("x-custom")).toBe("1");
  });

  test("refreshes an expired token and persists it", async () => {
    fixture = await createGithubFixture();
    process.env.GITHUB_CLIENT_ID = "cid";
    process.env.GITHUB_CLIENT_SECRET = "secret";
    await db
      .update(account)
      .set({
        accessTokenExpiresAt: new Date(Date.now() - 1000),
        refreshToken: "ghr_old",
      })
      .where(eq(account.userId, fixture.userId));
    const mock = mockGithubApi([
      {
        method: "POST",
        path: "/login/oauth/access_token",
        body: { access_token: "gho_new", expires_in: 3600 },
      },
    ]);
    restoreFetch = mock.restore;

    expect(await GithubAuthService.resolveToken(fixture.userId)).toBe(
      "gho_new",
    );
    expect(mock.calls[0].body).toEqual({
      client_id: "cid",
      client_secret: "secret",
      grant_type: "refresh_token",
      refresh_token: "ghr_old",
    });
    expect(mock.calls[0].headers.get("accept")).toBe("application/json");
    const [row] = await db
      .select()
      .from(account)
      .where(eq(account.userId, fixture.userId));
    expect(row.accessToken).toBe("gho_new");
    expect(row.refreshToken).toBe("ghr_old");
    const ms = row.accessTokenExpiresAt!.getTime() - Date.now();
    expect(ms).toBeGreaterThan(3500 * 1000);
    expect(ms).toBeLessThan(3700 * 1000);
  });

  test("an expired token without refresh settings falls back to GITHUB_TOKEN", async () => {
    fixture = await createGithubFixture();
    process.env.GITHUB_TOKEN = "ghp_env";
    await db
      .update(account)
      .set({ accessTokenExpiresAt: new Date(Date.now() + 30_000) })
      .where(eq(account.userId, fixture.userId));
    expect(await GithubAuthService.resolveToken(fixture.userId)).toBe(
      "ghp_env",
    );
  });

  test("uses GITHUB_TOKEN when the user has no account", async () => {
    process.env.GITHUB_TOKEN = "ghp_env";
    const mock = mockGithubApi([{ method: "GET", path: "/user" }]);
    restoreFetch = mock.restore;
    await GithubAuthService.fetchWithAuth(API);
    expect(mock.calls[0].headers.get("authorization")).toBe("Bearer ghp_env");
  });

  test("sends no Authorization header without any token", async () => {
    fixture = await createGithubFixture({ githubAccount: false });
    const mock = mockGithubApi([{ method: "GET", path: "/user" }]);
    restoreFetch = mock.restore;
    expect(await GithubAuthService.resolveToken(fixture.userId)).toBeNull();
    await GithubAuthService.fetchWithAuth(API, undefined, fixture.userId);
    expect(mock.calls[0].headers.has("authorization")).toBe(false);
  });

  test("retries a 401 once with GITHUB_TOKEN", async () => {
    fixture = await createGithubFixture();
    process.env.GITHUB_TOKEN = "ghp_env";
    const mock = mockGithubApi([
      {
        method: "GET",
        path: "/user",
        status: 200,
      },
    ]);
    restoreFetch = mock.restore;
    // First call 401 by swapping the route after the first call.
    const inner = globalThis.fetch;
    let n = 0;
    globalThis.fetch = (async (i: RequestInfo | URL, init?: RequestInit) => {
      n += 1;
      if (n === 1) {
        await inner(i, init);
        return new Response("{}", { status: 401 });
      }
      return inner(i, init);
    }) as typeof fetch;

    const res = await GithubAuthService.fetchWithAuth(
      API,
      undefined,
      fixture.userId,
    );
    expect(res.status).toBe(200);
    expect(mock.calls).toHaveLength(2);
    expect(mock.calls[0].headers.get("authorization")).toBe(
      "Bearer gho_test_token",
    );
    expect(mock.calls[1].headers.get("authorization")).toBe("Bearer ghp_env");
  });

  test("does not retry a 401 with the same token", async () => {
    process.env.GITHUB_TOKEN = "ghp_env";
    const mock = mockGithubApi([{ method: "GET", path: "/user", status: 401 }]);
    restoreFetch = mock.restore;
    const res = await GithubAuthService.fetchWithAuth(API);
    expect(res.status).toBe(401);
    expect(mock.calls).toHaveLength(1);
  });
});

describe("GithubAuthService connection and login", () => {
  test("hasGithubConnection", async () => {
    fixture = await createGithubFixture();
    expect(await GithubAuthService.hasGithubConnection(fixture.userId)).toBe(
      true,
    );
    const other = await createGithubFixture({ githubAccount: false });
    expect(await GithubAuthService.hasGithubConnection(other.userId)).toBe(
      false,
    );
    await other.cleanup();
  });

  test("getGithubLogin resolves numeric ids and passes through logins", async () => {
    fixture = await createGithubFixture();
    const mock = mockGithubApi([
      { method: "GET", path: "/user/1001", body: { login: "octocat" } },
    ]);
    restoreFetch = mock.restore;
    expect(await GithubAuthService.getGithubLogin(fixture.userId)).toBe(
      "octocat",
    );
    expect(mock.calls[0].url).toBe("https://api.github.com/user/1001");

    await db
      .update(account)
      .set({ accountId: "hubot" })
      .where(eq(account.userId, fixture.userId));
    expect(await GithubAuthService.getGithubLogin(fixture.userId)).toBe(
      "hubot",
    );
    expect(mock.calls).toHaveLength(1);
  });

  test("getGithubLogin is null without account or on failure", async () => {
    const none = await createGithubFixture({ githubAccount: false });
    expect(await GithubAuthService.getGithubLogin(none.userId)).toBeNull();
    await none.cleanup();
    fixture = await createGithubFixture();
    restoreFetch = mockGithubApi([]).restore;
    expect(await GithubAuthService.getGithubLogin(fixture.userId)).toBeNull();
  });
});

describe("401 retry with a refreshed user token (QA)", () => {
  test("retries once with the refreshed user token and keeps caller headers", async () => {
    fixture = await createGithubFixture();
    process.env.GITHUB_CLIENT_ID = "cid";
    process.env.GITHUB_CLIENT_SECRET = "secret";
    await db
      .update(account)
      .set({ refreshToken: "ghr_old" })
      .where(eq(account.userId, fixture.userId));
    const mock = mockGithubApi([
      {
        method: "POST",
        path: "/login/oauth/access_token",
        body: { access_token: "gho_new", refresh_token: "ghr_new" },
      },
      {
        method: "GET",
        path: "/user",
        body: {},
      },
    ]);
    restoreFetch = mock.restore;
    const inner = globalThis.fetch;
    let userCalls = 0;
    globalThis.fetch = (async (i: RequestInfo | URL, init?: RequestInit) => {
      const res = await inner(i, init);
      if (String(i).endsWith("/user") && ++userCalls === 1) {
        return new Response("{}", { status: 401 });
      }
      return res;
    }) as typeof fetch;

    const res = await GithubAuthService.fetchWithAuth(
      API,
      { headers: { "X-Custom": "keep" } },
      fixture.userId,
    );
    expect(res.status).toBe(200);
    const userReqs = mock.calls.filter((c) => c.path === "/user");
    expect(userReqs).toHaveLength(2);
    expect(userReqs[0].headers.get("authorization")).toBe(
      "Bearer gho_test_token",
    );
    expect(userReqs[1].headers.get("authorization")).toBe("Bearer gho_new");
    expect(userReqs[1].headers.get("x-custom")).toBe("keep");
    const [row] = await db
      .select()
      .from(account)
      .where(eq(account.userId, fixture.userId));
    expect(row.accessToken).toBe("gho_new");
    expect(row.refreshToken).toBe("ghr_new");
  });
});
