import { db } from "@/db";
import { meetingRoom, type MeetingRoom } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { GoogleCalendarService, type ResourceRoom } from "./google-calendar";

export interface RoomFilter {
  minCapacity?: number;
  features?: string[];
  building?: string;
}

export class RoomService {
  private static toRoomValues(r: ResourceRoom) {
    const email = r.email.trim().toLowerCase();
    return {
      name: r.name,
      email,
      googleResourceEmail: r.email,
      officeLocation: r.officeLocation || "hcm",
      capacity: r.capacity || 10,
      features: r.features && r.features.length > 0 ? r.features : ["video-conference"],
      building: r.building || "Google Workspace",
      floor: r.floor || null,
      description: r.description || null,
    };
  }

  private static async upsertGoogleRoom(r: ResourceRoom): Promise<MeetingRoom> {
    const vals = this.toRoomValues(r);
    try {
      const [saved] = await db
        .insert(meetingRoom)
        .values(vals)
        .onConflictDoUpdate({
          target: meetingRoom.email,
          set: vals,
        })
        .returning();
      if (saved) return saved;
    } catch {
      // Fallback to in-memory room if DB upsert fails
    }
    return {
      id: r.id || vals.email,
      ...vals,
      equipment: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Synchronizes meeting rooms from Google Workspace Resource Calendars
   * into the local database `meeting_room` table via upsert.
   */
  public static async syncRoomsFromGoogle(): Promise<MeetingRoom[]> {
    const resourceRooms: ResourceRoom[] = await GoogleCalendarService.listResourceRooms();
    await Promise.all(resourceRooms.map((room) => this.upsertGoogleRoom(room)));
    return this.listRooms();
  }

  /**
   * Lists physical meeting rooms from Google Workspace Resource Calendars,
   * Google Calendar event resources, and the database catalog.
   */
  public static async listRooms(
    filter?: RoomFilter,
    options?: { accountRecord?: unknown; accessToken?: string }
  ): Promise<MeetingRoom[]> {
    const roomMap = new Map<string, MeetingRoom>();

    // 1. Always load rooms from database catalog
    try {
      const dbRooms = await db
        .select()
        .from(meetingRoom)
        .orderBy(asc(meetingRoom.capacity), asc(meetingRoom.name));

      for (const r of dbRooms) {
        const key = (r.email || r.id).toLowerCase();
        roomMap.set(key, r);
        if (r.googleResourceEmail) {
          roomMap.set(r.googleResourceEmail.toLowerCase(), r);
        }
      }
    } catch (dbErr) {
      console.warn("[RoomService] DB lookup error:", dbErr);
    }

    // 2. Fetch/merge meeting rooms from Google Workspace when DB catalog is empty
    if (roomMap.size === 0) {
      try {
        const resourceRooms = await GoogleCalendarService.listResourceRooms(options);
        const missingRooms = resourceRooms.filter(
          (r) => !roomMap.has(r.email.trim().toLowerCase())
        );
        const upsertedRooms = await Promise.all(missingRooms.map((r) => this.upsertGoogleRoom(r)));
        for (const upserted of upsertedRooms) {
          roomMap.set(upserted.email.trim().toLowerCase(), upserted);
        }
      } catch (err) {
        console.warn("Could not list rooms from Google:", err);
      }
    }

    let rooms = Array.from(new Set(roomMap.values()));

    if (filter?.minCapacity !== undefined && filter.minCapacity > 0) {
      rooms = rooms.filter((r) => r.capacity >= filter.minCapacity!);
    }

    if (filter?.features && filter.features.length > 0) {
      const required = filter.features.map((f) => f.toLowerCase());
      rooms = rooms.filter((r) => {
        const roomFeatures = (r.features || []).map((f) => f.toLowerCase());
        return required.every((req) => roomFeatures.includes(req));
      });
    }

    if (filter?.building) {
      const targetBuilding = filter.building.toLowerCase();
      rooms = rooms.filter((r) => r.building?.toLowerCase() === targetBuilding);
    }

    rooms.sort((a, b) => {
      if (a.capacity !== b.capacity) return a.capacity - b.capacity;
      return a.name.localeCompare(b.name);
    });

    return rooms;
  }

  /**
   * Lookup a room by its database ID.
   */
  public static async getRoomById(id: string): Promise<MeetingRoom | null> {
    const results = await db.select().from(meetingRoom).where(eq(meetingRoom.id, id)).limit(1);
    return results[0] || null;
  }

  /**
   * Lookup a room by its calendar resource email address.
   */
  public static async getRoomByEmail(email: string): Promise<MeetingRoom | null> {
    const results = await db
      .select()
      .from(meetingRoom)
      .where(eq(meetingRoom.email, email.trim().toLowerCase()))
      .limit(1);
    return results[0] || null;
  }
}
