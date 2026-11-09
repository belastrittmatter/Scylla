import { db } from "@/db";
import { user, teamMember, type User } from "@/db/schema";
import { eq, or, ilike, and, inArray } from "drizzle-orm";
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

export class UserService {
  /**
   * Search teammates from Google Workspace Directory, Calendar events, and database users.
   */
  public static async searchTeammates(
    query: string = "",
    limit: number = 20,
    options?: {
      accountRecord?: unknown;
      accessToken?: string;
      currentUserId?: string;
    },
  ): Promise<Teammate[]> {
    const trimmed = query.trim();
    const seenEmails = new Set<string>();
    const results: Teammate[] = [];

    // 1. Search database users (scoped to caller's teammates if currentUserId provided)
    try {
      const searchPattern = `%${trimmed}%`;
      let teammateIds: string[] | null = null;

      if (options?.currentUserId) {
        const memberships = await db
          .select({ teamId: teamMember.teamId })
          .from(teamMember)
          .where(eq(teamMember.userId, options.currentUserId));
        const teamIds = memberships.map((m) => m.teamId);
        if (teamIds.length > 0) {
          const members = await db
            .select({ userId: teamMember.userId })
            .from(teamMember)
            .where(inArray(teamMember.teamId, teamIds));
          teammateIds = Array.from(
            new Set([options.currentUserId, ...members.map((m) => m.userId)]),
          );
        } else {
          teammateIds = [options.currentUserId];
        }
      }

      let dbUsers: User[] = [];
      if (teammateIds !== null && teammateIds.length === 0) {
        dbUsers = [];
      } else {
        const userScopeCondition =
          teammateIds !== null ? inArray(user.id, teammateIds) : undefined;
        const textSearchCondition = trimmed
          ? or(
              ilike(user.name, searchPattern),
              ilike(user.email, searchPattern),
            )
          : undefined;

        const combinedCondition =
          userScopeCondition && textSearchCondition
            ? and(userScopeCondition, textSearchCondition)
            : userScopeCondition || textSearchCondition;

        dbUsers = combinedCondition
          ? await db.select().from(user).where(combinedCondition).limit(limit)
          : await db.select().from(user).limit(limit);
      }

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
      console.warn("Failed to search database users:", dbErr);
    }

    // 2. Fetch directory users from Google Workspace only when caller has linked credentials or in mock/test mode
    if (
      options?.accountRecord ||
      options?.accessToken ||
      GoogleCalendarService.isMockMode()
    ) {
      try {
        const directoryUsers = await GoogleCalendarService.searchDirectoryUsers(
          trimmed,
          options,
        );
        for (const du of directoryUsers) {
          const em = du.email.toLowerCase();
          // Google answers fragments with a synthetic non-email entry; only real
          // addresses may enter the list, and only when they match the query.
          if (!isFullEmail(du.email)) continue;
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
        console.warn("Failed to search Google directory users:", gErr);
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
