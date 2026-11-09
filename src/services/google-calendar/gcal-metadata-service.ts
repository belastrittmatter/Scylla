import { GCalAuthService } from "./gcal-auth-service";
import { GCalDirectoryService } from "./gcal-directory-service";
import { GCalParserHelper } from "./gcal-parser-helper";
import { GCalRoomsService } from "./gcal-rooms-service";
import type {
  DirectoryUser,
  GCalAccountRecord,
  ResourceRoom,
} from "./gcal-types";

export class GCalMetadataService {
  public static async getCalendarMetadata(
    calendarId: string,
    options?: {
      accessToken?: string;
      accountRecord?: unknown;
    },
  ): Promise<{
    name: string;
    isResource: boolean;
    capacity?: number;
    building?: string;
    floor?: string;
    details?: string;
  } | null> {
    const acc = options?.accountRecord as GCalAccountRecord | undefined;
    const token = acc
      ? await GCalAuthService.refreshAccountToken(acc)
      : await GCalAuthService.getAccessToken(options?.accessToken);

    if (!token) return null;

    try {
      const res = await GCalAuthService.fetchWithMock(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
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
          const parsed = GCalParserHelper.parseGoogleRoom(calendarId, summary);
          return {
            name: parsed.name,
            isResource: true,
            capacity: parsed.capacity,
            building: parsed.building,
            floor: parsed.floor,
            details: parsed.description,
          };
        } else {
          const parsed = GCalParserHelper.parseGoogleUser(calendarId, summary);
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

  public static async resolveAttendeeInfo(
    email: string,
    options?: {
      accessToken?: string;
      accountRecord?: unknown;
    },
  ): Promise<{ name: string; isResource: boolean; details?: string }> {
    const lowerEmail = email.trim().toLowerCase();
    const isResourcePattern =
      lowerEmail.includes("resource.calendar.google.com") ||
      lowerEmail.includes("meetingroom");

    const [rooms, users] = await Promise.all([
      GCalRoomsService.listResourceRooms(options).catch(
        () => [] as ResourceRoom[],
      ),
      isResourcePattern
        ? Promise.resolve([] as DirectoryUser[])
        : GCalDirectoryService.searchDirectoryUsers("", options).catch(
            () => [] as DirectoryUser[],
          ),
    ]);

    const matchedRoom = rooms.find(
      (r) =>
        r.email.toLowerCase() === lowerEmail ||
        r.id.toLowerCase() === lowerEmail,
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

    try {
      const meta = await this.getCalendarMetadata(email, options);
      if (meta) return meta;
    } catch {
      // ignore
    }

    if (isResourcePattern) {
      return {
        name: "Meeting Room",
        isResource: true,
        details: `Room (${email})`,
      };
    }

    const userObj = GCalParserHelper.parseGoogleUser(email);
    return {
      name: userObj.name,
      isResource: false,
      details: userObj.title,
    };
  }
}
