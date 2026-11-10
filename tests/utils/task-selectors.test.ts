import { describe, expect, test } from "bun:test";
import {
  getDeadlineBucket,
  groupTasksForList,
  hideClosedTasks,
  makeCanDeleteTask,
  selectScopedTasks,
} from "../../src/components/tasks/task-selectors";
import type { TaskItem, Team } from "../../src/components/tasks/task-types";

const mk = (id: string, over: Partial<TaskItem> = {}): TaskItem =>
  ({
    id,
    title: id,
    teamId: "t1",
    projectId: "p1",
    assigneeId: "u1",
    dueDate: null,
    ...over,
  }) as TaskItem;

describe("selectScopedTasks", () => {
  const tasks = [
    mk("a"),
    mk("b", { assigneeId: "u2" }),
    mk("c", { projectId: "p2" }),
    mk("d", { teamId: "t2", assigneeId: "u1" }),
  ];
  const base = { tasks, userId: "u1", teamId: "t1", projectId: "p1" };
  const ids = (r: TaskItem[]) => r.map((t) => t.id);

  test("me returns tasks assigned to the user across teams", () => {
    expect(ids(selectScopedTasks({ ...base, scope: "me" }))).toEqual([
      "a",
      "c",
      "d",
    ]);
  });

  test("team returns tasks of the selected team and project", () => {
    expect(ids(selectScopedTasks({ ...base, scope: "team" }))).toEqual([
      "a",
      "b",
    ]);
  });

  test("team without a project returns all projects of the team", () => {
    expect(
      ids(selectScopedTasks({ ...base, scope: "team", projectId: null })),
    ).toEqual(["a", "b", "c"]);
  });

  test("team is empty without a team", () => {
    expect(selectScopedTasks({ ...base, scope: "team", teamId: null })).toEqual(
      [],
    );
  });

  test("me is empty without a user", () => {
    expect(selectScopedTasks({ ...base, scope: "me", userId: null })).toEqual(
      [],
    );
  });
});

describe("hideClosedTasks", () => {
  const tasks = [
    mk("open", { status: "todo" }),
    mk("done", { status: "done" }),
    mk("cancelled", { status: "cancelled" }),
  ];

  test("hides done and cancelled while status filter is 'all'", () => {
    expect(hideClosedTasks(tasks, "all").map((t) => t.id)).toEqual(["open"]);
  });

  test("keeps everything once the status filter changes", () => {
    expect(hideClosedTasks(tasks, "done")).toHaveLength(3);
  });
});

describe("getDeadlineBucket", () => {
  const now = new Date(2026, 5, 10, 15, 30); // local Jun 10 15:30
  const bucket = (d: Date) => getDeadlineBucket(d, now);

  test("buckets by local day boundaries", () => {
    expect(bucket(new Date(2026, 5, 9, 23, 59))).toBe("overdue");
    expect(bucket(new Date(2026, 5, 10, 0, 0))).toBe("today");
    expect(bucket(new Date(2026, 5, 10, 23, 59))).toBe("today");
    expect(bucket(new Date(2026, 5, 11, 12, 0))).toBe("upcoming7");
    expect(bucket(new Date(2026, 5, 17, 23, 59))).toBe("upcoming7");
    expect(bucket(new Date(2026, 5, 18, 0, 0))).toBe("later");
    expect(getDeadlineBucket(null, now)).toBe("no_date");
  });
});

describe("groupTasksForList", () => {
  const now = new Date(2026, 10, 10, 12);
  const day = (offset: number) => new Date(2026, 10, 10 + offset, 9);

  test("deadline groups keep order, drop empty groups, sort by due date", () => {
    const groups = groupTasksForList(
      [
        mk("late2", { dueDate: day(-1) }),
        mk("none"),
        mk("late1", { dueDate: day(-3) }),
      ],
      "deadline",
      now,
    );
    expect(groups.map((g) => [g.id, g.tasks.map((t) => t.id)])).toEqual([
      ["overdue", ["late1", "late2"]],
      ["no_date", ["none"]],
    ]);
    expect(groups[0].destructive).toBe(true);
    expect(groups[1].destructive).toBe(false);
  });

  test("status groups follow the workflow order", () => {
    const groups = groupTasksForList(
      [mk("d", { status: "done" }), mk("t", { status: "todo" })],
      "status",
      now,
    );
    expect(groups.map((g) => [g.label, g.tasks.length])).toEqual([
      ["To Do", 1],
      ["Done", 1],
    ]);
  });
});

describe("makeCanDeleteTask (client mirror of the server rule)", () => {
  const teams = [{ id: "t1", ownerId: "boss" }] as Team[];
  const members = [
    { id: "m1", teamId: "t1", userId: "ann", role: "member" },
    { id: "m2", teamId: "t1", userId: "vic", role: "viewer" },
    { id: "m3", teamId: "t1", userId: "ada", role: "admin" },
  ];
  const task = (creatorId: string) =>
    ({ id: "x", teamId: "t1", creatorId }) as TaskItem;

  test("applies owner/admin/member/viewer rules per task team", () => {
    const can = (userId?: string) => makeCanDeleteTask(teams, members, userId);
    expect(can("boss")(task("ann"))).toBe(true);
    expect(can("ada")(task("ann"))).toBe(true);
    expect(can("ann")(task("ann"))).toBe(true);
    expect(can("ann")(task("ada"))).toBe(true);
    expect(can("vic")(task("vic"))).toBe(false);
    expect(can(undefined)(task("ann"))).toBe(false);
    expect(can("ann")({ ...task("ann"), teamId: "other" })).toBe(false);
  });
});
