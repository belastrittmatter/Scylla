import { afterEach, describe, expect, spyOn, test } from "bun:test";
import * as authHelper from "@/actions/auth-helper";
import * as apiUtils from "@/services/api-utils";
import {
  cancelBookingAction,
  getAgendaAction,
  rescheduleBookingAction,
} from "@/actions/booking-actions";
import { DELETE, PATCH } from "@/app/api/bookings/[id]/route";
import { type Booking } from "@/db/schema";
import { BookingService } from "@/services/booking";

const record = {
  id: "booking-access-test",
  organizerUserId: "organizer",
  userId: "owner",
  attendees: [{ email: "attendee@example.com" }],
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
  spies.push(spyOn(apiUtils, "resolveUserId").mockResolvedValue(id));
}

function stubBooking() {
  spies.push(spyOn(BookingService, "getBookingById").mockResolvedValue(record));
  const mutations = {
    cancel: spyOn(BookingService, "cancel").mockResolvedValue(record),
    reschedule: spyOn(BookingService, "reschedule").mockResolvedValue(record),
  };
  spies.push(mutations.cancel, mutations.reschedule);
  return mutations;
}

const url = `http://localhost/api/bookings/${record.id}`;
const ctx = { params: { id: record.id } };
// Same rule on both paths: a mutation is allowed iff this returns success.
const paths = {
  "action cancel": async () => (await cancelBookingAction(record.id)).success,
  "action reschedule": async () =>
    (await rescheduleBookingAction(record.id, changes)).success,
  "REST DELETE": async () =>
    (await DELETE(new Request(url, { method: "DELETE" }), ctx)).ok,
  "REST PATCH": async () =>
    (
      await PATCH(
        new Request(url, { method: "PATCH", body: JSON.stringify(changes) }),
        ctx,
      )
    ).ok,
};

describe("booking mutation authorization (Server Actions and REST agree)", () => {
  for (const [path, invoke] of Object.entries(paths)) {
    for (const [caller, allowed] of [
      ["organizer", true],
      ["owner", true],
      ["attendee", false],
      ["stranger", false],
    ] as const) {
      test(`${path}: ${caller} is ${allowed ? "allowed" : "denied"}`, async () => {
        identity(caller);
        const mutations = stubBooking();
        expect(await invoke()).toBe(allowed);
        const calls =
          mutations.cancel.mock.calls.length +
          mutations.reschedule.mock.calls.length;
        expect(calls).toBe(allowed ? 1 : 0);
      });
    }
  }

  test("action reports the exact denial message", async () => {
    identity("attendee");
    stubBooking();
    expect(await cancelBookingAction(record.id)).toEqual({
      success: false,
      error: "Access denied",
    });
  });

  test("canModify is organizer-or-owner only", () => {
    expect(BookingService.canModify(record, "organizer")).toBe(true);
    expect(BookingService.canModify(record, "owner")).toBe(true);
    expect(BookingService.canModify(record, "attendee")).toBe(false);
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
