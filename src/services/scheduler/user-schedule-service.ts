import { db } from "@/db";
import { schedule, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  DEFAULT_WORKING_HOURS,
  type WorkingHoursEntry,
} from "./scheduler-types";

export class UserScheduleService {
  public static async getUserSchedule(userIdOrEmail?: string): Promise<{
    workingHours: WorkingHoursEntry[];
    timeZone: string;
  }> {
    if (!userIdOrEmail) {
      return {
        workingHours: DEFAULT_WORKING_HOURS,
        timeZone: "Asia/Ho_Chi_Minh",
      };
    }

    let targetUserId = userIdOrEmail;
    if (userIdOrEmail.includes("@")) {
      const users = await db
        .select()
        .from(user)
        .where(eq(user.email, userIdOrEmail.trim().toLowerCase()))
        .limit(1);
      if (users[0]) {
        targetUserId = users[0].id;
      }
    }

    const scheds = await db
      .select()
      .from(schedule)
      .where(eq(schedule.userId, targetUserId))
      .limit(1);

    if (scheds[0]) {
      return {
        workingHours: scheds[0].workingHours || DEFAULT_WORKING_HOURS,
        timeZone: scheds[0].timeZone || "Asia/Ho_Chi_Minh",
      };
    }

    return {
      workingHours: DEFAULT_WORKING_HOURS,
      timeZone: "Asia/Ho_Chi_Minh",
    };
  }
}
