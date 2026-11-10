import { describe, expect, test } from "bun:test";
import { activeTasksTeam } from "@/components/layout/tasks-nav-item";

const q = (s: string) => new URLSearchParams(s);

describe("activeTasksTeam", () => {
  test("no scope or scope=me is My tasks", () => {
    expect(activeTasksTeam("/tasks", q(""))).toBeNull();
    expect(activeTasksTeam("/tasks", q("scope=me&team=x"))).toBeNull();
  });
  test("legacy query without scope falls back to team param or resolves teamId", () => {
    const teams = [{ id: "t-1", slug: "alpha" }];
    expect(activeTasksTeam("/tasks", q("team=alpha"), teams)).toBe("alpha");
    expect(activeTasksTeam("/tasks", q("teamId=t-1"), teams)).toBe("alpha");
  });
  test("scope=team&team=x and /tasks/x/... are team x", () => {
    expect(activeTasksTeam("/tasks", q("scope=team&team=X"))).toBe("x");
    expect(activeTasksTeam("/tasks/x/proj", q(""))).toBe("x");
  });
});
