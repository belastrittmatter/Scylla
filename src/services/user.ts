import { db } from "@/db";
import { user, type User } from "@/db/schema";
import { eq, or, ilike } from "drizzle-orm";
import { GoogleCalendarService } from "@/services/google-calendar";

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
    options?: { accountRecord?: unknown; accessToken?: string },
  ): Promise<Teammate[]> {
    const trimmed = query.trim();
    const seenEmails = new Set<string>();
    const results: Teammate[] = [];

    // 1. Search database users
    try {
      const searchPattern = `%${trimmed}%`;
      const dbUsers = trimmed
        ? await db
            .select()
            .from(user)
            .where(
              or(
                ilike(user.name, searchPattern),
                ilike(user.email, searchPattern),
              ),
            )
            .limit(limit)
        : await db.select().from(user).limit(limit);

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

    // 2. Fetch directory users directly from Google Workspace
    try {
      const directoryUsers = await GoogleCalendarService.searchDirectoryUsers(
        trimmed,
        options,
      );
      for (const du of directoryUsers) {
        const em = du.email.toLowerCase();
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

    // 3. If query contains "@", include it as a selectable option so user can check any email
    if (trimmed.includes("@")) {
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
