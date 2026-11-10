import { describe, expect, test } from "bun:test";
import * as actions from "@/actions";
import { resolveActionUserId } from "@/actions/auth-helper";

// No session mock here: every exported Server Action must fail closed.
const calls: Record<
  string,
  () => Promise<{ success: boolean; error?: string }>
> = {
  searchTeammatesAction: () => actions.searchTeammatesAction("alex"),
  getRoomsAction: () => actions.getRoomsAction({}),
  findSlotsAction: () =>
    actions.findSlotsAction({
      attendees: ["alex@example.com"],
      durationMinutes: 30,
      startDate: "2026-10-20T09:00:00Z",
      endDate: "2026-10-20T12:00:00Z",
    }),
  getAgendaAction: () => actions.getAgendaAction("2026-10-20"),
  getAgendaActionWithUserId: () =>
    actions.getAgendaAction("2026-10-20", "usr_alex_rivera"),
  createBookingAction: () =>
    actions.createBookingAction({
      title: "Anonymous",
      organizerUserId: "usr_alex_rivera",
      startTime: "2026-10-20T10:00:00.000Z",
      endTime: "2026-10-20T10:30:00.000Z",
    }),
  rescheduleBookingAction: () =>
    actions.rescheduleBookingAction("any-booking", {
      startTime: "2026-10-20T10:00:00.000Z",
      endTime: "2026-10-20T10:30:00.000Z",
    }),
  cancelBookingAction: () => actions.cancelBookingAction("any-booking"),
  getWorkspaceDataAction: () => actions.getWorkspaceDataAction(),
  updateTaskStatusAction: () =>
    actions.updateTaskStatusAction("any-task", "done"),
  updateTaskAction: () =>
    actions.updateTaskAction("any-task", { title: "Hijacked" }),
  createProjectAction: () =>
    actions.createProjectAction({ teamId: "any-team", name: "Anonymous" }),
  createTaskAction: () =>
    actions.createTaskAction({ teamId: "any-team", title: "Anonymous" }),
  getTaskCommentsAction: () => actions.getTaskCommentsAction("any-task"),
  createTaskCommentAction: () =>
    actions.createTaskCommentAction({ taskId: "any-task", content: "hi" }),
};

describe("Server Actions without a session (#93)", () => {
  test("resolveActionUserId ignores the environment and requires a session", async () => {
    await expect(resolveActionUserId()).rejects.toThrow("Unauthorized");
  });

  for (const [name, call] of Object.entries(calls)) {
    test(`${name} rejects anonymous callers`, async () => {
      const res = await call();
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized: Active user session required");
    });
  }
});
