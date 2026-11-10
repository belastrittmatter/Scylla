import { describe, expect, test } from "bun:test";
import { moveTaskInList } from "../../src/components/tasks/task-move";
import { selectVisibleTasks } from "../../src/components/tasks/use-scoped-tasks";
import { INITIAL_TASK_FILTERS } from "../../src/components/tasks/task-types";
import type { TaskItem } from "../../src/components/tasks/task-types";

const mk = (id: string, status: string): TaskItem =>
  ({
    id,
    title: id,
    status,
    teamId: "t1",
    assigneeId: "u1",
    dueDate: null,
    priority: "low",
  }) as TaskItem;

const ids = (l: TaskItem[]) => l.map((t) => t.id);

describe("moveTaskInList", () => {
  // Global order interleaves columns, so a visible-column index is not a global index.
  const list = [
    mk("a", "todo"),
    mk("x", "done"),
    mk("b", "todo"),
    mk("c", "todo"),
  ];

  test("inserts before the reference task in the global list", () => {
    const next = moveTaskInList(list, "x", "todo", "c");
    expect(ids(next)).toEqual(["a", "b", "x", "c"]);
    expect(next.find((t) => t.id === "x")?.status).toBe("todo");
  });

  test("null reference appends to the end", () => {
    expect(ids(moveTaskInList(list, "a", "done", null))).toEqual([
      "x",
      "b",
      "c",
      "a",
    ]);
  });

  test("unknown task leaves the list untouched", () => {
    expect(moveTaskInList(list, "nope", "done", null)).toBe(list);
  });
});

describe("selectVisibleTasks", () => {
  const tasks = [
    mk("open", "todo"),
    mk("closed", "done"),
    mk("dropped", "cancelled"),
  ];
  const base = {
    tasks,
    scope: "me" as const,
    userId: "u1",
    teamId: "",
    projectId: "",
    filters: INITIAL_TASK_FILTERS,
  };

  test("list hides closed, timeline hides only cancelled, board shows all", () => {
    expect(ids(selectVisibleTasks({ ...base, viewMode: "list" }))).toEqual([
      "open",
    ]);
    expect(ids(selectVisibleTasks({ ...base, viewMode: "timeline" }))).toEqual([
      "open",
      "closed",
    ]);
    expect(ids(selectVisibleTasks({ ...base, viewMode: "board" }))).toEqual([
      "open",
      "closed",
      "dropped",
    ]);
  });
});
