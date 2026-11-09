import { GCalAuthService } from "./gcal-auth-service";
import { GCalParserHelper } from "./gcal-parser-helper";
import type { DirectoryUser, GCalAccountRecord } from "./gcal-types";

export class GCalDirectoryService {
  private static cachedUsersMap = new Map<
    string,
    { data: DirectoryUser[]; expiresAt: number }
  >();
  private static hasAdminApiPermission = true;

  public static clearCache(): void {
    this.cachedUsersMap.clear();
    this.hasAdminApiPermission = true;
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
    const q = query.trim();
    const lowerQuery = q.toLowerCase();
    const filterUsers = (users: DirectoryUser[]): DirectoryUser[] => {
      if (!q) return users;
      const filtered = users.filter(
        (u) =>
          u.name.toLowerCase().includes(lowerQuery) ||
          u.email.toLowerCase().includes(lowerQuery) ||
          (u.title && u.title.toLowerCase().includes(lowerQuery)) ||
          (u.department && u.department.toLowerCase().includes(lowerQuery)),
      );
      if (
        q.includes("@") &&
        !filtered.some((u) => u.email.toLowerCase() === lowerQuery)
      ) {
        return [...filtered, GCalParserHelper.parseGoogleUser(q)];
      }
      return filtered;
    };

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

    if (!token) return [];

    const cacheKey = acc?.id || token.slice(0, 32);
    const cached = this.cachedUsersMap.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt && cached.data.length > 0) {
      const cachedMatches = filterUsers(cached.data);
      if (!q || cachedMatches.length > 0) return cachedMatches;
    }

    const userMap = new Map<string, DirectoryUser>();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const adminUrl = q
      ? `https://admin.googleapis.com/admin/directory/v1/users?customer=my_customer&query=${encodeURIComponent(q)}&maxResults=20`
      : "https://admin.googleapis.com/admin/directory/v1/users?customer=my_customer&maxResults=20";

    const [evRes, calRes, pRes, adminRes] = await Promise.all([
      GCalAuthService.fetchWithMock(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250",
        { headers },
      ).catch(() => null),
      GCalAuthService.fetchWithMock(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250",
        { headers },
      ).catch(() => null),
      q
        ? GCalAuthService.fetchWithMock(
            `https://people.googleapis.com/v1/people:searchDirectoryPeople?query=${encodeURIComponent(q)}&readMask=names,emailAddresses,photos,organizations&sources=DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE&sources=DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT&pageSize=20`,
            { headers },
          ).catch(() => null)
        : Promise.resolve(null),
      this.hasAdminApiPermission
        ? GCalAuthService.fetchWithMock(adminUrl, { headers }).catch((res) => {
            if (
              res &&
              typeof res === "object" &&
              "status" in res &&
              res.status === 403
            ) {
              this.hasAdminApiPermission = false;
            }
            return null;
          })
        : Promise.resolve(null),
    ]);

    if (evRes?.ok) {
      try {
        const evData = await evRes.json();
        for (const item of (evData.items || []) as Array<{
          organizer?: { email?: string; displayName?: string };
          attendees?: Array<{
            email?: string;
            displayName?: string;
            resource?: boolean;
          }>;
        }>) {
          if (item.organizer?.email) {
            const orgEmail = item.organizer.email.toLowerCase().trim();
            if (
              !orgEmail.includes("resource.calendar.google.com") &&
              !orgEmail.includes("group.calendar.google.com") &&
              !userMap.has(orgEmail)
            ) {
              userMap.set(
                orgEmail,
                GCalParserHelper.parseGoogleUser(
                  item.organizer.email,
                  item.organizer.displayName,
                ),
              );
            }
          }
          for (const att of item.attendees || []) {
            const em = (att.email || "").toLowerCase().trim();
            if (
              em &&
              !att.resource &&
              !em.includes("resource.calendar.google.com") &&
              !em.includes("group.calendar.google.com") &&
              !userMap.has(em)
            ) {
              userMap.set(
                em,
                GCalParserHelper.parseGoogleUser(att.email!, att.displayName),
              );
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (calRes?.ok) {
      try {
        const calData = await calRes.json();
        for (const cal of (calData.items || []) as Array<
          Record<string, unknown>
        >) {
          const id = String(cal.id || "").toLowerCase();
          if (
            id.includes("@") &&
            !id.includes("resource.calendar.google.com") &&
            !id.includes("group.calendar.google.com") &&
            !id.includes("holiday@") &&
            !userMap.has(id)
          ) {
            userMap.set(
              id,
              GCalParserHelper.parseGoogleUser(
                String(cal.id || ""),
                String(cal.summary || ""),
              ),
            );
          }
        }
      } catch {
        // ignore
      }
    }

    if (pRes?.ok) {
      try {
        const pData = await pRes.json();
        for (const p of (pData.people || []) as Array<{
          names?: Array<{ displayName?: string }>;
          emailAddresses?: Array<{ value?: string }>;
          photos?: Array<{ url?: string }>;
          organizations?: Array<{ title?: string; department?: string }>;
        }>) {
          const em = (p.emailAddresses?.[0]?.value || "").toLowerCase();
          if (em && !userMap.has(em)) {
            userMap.set(
              em,
              GCalParserHelper.parseGoogleUser(
                em,
                p.names?.[0]?.displayName,
                p.photos?.[0]?.url,
                p.organizations?.[0]?.title,
                p.organizations?.[0]?.department,
              ),
            );
          }
        }
      } catch {
        // ignore
      }
    }

    if (adminRes?.ok) {
      try {
        const data = await adminRes.json();
        for (const u of (data.users || []) as Array<Record<string, unknown>>) {
          const em = String(u.primaryEmail || "").toLowerCase();
          if (em && !userMap.has(em)) {
            const nameObj = u.name as { fullName?: string } | undefined;
            userMap.set(
              em,
              GCalParserHelper.parseGoogleUser(
                String(u.primaryEmail || ""),
                nameObj?.fullName,
                u.thumbnailPhotoUrl ? String(u.thumbnailPhotoUrl) : undefined,
              ),
            );
          }
        }
      } catch {
        // ignore
      }
    }

    const allUsers = Array.from(userMap.values());
    if (allUsers.length > 0) {
      this.cachedUsersMap.set(cacheKey, {
        data: allUsers,
        expiresAt: Date.now() + 180_000,
      });
    }
    return filterUsers(allUsers);
  }
}
