/**
 * Google Calendar & Directory API Service Wrapper
 *
 * Facade providing typed methods to interact with Google Calendar and Directory APIs.
 * Dispatches to modularized subservices in src/services/google-calendar/.
 */

import { GCalAuthService } from "./google-calendar/gcal-auth-service";
import { GCalDirectoryService } from "./google-calendar/gcal-directory-service";
import { GCalEventMutationService } from "./google-calendar/gcal-event-mutation-service";
import { GCalEventQueryService } from "./google-calendar/gcal-event-query-service";
import { GCalFreeBusyService } from "./google-calendar/gcal-freebusy-service";
import { GCalMetadataService } from "./google-calendar/gcal-metadata-service";
import { GCalParserHelper } from "./google-calendar/gcal-parser-helper";
import { GCalRoomsService } from "./google-calendar/gcal-rooms-service";

import { CalendarEventTracker } from "./google-calendar/gcal-auth-service";
export { CalendarEventTracker } from "./google-calendar/gcal-auth-service";
export {
  type CalendarEventAttendee,
  type CalendarEventAttendee as CalendarAttendee,
  type CalendarEventResult,
  type CreateEventInput,
  type DeleteEventResult,
  type DirectoryUser,
  type FreeBusyInterval,
  type ResourceRoom,
  type UpdateEventInput,
  normalizeAttendees,
  toIsoString,
} from "./google-calendar/gcal-types";

import type {
  CalendarEventResult,
  CreateEventInput,
  DeleteEventResult,
  DirectoryUser,
  FreeBusyInterval,
  ResourceRoom,
  UpdateEventInput,
} from "./google-calendar/gcal-types";

export class GoogleCalendarService {
  public static clearCache(): void {
    GCalRoomsService.clearCache();
    GCalDirectoryService.clearCache();
  }

  public static getTrackedEventIds(): string[] {
    return CalendarEventTracker.getTrackedIds();
  }

  public static isConfigured(accessToken?: string): boolean {
    return GCalAuthService.isConfigured(accessToken);
  }

  public static isMock(accessToken?: string): boolean {
    return GCalAuthService.isMock(accessToken);
  }

  public static isMockMode(): boolean {
    return GCalAuthService.isMockMode();
  }

  public static async fetchWithMock(
    url: string,
    init?: RequestInit,
  ): Promise<Response> {
    return GCalAuthService.fetchWithMock(url, init);
  }

  public static async cleanupTrackedEvents(
    calendarId = "primary",
    token?: string,
  ): Promise<{ deleted: string[]; failed: string[] }> {
    return CalendarEventTracker.cleanupAll((id) =>
      this.deleteEvent(id, calendarId, token),
    );
  }

  public static async refreshAccountToken(accountRecord: {
    id?: string;
    refreshToken?: string | null;
    accessToken?: string | null;
    accessTokenExpiresAt?: Date | null;
    [key: string]: unknown;
  }): Promise<string | null> {
    return GCalAuthService.refreshAccountToken(accountRecord);
  }

  public static async getAccessToken(
    fallbackToken?: string,
  ): Promise<string | null> {
    return GCalAuthService.getAccessToken(fallbackToken);
  }

  public static parseGoogleRoom(
    email: string,
    displayName?: string,
    rawCapacity?: number,
    rawDescription?: string,
    buildingId?: string,
    floorName?: string,
  ): ResourceRoom {
    return GCalParserHelper.parseGoogleRoom(
      email,
      displayName,
      rawCapacity,
      rawDescription,
      buildingId,
      floorName,
    );
  }

  public static parseGoogleUser(
    email: string,
    displayName?: string,
    image?: string,
    title?: string,
    department?: string,
  ): DirectoryUser {
    return GCalParserHelper.parseGoogleUser(
      email,
      displayName,
      image,
      title,
      department,
    );
  }

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
    return GCalMetadataService.getCalendarMetadata(calendarId, options);
  }

  public static async resolveAttendeeInfo(
    email: string,
    options?: {
      accessToken?: string;
      accountRecord?: unknown;
    },
  ): Promise<{ name: string; isResource: boolean; details?: string }> {
    return GCalMetadataService.resolveAttendeeInfo(email, options);
  }

  public static async listResourceRooms(
    accessTokenOrOptions?:
      | string
      | {
          accountRecord?: unknown;
          accessToken?: string;
        },
  ): Promise<ResourceRoom[]> {
    return GCalRoomsService.listResourceRooms(accessTokenOrOptions);
  }

  public static async searchDirectoryUsers(
    query: string,
    accessTokenOrOptions?:
      | string
      | {
          accountRecord?: unknown;
          accessToken?: string;
        },
  ): Promise<DirectoryUser[]> {
    return GCalDirectoryService.searchDirectoryUsers(
      query,
      accessTokenOrOptions,
    );
  }

  public static async getFreeBusy(
    emails: string[],
    start: Date,
    end: Date,
    accessTokenOrOptions?:
      | string
      | {
          accountRecord?: unknown;
          accessToken?: string;
        },
    optionalAccountRecord?: unknown,
  ): Promise<Record<string, FreeBusyInterval[]>> {
    return GCalFreeBusyService.getFreeBusy(
      emails,
      start,
      end,
      accessTokenOrOptions,
      optionalAccountRecord,
    );
  }

  public static async createEvent(
    payload: CreateEventInput,
    accessToken?: string,
  ): Promise<CalendarEventResult> {
    return GCalEventMutationService.createEvent(payload, accessToken);
  }

  public static async updateEvent(
    eventId: string,
    payload: UpdateEventInput,
    accessToken?: string,
  ): Promise<CalendarEventResult> {
    return GCalEventMutationService.updateEvent(eventId, payload, accessToken);
  }

  public static async deleteEvent(
    eventId: string,
    calendarId: string = "primary",
    accessToken?: string,
  ): Promise<DeleteEventResult> {
    return GCalEventMutationService.deleteEvent(
      eventId,
      calendarId,
      accessToken,
    );
  }

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
    },
  ): Promise<CalendarEventResult[]> {
    return GCalEventQueryService.listEvents(calendarId, options);
  }
}
