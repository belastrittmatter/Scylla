import { GCalAuthService } from "./gcal-auth-service";
import { type CalendarEventResult, toIsoString } from "./gcal-types";

export class GCalEventQueryService {
  public static async listEvents(
    calendarId: string = "primary",
    options?: {
      accessToken?: string;
      accountRecord?: {
        id?: string;
        refreshToken?: string | null;
        accessToken?: string | null;
        accessTokenExpiresAt?: Date | null;
        [key: string]: unknown;
      };
      timeMin?: Date | string;
      timeMax?: Date | string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: string;
      showDeleted?: boolean;
    },
  ): Promise<CalendarEventResult[]> {
    let token = options?.accountRecord
      ? await GCalAuthService.refreshAccountToken(options.accountRecord)
      : await GCalAuthService.getAccessToken(options?.accessToken);

    if (!token) {
      throw new Error(
        "Google Calendar API access token is required for listEvents",
      );
    }

    const fetchPage = async (authToken: string, pageToken?: string) => {
      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      );

      if (options?.timeMin) {
        url.searchParams.set("timeMin", toIsoString(options.timeMin));
      }
      if (options?.timeMax) {
        url.searchParams.set("timeMax", toIsoString(options.timeMax));
      }
      url.searchParams.set("maxResults", String(options?.maxResults ?? 100));
      url.searchParams.set(
        "singleEvents",
        String(options?.singleEvents ?? true),
      );
      url.searchParams.set("orderBy", options?.orderBy ?? "startTime");
      if (options?.showDeleted) {
        url.searchParams.set("showDeleted", "true");
      }
      if (pageToken) {
        url.searchParams.set("pageToken", pageToken);
      }

      return GCalAuthService.fetchWithMock(url.toString(), {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });
    };

    try {
      const allItems: Array<Record<string, unknown>> = [];
      let pageToken: string | undefined = undefined;

      do {
        let res = await fetchPage(token, pageToken);

        if (res.status === 401 && options?.accountRecord?.refreshToken) {
          const refreshedToken = await GCalAuthService.refreshAccountToken({
            ...options.accountRecord,
            accessTokenExpiresAt: new Date(0),
          });
          if (refreshedToken && refreshedToken !== token) {
            token = refreshedToken;
            res = await fetchPage(token, pageToken);
          }
        }

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Google Calendar listEvents failed: ${errText}`);
        }

        const data = await res.json();
        const items = (data.items || []) as Array<Record<string, unknown>>;
        allItems.push(...items);
        pageToken = (data as { nextPageToken?: string })?.nextPageToken;
      } while (pageToken);

      return allItems.map((item) => {
        const startObj = item.start as
          { dateTime?: string; date?: string } | undefined;
        const endObj = item.end as
          { dateTime?: string; date?: string } | undefined;
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
            ? new Date(`${endObj.date}T00:00:00Z`).toISOString()
            : "";

        const attendeesRaw = (item.attendees || []) as Array<
          Record<string, unknown>
        >;

        return {
          id: String(item.id || ""),
          status: String(item.status || "confirmed"),
          summary: item.summary ? String(item.summary) : undefined,
          description: item.description ? String(item.description) : undefined,
          location: item.location ? String(item.location) : undefined,
          meetingUrl: meetingUrl || undefined,
          hangoutsLink: item.hangoutLink ? String(item.hangoutLink) : undefined,
          htmlLink: item.htmlLink ? String(item.htmlLink) : undefined,
          transparency: item.transparency
            ? String(item.transparency)
            : undefined,
          eventType: item.eventType ? String(item.eventType) : undefined,
          isAllDay,
          start: { dateTime: startIso },
          end: { dateTime: endIso },
          attendees: attendeesRaw.map((a) => ({
            email: String(a.email || ""),
            name: a.displayName ? String(a.displayName) : undefined,
            responseStatus: a.responseStatus
              ? String(a.responseStatus)
              : undefined,
            resource: Boolean(a.resource),
          })),
        };
      });
    } catch (err) {
      console.warn("Error calling Google Calendar listEvents:", err);
      throw err;
    }
  }
}
