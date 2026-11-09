import { GCalAuthService } from "./gcal-auth-service";
import type { FreeBusyInterval, GCalAccountRecord } from "./gcal-types";

export class GCalFreeBusyService {
  public static async getFreeBusy(
    emails: string[],
    start: Date,
    end: Date,
    accessTokenOrOptions?:
      string | { accountRecord?: unknown; accessToken?: string },
    optionalAccountRecord?: unknown,
  ): Promise<Record<string, FreeBusyInterval[]>> {
    const options =
      typeof accessTokenOrOptions === "object" && accessTokenOrOptions !== null
        ? accessTokenOrOptions
        : {
            accessToken:
              typeof accessTokenOrOptions === "string"
                ? accessTokenOrOptions
                : undefined,
            accountRecord: optionalAccountRecord,
          };

    const timeMin = start.toISOString();
    const timeMax = end.toISOString();
    const acc = options.accountRecord as GCalAccountRecord | undefined;
    let token = acc
      ? await GCalAuthService.refreshAccountToken(acc)
      : await GCalAuthService.getAccessToken(options.accessToken);

    if (!token || emails.length === 0) {
      if (!token && emails.length > 0) {
        console.warn(
          "Google Calendar API access token not available for getFreeBusy",
        );
      }
      const emptyEntries: Record<string, FreeBusyInterval[]> = {};
      for (const email of emails) {
        emptyEntries[email] = [];
      }
      return emptyEntries;
    }

    const fetchFreeBusy = (authToken: string) =>
      GCalAuthService.fetchWithMock(
        "https://www.googleapis.com/calendar/v3/freeBusy",
        {
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
        },
      );

    try {
      let res = await fetchFreeBusy(token);

      if (res.status === 401 && acc?.refreshToken) {
        const refreshedToken = await GCalAuthService.refreshAccountToken({
          ...acc,
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
        const cal = data.calendars?.[email];
        if (cal?.errors?.length) {
          console.warn(
            "Google Calendar freeBusy returned errors for an attendee calendar:",
            (cal.errors as Array<{ reason?: string }>).map((e) => e.reason),
          );
        }
        entries[email] = (cal?.busy || []).map(
          (interval: { start: string; end: string }) => ({
            start: interval.start,
            end: interval.end,
          }),
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
}
