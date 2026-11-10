import { describe, expect, test } from "bun:test";
import { toTaskItem } from "../../src/components/mcp-ui/task-board-mapping";

describe("toTaskItem", () => {
  test("maps a full payload task", () => {
    const t = toTaskItem({
      id: "t1",
      title: "Ship",
      description: "d",
      status: "in_progress",
      priority: "high",
      assigneeName: "Ada Lovelace",
      dueDate: "2026-01-02T00:00:00.000Z",
      estimatedMinutes: 30,
      totalSpentSeconds: 90,
      activeSessionStartedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(t.id).toBe("t1");
    expect(t.status).toBe("in_progress");
    expect(t.priority).toBe("high");
    expect(t.dueDate).toEqual(new Date("2026-01-02T00:00:00.000Z"));
    expect(t.estimatedMinutes).toBe(30);
    expect(t.totalSpentSeconds).toBe(90);
    expect(t.activeSessionStartedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(t.assignee?.name).toBe("Ada Lovelace");
    expect(t.assignee?.initials).toBe("AL");
  });

  test("applies defaults for sparse payloads", () => {
    const t = toTaskItem({ id: "t2", title: "Min", status: "todo" });
    expect(t.priority).toBe("medium");
    expect(t.dueDate).toBeNull();
    expect(t.assignee).toBeNull();
    expect(t.description).toBeNull();
    expect(t.estimatedMinutes).toBeNull();
  });

  test("lowercases priority and ignores invalid due dates", () => {
    const t = toTaskItem({
      id: "t3",
      title: "x",
      status: "todo",
      priority: "URGENT",
      dueDate: "nope",
    });
    expect(t.priority).toBe("urgent");
    expect(t.dueDate).toBeNull();
  });
});
