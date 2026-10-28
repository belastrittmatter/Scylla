"use server";

import { z } from "zod";
import { UserService, type Teammate } from "@/services/user";
import { RoomService, type RoomFilter } from "@/services/rooms";
import { SchedulerService, type FindSlotsParams, type TimeSlot } from "@/services/scheduler";
import {
  BookingService,
  type CreateBookingPayload,
  type ReschedulePayload,
} from "@/services/booking";
import type { MeetingRoom, Booking } from "@/db/schema";
import {
  RoomFilterSchema,
  FindSlotsParamsSchema,
  GetAgendaParamsSchema,
  CreateBookingPayloadSchema,
  ReschedulePayloadSchema,
} from "./schemas";
import { getSessionUserId, type ActionResult } from "./auth-helper";

export async function searchTeammatesAction(query: string = ""): Promise<ActionResult<Teammate[]>> {
  try {
    const parseResult = z.string().safeParse(query);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }
    const teammates = await UserService.searchTeammates(parseResult.data);
    return { success: true, data: teammates };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to search teammates",
    };
  }
}

export async function getRoomsAction(filter?: RoomFilter): Promise<ActionResult<MeetingRoom[]>> {
  try {
    const parseResult = RoomFilterSchema.safeParse(filter);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }
    const rooms = await RoomService.listRooms(parseResult.data);
    return { success: true, data: rooms };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch meeting rooms",
    };
  }
}

export async function findSlotsAction(params: FindSlotsParams): Promise<ActionResult<TimeSlot[]>> {
  try {
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
      error: err instanceof Error ? err.message : "Failed to find available slots",
    };
  }
}

export async function getAgendaAction(
  dateIso: string,
  userId?: string
): Promise<ActionResult<Booking[]>> {
  try {
    const parseResult = GetAgendaParamsSchema.safeParse({ dateIso, userId });
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }

    let targetUserId = parseResult.data.userId;
    if (!targetUserId) {
      targetUserId = (await getSessionUserId()) ?? undefined;
    }

    if (!targetUserId) {
      return {
        success: false,
        error: "User ID is required when unauthenticated",
      };
    }

    const agenda = await BookingService.getAgenda(targetUserId, parseResult.data.dateIso);
    return { success: true, data: agenda };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch agenda",
    };
  }
}

export async function createBookingAction(
  payload: CreateBookingPayload
): Promise<ActionResult<Booking>> {
  try {
    const parseResult = CreateBookingPayloadSchema.safeParse(payload);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      };
    }

    const data = parseResult.data;
    let organizerUserId = data.organizerUserId;
    if (!organizerUserId) {
      organizerUserId = (await getSessionUserId()) ?? undefined;
    }

    if (!organizerUserId) {
      return {
        success: false,
        error: "Organizer user ID is required when unauthenticated",
      };
    }

    const booking = await BookingService.createBooking({
      ...data,
      organizerUserId,
    });
    return { success: true, data: booking };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create booking",
    };
  }
}

export async function rescheduleBookingAction(
  id: string,
  payload: ReschedulePayload
): Promise<ActionResult<Booking>> {
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

    const booking = await BookingService.reschedule(idParse.data, parseResult.data);
    return { success: true, data: booking };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reschedule booking",
    };
  }
}

export async function cancelBookingAction(id: string): Promise<ActionResult<Booking>> {
  try {
    const idParse = z.string().min(1, "Booking ID is required").safeParse(id);
    if (!idParse.success) {
      return { success: false, error: idParse.error.issues.map((i) => i.message).join(", ") };
    }
    const booking = await BookingService.cancel(idParse.data);
    return { success: true, data: booking };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel booking",
    };
  }
}
