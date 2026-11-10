import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "../../src/db";
import { user, account } from "../../src/db/schema";
import { GithubAuthService } from "../../src/services/github/github-auth-service";

describe("GithubAuthService (Token Refresh & Auto Retry)", () => {
  let originalFetch: typeof globalThis.fetch;
  const originalClientId = process.env.GITHUB_CLIENT_ID;
  const originalClientSecret = process.env.GITHUB_CLIENT_SECRET;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env.GITHUB_CLIENT_ID = "mock-client-id";
    process.env.GITHUB_CLIENT_SECRET = "mock-client-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.GITHUB_CLIENT_ID = originalClientId;
    process.env.GITHUB_CLIENT_SECRET = originalClientSecret;
  });

  test("resolveToken returns fresh access token directly when not expired", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Fresh User",
        email: `fresh-${Date.now()}@example.com`,
      })
      .returning();

    const futureDate = new Date(Date.now() + 3600 * 1000);
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "fresh-gh-1",
      providerId: "github",
      userId: testUser.id,
      accessToken: "gho_valid_fresh_token",
      accessTokenExpiresAt: futureDate,
    });

    const token = await GithubAuthService.resolveToken(testUser.id);
    expect(token).toBe("gho_valid_fresh_token");

    // Clean up
    await db.delete(account).where(inArray(account.userId, [testUser.id]));
    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });

  test("resolveToken automatically refreshes expired token using refreshToken and updates DB", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Expired User",
        email: `expired-${Date.now()}@example.com`,
      })
      .returning();

    const pastDate = new Date(Date.now() - 3600 * 1000);
    const [acc] = await db
      .insert(account)
      .values({
        id: crypto.randomUUID(),
        accountId: "expired-gh-2",
        providerId: "github",
        userId: testUser.id,
        accessToken: "gho_expired_token",
        refreshToken: "ghr_valid_refresh_token",
        accessTokenExpiresAt: pastDate,
      })
      .returning();

    // Mock GitHub OAuth refresh token endpoint
    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (
        urlStr.includes("github.com/login/oauth/access_token") &&
        init?.method === "POST"
      ) {
        const body = JSON.parse(init.body as string);
        if (body.grant_type === "refresh_token") {
          return new Response(
            JSON.stringify({
              access_token: "gho_brand_new_token_123",
              expires_in: 28800,
              refresh_token: "ghr_brand_new_refresh_token_456",
              token_type: "bearer",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const token = await GithubAuthService.resolveToken(testUser.id);
    expect(token).toBe("gho_brand_new_token_123");

    // Verify token was persisted to DB
    const [refreshedAcc] = await db
      .select()
      .from(account)
      .where(inArray(account.id, [acc.id]));

    expect(refreshedAcc.accessToken).toBe("gho_brand_new_token_123");
    expect(refreshedAcc.refreshToken).toBe("ghr_brand_new_refresh_token_456");
    expect(
      refreshedAcc.accessTokenExpiresAt &&
        refreshedAcc.accessTokenExpiresAt.getTime() > Date.now(),
    ).toBe(true);

    // Clean up
    await db.delete(account).where(inArray(account.userId, [testUser.id]));
    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });

  test("fetchWithAuth automatically refreshes and retries when encountering 401 response", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Retry User",
        email: `retry-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "retry-gh-3",
      providerId: "github",
      userId: testUser.id,
      accessToken: "gho_unexpectedly_revoked",
      refreshToken: "ghr_valid_retry_refresh",
      accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000), // thinks it's valid
    });

    let callCount = 0;
    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.includes("api.github.com/user")) {
        callCount++;
        const authHeader = (init?.headers as Headers)?.get("Authorization");
        if (authHeader === "Bearer gho_unexpectedly_revoked") {
          return new Response(JSON.stringify({ message: "Bad credentials" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (authHeader === "Bearer gho_after_refresh_token") {
          return new Response(JSON.stringify({ login: "successful_retry" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      if (urlStr.includes("github.com/login/oauth/access_token")) {
        return new Response(
          JSON.stringify({
            access_token: "gho_after_refresh_token",
            expires_in: 28800,
            token_type: "bearer",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/user",
      {},
      testUser.id,
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.login).toBe("successful_retry");
    expect(callCount).toBe(2); // First call failed with 401, second call succeeded with refreshed token

    // Clean up
    await db.delete(account).where(inArray(account.userId, [testUser.id]));
    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });

  test("fetchWithAuth falls back to GITHUB_TOKEN when DB token has 401 and refresh token is unavailable", async () => {
    const originalToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = "ghp_env_fallback_token_999";

    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "No Refresh User",
        email: `norefresh-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "norefresh-gh-1",
      providerId: "github",
      userId: testUser.id,
      accessToken: "gho_dead_token_without_refresh",
      refreshToken: null,
    });

    let callCount = 0;
    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.includes("api.github.com/user")) {
        callCount++;
        const authHeader = (init?.headers as Headers)?.get("Authorization");
        if (authHeader === "Bearer gho_dead_token_without_refresh") {
          return new Response(JSON.stringify({ message: "Bad credentials" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (authHeader === "Bearer ghp_env_fallback_token_999") {
          return new Response(JSON.stringify({ login: "env_fallback_user" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/user",
      {},
      testUser.id,
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.login).toBe("env_fallback_user");
    expect(callCount).toBe(2);

    process.env.GITHUB_TOKEN = originalToken;
    await db.delete(account).where(inArray(account.userId, [testUser.id]));
    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });
});
