import { db } from "@/db";
import { eventType, type EventType } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export interface CreateEventTypeInput {
  userId?: string;
  name: string;
  title?: string;
  slug?: string;
  description?: string;
  duration: number;
  requiresRoom?: boolean;
  beforeBuffer?: number;
  afterBuffer?: number;
}

export class EventTypeService {
  public static async getEventTypes(userId?: string): Promise<EventType[]> {
    if (userId) {
      return db
        .select()
        .from(eventType)
        .where(eq(eventType.userId, userId))
        .orderBy(asc(eventType.duration), asc(eventType.name));
    }
    return db
      .select()
      .from(eventType)
      .orderBy(asc(eventType.duration), asc(eventType.name));
  }

  public static async createEventType(
    input: CreateEventTypeInput,
  ): Promise<EventType> {
    const baseSlug = (input.slug || input.name || "meeting")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let finalSlug = baseSlug || "meeting";
    let counter = 1;
    while (true) {
      const existing = await this.getEventTypeBySlug(finalSlug);
      if (!existing) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const [created] = await db
      .insert(eventType)
      .values({
        userId: input.userId,
        name: input.name,
        title: input.title || input.name,
        slug: finalSlug,
        description: input.description,
        duration: input.duration || 30,
        requiresRoom: input.requiresRoom ?? false,
        beforeBuffer: input.beforeBuffer ?? 0,
        afterBuffer: input.afterBuffer ?? 0,
      })
      .returning();

    return created;
  }

  public static async getEventTypeBySlug(
    slug: string,
  ): Promise<EventType | null> {
    const results = await db
      .select()
      .from(eventType)
      .where(eq(eventType.slug, slug))
      .limit(1);
    return results[0] || null;
  }

  public static async getEventTypeById(id: string): Promise<EventType | null> {
    const results = await db
      .select()
      .from(eventType)
      .where(eq(eventType.id, id))
      .limit(1);
    return results[0] || null;
  }
}
