import { describe, expect, test } from "bun:test";
import { canDeleteTask } from "@/services/task/task-permissions";

const base = { isTeamOwner: false };

describe("canDeleteTask", () => {
  test("team owner (by team.ownerId) may delete any task", () => {
    expect(canDeleteTask({ ...base, isTeamOwner: true, role: null })).toBe(
      true,
    );
  });

  test("owner and admin roles may delete any task", () => {
    expect(canDeleteTask({ ...base, role: "owner" })).toBe(true);
    expect(canDeleteTask({ ...base, role: "admin" })).toBe(true);
  });

  test("member may delete any task in the team", () => {
    expect(canDeleteTask({ ...base, role: "member" })).toBe(true);
  });

  test("viewer may not delete", () => {
    expect(canDeleteTask({ ...base, role: "viewer" })).toBe(false);
  });

  test("non-member and unknown roles may not delete", () => {
    expect(canDeleteTask({ ...base, role: null })).toBe(false);
    expect(canDeleteTask({ ...base, role: undefined })).toBe(false);
    expect(canDeleteTask({ ...base, role: "guest" })).toBe(false);
  });
});
