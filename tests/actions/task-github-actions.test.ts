import {
  describe,
  test,
  expect,
  spyOn,
  beforeAll,
  afterAll,
  afterEach,
} from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { user, task, account } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import { TaskService } from "../../src/services/task/task-service";
import { TaskWorkspaceService } from "../../src/services/task/task-workspace-service";
import { GithubIntegrationService } from "../../src/services/github/github-integration-service";
import { mockSessionUser } from "../test-utils/mock-session";
import * as authHelper from "../../src/actions/auth-helper";
import {
  createTaskAction,
  updateTaskAction,
  updateTaskStatusAction,
  getTaskCommentsAction,
  createTaskCommentAction,
} from "../../src/actions";

async function mkUser(label: string) {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: label,
      email: `${label}-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  return u;
}

describe("task actions push to GitHub", () => {
  let owner: { id: string };
  let viewer: { id: string };
  let outsider: { id: string };
  let teamId: string;
  let projectId: string;
  let session: ReturnType<typeof mockSessionUser>;
  let createSpy: ReturnType<typeof spyOn>;
  let syncSpy: ReturnType<typeof spyOn>;

  async function newTask(overrides: { projectId?: string | null } = {}) {
    return TaskService.createTask({
      title: "Orig",
      description: "desc",
      teamId,
      projectId: overrides.projectId === null ? undefined : projectId,
      creatorId: owner.id,
      status: "todo",
      priority: "medium",
    });
  }

  beforeAll(async () => {
    owner = await mkUser("owner");
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "12345",
      providerId: "github",
      userId: owner.id,
      accessToken: "gho_test",
    });
    viewer = await mkUser("viewer");
    outsider = await mkUser("outsider");
    const team = await TeamService.createTeam({
      name: `T ${Date.now()}`,
      ownerId: owner.id,
    });
    teamId = team.id;
    await TeamService.addTeamMember({
      teamId,
      userId: viewer.id,
      role: "viewer",
    });
    const p = await ProjectService.createProject({
      name: "P",
      teamId,
      githubRepo: "octo/repo",
    });
    projectId = p.id;
  });

  afterAll(async () => {
    for (const u of [owner, viewer, outsider])
      await db.delete(user).where(eq(user.id, u.id));
  });

  const setup = (as: string) => {
    session = mockSessionUser(as);
    createSpy = spyOn(
      GithubIntegrationService,
      "createIssueForTask",
    ).mockResolvedValue(null);
    syncSpy = spyOn(
      GithubIntegrationService,
      "syncTaskToGitHub",
    ).mockResolvedValue(true);
  };
  afterEach(() => {
    session?.mockRestore();
    createSpy?.mockRestore();
    syncSpy?.mockRestore();
  });

  test("createTaskAction returns issue number and url", async () => {
    setup(owner.id);
    createSpy.mockResolvedValue({ number: 42, url: "u" });
    const res = await createTaskAction({ title: "New", teamId, projectId });
    expect(res.success).toBe(true);
    expect(res.data?.githubIssueNumber).toBe(42);
    expect(res.data?.githubIssueUrl).toBe("u");
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(res.data?.id, owner.id);
  });

  test("createTaskAction succeeds when issue creation returns null or rejects", async () => {
    setup(owner.id);
    const a = await createTaskAction({ title: "N1", teamId, projectId });
    expect(a.success).toBe(true);
    createSpy.mockRejectedValue(new Error("boom"));
    const b = await createTaskAction({ title: "N2", teamId, projectId });
    expect(b.success).toBe(true);
    const [row] = await db.select().from(task).where(eq(task.id, b.data!.id));
    expect(row.title).toBe("N2");
  });

  test("createTaskAction without a project does not call GitHub", async () => {
    setup(owner.id);
    const res = await createTaskAction({ title: "NoProj", teamId });
    expect(res.success).toBe(true);
    expect(createSpy).not.toHaveBeenCalled();
  });

  test("updateTaskAction pushes only changed fields", async () => {
    setup(owner.id);
    const t = await newTask();
    const res = await updateTaskAction(t.id, {
      title: "New",
      priority: "medium",
      description: "desc",
    });
    expect(res.success).toBe(true);
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalledWith(t.id, { title: "New" }, owner.id);
  });

  test("updateTaskAction with only dueDate does not push", async () => {
    setup(owner.id);
    const t = await newTask();
    const res = await updateTaskAction(t.id, { dueDate: "2030-01-01" });
    expect(res.success).toBe(true);
    expect(syncSpy).not.toHaveBeenCalled();
  });

  test("updateTaskAction pushes status and assignee together", async () => {
    setup(owner.id);
    const t = await newTask();
    const res = await updateTaskAction(t.id, {
      status: "in_progress",
      assigneeId: owner.id,
    });
    expect(res.success).toBe(true);
    expect(syncSpy).toHaveBeenCalledWith(
      t.id,
      { status: "in_progress", assigneeId: owner.id },
      owner.id,
    );
  });

  test("a rejecting or false sync leaves success true", async () => {
    setup(owner.id);
    const t = await newTask();
    syncSpy.mockRejectedValue(new Error("boom"));
    expect((await updateTaskAction(t.id, { title: "A" })).success).toBe(true);
    syncSpy.mockResolvedValue(false);
    expect((await updateTaskAction(t.id, { title: "B" })).success).toBe(true);
  });

  test("updateTaskStatusAction pushes only when status changes", async () => {
    setup(owner.id);
    const t = await newTask();
    expect((await updateTaskStatusAction(t.id, "in_progress")).success).toBe(
      true,
    );
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalledWith(
      t.id,
      { status: "in_progress" },
      owner.id,
    );
    await updateTaskStatusAction(t.id, "in_progress");
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  test("failed updates do not push", async () => {
    setup(viewer.id);
    const t = await newTask();
    const v = await updateTaskAction(t.id, { title: "X" });
    const vs = await updateTaskStatusAction(t.id, "done");
    const unknown = await updateTaskAction("nope", { title: "X" });
    expect(v.success).toBe(false);
    expect(vs.success).toBe(false);
    expect(unknown.success).toBe(false);
    expect(syncSpy).not.toHaveBeenCalled();
  });

  test("unknown task does not push", async () => {
    setup(owner.id);
    expect((await updateTaskStatusAction("missing", "done")).success).toBe(
      false,
    );
    expect(syncSpy).not.toHaveBeenCalled();
  });

  test("comments: local source, viewer and non-member errors", async () => {
    setup(owner.id);
    const t = await newTask();
    const created = await createTaskCommentAction({
      taskId: t.id,
      content: "hi",
    });
    expect(created.success).toBe(true);
    expect(created.data?.source).toBe("local");
    const list = await getTaskCommentsAction(t.id);
    expect(list.success).toBe(true);
    expect(list.data?.length).toBeGreaterThan(0);
    expect(
      list.data?.every((c) => c.source === "local" || c.source === "github"),
    ).toBe(true);
    session.mockRestore();

    session = mockSessionUser(viewer.id);
    const v = await createTaskCommentAction({ taskId: t.id, content: "hi" });
    expect(v.error).toBe("Permission denied: viewers cannot comment on tasks");
    session.mockRestore();

    session = mockSessionUser(outsider.id);
    const o = await createTaskCommentAction({ taskId: t.id, content: "hi" });
    expect(o.error).toBe("Access denied");
  });

  test("unassigning pushes assigneeId null", async () => {
    setup(owner.id);
    const t = await TaskService.createTask({
      title: "Assigned",
      teamId,
      projectId,
      creatorId: owner.id,
      assigneeId: owner.id,
      status: "todo",
      priority: "medium",
    });
    const res = await updateTaskAction(t.id, { assigneeId: null });
    expect(res.success).toBe(true);
    expect(syncSpy).toHaveBeenCalledWith(t.id, { assigneeId: null }, owner.id);
  });

  test("a non-member update is denied and does not push", async () => {
    setup(outsider.id);
    const t = await newTask();
    const a = await updateTaskAction(t.id, { title: "Hack" });
    const b = await updateTaskStatusAction(t.id, "done");
    expect(a).toEqual({ success: false, error: "Access denied" });
    expect(b).toEqual({ success: false, error: "Access denied" });
    expect(syncSpy).not.toHaveBeenCalled();
    const c = await getTaskCommentsAction(t.id);
    expect(c).toEqual({ success: false, error: "Access denied" });
  });

  test("comment actions go through the workspace service with the acting user", async () => {
    setup(owner.id);
    const t = await newTask();
    const list = spyOn(
      TaskWorkspaceService,
      "getTaskComments",
    ).mockResolvedValue([]);
    const create = spyOn(TaskWorkspaceService, "createTaskComment");
    try {
      const r = await getTaskCommentsAction(t.id);
      expect(r).toEqual({ success: true, data: [] });
      expect(list).toHaveBeenCalledWith(t.id, owner.id);
      const c = await createTaskCommentAction({ taskId: t.id, content: "yo" });
      expect(c.success).toBe(true);
      expect(create).toHaveBeenCalledWith({
        taskId: t.id,
        userId: owner.id,
        content: "yo",
      });
    } finally {
      list.mockRestore();
      create.mockRestore();
    }
  });

  test("without a session nothing is called", async () => {
    createSpy = spyOn(
      GithubIntegrationService,
      "createIssueForTask",
    ).mockResolvedValue(null);
    syncSpy = spyOn(
      GithubIntegrationService,
      "syncTaskToGitHub",
    ).mockResolvedValue(true);
    const err = "Unauthorized: Active user session required";
    // Ensure no mocked session; resolveActionUserId must reject.
    const none = spyOn(authHelper, "resolveActionUserId").mockRejectedValue(
      new Error(err),
    );
    try {
      const t = await newTask();
      expect(await createTaskAction({ title: "x", teamId, projectId })).toEqual(
        { success: false, error: err },
      );
      expect(await updateTaskAction(t.id, { title: "y" })).toEqual({
        success: false,
        error: err,
      });
      expect(await getTaskCommentsAction(t.id)).toEqual({
        success: false,
        error: err,
      });
      expect(createSpy).not.toHaveBeenCalled();
      expect(syncSpy).not.toHaveBeenCalled();
    } finally {
      none.mockRestore();
    }
  });
});
