import { db } from "@/db";
import { account } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CalendarEventTracker } from "@/utils/calendar-event-tracker";
export { CalendarEventTracker };
import {
  isGoogleApiUrl,
  handleMockGoogleRequest,
} from "@/utils/mock-google-calendar";

export class GCalAuthService {
  public static isConfigured(accessToken?: string): boolean {
    if (accessToken) return true;
    if (process.env.GOOGLE_ACCESS_TOKEN) return true;
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
    );
  }

  public static isMock(accessToken?: string): boolean {
    return !this.isConfigured(accessToken);
  }

  public static isMockMode(): boolean {
    if (process.env.CALENDAR_FORCE_LIVE === "true") return false;
    if (process.env.CALENDAR_MOCK_MODE === "false") return false;
    if (process.env.CALENDAR_MOCK_MODE === "true") return true;
    return process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test";
  }

  public static async fetchWithMock(
    url: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> {
    const urlStr =
      typeof url === "string"
        ? url
        : url instanceof URL
          ? url.toString()
          : url.url;

    const isCustomFetch = !globalThis.fetch
      .toString()
      .includes("[native code]");
    if (isCustomFetch) {
      return globalThis.fetch(url, init);
    }

    if (process.env.CALENDAR_FORCE_LIVE === "true") {
      return globalThis.fetch(url, init);
    }

    if (this.isMockMode() && isGoogleApiUrl(urlStr)) {
      return handleMockGoogleRequest(urlStr, init);
    }

    return globalThis.fetch(url, init);
  }

  public static getTrackedEventIds(): string[] {
    return CalendarEventTracker.getTracked();
  }

  public static trackEvent(eventId: string): void {
    CalendarEventTracker.track(eventId);
  }

  public static clearTrackedEvents(): void {
    CalendarEventTracker.clear();
  }

  public static async cleanupTrackedEvents(
    deleteFn: (id: string) => Promise<unknown>,
  ): Promise<{ deleted: string[]; failed: string[] }> {
    return CalendarEventTracker.cleanupAll(deleteFn);
  }

  public static async refreshAccountToken(accountRecord: {
    id?: string;
    refreshToken?: string | null;
    accessToken?: string | null;
    accessTokenExpiresAt?: Date | null;
    [key: string]: unknown;
  }): Promise<string | null> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (
      accountRecord.accessToken &&
      accountRecord.accessTokenExpiresAt &&
      accountRecord.accessTokenExpiresAt.getTime() > Date.now() + 60 * 1000
    ) {
      return accountRecord.accessToken;
    }

    if (this.isMockMode()) {
      return accountRecord.accessToken || "mock-refreshed-token";
    }

    if (accountRecord.refreshToken && clientId && clientSecret) {
      try {
        const res = await this.fetchWithMock(
          "https://oauth2.googleapis.com/token",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: accountRecord.refreshToken,
              grant_type: "refresh_token",
            }),
          },
        );

        const data = await res.json();
        if (res.ok && data.access_token) {
          const expiresIn = Number(data.expires_in) || 3600;
          const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

          if (accountRecord.id) {
            try {
              await db
                .update(account)
                .set({
                  accessToken: data.access_token,
                  accessTokenExpiresAt: newExpiresAt,
                  updatedAt: new Date(),
                })
                .where(eq(account.id, accountRecord.id));
            } catch (dbErr) {
              console.warn(
                "Could not persist refreshed Google token to DB:",
                dbErr,
              );
            }
          }

          return data.access_token;
        } else {
          console.warn("Failed to refresh Google token:", data);
        }
      } catch (err) {
        console.warn("Error refreshing Google OAuth access token:", err);
      }
    }

    return accountRecord.accessToken || null;
  }

  public static async getAccessToken(
    explicitToken?: string,
  ): Promise<string | null> {
    if (explicitToken) return explicitToken;
    if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;

    if (this.isMockMode()) {
      return "mock-access-token";
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (refreshToken && clientId && clientSecret) {
      try {
        const res = await this.fetchWithMock(
          "https://oauth2.googleapis.com/token",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: "refresh_token",
            }),
          },
        );

        const data = await res.json();
        if (res.ok && data.access_token) {
          return data.access_token;
        }
      } catch (err) {
        console.warn("Error getting Google OAuth access token:", err);
      }
    }

    return null;
  }
}
