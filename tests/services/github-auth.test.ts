import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { account, user } from "../../src/db/schema";
import { GithubAuthService } from "../../src/services/github/github-auth-service";

interface Recorded {
  url: string;
  method: string;
  headers: Headers;
  body: string | undefined;
}

const ENV_KEYS = [
  "GITHUB_TOKEN",
  "GITHUB_ACCESS_TOKEN",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
] as const;
const REFRESH_URL = "https://github.com/login/oauth/access_token";

let originalFetch: typeof globalThis.fetch;
let savedEnv: Record<string, string | undefined>;
let calls: Recorded[];
let responder: (r: Recorded) => Response;
const userIds: string[] = [];

beforeEach(() => {
  originalFetch = globalThis.fetch;
  savedEnv = {};
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  calls = [];
  responder = () => new Response("unexpected", { status: 500 });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const rec: Recorded = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    calls.push(rec);
    return responder(rec);
  }) as typeof globalThis.fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  for (const id of userIds.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
});

async function makeUser(
  github?: Partial<typeof account.$inferInsert>,
  providerId = "github",
): Promise<string> {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "N",
      email: `n-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  if (github) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "12345",
      providerId,
      userId: u.id,
      ...github,
    });
  }
  return u.id;
}

const minutes = (n: number): Date => new Date(Date.now() + n * 60_000);

function enableRefresh(): void {
  process.env.GITHUB_CLIENT_ID = "cid";
  process.env.GITHUB_CLIENT_SECRET = "secret";
}

describe("connection lookups", () => {
  test("isConnected only for a github account row", async () => {
    const connected = await makeUser({ accessToken: "t" });
    const none = await makeUser();
    const google = await makeUser({ accessToken: "t" }, "google");
    expect(await GithubAuthService.isConnected(connected)).toBe(true);
    expect(await GithubAuthService.isConnected(none)).toBe(false);
    expect(await GithubAuthService.isConnected(google)).toBe(false);
  });

  test("getConnectedUserIds returns the connected subset", async () => {
    const a = await makeUser({ accessToken: "t" });
    const b = await makeUser();
    const result = await GithubAuthService.getConnectedUserIds([a, b]);
    expect([...result]).toEqual([a]);
    expect((await GithubAuthService.getConnectedUserIds([])).size).toBe(0);
  });
});

describe("resolveToken", () => {
  test("returns the stored unexpired token without any request", async () => {
    const id = await makeUser({
      accessToken: "gho_fresh",
      accessTokenExpiresAt: minutes(60),
    });
    expect(await GithubAuthService.resolveToken(id)).toBe("gho_fresh");
    const noExpiry = await makeUser({ accessToken: "gho_forever" });
    expect(await GithubAuthService.resolveToken(noExpiry)).toBe("gho_forever");
    expect(calls).toHaveLength(0);
  });

  test("refreshes an expired token and persists it", async () => {
    enableRefresh();
    const id = await makeUser({
      accessToken: "old",
      refreshToken: "ref_old",
      accessTokenExpiresAt: minutes(-10),
    });
    responder = () =>
      Response.json({
        access_token: "new_tok",
        refresh_token: "ref_new",
        expires_in: 3600,
      });
    expect(await GithubAuthService.resolveToken(id)).toBe("new_tok");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(REFRESH_URL);
    expect(calls[0].method).toBe("POST");
    expect(calls[0].headers.get("Accept")).toBe("application/json");
    expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
      client_id: "cid",
      client_secret: "secret",
      grant_type: "refresh_token",
      refresh_token: "ref_old",
    });
    const [row] = await db.select().from(account).where(eq(account.userId, id));
    expect(row.accessToken).toBe("new_tok");
    expect(row.refreshToken).toBe("ref_new");
    expect(row.accessTokenExpiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  test("a token expiring within 60 seconds is refreshed", async () => {
    enableRefresh();
    const id = await makeUser({
      accessToken: "soon",
      refreshToken: "r",
      accessTokenExpiresAt: new Date(Date.now() + 30_000),
    });
    responder = () => Response.json({ access_token: "renewed" });
    expect(await GithubAuthService.resolveToken(id)).toBe("renewed");
  });

  test("env token for an unknown user and for no user", async () => {
    process.env.GITHUB_TOKEN = "env_tok";
    expect(await GithubAuthService.resolveToken(crypto.randomUUID())).toBe(
      "env_tok",
    );
    expect(await GithubAuthService.resolveToken()).toBe("env_tok");
    delete process.env.GITHUB_TOKEN;
    process.env.GITHUB_ACCESS_TOKEN = "env_access";
    expect(await GithubAuthService.resolveToken()).toBe("env_access");
  });

  test("undefined with no account and no env token", async () => {
    const id = await makeUser();
    expect(await GithubAuthService.resolveToken(id)).toBeUndefined();
    expect(await GithubAuthService.resolveToken()).toBeUndefined();
  });

  test("expired token that cannot be refreshed: env, else stale", async () => {
    const id = await makeUser({
      accessToken: "stale",
      accessTokenExpiresAt: minutes(-10),
    });
    expect(await GithubAuthService.resolveToken(id)).toBe("stale");
    process.env.GITHUB_TOKEN = "env_tok";
    expect(await GithubAuthService.resolveToken(id)).toBe("env_tok");
  });

  test("a failed refresh does not throw and falls back", async () => {
    enableRefresh();
    const id = await makeUser({
      accessToken: "stale",
      refreshToken: "r",
      accessTokenExpiresAt: minutes(-10),
    });
    responder = () => Response.json({ error: "bad_refresh_token" });
    expect(await GithubAuthService.resolveToken(id)).toBe("stale");
    responder = () => new Response("boom", { status: 500 });
    expect(await GithubAuthService.resolveToken(id)).toBe("stale");
  });

  test("a refresh response missing a refresh token keeps the old one", async () => {
    enableRefresh();
    const id = await makeUser({
      accessToken: "old",
      refreshToken: "keep_me",
      accessTokenExpiresAt: minutes(-1),
    });
    responder = () => Response.json({ access_token: "n2" });
    await GithubAuthService.resolveToken(id);
    const [row] = await db.select().from(account).where(eq(account.userId, id));
    expect(row.refreshToken).toBe("keep_me");
    const left = row.accessTokenExpiresAt!.getTime() - Date.now();
    expect(left).toBeGreaterThan(28_000_000);
  });
});

describe("fetchWithAuth", () => {
  test("sends the token, headers, method and body", async () => {
    const id = await makeUser({ accessToken: "gho_x" });
    responder = () => Response.json({ ok: true });
    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/thing",
      {
        method: "PUT",
        body: '{"a":1}',
        headers: { "X-Custom": "yes", "Content-Type": "application/json" },
      },
      id,
    );
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    const c = calls[0];
    expect(c.url).toBe("https://api.github.com/thing");
    expect(c.method).toBe("PUT");
    expect(c.body).toBe('{"a":1}');
    expect(c.headers.get("Authorization")).toBe("Bearer gho_x");
    expect(c.headers.get("Accept")).toBe("application/vnd.github+json");
    expect(c.headers.get("User-Agent")).toBe("Scylla-Task-Integration/1.0");
    expect(c.headers.get("X-Custom")).toBe("yes");
    expect(c.headers.get("Content-Type")).toBe("application/json");
  });

  test("keeps a caller Accept header", async () => {
    responder = () => Response.json({});
    await GithubAuthService.fetchWithAuth("https://api.github.com/x", {
      headers: { Accept: "application/vnd.github.diff" },
    });
    expect(calls[0].headers.get("Accept")).toBe("application/vnd.github.diff");
  });

  test("without a token the request is sent unauthenticated", async () => {
    responder = () => Response.json({ ok: 1 });
    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/x",
    );
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].headers.has("Authorization")).toBe(false);
  });

  test("on 401 refreshes and retries once with the new token", async () => {
    enableRefresh();
    const id = await makeUser({
      accessToken: "revoked",
      refreshToken: "r",
      accessTokenExpiresAt: minutes(60),
    });
    responder = (r) => {
      if (r.url === REFRESH_URL)
        return Response.json({ access_token: "fresh" });
      return r.headers.get("Authorization") === "Bearer fresh"
        ? Response.json({ ok: true })
        : new Response("bad", { status: 401 });
    };
    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/x",
      {},
      id,
    );
    expect(res.status).toBe(200);
    expect(calls.map((c) => c.url)).toEqual([
      "https://api.github.com/x",
      REFRESH_URL,
      "https://api.github.com/x",
    ]);
  });

  test("on 401 retries once with a different env token", async () => {
    const id = await makeUser({ accessToken: "revoked" });
    process.env.GITHUB_TOKEN = "env_tok";
    responder = (r) =>
      r.headers.get("Authorization") === "Bearer env_tok"
        ? Response.json({ ok: true })
        : new Response("bad", { status: 401 });
    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/x",
      {},
      id,
    );
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(2);
  });

  test("on 401 with no alternative the 401 is returned after one request", async () => {
    const id = await makeUser({ accessToken: "revoked" });
    responder = () => new Response("bad", { status: 401 });
    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/x",
      {},
      id,
    );
    expect(res.status).toBe(401);
    expect(calls).toHaveLength(1);
  });

  test("on 401 the env token equal to the one used is not retried", async () => {
    process.env.GITHUB_TOKEN = "same";
    responder = () => new Response("bad", { status: 401 });
    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/x",
    );
    expect(res.status).toBe(401);
    expect(calls).toHaveLength(1);
  });
});
