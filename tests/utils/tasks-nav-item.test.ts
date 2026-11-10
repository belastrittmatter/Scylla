import { describe, expect, test } from "bun:test";
import { activeTasksTeam } from "@/components/layout/tasks-nav-item";

const q = (s: string) => new URLSearchParams(s);

describe("activeTasksTeam", () => {
  test("no scope or scope=me is My tasks", () => {
    expect(activeTasksTeam("/tasks", q(""))).toBeNull();
    expect(activeTasksTeam("/tasks", q("scope=me&team=x"))).toBeNull();
  });
  test("scope=team&team=x and /tasks/x/... are team x", () => {
    expect(activeTasksTeam("/tasks", q("scope=team&team=X"))).toBe("x");
    expect(activeTasksTeam("/tasks/x/proj", q(""))).toBe("x");
  });
});
