import { afterEach, describe, expect, spyOn, test } from "bun:test";
import * as authHelper from "@/actions/auth-helper";
import {
  cancelBookingAction,
  getAgendaAction,
  rescheduleBookingAction,
} from "@/actions/booking-actions";
import { db } from "@/db";
import { booking, user, type Booking } from "@/db/schema";
import { BookingService } from "@/services/booking";

const record = {
  id: "booking-access-test",
  organizerUserId: "organizer",
  userId: "owner",
  attendees: [{ email: "Attendee@Example.com" }],
} as Booking;
const changes = {
  startTime: "2026-11-20T10:00:00.000Z",
  endTime: "2026-11-20T10:30:00.000Z",
};

const spies: Array<{ mockRestore(): void }> = [];
afterEach(() => {
  spies.splice(0).forEach((spy) => spy.mockRestore());
});

function identity(id = "attendee") {
  spies.push(spyOn(authHelper, "resolveActionUserId").mockResolvedValue(id));
}

function bookingReads(
  emailVerified: boolean,
  email = "attendee@example.com",
  b = record,
) {
  const select = spyOn(db, "select").mockImplementation((() => ({
    from: (table: unknown) => ({
      where: () => ({
        limit: async () =>
          table === booking ? [b] : [{ email, emailVerified }],
      }),
    }),
  })) as unknown as typeof db.select);
  spies.push(select);
  return select;
}

describe("booking action authorization", () => {
  for (const action of ["cancel", "reschedule"] as const) {
    test(`${action} denies unverified attendee email and allows it after verification`, async () => {
      identity();
      const mutation = spyOn(BookingService, action).mockResolvedValue(record);
      spies.push(mutation);
      const reads = bookingReads(false);
      const invoke = () =>
        action === "cancel"
          ? cancelBookingAction(record.id)
          : rescheduleBookingAction(record.id, changes);

      expect(await invoke()).toEqual({
        success: false,
        error: "Access denied",
      });
      expect(mutation).not.toHaveBeenCalled();
      expect(reads).toHaveBeenCalledWith({
        email: user.email,
        emailVerified: user.emailVerified,
      });
      reads.mockRestore();
      bookingReads(true);
      expect((await invoke()).success).toBe(true);
      expect(mutation).toHaveBeenCalledTimes(1);
    });
  }

  for (const id of ["organizer", "owner"]) {
    test(`preserves ID-based access for ${id} without email verification`, async () => {
      identity(id);
      bookingReads(false);
      const mutation = spyOn(BookingService, "cancel").mockResolvedValue(
        record,
      );
      spies.push(mutation);
      expect((await cancelBookingAction(record.id)).success).toBe(true);
    });
  }

  test("denies a verified email that is not an attendee", async () => {
    identity();
    bookingReads(true, "stranger@example.com");
    const mutation = spyOn(BookingService, "cancel").mockResolvedValue(record);
    spies.push(mutation);
    expect((await cancelBookingAction(record.id)).success).toBe(false);
    expect(mutation).not.toHaveBeenCalled();
  });
});

describe("agenda action authorization", () => {
  test("rejects an explicit ID different from the resolved caller before querying", async () => {
    identity("session-user");
    const agenda = spyOn(BookingService, "getAgenda").mockResolvedValue([]);
    spies.push(agenda);
    expect(await getAgendaAction("2026-11-20", "other-user")).toEqual({
      success: false,
      error: "Access denied",
    });
    expect(agenda).not.toHaveBeenCalled();
  });

  test("allows an explicit ID matching the caller", async () => {
    identity("session-user");
    const agenda = spyOn(BookingService, "getAgenda").mockResolvedValue([]);
    spies.push(agenda);
    expect((await getAgendaAction("2026-11-20", "session-user")).success).toBe(
      true,
    );
    expect(agenda).toHaveBeenCalledWith("session-user", "2026-11-20");
  });

  test("rejects callers without a session", async () => {
    const agenda = spyOn(BookingService, "getAgenda").mockResolvedValue([]);
    spies.push(agenda);
    expect(await getAgendaAction("2026-11-20", "other-user")).toEqual({
      success: false,
      error: "Unauthorized: Active user session required",
    });
    expect(agenda).not.toHaveBeenCalled();
  });
});
