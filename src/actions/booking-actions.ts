"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account } from "@/db/schema";
import { UserService, type Teammate } from "@/services/user";
import { RoomService, type RoomFilter } from "@/services/rooms";
import {
  SchedulerService,
  type FindSlotsParams,
  type TimeSlot,
} from "@/services/scheduler";
import {
  BookingService,
  type CreateBookingPayload,
  type ReschedulePayload,
} from "@/services/booking";
import type { MeetingRoom, Booking as BookingRecord } from "@/db/schema";
import {
  RoomFilterSchema,
  FindSlotsParamsSchema,
  GetAgendaParamsSchema,
  CreateBookingPayloadSchema,
  ReschedulePayloadSchema,
} from "./schemas";
import { resolveActionUserId, type ActionResult } from "./auth-helper";

/** The caller's Google account, so directory/room lookups run as them. */
async function googleOptionsFor(userId: string) {
  const [googleAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1);
  return {
    accountRecord: googleAccount,
    accessToken: googleAccount?.accessToken ?? undefined,
  };
}

export async function searchTeammatesAction(
  query: string = "",
): Promise<ActionResult<Teammate[]>> {
  try {
    const userId = await resolveActionUserId();
    const parseResult = z.string().safeParse(query);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }
    const teammates = await UserService.searchTeammates(parseResult.data, 20, {
      currentUserId: userId,
      ...(await googleOptionsFor(userId)),
    });
    return { success: true, data: teammates };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to search teammates",
    };
  }
}

export async function getRoomsAction(
  filter?: RoomFilter,
): Promise<ActionResult<MeetingRoom[]>> {
  try {
    const userId = await resolveActionUserId();
    const parseResult = RoomFilterSchema.safeParse(filter);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }
    const rooms = await RoomService.listRooms(
      parseResult.data,
      await googleOptionsFor(userId),
    );
    return { success: true, data: rooms };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to fetch meeting rooms",
    };
  }
}

export async function findSlotsAction(
  params: FindSlotsParams,
): Promise<ActionResult<TimeSlot[]>> {
  try {
    await resolveActionUserId();
    const parseResult = FindSlotsParamsSchema.safeParse(params);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }
    const slots = await SchedulerService.findSlots(parseResult.data);
    return { success: true, data: slots };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to find available slots",
    };
  }
}

export async function getAgendaAction(
  dateIso: string,
  userId?: string,
): Promise<ActionResult<BookingRecord[]>> {
  try {
    const parseResult = GetAgendaParamsSchema.safeParse({ dateIso, userId });
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }

    const sessionUserId = await resolveActionUserId();
    if (parseResult.data.userId && parseResult.data.userId !== sessionUserId) {
      return { success: false, error: "Access denied" };
    }

    const agenda = await BookingService.getAgenda(
      sessionUserId,
      parseResult.data.dateIso,
    );
    return { success: true, data: agenda };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch agenda",
    };
  }
}

export async function createBookingAction(
  payload: CreateBookingPayload,
): Promise<ActionResult<BookingRecord>> {
  try {
    const parseResult = CreateBookingPayloadSchema.safeParse(payload);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }

    const data = parseResult.data;
    // organizerUserId from the client is ignored: the organizer is the caller.
    const sessionUserId = await resolveActionUserId();

    const bookingResult = await BookingService.createBooking({
      ...data,
      organizerUserId: sessionUserId,
    });
    return { success: true, data: bookingResult };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create booking",
    };
  }
}

export async function rescheduleBookingAction(
  id: string,
  payload: ReschedulePayload,
): Promise<ActionResult<BookingRecord>> {
  try {
    const idParse = z.string().min(1, "Booking ID is required").safeParse(id);
    if (!idParse.success) {
      return {
        success: false,
        error: idParse.error.issues.map((i) => i.message).join(", "),
      };
    }

    const parseResult = ReschedulePayloadSchema.safeParse(payload);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }

    const sessionUserId = await resolveActionUserId();

    const existingBooking = await BookingService.getBookingById(idParse.data);
    if (!existingBooking) {
      return { success: false, error: "Booking not found" };
    }
    if (!BookingService.canModify(existingBooking, sessionUserId)) {
      return { success: false, error: "Access denied" };
    }

    const updated = await BookingService.reschedule(
      idParse.data,
      parseResult.data,
    );
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to reschedule booking",
    };
  }
}

export async function cancelBookingAction(
  id: string,
): Promise<ActionResult<BookingRecord>> {
  try {
    const idParse = z.string().min(1, "Booking ID is required").safeParse(id);
    if (!idParse.success) {
      return {
        success: false,
        error: idParse.error.issues.map((i) => i.message).join(", "),
      };
    }

    const sessionUserId = await resolveActionUserId();

    const existingBooking = await BookingService.getBookingById(idParse.data);
    if (!existingBooking) {
      return { success: false, error: "Booking not found" };
    }
    if (!BookingService.canModify(existingBooking, sessionUserId)) {
      return { success: false, error: "Access denied" };
    }

    const cancelled = await BookingService.cancel(idParse.data);
    return { success: true, data: cancelled };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel booking",
    };
  }
}
