import { GCalAuthService } from "./gcal-auth-service";
import { GCalParserHelper } from "./gcal-parser-helper";
import type { GCalAccountRecord, ResourceRoom } from "./gcal-types";

export class GCalRoomsService {
  private static cachedRoomsMap = new Map<
    string,
    { data: ResourceRoom[]; expiresAt: number }
  >();

  public static clearCache(): void {
    this.cachedRoomsMap.clear();
  }

  public static async listResourceRooms(
    accessTokenOrOptions?:
      | string
      | {
          accountRecord?: unknown;
          accessToken?: string;
        },
  ): Promise<ResourceRoom[]> {
    const options =
      typeof accessTokenOrOptions === "object" && accessTokenOrOptions !== null
        ? accessTokenOrOptions
        : {
            accessToken:
              typeof accessTokenOrOptions === "string"
                ? accessTokenOrOptions
                : undefined,
          };

    const acc = options.accountRecord as GCalAccountRecord | undefined;
    const token = acc
      ? await GCalAuthService.refreshAccountToken(acc)
      : await GCalAuthService.getAccessToken(options.accessToken);

    if (!token) {
      throw new Error(
        "Google API access token is not available. Please sign in or re-authenticate.",
      );
    }

    const cacheKey = acc?.id || token.slice(0, 32);
    const cached = this.cachedRoomsMap.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt && cached.data.length > 0) {
      return cached.data;
    }

    const roomMap = new Map<string, ResourceRoom>();
    let nextPageToken: string | undefined = undefined;

    do {
      const url = new URL(
        "https://admin.googleapis.com/admin/directory/v1/customer/my_customer/resources/calendars",
      );
      url.searchParams.set("maxResults", "100");
      if (nextPageToken) {
        url.searchParams.set("pageToken", nextPageToken);
      }

      const res = await GCalAuthService.fetchWithMock(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg =
          (data as { error?: { message?: string } })?.error?.message ||
          `Google Admin Directory API request failed with HTTP ${res.status}`;
        throw new Error(errMsg);
      }

      const items = (data.items || []) as Array<Record<string, unknown>>;
      for (const item of items) {
        const em = String(item.resourceEmail || "").toLowerCase();
        if (em && !roomMap.has(em)) {
          const itemCap =
            typeof item.capacity === "number"
              ? item.capacity
              : Number(item.capacity) || undefined;
          roomMap.set(
            em,
            GCalParserHelper.parseGoogleRoom(
              String(item.resourceEmail || ""),
              String(item.resourceName || ""),
              itemCap,
              String(
                item.userVisibleDescription || item.resourceDescription || "",
              ) || undefined,
              item.buildingId ? String(item.buildingId) : undefined,
              item.floorName ? String(item.floorName) : undefined,
            ),
          );
        }
      }

      nextPageToken = (data as { nextPageToken?: string })?.nextPageToken;
    } while (nextPageToken);

    const roomsResult = Array.from(roomMap.values());
    if (roomsResult.length > 0) {
      this.cachedRoomsMap.set(cacheKey, {
        data: roomsResult,
        expiresAt: Date.now() + 180_000,
      });
    }
    return roomsResult;
  }
}
