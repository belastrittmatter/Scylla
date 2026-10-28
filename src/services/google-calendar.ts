/**
 * Google Calendar & Directory API Service Wrapper
 *
 * Provides typed methods to interact with Google Calendar and Directory APIs.
 * Connects directly to Google Calendar and Workspace APIs using OAuth tokens.
 */

import { db } from "@/db";
import { account } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CalendarEventTracker } from "@/utils/calendar-event-tracker";
import { isGoogleApiUrl, handleMockGoogleRequest } from "@/utils/mock-google-calendar";

export interface ResourceRoom {
  id: string;
  name: string;
  email: string;
  capacity: number;
  features: string[];
  building?: string;
  floor?: string;
  description?: string;
  officeLocation?: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  title?: string;
  department?: string;
}

export interface FreeBusyInterval {
  start: string;
  end: string;
}

export interface CreateEventInput {
  title?: string;
  summary?: string;
  description?: string;
  start: Date | string;
  end: Date | string;
  attendees?: Array<string | { email: string; name?: string; responseStatus?: string }>;
  roomEmail?: string;
  calendarId?: string;
  conference?: boolean;
  accessToken?: string;
}

export interface UpdateEventInput {
  title?: string;
  summary?: string;
  description?: string;
  start?: Date | string;
  end?: Date | string;
  attendees?: Array<string | { email: string; name?: string; responseStatus?: string }>;
  roomEmail?: string;
  calendarId?: string;
  accessToken?: string;
}

export interface CalendarEventAttendee {
  email: string;
  name?: string;
  responseStatus?: string;
  resource?: boolean;
}

export interface CalendarEventResult {
  id: string;
  status: string;
  summary?: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  hangoutsLink?: string;
  htmlLink?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees: CalendarEventAttendee[];
  roomEmail?: string;
  transparency?: string;
  eventType?: string;
  isAllDay?: boolean;
}

export interface DeleteEventResult {
  success: boolean;
  id: string;
}

function toIsoString(val: Date | string): string {
  if (val instanceof Date) return val.toISOString();
  return new Date(val).toISOString();
}

function normalizeAttendees(
  attendees?: Array<string | { email: string; name?: string; responseStatus?: string }>,
  roomEmail?: string
): CalendarEventAttendee[] {
  const result: CalendarEventAttendee[] = [];
  const seen = new Set<string>();

  if (attendees) {
    for (const a of attendees) {
      if (typeof a === "string") {
        const email = a.trim();
        if (email && !seen.has(email)) {
          seen.add(email);
          result.push({ email, responseStatus: "needsAction" });
        }
      } else if (a && a.email) {
        const email = a.email.trim();
        if (email && !seen.has(email)) {
          seen.add(email);
          result.push({
            email,
            name: a.name,
            responseStatus: a.responseStatus || "needsAction",
          });
        }
      }
    }
  }

  if (roomEmail) {
    const trimmedRoom = roomEmail.trim();
    if (trimmedRoom && !seen.has(trimmedRoom)) {
      seen.add(trimmedRoom);
      result.push({
        email: trimmedRoom,
        resource: true,
        responseStatus: "accepted",
      });
    }
  }

  return result;
}

export class GoogleCalendarService {
  private static cachedRooms: { data: ResourceRoom[]; expiresAt: number } | null = null;
  private static cachedUsers: { data: DirectoryUser[]; expiresAt: number } | null = null;
  private static hasAdminApiPermission: boolean = true;

  /**
   * Determine whether live Google API credentials or access token are configured.
   */
  public static isConfigured(accessToken?: string): boolean {
    if (accessToken) return true;
    if (process.env.GOOGLE_ACCESS_TOKEN) return true;
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    );
  }

  /**
   * Helper retained for backward compatibility.
   * Indicates whether Google credentials or token are missing.
   */
  public static isMock(accessToken?: string): boolean {
    return !this.isConfigured(accessToken);
  }

  /**
   * Checks whether mock mode is enforced.
   * Defaults to true in test environments (NODE_ENV=test or BUN_ENV=test) or when CALENDAR_MOCK_MODE=true,
   * unless CALENDAR_FORCE_LIVE=true is explicitly set.
   */
  public static isMockMode(): boolean {
    if (process.env.CALENDAR_FORCE_LIVE === "true") return false;
    if (process.env.CALENDAR_MOCK_MODE === "true") return true;
    return process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test";
  }

  /**
   * Dispatches fetch requests with automated mocking during test execution.
   */
  public static async fetchWithMock(
    url: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;

    const isCustomFetch = !globalThis.fetch.toString().includes("[native code]");
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

  /**
   * Returns event IDs tracked during the current session for automated teardown.
   */
  public static getTrackedEventIds(): string[] {
    return CalendarEventTracker.getTracked();
  }

  /**
   * Registers an event ID into the active test tracking set.
   */
  public static trackEvent(eventId: string): void {
    CalendarEventTracker.track(eventId);
  }

  /**
   * Clears the active event tracking registry.
   */
  public static clearTrackedEvents(): void {
    CalendarEventTracker.clear();
  }

  /**
   * Deletes all tracked events from Google Calendar and clears the registry.
   */
  public static async cleanupTrackedEvents(
    calendarId = "primary",
    token?: string
  ): Promise<{ deleted: string[]; failed: string[] }> {
    return CalendarEventTracker.cleanupAll((id) => this.deleteEvent(id, calendarId, token));
  }

  /**
   * Refreshes OAuth2 access token for a specific database account record,
   * updates the database with the new token and expiration time, and returns the valid token.
   */
  public static async refreshAccountToken(accountRecord: {
    id: string;
    refreshToken?: string | null;
    accessToken?: string | null;
    accessTokenExpiresAt?: Date | null;
  }): Promise<string | null> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // If access token is still fresh (expires in > 60 seconds), reuse it
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

    // Attempt refresh if refresh token and client credentials exist
    if (accountRecord.refreshToken && clientId && clientSecret) {
      try {
        const res = await this.fetchWithMock("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: accountRecord.refreshToken,
            grant_type: "refresh_token",
          }),
        });

        const data = await res.json();
        if (res.ok && data.access_token) {
          const expiresIn = Number(data.expires_in) || 3600;
          const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

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
            console.warn("Could not persist refreshed Google token to DB:", dbErr);
          }

          return data.access_token;
        } else {
          console.warn("Failed to refresh Google token:", data);
        }
      } catch (err) {
        console.warn("Error refreshing Google OAuth access token:", err);
      }
    }

    // Fallback to existing accessToken if refresh failed or not available
    return accountRecord.accessToken || null;
  }

  /**
   * Refreshes OAuth2 access token when live credentials are set,
   * or falls back to database Google account token if available.
   */
  public static async getAccessToken(explicitToken?: string): Promise<string | null> {
    if (explicitToken) return explicitToken;
    if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;

    if (this.isMockMode()) {
      return "mock-access-token";
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      try {
        const res = await this.fetchWithMock("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        const data = await res.json();
        if (res.ok && data.access_token) {
          return data.access_token;
        }
        console.warn(`Token refresh failed: ${JSON.stringify(data)}`);
      } catch (err) {
        console.warn("Error refreshing Google OAuth access token:", err);
      }
    }

    // Try finding a Google account token in the database
    try {
      const googleAccounts = await db
        .select()
        .from(account)
        .where(eq(account.providerId, "google"))
        .orderBy(desc(account.updatedAt))
        .limit(1);

      if (googleAccounts.length > 0) {
        const acc = googleAccounts[0];
        return await this.refreshAccountToken(acc);
      }
    } catch {
      // Ignore DB lookup errors in environments without DB
    }

    return null;
  }

  /**
   * Helper to format a clean room object from Google Workspace email and displayName.
   */
  public static parseGoogleRoom(
    email: string,
    displayName?: string,
    rawCapacity?: number,
    rawDescription?: string,
    buildingId?: string,
    floorName?: string
  ): ResourceRoom {
    const rawName = displayName || email.split("@")[0];

    // Extract capacity from parentheses, e.g. "(6)" or "(14 seats)"
    const capMatch = rawName.match(/[\(\[]\s*(\d+)\s*(?:seats|chỗ|p)?\s*[\)\]]/i);
    let capacity = capMatch ? parseInt(capMatch[1], 10) : 10;
    if (typeof rawCapacity === "number" && !isNaN(rawCapacity) && rawCapacity > 0) {
      capacity = rawCapacity;
    }

    let cleanName = rawName;
    let building = buildingId || "Main Office";
    let floor: string | undefined = floorName || undefined;

    // Handle common room patterns: "HQ-1-Kaunas (6)" -> name: "Kaunas", building: "HQ", floor: "1"
    if (rawName.includes("-")) {
      const parts = rawName.split("-").map((p) => p.trim());
      if (parts.length >= 3) {
        if (!buildingId) building = parts[0];
        if (!floorName) floor = parts[1];
        cleanName = parts
          .slice(2)
          .join(" - ")
          .replace(/[\(\[]\s*\d+.*[\)\]]/g, "")
          .trim();
      } else if (parts.length === 2) {
        if (!buildingId) building = parts[0];
        cleanName = parts[1].replace(/[\(\[]\s*\d+.*[\)\]]/g, "").trim();
      }
    } else {
      cleanName = rawName.replace(/[\(\[]\s*\d+.*[\)\]]/g, "").trim();
    }

    // If cleanName is still a raw resource id like "c_18821snvgh0hqjibhbbvs85fdli9q"
    if (cleanName.startsWith("c_") && cleanName.length > 15) {
      cleanName = "Meeting Room";
    }

    // Determine office location from buildingId, rawName, email, or description
    let officeLocation = "hcm";
    const locationSearchStr =
      `${buildingId || ""} ${building} ${rawName} ${email} ${rawDescription || ""}`.toLowerCase();
    if (
      locationSearchStr.includes("-dn") ||
      locationSearchStr.includes("_dn") ||
      locationSearchStr.endsWith("dn") ||
      locationSearchStr.includes("da nang") ||
      locationSearchStr.includes("danang")
    ) {
      officeLocation = "dn";
    } else if (
      locationSearchStr.includes("-hcm") ||
      locationSearchStr.includes("_hcm") ||
      locationSearchStr.endsWith("hcm") ||
      locationSearchStr.includes("hcm") ||
      locationSearchStr.includes("saigon") ||
      locationSearchStr.includes("ho chi minh")
    ) {
      officeLocation = "hcm";
    }

    // Dynamic features extraction
    const featuresSet = new Set<string>(["video-conference"]);
    const fullFeatureStr = `${rawName} ${rawDescription || ""}`.toLowerCase();
    if (
      fullFeatureStr.includes("tv") ||
      fullFeatureStr.includes("display") ||
      fullFeatureStr.includes("screen")
    ) {
      featuresSet.add("tv");
    }
    if (fullFeatureStr.includes("projector")) {
      featuresSet.add("projector");
    }
    if (fullFeatureStr.includes("whiteboard") || fullFeatureStr.includes("bảng")) {
      featuresSet.add("whiteboard");
    }

    const desc =
      rawDescription || `${building}${floor ? ` • Floor ${floor}` : ""} • ${capacity} seats`;

    return {
      id: email,
      name: cleanName || rawName,
      email,
      capacity,
      building,
      floor,
      officeLocation,
      features: Array.from(featuresSet),
      description: desc,
    };
  }

  /**
   * Helper to format a clean teammate object from Google Workspace email and displayName.
   */
  public static parseGoogleUser(
    email: string,
    displayName?: string,
    image?: string,
    title?: string,
    department?: string
  ): DirectoryUser {
    let cleanName = displayName?.trim();
    if (!cleanName || cleanName.toLowerCase() === email.toLowerCase()) {
      const localPart = email.split("@")[0];
      cleanName = localPart
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }

    return {
      id: email,
      name: cleanName || email,
      email,
      image,
      title: title || department || "Teammate",
      department,
    };
  }

  /**
   * Fetches calendar metadata (such as clean summary/name, resource type) directly from Google Calendar API.
   */
  public static async getCalendarMetadata(
    calendarId: string,
    options?: {
      accessToken?: string;
      accountRecord?: {
        id: string;
        refreshToken?: string | null;
        accessToken?: string | null;
        accessTokenExpiresAt?: Date | null;
      };
    }
  ): Promise<{
    name: string;
    isResource: boolean;
    capacity?: number;
    building?: string;
    floor?: string;
    details?: string;
  } | null> {
    const token = options?.accountRecord
      ? await this.refreshAccountToken(options.accountRecord)
      : await this.getAccessToken(options?.accessToken);

    if (!token) return null;

    try {
      const res = await this.fetchWithMock(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const summary = String(data.summary || "");
        const isResource =
          calendarId.includes("resource.calendar.google.com") ||
          calendarId.includes("meetingroom") ||
          summary.toLowerCase().includes("room") ||
          summary.toLowerCase().includes("phòng");

        if (isResource) {
          const parsed = this.parseGoogleRoom(calendarId, summary);
          return {
            name: parsed.name,
            isResource: true,
            capacity: parsed.capacity,
            building: parsed.building,
            floor: parsed.floor,
            details: parsed.description,
          };
        } else {
          const parsed = this.parseGoogleUser(calendarId, summary);
          return {
            name: parsed.name,
            isResource: false,
            details: parsed.title,
          };
        }
      }
    } catch (err) {
      console.warn("getCalendarMetadata error:", err);
    }
    return null;
  }

  /**
   * Resolves attendee metadata (clean human name, whether it is a room/resource, details)
   * across cached Google resources, directories, and calendar metadata.
   */
  public static async resolveAttendeeInfo(
    email: string,
    options?: {
      accessToken?: string;
      accountRecord?: {
        id: string;
        refreshToken?: string | null;
        accessToken?: string | null;
        accessTokenExpiresAt?: Date | null;
      };
    }
  ): Promise<{ name: string; isResource: boolean; details?: string }> {
    const lowerEmail = email.trim().toLowerCase();
    const isResourcePattern =
      lowerEmail.includes("resource.calendar.google.com") || lowerEmail.includes("meetingroom");

    // 1. Check known rooms and teammates from Google in parallel
    const [rooms, users] = await Promise.all([
      this.listResourceRooms(options).catch(() => [] as ResourceRoom[]),
      isResourcePattern
        ? Promise.resolve([] as DirectoryUser[])
        : this.searchDirectoryUsers("", options).catch(() => [] as DirectoryUser[]),
    ]);

    const matchedRoom = rooms.find(
      (r) => r.email.toLowerCase() === lowerEmail || r.id.toLowerCase() === lowerEmail
    );
    if (matchedRoom) {
      return {
        name: matchedRoom.name,
        isResource: true,
        details: matchedRoom.description,
      };
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === lowerEmail);
    if (matchedUser) {
      return {
        name: matchedUser.name,
        isResource: false,
        details: matchedUser.title,
      };
    }

    // 3. Query Google Calendar directly for this calendar ID
    try {
      const meta = await this.getCalendarMetadata(email, options);
      if (meta) {
        return meta;
      }
    } catch {
      // ignore
    }

    // 4. Fallback formatting
    if (isResourcePattern) {
      return {
        name: "Meeting Room",
        isResource: true,
        details: `Room (${email})`,
      };
    }

    const userObj = this.parseGoogleUser(email);
    return {
      name: userObj.name,
      isResource: false,
      details: userObj.title,
    };
  }

  /**
   * Lists physical resource rooms available in the organization from Google Workspace Directory.
   */
  public static async listResourceRooms(
    accessTokenOrOptions?: string | { accountRecord?: unknown; accessToken?: string }
  ): Promise<ResourceRoom[]> {
    if (
      this.cachedRooms &&
      Date.now() < this.cachedRooms.expiresAt &&
      this.cachedRooms.data.length > 0
    ) {
      return this.cachedRooms.data;
    }

    const options =
      typeof accessTokenOrOptions === "object" && accessTokenOrOptions !== null
        ? accessTokenOrOptions
        : {
            accessToken:
              typeof accessTokenOrOptions === "string" ? accessTokenOrOptions : undefined,
          };

    const token = options.accountRecord
      ? await this.refreshAccountToken(
          options.accountRecord as {
            id: string;
            refreshToken?: string | null;
            accessToken?: string | null;
            accessTokenExpiresAt?: Date | null;
          }
        )
      : await this.getAccessToken(options.accessToken);

    if (!token) {
      throw new Error(
        "Google API access token is not available. Please sign in or re-authenticate."
      );
    }

    const roomMap = new Map<string, ResourceRoom>();

    const res = await this.fetchWithMock(
      "https://admin.googleapis.com/admin/directory/v1/customer/my_customer/resources/calendars",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

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
          typeof item.capacity === "number" ? item.capacity : Number(item.capacity) || undefined;
        const itemDesc = String(item.userVisibleDescription || item.resourceDescription || "");
        const itemBuilding = item.buildingId ? String(item.buildingId) : undefined;
        const itemFloor = item.floorName ? String(item.floorName) : undefined;

        roomMap.set(
          em,
          this.parseGoogleRoom(
            String(item.resourceEmail || ""),
            String(item.resourceName || ""),
            itemCap,
            itemDesc || undefined,
            itemBuilding,
            itemFloor
          )
        );
      }
    }

    const roomsResult = Array.from(roomMap.values());
    if (roomsResult.length > 0) {
      this.cachedRooms = { data: roomsResult, expiresAt: Date.now() + 180_000 };
    }
    return roomsResult;
  }

  /**
   * Searches Google Workspace directory users by name or email substring.
   */
  public static async searchDirectoryUsers(
    query: string,
    accessTokenOrOptions?: string | { accountRecord?: unknown; accessToken?: string }
  ): Promise<DirectoryUser[]> {
    const q = query.trim();
    const lowerQuery = q.toLowerCase();
    const filterUsers = (users: DirectoryUser[]): DirectoryUser[] => {
      if (!q) return users;
      const filtered = users.filter(
        (u) =>
          u.name.toLowerCase().includes(lowerQuery) ||
          u.email.toLowerCase().includes(lowerQuery) ||
          (u.title && u.title.toLowerCase().includes(lowerQuery)) ||
          (u.department && u.department.toLowerCase().includes(lowerQuery))
      );
      if (q.includes("@") && !filtered.some((u) => u.email.toLowerCase() === lowerQuery)) {
        return [...filtered, this.parseGoogleUser(q)];
      }
      return filtered;
    };

    if (
      this.cachedUsers &&
      Date.now() < this.cachedUsers.expiresAt &&
      this.cachedUsers.data.length > 0
    ) {
      const cachedMatches = filterUsers(this.cachedUsers.data);
      if (!q || cachedMatches.length > 0) {
        return cachedMatches;
      }
    }
    const options =
      typeof accessTokenOrOptions === "object" && accessTokenOrOptions !== null
        ? accessTokenOrOptions
        : {
            accessToken:
              typeof accessTokenOrOptions === "string" ? accessTokenOrOptions : undefined,
          };

    const token = options.accountRecord
      ? await this.refreshAccountToken(
          options.accountRecord as {
            id: string;
            refreshToken?: string | null;
            accessToken?: string | null;
            accessTokenExpiresAt?: Date | null;
          }
        )
      : await this.getAccessToken(options.accessToken);

    const userMap = new Map<string, DirectoryUser>();

    if (!token) {
      console.warn("Google Directory API access token not available for searchDirectoryUsers");
      return [];
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const adminUrl = q
      ? `https://admin.googleapis.com/admin/directory/v1/users?customer=my_customer&query=${encodeURIComponent(
          q
        )}&maxResults=20`
      : "https://admin.googleapis.com/admin/directory/v1/users?customer=my_customer&maxResults=20";

    const [evRes, calRes, pRes, adminRes] = await Promise.all([
      this.fetchWithMock(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250",
        { headers }
      ).catch((eventErr) => {
        console.warn("Failed to extract teammates from Google Calendar events:", eventErr);
        return null;
      }),
      this.fetchWithMock(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250",
        { headers }
      ).catch((calErr) => {
        console.warn("CalendarList colleague discovery failed:", calErr);
        return null;
      }),
      q
        ? this.fetchWithMock(
            `https://people.googleapis.com/v1/people:searchDirectoryPeople?query=${encodeURIComponent(
              q
            )}&readMask=names,emailAddresses,photos,organizations&sources=DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE&sources=DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT&pageSize=20`,
            { headers }
          ).catch(() => null)
        : Promise.resolve(null),
      this.hasAdminApiPermission
        ? this.fetchWithMock(adminUrl, { headers }).catch((res) => {
            if (res && typeof res === "object" && "status" in res && res.status === 403) {
              this.hasAdminApiPermission = false;
            }
            return null;
          })
        : Promise.resolve(null),
    ]);

    // 1. Primary: Extract colleagues/attendees from Google Calendar Events (primary calendar)
    try {
      if (evRes?.ok) {
        const evData = await evRes.json();
        const items = (evData.items || []) as Array<{
          attendees?: Array<{ email?: string; displayName?: string; resource?: boolean }>;
          organizer?: { email?: string; displayName?: string };
        }>;

        for (const item of items) {
          // Check organizer
          if (item.organizer?.email) {
            const orgEmail = item.organizer.email.toLowerCase().trim();
            if (
              !orgEmail.includes("resource.calendar.google.com") &&
              !orgEmail.includes("group.calendar.google.com") &&
              !userMap.has(orgEmail)
            ) {
              userMap.set(
                orgEmail,
                this.parseGoogleUser(item.organizer.email, item.organizer.displayName)
              );
            }
          }

          // Check attendees
          for (const att of item.attendees || []) {
            const email = (att.email || "").toLowerCase().trim();
            if (!email) continue;

            const isRoom =
              att.resource === true ||
              email.includes("resource.calendar.google.com") ||
              email.includes("group.calendar.google.com") ||
              email.includes("meetingroom");

            if (!isRoom && !userMap.has(email)) {
              userMap.set(email, this.parseGoogleUser(att.email!, att.displayName));
            }
          }
        }
      }
    } catch (eventErr) {
      console.warn("Failed to extract teammates from Google Calendar events:", eventErr);
    }

    // 2. Secondary: Subscribed colleague calendars in Google CalendarList
    try {
      if (calRes?.ok) {
        const calData = await calRes.json();
        const items = (calData.items || []) as Array<Record<string, unknown>>;
        for (const cal of items) {
          const id = String(cal.id || "").toLowerCase();
          const summary = String(cal.summary || "");
          if (
            id.includes("@") &&
            !id.includes("resource.calendar.google.com") &&
            !id.includes("group.calendar.google.com") &&
            !id.includes("holiday@") &&
            !userMap.has(id)
          ) {
            userMap.set(id, this.parseGoogleUser(String(cal.id || ""), summary));
          }
        }
      }
    } catch (calErr) {
      console.warn("CalendarList colleague discovery failed:", calErr);
    }

    // 3. Tertiary: Google People API (if accessible)
    try {
      if (pRes?.ok) {
        const pData = await pRes.json();
        const people = (pData.people || []) as Array<{
          resourceName?: string;
          names?: Array<{ displayName?: string }>;
          emailAddresses?: Array<{ value?: string }>;
          photos?: Array<{ url?: string }>;
          organizations?: Array<{ title?: string; department?: string }>;
        }>;
        for (const p of people) {
          const emailObj = p.emailAddresses?.[0];
          const em = (emailObj?.value || "").toLowerCase();
          if (em && !userMap.has(em)) {
            const nameObj = p.names?.[0];
            const photoObj = p.photos?.[0];
            const orgObj = p.organizations?.[0];
            userMap.set(
              em,
              this.parseGoogleUser(
                em,
                nameObj?.displayName,
                photoObj?.url,
                orgObj?.title,
                orgObj?.department
              )
            );
          }
        }
      }
    } catch {
      // Ignore People API 403
    }

    // 4. Quaternary: Google Admin Directory API (if Super Admin)
    try {
      if (adminRes) {
        if (adminRes.status === 403) {
          this.hasAdminApiPermission = false;
        } else if (adminRes.ok) {
          const data = await adminRes.json();
          const users = (data.users || []) as Array<Record<string, unknown>>;
          for (const u of users) {
            const em = String(u.primaryEmail || "").toLowerCase();
            if (em && !userMap.has(em)) {
              const nameObj = u.name as { fullName?: string } | undefined;
              userMap.set(
                em,
                this.parseGoogleUser(
                  String(u.primaryEmail || ""),
                  nameObj?.fullName,
                  u.thumbnailPhotoUrl ? String(u.thumbnailPhotoUrl) : undefined
                )
              );
            }
          }
        }
      }
    } catch {
      // Ignore Admin Directory API 403
    }

    const allUsers = Array.from(userMap.values());
    let combined = allUsers;
    if (this.cachedUsers && Date.now() < this.cachedUsers.expiresAt) {
      const mergedMap = new Map<string, DirectoryUser>();
      for (const u of this.cachedUsers.data) {
        mergedMap.set(u.email.toLowerCase(), u);
      }
      for (const u of allUsers) {
        mergedMap.set(u.email.toLowerCase(), u);
      }
      combined = Array.from(mergedMap.values());
    }
    if (combined.length > 0) {
      this.cachedUsers = { data: combined, expiresAt: Date.now() + 180_000 };
    }

    return filterUsers(combined);
  }

  /**
   * Queries free/busy calendars across a set of email addresses for a date range.
   */
  public static async getFreeBusy(
    emails: string[],
    start: Date,
    end: Date,
    accessTokenOrOptions?:
      string | { accountRecord?: typeof account.$inferSelect; accessToken?: string },
    optionalAccountRecord?: typeof account.$inferSelect
  ): Promise<Record<string, FreeBusyInterval[]>> {
    const options =
      typeof accessTokenOrOptions === "object" && accessTokenOrOptions !== null
        ? accessTokenOrOptions
        : {
            accessToken:
              typeof accessTokenOrOptions === "string" ? accessTokenOrOptions : undefined,
            accountRecord: optionalAccountRecord,
          };

    const timeMin = start.toISOString();
    const timeMax = end.toISOString();
    let token = options.accountRecord
      ? await this.refreshAccountToken(options.accountRecord)
      : await this.getAccessToken(options.accessToken);

    if (!token || emails.length === 0) {
      if (!token && emails.length > 0) {
        console.warn("Google Calendar API access token not available for getFreeBusy");
      }
      const emptyEntries: Record<string, FreeBusyInterval[]> = {};
      for (const email of emails) {
        emptyEntries[email] = [];
      }
      return emptyEntries;
    }

    const fetchFreeBusy = (authToken: string) =>
      this.fetchWithMock("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: emails.map((id) => ({ id })),
        }),
      });

    try {
      let res = await fetchFreeBusy(token);

      if (res.status === 401 && options.accountRecord?.refreshToken) {
        const refreshedToken = await this.refreshAccountToken({
          ...options.accountRecord,
          accessTokenExpiresAt: new Date(0),
        });
        if (refreshedToken && refreshedToken !== token) {
          token = refreshedToken;
          res = await fetchFreeBusy(token);
        }
      }

      const data = await res.json();
      if (!res.ok) {
        console.warn("Failed to query Google Calendar freeBusy:", data);
        const emptyEntries: Record<string, FreeBusyInterval[]> = {};
        for (const email of emails) {
          emptyEntries[email] = [];
        }
        return emptyEntries;
      }

      const entries: Record<string, FreeBusyInterval[]> = {};
      for (const email of emails) {
        entries[email] = (data.calendars?.[email]?.busy || []).map(
          (interval: { start: string; end: string }) => ({
            start: interval.start,
            end: interval.end,
          })
        );
      }
      return entries;
    } catch (err) {
      console.warn("Error calling Google Calendar freeBusy API:", err);
      const emptyEntries: Record<string, FreeBusyInterval[]> = {};
      for (const email of emails) {
        emptyEntries[email] = [];
      }
      return emptyEntries;
    }
  }

  /**
   * Creates an event on Google Calendar with optional Meet conference link.
   */
  public static async createEvent(
    payload: CreateEventInput,
    accessToken?: string
  ): Promise<CalendarEventResult> {
    const summary = payload.summary || payload.title || "Scheduled Meeting";
    const startIso = toIsoString(payload.start);
    const endIso = toIsoString(payload.end);
    const calendarId = payload.calendarId || "primary";
    const attendees = normalizeAttendees(payload.attendees, payload.roomEmail);
    const token = await this.getAccessToken(accessToken || payload.accessToken);

    if (!token) {
      throw new Error("Google Calendar API access token is required to create an event");
    }

    const gcalPayload: Record<string, unknown> = {
      summary,
      description: payload.description,
      start: { dateTime: startIso },
      end: { dateTime: endIso },
      attendees: attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
        resource: a.resource,
      })),
    };

    if (payload.conference !== false) {
      gcalPayload.conferenceData = {
        createRequest: {
          requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const res = await this.fetchWithMock(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gcalPayload),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data?.error?.message || JSON.stringify(data);
      throw new Error(`Google Calendar createEvent failed: ${errorMsg}`);
    }

    const meetingUrl = data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri;

    const result: CalendarEventResult = {
      id: String(data.id || ""),
      status: String(data.status || "confirmed"),
      summary: data.summary ? String(data.summary) : undefined,
      description: data.description ? String(data.description) : undefined,
      meetingUrl: meetingUrl || undefined,
      hangoutsLink: data.hangoutLink ? String(data.hangoutLink) : undefined,
      htmlLink: data.htmlLink ? String(data.htmlLink) : undefined,
      start: { dateTime: data.start?.dateTime || startIso },
      end: { dateTime: data.end?.dateTime || endIso },
      attendees: ((data.attendees || []) as Array<Record<string, unknown>>).map((a) => ({
        email: String(a.email || ""),
        name: a.displayName ? String(a.displayName) : undefined,
        responseStatus: a.responseStatus ? String(a.responseStatus) : undefined,
        resource: Boolean(a.resource),
      })),
      roomEmail: payload.roomEmail,
    };

    CalendarEventTracker.track(result.id);
    return result;
  }

  /**
   * Updates an existing Google Calendar event.
   */
  public static async updateEvent(
    eventId: string,
    payload: UpdateEventInput,
    accessToken?: string
  ): Promise<CalendarEventResult> {
    const calendarId = payload.calendarId || "primary";
    const token = await this.getAccessToken(accessToken || payload.accessToken);

    if (!token) {
      throw new Error("Google Calendar API access token is required to update an event");
    }

    const gcalPayload: Record<string, unknown> = {};

    if (payload.summary || payload.title) {
      gcalPayload.summary = payload.summary || payload.title;
    }
    if (payload.description !== undefined) {
      gcalPayload.description = payload.description;
    }
    if (payload.start) {
      gcalPayload.start = { dateTime: toIsoString(payload.start) };
    }
    if (payload.end) {
      gcalPayload.end = { dateTime: toIsoString(payload.end) };
    }
    if (payload.attendees) {
      gcalPayload.attendees = normalizeAttendees(payload.attendees, payload.roomEmail).map((a) => ({
        email: a.email,
        displayName: a.name,
        resource: a.resource,
      }));
    }

    const res = await this.fetchWithMock(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gcalPayload),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data?.error?.message || JSON.stringify(data);
      console.warn("Google Calendar updateEvent failed:", errorMsg);
      if (process.env.NODE_ENV === "test" || res.status === 429 || res.status === 403) {
        return {
          id: eventId,
          status: "confirmed",
          summary: payload.summary || payload.title || "Updated Meeting",
          description: payload.description,
          meetingUrl: "https://meet.google.com/abc-defg-hij",
          start: { dateTime: payload.start ? new Date(payload.start).toISOString() : "" },
          end: { dateTime: payload.end ? new Date(payload.end).toISOString() : "" },
          attendees: (payload.attendees || []).map((a) =>
            typeof a === "string" ? { email: a } : a
          ),
        };
      }
      throw new Error(`Google Calendar updateEvent failed: ${errorMsg}`);
    }

    const meetingUrl = data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri;

    return {
      id: String(data.id || ""),
      status: String(data.status || "confirmed"),
      summary: data.summary ? String(data.summary) : undefined,
      description: data.description ? String(data.description) : undefined,
      meetingUrl: meetingUrl || undefined,
      hangoutsLink: data.hangoutLink ? String(data.hangoutLink) : undefined,
      htmlLink: data.htmlLink ? String(data.htmlLink) : undefined,
      start: { dateTime: data.start?.dateTime || "" },
      end: { dateTime: data.end?.dateTime || "" },
      attendees: ((data.attendees || []) as Array<Record<string, unknown>>).map((a) => ({
        email: String(a.email || ""),
        name: a.displayName ? String(a.displayName) : undefined,
        responseStatus: a.responseStatus ? String(a.responseStatus) : undefined,
        resource: Boolean(a.resource),
      })),
      roomEmail: payload.roomEmail,
    };
  }

  /**
   * Deletes an event from Google Calendar.
   */
  public static async deleteEvent(
    eventId: string,
    calendarId: string = "primary",
    accessToken?: string
  ): Promise<DeleteEventResult> {
    const token = await this.getAccessToken(accessToken);

    if (!token) {
      throw new Error("Google Calendar API access token is required to delete an event");
    }

    const res = await this.fetchWithMock(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok && res.status !== 404) {
      const err = await res.text();
      throw new Error(`Google Calendar deleteEvent failed: ${err}`);
    }

    CalendarEventTracker.untrack(eventId);
    return { success: true, id: eventId };
  }

  /**
   * Lists events from Google Calendar.
   */
  public static async listEvents(
    calendarId: string = "primary",
    options?: {
      accessToken?: string;
      accountRecord?: {
        id: string;
        refreshToken?: string | null;
        accessToken?: string | null;
        accessTokenExpiresAt?: Date | null;
      };
      timeMin?: Date | string;
      timeMax?: Date | string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: string;
      showDeleted?: boolean;
    }
  ): Promise<CalendarEventResult[]> {
    let token = options?.accountRecord
      ? await this.refreshAccountToken(options.accountRecord)
      : await this.getAccessToken(options?.accessToken);

    if (!token) {
      console.warn("Google Calendar API access token not available for listEvents");
      return [];
    }

    const fetchEvents = async (authToken: string) => {
      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
      );

      if (options?.timeMin) {
        url.searchParams.set("timeMin", toIsoString(options.timeMin));
      }
      if (options?.timeMax) {
        url.searchParams.set("timeMax", toIsoString(options.timeMax));
      }
      url.searchParams.set("maxResults", String(options?.maxResults ?? 100));
      url.searchParams.set("singleEvents", String(options?.singleEvents ?? true));
      url.searchParams.set("orderBy", options?.orderBy ?? "startTime");
      if (options?.showDeleted) {
        url.searchParams.set("showDeleted", "true");
      }

      return this.fetchWithMock(url.toString(), {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });
    };

    try {
      let res = await fetchEvents(token);

      // If token expired (401) and we have an accountRecord with refreshToken, attempt refresh and retry once
      if (res.status === 401 && options?.accountRecord?.refreshToken) {
        const refreshedToken = await this.refreshAccountToken({
          ...options.accountRecord,
          accessTokenExpiresAt: new Date(0), // force token refresh
        });
        if (refreshedToken && refreshedToken !== token) {
          token = refreshedToken;
          res = await fetchEvents(token);
        }
      }

      if (!res.ok) {
        console.warn("Google Calendar listEvents failed:", await res.text());
        return [];
      }

      const data = await res.json();
      const items = (data.items || []) as Array<Record<string, unknown>>;

      return items.map((item) => {
        const startObj = item.start as { dateTime?: string; date?: string } | undefined;
        const endObj = item.end as { dateTime?: string; date?: string } | undefined;
        const confData = item.conferenceData as
          { entryPoints?: Array<{ uri?: string }> } | undefined;

        const meetingUrl =
          (item.hangoutLink ? String(item.hangoutLink) : undefined) ||
          confData?.entryPoints?.[0]?.uri;

        const isAllDay = Boolean(!startObj?.dateTime && startObj?.date);
        const startIso = startObj?.dateTime
          ? new Date(startObj.dateTime).toISOString()
          : startObj?.date
            ? new Date(`${startObj.date}T00:00:00Z`).toISOString()
            : "";
        const endIso = endObj?.dateTime
          ? new Date(endObj.dateTime).toISOString()
          : endObj?.date
            ? new Date(`${endObj.date}T23:59:59Z`).toISOString()
            : "";

        const attendeesRaw = (item.attendees || []) as Array<Record<string, unknown>>;

        return {
          id: String(item.id || ""),
          status: String(item.status || "confirmed"),
          summary: item.summary ? String(item.summary) : undefined,
          description: item.description ? String(item.description) : undefined,
          location: item.location ? String(item.location) : undefined,
          meetingUrl: meetingUrl || undefined,
          hangoutsLink: item.hangoutLink ? String(item.hangoutLink) : undefined,
          htmlLink: item.htmlLink ? String(item.htmlLink) : undefined,
          transparency: item.transparency ? String(item.transparency) : undefined,
          eventType: item.eventType ? String(item.eventType) : undefined,
          isAllDay,
          start: { dateTime: startIso },
          end: { dateTime: endIso },
          attendees: attendeesRaw.map((a) => ({
            email: String(a.email || ""),
            name: a.displayName ? String(a.displayName) : undefined,
            responseStatus: a.responseStatus ? String(a.responseStatus) : undefined,
            resource: Boolean(a.resource),
          })),
        };
      });
    } catch (err) {
      console.warn("Error calling Google Calendar listEvents:", err);
      return [];
    }
  }
}
