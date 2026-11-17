import { afterAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, project, task, user } from "@/db/schema";
import {
  TaskAssigneeGithubError,
  assigneeGithubRequiredMessage,
  isAssigneeAllowed,
} from "@/services/task/task-rules";
import {
  MIN_TASK_SESSION_DURATION_SECONDS,
  TaskAccessError,
  TaskDateRangeError,
  TaskService,
} from "@/services/task/task-service";
import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import { POST as createTaskHandler } from "@/app/api/tasks/route";
import { PATCH as updateTaskHandler } from "@/app/api/tasks/[id]/route";

const userIds: string[] = [];

async function makeUser(name: string, github: boolean) {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name,
      email: `n-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  if (github) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "12345",
      providerId: "github",
      userId: u.id,
      accessToken: "gho_test",
    });
  }
  return u;
}

async function setup() {
  const owner = await makeUser("Owner", true);
  const connected = await makeUser("Connie", true);
  const unconnected = await makeUser("Ada", false);
  const outsider = await makeUser("Outsider", false);
  const team = await TeamService.createTeam({
    name: `T ${crypto.randomUUID()}`,
    ownerId: owner.id,
  });
  for (const u of [connected, unconnected]) {
    await TeamService.addTeamMember({
      teamId: team.id,
      userId: u.id,
      role: "member",
    });
  }
  const linked = await ProjectService.createProject({
    name: "Linked",
    teamId: team.id,
    githubRepo: "octo/repo",
  });
  const unlinked = await ProjectService.createProject({
    name: "Unlinked",
    teamId: team.id,
  });
  const base = {
    teamId: team.id,
    creatorId: owner.id,
    status: "todo" as const,
    priority: "medium" as const,
  };
  return {
    owner,
    connected,
    unconnected,
    outsider,
    team,
    linked,
    unlinked,
    base,
  };
}

afterAll(async () => {
  for (const id of userIds) await db.delete(user).where(eq(user.id, id));
});

describe("pure rule", () => {
  test("isAssigneeAllowed", () => {
    expect(
      isAssigneeAllowed({
        projectGithubRepo: null,
        assigneeGithubConnected: false,
      }),
    ).toBe(true);
    expect(
      isAssigneeAllowed({
        projectGithubRepo: undefined,
        assigneeGithubConnected: false,
      }),
    ).toBe(true);
    expect(
      isAssigneeAllowed({
        projectGithubRepo: "  ",
        assigneeGithubConnected: false,
      }),
    ).toBe(true);
    expect(
      isAssigneeAllowed({
        projectGithubRepo: "octo/repo",
        assigneeGithubConnected: true,
      }),
    ).toBe(true);
    expect(
      isAssigneeAllowed({
        projectGithubRepo: "octo/repo",
        assigneeGithubConnected: false,
      }),
    ).toBe(false);
  });
  test("message and error", () => {
    expect(assigneeGithubRequiredMessage("Ada")).toContain(
      "Ada has not connected their GitHub account",
    );
    for (const n of [null, undefined, "  "]) {
      expect(assigneeGithubRequiredMessage(n)).toStartWith(
        "Cannot assign task: The selected member",
      );
    }
    const e = new TaskAssigneeGithubError("x");
    expect(e.name).toBe("TaskAssigneeGithubError");
    expect(e).toBeInstanceOf(Error);
  });
});

describe("createTask", () => {
  test("linked project", async () => {
    const s = await setup();
    const title = `rej-${crypto.randomUUID()}`;
    const err = await TaskService.createTask({
      ...s.base,
      title,
      projectId: s.linked.id,
      assigneeId: s.unconnected.id,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(TaskAssigneeGithubError);
    expect(err.message).toBe(assigneeGithubRequiredMessage("Ada"));
    expect(
      await db.select().from(task).where(eq(task.title, title)),
    ).toHaveLength(0);

    const ok = await TaskService.createTask({
      ...s.base,
      title: "ok",
      projectId: s.linked.id,
      assigneeId: s.connected.id,
    });
    expect(ok.assigneeId).toBe(s.connected.id);
    const none = await TaskService.createTask({
      ...s.base,
      title: "none",
      projectId: s.linked.id,
    });
    expect(none.assigneeId).toBeNull();
  });

  test("unlinked and no project allow unconnected", async () => {
    const s = await setup();
    const a = await TaskService.createTask({
      ...s.base,
      title: "a",
      projectId: s.unlinked.id,
      assigneeId: s.unconnected.id,
    });
    const b = await TaskService.createTask({
      ...s.base,
      title: "b",
      assigneeId: s.unconnected.id,
    });
    expect(a.assigneeId).toBe(s.unconnected.id);
    expect(b.assigneeId).toBe(s.unconnected.id);
  });

  test("membership error keeps precedence", async () => {
    const s = await setup();
    await expect(
      TaskService.createTask({
        ...s.base,
        title: "p",
        projectId: s.linked.id,
        assigneeId: s.outsider.id,
      }),
    ).rejects.toThrow("is not a member of team");
  });
});

describe("updateTask", () => {
  test("assignee changes on linked project", async () => {
    const s = await setup();
    const t = await TaskService.createTask({
      ...s.base,
      title: "t",
      projectId: s.linked.id,
    });
    await expect(
      TaskService.updateTask(
        t.id,
        { assigneeId: s.unconnected.id },
        s.owner.id,
      ),
    ).rejects.toBeInstanceOf(TaskAssigneeGithubError);
    const row = await db.query.task.findFirst({ where: eq(task.id, t.id) });
    expect(row?.assigneeId).toBeNull();
    const ok = await TaskService.updateTask(
      t.id,
      { assigneeId: s.connected.id },
      s.owner.id,
    );
    expect(ok.assigneeId).toBe(s.connected.id);
    const cleared = await TaskService.updateTask(
      t.id,
      { assigneeId: null },
      s.owner.id,
    );
    expect(cleared.assigneeId).toBeNull();
  });

  test("moving into a linked project rejects", async () => {
    const s = await setup();
    const t = await TaskService.createTask({
      ...s.base,
      title: "m",
      projectId: s.unlinked.id,
      assigneeId: s.unconnected.id,
    });
    await expect(
      TaskService.updateTask(t.id, { projectId: s.linked.id }, s.owner.id),
    ).rejects.toBeInstanceOf(TaskAssigneeGithubError);
    const row = await db.query.task.findFirst({ where: eq(task.id, t.id) });
    expect(row?.projectId).toBe(s.unlinked.id);
  });

  test("untouched assignee and project is not blocked", async () => {
    const s = await setup();
    const t = await TaskService.createTask({
      ...s.base,
      title: "u",
      projectId: s.unlinked.id,
      assigneeId: s.unconnected.id,
    });
    await db
      .update(project)
      .set({ githubRepo: "octo/repo" })
      .where(eq(project.id, s.unlinked.id));
    const a = await TaskService.updateTask(t.id, { title: "New" }, s.owner.id);
    expect(a.title).toBe("New");
    const b = await TaskService.updateTask(
      t.id,
      { assigneeId: s.unconnected.id, status: "in_progress" },
      s.owner.id,
    );
    expect(b.status).toBe("in_progress");
  });

  test("rejected update starts no time session", async () => {
    const s = await setup();
    const t = await TaskService.createTask({
      ...s.base,
      title: "s",
      projectId: s.linked.id,
    });
    await expect(
      TaskService.updateTask(
        t.id,
        { status: "in_progress", assigneeId: s.unconnected.id },
        s.owner.id,
      ),
    ).rejects.toBeInstanceOf(TaskAssigneeGithubError);
    expect(await TaskService.getTaskTimeSessions(t.id)).toHaveLength(0);
    const row = await db.query.task.findFirst({ where: eq(task.id, t.id) });
    expect(row?.status).toBe("todo");
  });
});

describe("updateTask placement edge cases (QA)", () => {
  test("moving into a linked project is allowed for a connected or absent assignee", async () => {
    const s = await setup();
    const a = await TaskService.createTask({
      ...s.base,
      title: "qa-a",
      projectId: s.unlinked.id,
      assigneeId: s.connected.id,
    });
    const movedA = await TaskService.updateTask(
      a.id,
      { projectId: s.linked.id },
      s.owner.id,
    );
    expect(movedA.projectId).toBe(s.linked.id);
    const b = await TaskService.createTask({
      ...s.base,
      title: "qa-b",
      projectId: s.unlinked.id,
    });
    const movedB = await TaskService.updateTask(
      b.id,
      { projectId: s.linked.id },
      s.owner.id,
    );
    expect(movedB.projectId).toBe(s.linked.id);
  });

  test("changing project and assignee together uses the new assignee", async () => {
    const s = await setup();
    const t = await TaskService.createTask({
      ...s.base,
      title: "qa-c",
      projectId: s.unlinked.id,
      assigneeId: s.unconnected.id,
    });
    const moved = await TaskService.updateTask(
      t.id,
      { projectId: s.linked.id, assigneeId: s.connected.id },
      s.owner.id,
    );
    expect(moved.projectId).toBe(s.linked.id);
    expect(moved.assigneeId).toBe(s.connected.id);
  });

  test("moving out of a linked project (projectId null) is not blocked", async () => {
    const s = await setup();
    const t = await TaskService.createTask({
      ...s.base,
      title: "qa-d",
      projectId: s.linked.id,
      assigneeId: s.connected.id,
    });
    await db
      .update(task)
      .set({ assigneeId: s.unconnected.id })
      .where(eq(task.id, t.id));
    const moved = await TaskService.updateTask(
      t.id,
      { projectId: null },
      s.owner.id,
    );
    expect(moved.projectId).toBeNull();
  });

  test("moving between linked projects rejects an unconnected stored assignee", async () => {
    const s = await setup();
    const other = await ProjectService.createProject({
      name: "Other linked",
      teamId: s.team.id,
      githubRepo: "octo/other",
    });
    const t = await TaskService.createTask({
      ...s.base,
      title: "qa-e",
      projectId: s.linked.id,
      assigneeId: s.connected.id,
    });
    await db
      .update(task)
      .set({ assigneeId: s.unconnected.id })
      .where(eq(task.id, t.id));
    await expect(
      TaskService.updateTask(t.id, { projectId: other.id }, s.owner.id),
    ).rejects.toBeInstanceOf(TaskAssigneeGithubError);
    const row = await db.query.task.findFirst({ where: eq(task.id, t.id) });
    expect(row?.projectId).toBe(s.linked.id);
  });

  test("non-member assignee keeps the membership error on update", async () => {
    const s = await setup();
    const t = await TaskService.createTask({
      ...s.base,
      title: "qa-f",
      projectId: s.linked.id,
    });
    await expect(
      TaskService.updateTask(t.id, { assigneeId: s.outsider.id }, s.owner.id),
    ).rejects.toThrow("is not a member of team");
  });

  test("a rejected move writes no field and starts no session", async () => {
    const s = await setup();
    const t = await TaskService.createTask({
      ...s.base,
      title: "qa-g",
      projectId: s.unlinked.id,
      assigneeId: s.unconnected.id,
    });
    await expect(
      TaskService.updateTask(
        t.id,
        { projectId: s.linked.id, title: "changed", status: "in_progress" },
        s.owner.id,
      ),
    ).rejects.toBeInstanceOf(TaskAssigneeGithubError);
    const row = await db.query.task.findFirst({ where: eq(task.id, t.id) });
    expect(row?.title).toBe("qa-g");
    expect(row?.status).toBe("todo");
    expect(await TaskService.getTaskTimeSessions(t.id)).toHaveLength(0);
  });

  test("a project with a blank githubRepo does not block creation", async () => {
    const s = await setup();
    await db
      .update(project)
      .set({ githubRepo: "   " })
      .where(eq(project.id, s.unlinked.id));
    const t = await TaskService.createTask({
      ...s.base,
      title: "qa-h",
      projectId: s.unlinked.id,
      assigneeId: s.unconnected.id,
    });
    expect(t.assigneeId).toBe(s.unconnected.id);
  });
});

describe("routes", () => {
  test("POST and PATCH answer 400", async () => {
    const s = await setup();
    const headers = {
      "x-user-id": s.owner.id,
      "Content-Type": "application/json",
    };
    const res = await createTaskHandler(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: "r",
          teamId: s.team.id,
          projectId: s.linked.id,
          assigneeId: s.unconnected.id,
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(assigneeGithubRequiredMessage("Ada"));

    const t = await TaskService.createTask({
      ...s.base,
      title: "r2",
      projectId: s.linked.id,
    });
    const res2 = await updateTaskHandler(
      new Request(`http://localhost/api/tasks/${t.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ assigneeId: s.unconnected.id }),
      }),
      { params: Promise.resolve({ id: t.id }) },
    );
    expect(res2.status).toBe(400);
    expect((await res2.json()).error).toBe(
      assigneeGithubRequiredMessage("Ada"),
    );
  });
});

test("exports remain", () => {
  expect(TaskAccessError).toBeDefined();
  expect(TaskDateRangeError).toBeDefined();
  expect(MIN_TASK_SESSION_DURATION_SECONDS).toBeGreaterThan(0);
});
