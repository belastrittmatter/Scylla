import { db } from "@/db";
import { user, teamMember, type User } from "@/db/schema";
import { eq, or, ilike, and, inArray, sql } from "drizzle-orm";
import { GoogleCalendarService } from "@/services/google-calendar";
import { isFullEmail } from "@/lib/format-person-name";

export interface Teammate {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  avatarUrl?: string | null;
  title?: string;
  department?: string;
}

const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 50;

export class UserService {
  /**
   * IDs of every user sharing a team with `userId`, including `userId` itself.
   */
  public static async getTeammateIds(userId: string): Promise<string[]> {
    const members = await db
      .selectDistinct({ userId: teamMember.userId })
      .from(teamMember)
      .where(
        inArray(
          teamMember.teamId,
          db
            .select({ teamId: teamMember.teamId })
            .from(teamMember)
            .where(eq(teamMember.userId, userId)),
        ),
      );
    return Array.from(new Set([userId, ...members.map((m) => m.userId)]));
  }

  /**
   * True when every entry (a user id or email, case-insensitive) is a registered
   * user sharing a team with `callerId`; unknown addresses and other tenants fail.
   */
  public static async areTeammates(
    callerId: string,
    idsOrEmails: string[],
  ): Promise<boolean> {
    const allowedUserIds = new Set(await this.getTeammateIds(callerId));
    const matchedUsers = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(
        or(
          inArray(user.id, idsOrEmails),
          inArray(
            sql`lower(${user.email})`,
            idsOrEmails.map((a) => a.toLowerCase()),
          ),
        ),
      );
    return idsOrEmails.every((a) =>
      matchedUsers.some(
        (u) =>
          allowedUserIds.has(u.id) &&
          (u.id === a || u.email.toLowerCase() === a.toLowerCase()),
      ),
    );
  }

  /**
   * Search the caller's teammates across database users and the Google
   * Workspace directory. Fails closed (empty result) without a caller id.
   */
  public static async searchTeammates(
    query: string = "",
    limit: number = 20,
    options: {
      currentUserId: string;
      accountRecord?: unknown;
      accessToken?: string;
    },
  ): Promise<Teammate[]> {
    const trimmed = query.trim();
    // An empty query lists the caller's teammates; a single character is too broad to search.
    if (!options.currentUserId || trimmed.length === 1) return [];
    limit = Math.min(Math.max(1, limit), MAX_LIMIT);

    const seenEmails = new Set<string>();
    const results: Teammate[] = [];
    const teammateIds = await this.getTeammateIds(options.currentUserId);

    // 1. Search database users scoped to the caller's teammates
    try {
      const searchPattern = `%${trimmed}%`;
      const dbUsers = await db
        .select()
        .from(user)
        .where(
          and(
            inArray(user.id, teammateIds),
            trimmed
              ? or(
                  ilike(user.name, searchPattern),
                  ilike(user.email, searchPattern),
                )
              : undefined,
          ),
        )
        .limit(limit);

      for (const u of dbUsers) {
        const em = u.email.toLowerCase();
        if (!seenEmails.has(em)) {
          seenEmails.add(em);
          results.push({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            avatarUrl: u.image,
          });
        }
      }
    } catch (dbErr) {
      console.warn(
        "Failed to search database users:",
        dbErr instanceof Error ? dbErr.message : "Unknown error",
      );
    }

    // 2. Fetch directory users from Google Workspace only when caller has linked credentials or in mock/test mode
    if (
      trimmed.length >= MIN_QUERY_LENGTH &&
      (options.accountRecord ||
        options.accessToken ||
        GoogleCalendarService.isMockMode())
    ) {
      try {
        const directoryUsers = await GoogleCalendarService.searchDirectoryUsers(
          trimmed,
          options,
        );
        const directoryEmails = directoryUsers
          .map((du) => du.email.toLowerCase())
          .filter(isFullEmail);
        // The Workspace directory spans the whole org; only teammates may surface.
        const teammateEmails = new Set(
          directoryEmails.length === 0
            ? []
            : (
                await db
                  .select({ email: user.email })
                  .from(user)
                  .where(
                    and(
                      inArray(user.id, teammateIds),
                      inArray(sql`lower(${user.email})`, directoryEmails),
                    ),
                  )
              ).map((u) => u.email.toLowerCase()),
        );
        for (const du of directoryUsers) {
          const em = du.email.toLowerCase();
          // Google answers fragments with a synthetic non-email entry; only real
          // addresses may enter the list, and only when they match the query.
          if (!isFullEmail(du.email) || !teammateEmails.has(em)) continue;
          if (
            trimmed &&
            !du.name.toLowerCase().includes(trimmed.toLowerCase()) &&
            !em.includes(trimmed.toLowerCase())
          ) {
            continue;
          }
          if (!seenEmails.has(em)) {
            seenEmails.add(em);
            results.push({
              id: du.id || em,
              name: du.name || em.split("@")[0],
              email: du.email,
              image: du.image,
              avatarUrl: du.image,
              title: du.title,
              department: du.department,
            });
          }
        }
      } catch (gErr) {
        console.warn(
          "Failed to search Google directory users:",
          gErr instanceof Error ? gErr.message : "Unknown error",
        );
      }
    }

    // 3. A complete email is selectable directly so the user can check any address
    if (isFullEmail(trimmed)) {
      const lowerTrimmed = trimmed.toLowerCase();
      if (!seenEmails.has(lowerTrimmed)) {
        results.unshift({
          id: lowerTrimmed,
          name: lowerTrimmed.split("@")[0],
          email: trimmed,
        });
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Lookup a user by their unique database ID.
   */
  public static async getUserById(id: string): Promise<User | null> {
    const records = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return records[0] || null;
  }

  /**
   * Lookup a user by their email address.
   */
  public static async getUserByEmail(email: string): Promise<User | null> {
    const records = await db
      .select()
      .from(user)
      .where(eq(user.email, email.trim().toLowerCase()))
      .limit(1);
    return records[0] || null;
  }
}
