import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account } from "@/db/schema";

const TOKEN_URL = "https://github.com/login/oauth/access_token";
const EXPIRY_MARGIN_MS = 60_000;
const DEFAULT_EXPIRES_IN_S = 28_800;

type AccountRow = typeof account.$inferSelect;

export class GithubAuthService {
  private static async getAccount(userId: string): Promise<AccountRow | null> {
    const [row] = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
      .limit(1);
    return row ?? null;
  }

  private static envToken(): string | null {
    return process.env.GITHUB_TOKEN?.trim() || null;
  }

  private static async refresh(row: AccountRow): Promise<string | null> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!row.refreshToken || !clientId || !clientSecret) return null;
    try {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: row.refreshToken,
        }),
      });
      const data = (await res.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      if (!data.access_token) return null;
      const seconds = data.expires_in ?? DEFAULT_EXPIRES_IN_S;
      await db
        .update(account)
        .set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? row.refreshToken,
          accessTokenExpiresAt: new Date(Date.now() + seconds * 1000),
          updatedAt: new Date(),
        })
        .where(eq(account.id, row.id));
      return data.access_token;
    } catch (error) {
      console.warn("GitHub token refresh failed", error);
      return null;
    }
  }

  private static async userToken(
    userId: string,
    forceRefresh: boolean,
  ): Promise<string | null> {
    const row = await GithubAuthService.getAccount(userId);
    if (!row) return null;
    const expiresAt = row.accessTokenExpiresAt;
    const fresh =
      !!row.accessToken &&
      !forceRefresh &&
      (!expiresAt || expiresAt.getTime() > Date.now() + EXPIRY_MARGIN_MS);
    if (fresh) return row.accessToken;
    return GithubAuthService.refresh(row);
  }

  static async resolveToken(userId?: string): Promise<string | null> {
    if (userId) {
      const token = await GithubAuthService.userToken(userId, false);
      if (token) return token;
    }
    return GithubAuthService.envToken();
  }

  static async fetchWithAuth(
    url: string,
    init: RequestInit = {},
    userId?: string,
  ): Promise<Response> {
    const send = (token: string | null) => {
      const headers = new Headers(init.headers);
      headers.set("Accept", "application/vnd.github+json");
      headers.set("X-GitHub-Api-Version", "2022-11-28");
      headers.set("User-Agent", "Scylla-GitHub-Integration");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(url, { ...init, headers });
    };

    const token = await GithubAuthService.resolveToken(userId);
    const response = await send(token);
    if (response.status !== 401) return response;

    const candidates: Array<string | null> = [];
    if (userId)
      candidates.push(await GithubAuthService.userToken(userId, true));
    candidates.push(GithubAuthService.envToken());
    const next = candidates.find((t) => t && t !== token);
    return next ? send(next) : response;
  }

  static async hasGithubConnection(userId: string): Promise<boolean> {
    return (await GithubAuthService.getAccount(userId)) !== null;
  }

  static async getGithubLogin(userId: string): Promise<string | null> {
    const row = await GithubAuthService.getAccount(userId);
    if (!row) return null;
    if (!/^\d+$/.test(row.accountId)) return row.accountId;
    try {
      const res = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/user/${row.accountId}`,
        {},
        userId,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { login?: string };
      return data.login ?? null;
    } catch (error) {
      console.warn("GitHub login lookup failed", error);
      return null;
    }
  }
}
