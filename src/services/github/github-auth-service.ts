import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { account } from "@/db/schema";

export const GITHUB_API_URL = "https://api.github.com";

const REFRESH_URL = "https://github.com/login/oauth/access_token";
const USER_AGENT = "Scylla-Task-Integration/1.0";
const DEFAULT_TOKEN_LIFETIME_SECONDS = 28800;
const EXPIRY_MARGIN_MS = 60_000;

type GithubAccount = typeof account.$inferSelect;

interface RefreshResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

function envToken(): string | undefined {
  return (
    process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN || undefined
  );
}

async function findGithubAccount(
  userId: string,
): Promise<GithubAccount | undefined> {
  const [row] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
    .limit(1);
  return row;
}

/** Exchanges the account's refresh token for a new access token; never throws. */
async function refreshAccountToken(row: GithubAccount): Promise<string | null> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!row.refreshToken || !clientId || !clientSecret) return null;

  try {
    const res = await fetch(REFRESH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: row.refreshToken,
      }),
    });
    if (!res.ok) {
      console.warn(`Failed to refresh GitHub token (${res.status})`);
      return null;
    }
    const data = (await res.json()) as RefreshResponse;
    if (!data.access_token) {
      if (data.error) {
        console.warn(
          `GitHub OAuth refresh error: ${data.error} ${data.error_description ?? ""}`,
        );
      }
      return null;
    }
    const lifetime = Number(data.expires_in) || DEFAULT_TOKEN_LIFETIME_SECONDS;
    await db
      .update(account)
      .set({
        accessToken: data.access_token,
        ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
        accessTokenExpiresAt: new Date(Date.now() + lifetime * 1000),
        updatedAt: new Date(),
      })
      .where(eq(account.id, row.id));
    return data.access_token;
  } catch (err) {
    console.warn("Error refreshing GitHub OAuth access token:", err);
    return null;
  }
}

export class GithubAuthService {
  static async isConnected(userId: string): Promise<boolean> {
    return (await findGithubAccount(userId)) !== undefined;
  }

  static async getConnectedUserIds(
    userIds: readonly string[],
  ): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    const rows = await db
      .select({ userId: account.userId })
      .from(account)
      .where(
        and(
          inArray(account.userId, [...userIds]),
          eq(account.providerId, "github"),
        ),
      );
    return new Set(rows.map((r) => r.userId));
  }

  static async resolveToken(userId?: string): Promise<string | undefined> {
    if (userId) {
      const row = await findGithubAccount(userId);
      if (row) {
        const expiring =
          row.accessTokenExpiresAt !== null &&
          row.accessTokenExpiresAt.getTime() <= Date.now() + EXPIRY_MARGIN_MS;
        if (row.accessToken && !expiring) return row.accessToken;

        const refreshed = await refreshAccountToken(row);
        if (refreshed) return refreshed;

        return envToken() ?? row.accessToken ?? undefined;
      }
    }
    return envToken();
  }

  static async fetchWithAuth(
    url: string,
    init: RequestInit = {},
    userId?: string,
  ): Promise<Response> {
    const token = await GithubAuthService.resolveToken(userId);

    const headers = new Headers(init.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/vnd.github+json");
    }
    headers.set("User-Agent", USER_AGENT);
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(url, { ...init, headers });
    if (res.status !== 401) return res;

    let retryToken: string | undefined;
    if (userId) {
      const row = await findGithubAccount(userId);
      if (row?.refreshToken) {
        retryToken = (await refreshAccountToken(row)) ?? undefined;
      }
    }
    if (!retryToken) {
      const fallback = envToken();
      if (fallback && fallback !== token) retryToken = fallback;
    }
    if (!retryToken) return res;

    headers.set("Authorization", `Bearer ${retryToken}`);
    return fetch(url, { ...init, headers });
  }
}
