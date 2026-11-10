import { db } from "@/db";
import { account } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class GithubAuthService {
  /**
   * Refreshes the GitHub access token for a given user account record using its refresh_token.
   */
  public static async refreshAccountToken(userAccount: {
    id: string;
    refreshToken?: string | null;
  }): Promise<string | null> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!userAccount.refreshToken || !clientId || !clientSecret) {
      return null;
    }

    try {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Scylla-Task-Integration/1.0",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: userAccount.refreshToken,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(
          `Failed to refresh GitHub token (${res.status}): ${errText}`,
        );
        return null;
      }

      const data = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
        refresh_token?: string;
        error?: string;
        error_description?: string;
      };

      if (data.access_token) {
        const expiresIn = Number(data.expires_in) || 28800; // default 8 hours
        const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

        try {
          await db
            .update(account)
            .set({
              accessToken: data.access_token,
              ...(data.refresh_token
                ? { refreshToken: data.refresh_token }
                : {}),
              accessTokenExpiresAt: newExpiresAt,
              updatedAt: new Date(),
            })
            .where(eq(account.id, userAccount.id));
        } catch (dbErr) {
          console.warn(
            "Could not persist refreshed GitHub token to DB:",
            dbErr,
          );
        }

        return data.access_token;
      } else if (data.error) {
        console.warn(
          `GitHub OAuth refresh error: ${data.error} - ${data.error_description}`,
        );
      }
    } catch (err) {
      console.warn("Error refreshing GitHub OAuth access token:", err);
    }

    return null;
  }

  /**
   * Resolves a valid GitHub access token for the given user, refreshing it if expired.
   * Falls back to environment variables if no user token is found.
   */
  public static async resolveToken(
    userId?: string,
  ): Promise<string | undefined> {
    if (userId) {
      const [userAccount] = await db
        .select()
        .from(account)
        .where(
          and(eq(account.userId, userId), eq(account.providerId, "github")),
        )
        .limit(1);

      if (userAccount) {
        // If token has not expired (> 60 seconds remaining), return it
        const isExpired =
          userAccount.accessTokenExpiresAt &&
          userAccount.accessTokenExpiresAt.getTime() <= Date.now() + 60 * 1000;

        if (userAccount.accessToken && !isExpired) {
          return userAccount.accessToken;
        }

        // Token is expired or expiring soon, attempt refresh
        if (userAccount.refreshToken) {
          const refreshedToken = await this.refreshAccountToken(userAccount);
          if (refreshedToken) {
            return refreshedToken;
          }
        }

        // If refresh failed or not applicable, check env token first before returning stale token
        const envToken =
          process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
        if (isExpired && envToken) {
          return envToken;
        }

        if (userAccount.accessToken) {
          return userAccount.accessToken;
        }
      }
    }

    return (
      process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN || undefined
    );
  }

  /**
   * Performs an authenticated fetch to the GitHub API.
   * If a 401 Bad credentials response is received, it attempts to refresh the user's token and retries once.
   */
  public static async fetchWithAuth(
    url: string,
    init: RequestInit = {},
    userId?: string,
  ): Promise<Response> {
    const token = await this.resolveToken(userId);

    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/vnd.github.v3+json");
    headers.set("User-Agent", "Scylla-Task-Integration/1.0");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let res = await fetch(url, { ...init, headers });

    // If 401 unauthorized, attempt token refresh or fallback to GITHUB_TOKEN
    if (res.status === 401) {
      let retryToken: string | undefined;

      if (userId) {
        const [userAccount] = await db
          .select()
          .from(account)
          .where(
            and(eq(account.userId, userId), eq(account.providerId, "github")),
          )
          .limit(1);

        if (userAccount?.refreshToken) {
          const refreshed = await this.refreshAccountToken(userAccount);
          if (refreshed) {
            retryToken = refreshed;
          }
        }
      }

      const envToken =
        process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
      if (!retryToken && envToken && envToken !== token) {
        retryToken = envToken;
      }

      if (retryToken) {
        headers.set("Authorization", `Bearer ${retryToken}`);
        res = await fetch(url, { ...init, headers });
      }
    }

    return res;
  }
}
