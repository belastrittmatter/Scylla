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
import { GET as devGet } from "@/app/api/tasks/[id]/github-dev/route";
import { POST as branchPost } from "@/app/api/tasks/[id]/github-branch/route";
import { db, user } from "@/db";
import { TeamService } from "@/services/team/team-service";
import { TaskService } from "@/services/task/task-service";
import { GithubIntegrationService } from "@/services/github/github-integration-service";
import { GithubBranchError } from "@/services/github/github-branch-service";

const mk = async (n: string) =>
  (
    await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: n,
        email: `${n}-${crypto.randomUUID()}@example.com`,
      })
      .returning()
  )[0].id;

describe("task GitHub routes", () => {
  let owner: string, viewer: string, outsider: string, taskId: string;
  const spies: Array<{ mockRestore: () => void }> = [];

  beforeAll(async () => {
    owner = await mk("owner");
    viewer = await mk("viewer");
    outsider = await mk("outsider");
    const team = await TeamService.createTeam({
      name: `T ${Date.now()}`,
      ownerId: owner,
    });
    await TeamService.addTeamMember({
      teamId: team.id,
      userId: viewer,
      role: "viewer",
    });
    const t = await TaskService.createTask({
      title: "T",
      teamId: team.id,
      creatorId: owner,
      status: "todo",
      priority: "medium",
    });
    taskId = t.id;
  });
  afterAll(async () => {
    for (const id of [owner, viewer, outsider])
      await db.delete(user).where(eq(user.id, id));
  });
  afterEach(() => {
    while (spies.length) spies.pop()?.mockRestore();
  });

  const get = (id: string, uid?: string) =>
    devGet(
      new Request(`http://localhost/api/tasks/${id}/github-dev`, {
        headers: uid ? { "x-user-id": uid } : {},
      }),
      { params: Promise.resolve({ id }) },
    );
  const post = (id: string, uid?: string, body?: unknown) =>
    branchPost(
      new Request(`http://localhost/api/tasks/${id}/github-branch`, {
        method: "POST",
        headers: {
          ...(uid ? { "x-user-id": uid } : {}),
          "content-type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) },
    );

  const info = {
    repository: "a/b",
    issueNumber: 1,
    issueUrl: "u",
    branch: null,
    isBranchOnRemote: false,
    suggestedBranch: "feat/1-t",
    checkoutCommand: "c",
    pullRequest: null,
  };
  const branchResult = {
    branchName: "fix/x",
    alreadyExisted: false,
    checkoutCommand: "c",
    issueNumber: 1,
  };

  test("GET github-dev: 401, 404s, 200 (viewer may read)", async () => {
    const s = spyOn(
      GithubIntegrationService,
      "getTaskDevelopmentInfo",
    ).mockResolvedValue(info);
    spies.push(s);
    expect((await get(taskId)).status).toBe(401);
    const unknown = await get("missing", owner);
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({ error: "Task not found" });
    expect((await get(taskId, outsider)).status).toBe(404);
    expect(s).not.toHaveBeenCalled();
    const ok = await get(taskId, viewer);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual(info);
    expect(s).toHaveBeenCalledWith(taskId, viewer);
  });

  test("GET github-dev: 500 on unexpected error", async () => {
    spies.push(
      spyOn(
        GithubIntegrationService,
        "getTaskDevelopmentInfo",
      ).mockRejectedValue(new Error("boom")),
    );
    const res = await get(taskId, owner);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });

  test("POST github-branch: 401, 404s, 403", async () => {
    const s = spyOn(
      GithubIntegrationService,
      "createBranchForTask",
    ).mockResolvedValue(branchResult);
    spies.push(s);
    expect((await post(taskId)).status).toBe(401);
    expect((await post("missing", owner)).status).toBe(404);
    expect((await post(taskId, outsider)).status).toBe(404);
    const v = await post(taskId, viewer);
    expect(v.status).toBe(403);
    expect(await v.json()).toEqual({
      error: "Permission denied: viewers cannot create branches",
    });
    expect(s).not.toHaveBeenCalled();
  });

  test("POST github-branch: 200 with and without a body", async () => {
    const s = spyOn(
      GithubIntegrationService,
      "createBranchForTask",
    ).mockResolvedValue(branchResult);
    spies.push(s);
    const a = await post(taskId, owner, { branchName: "fix/x" });
    expect(a.status).toBe(200);
    expect(await a.json()).toEqual(branchResult);
    expect(s).toHaveBeenLastCalledWith(taskId, "fix/x", owner);
    await post(taskId, owner);
    expect(s).toHaveBeenLastCalledWith(taskId, undefined, owner);
  });

  test("POST github-branch: malformed or empty branchName means no custom name", async () => {
    const s = spyOn(
      GithubIntegrationService,
      "createBranchForTask",
    ).mockResolvedValue(branchResult);
    spies.push(s);
    await post(taskId, owner, { branchName: "" });
    expect(s).toHaveBeenLastCalledWith(taskId, undefined, owner);
    await post(taskId, owner, { branchName: 5 });
    expect(s).toHaveBeenLastCalledWith(taskId, undefined, owner);
    const bad = await branchPost(
      new Request(`http://localhost/api/tasks/${taskId}/github-branch`, {
        method: "POST",
        headers: { "x-user-id": owner },
        body: "{not json",
      }),
      { params: Promise.resolve({ id: taskId }) },
    );
    expect(bad.status).toBe(200);
    expect(s).toHaveBeenLastCalledWith(taskId, undefined, owner);
  });

  test("POST github-branch: GithubBranchError mapping", async () => {
    const s = spyOn(GithubIntegrationService, "createBranchForTask");
    spies.push(s);
    const cases = [
      ["task_not_found", 404],
      ["not_linked", 400],
      ["no_token", 400],
      ["invalid_branch_name", 400],
      ["github_error", 502],
    ] as const;
    for (const [code, status] of cases) {
      s.mockRejectedValue(new GithubBranchError(code, `msg ${code}`));
      const res = await post(taskId, owner);
      expect(res.status).toBe(status);
      expect(await res.json()).toEqual({ error: `msg ${code}` });
    }
    s.mockRejectedValue(new Error("other"));
    expect((await post(taskId, owner)).status).toBe(500);
  });
});
