import { describe, test, expect, spyOn, afterEach, beforeEach } from "bun:test";
import { db } from "../../src/db";
import { user, account } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import { TaskService } from "../../src/services/task/task-service";
import { GithubIntegrationService } from "../../src/services/github/github-integration-service";
import { GithubIssueService } from "../../src/services/github/github-issue-service";
import {
  GithubBranchService,
  GithubBranchError,
} from "../../src/services/github/github-branch-service";
import { GithubDevService } from "../../src/services/github/github-dev-service";
import { GithubUserResolver } from "../../src/services/github/github-user-resolver";

const spies: Array<{ mockRestore: () => void }> = [];
const track = <T extends { mockRestore: () => void }>(s: T): T => {
  spies.push(s);
  return s;
};
afterEach(() => {
  while (spies.length) spies.pop()?.mockRestore();
});

describe("GithubIntegrationService forwarding", () => {
  test("createIssueForTask", async () => {
    const s = track(
      spyOn(GithubIssueService, "createIssueForTask").mockResolvedValue({
        number: 1,
        url: "u",
      }),
    );
    expect(
      await GithubIntegrationService.createIssueForTask("t", "u1"),
    ).toEqual({ number: 1, url: "u" });
    expect(s).toHaveBeenCalledWith("t", "u1");
  });

  test("syncTaskToGitHub", async () => {
    const s = track(
      spyOn(GithubIssueService, "syncTaskToGitHub").mockResolvedValue(true),
    );
    expect(
      await GithubIntegrationService.syncTaskToGitHub(
        "t",
        { title: "x" },
        "u1",
      ),
    ).toBe(true);
    expect(s).toHaveBeenCalledWith("t", { title: "x" }, "u1");
  });

  test("getTaskDevelopmentInfo", async () => {
    const info = {
      repository: "a/b",
      issueNumber: 1,
      issueUrl: "u",
      branch: null,
      isBranchOnRemote: false,
      suggestedBranch: "feat/1-x",
      checkoutCommand: "c",
      pullRequest: null,
    };
    const s = track(
      spyOn(GithubDevService, "getTaskDevelopmentInfo").mockResolvedValue(info),
    );
    expect(
      await GithubIntegrationService.getTaskDevelopmentInfo("t", "u1"),
    ).toBe(info);
    expect(s).toHaveBeenCalledWith("t", "u1");
  });

  test("user resolver methods", async () => {
    const a = track(
      spyOn(GithubUserResolver, "resolveGitHubUsername").mockResolvedValue(
        "oc",
      ),
    );
    const b = track(
      spyOn(GithubUserResolver, "inviteCollaborator").mockResolvedValue(true),
    );
    const c = track(
      spyOn(GithubUserResolver, "inviteTeamCollaborators").mockResolvedValue({
        invited: ["x"],
        skipped: [],
      }),
    );
    expect(await GithubIntegrationService.resolveGitHubUsername("t", "a")).toBe(
      "oc",
    );
    expect(a).toHaveBeenCalledWith("t", "a");
    expect(
      await GithubIntegrationService.inviteCollaborator("o", "r", "n", "a"),
    ).toBe(true);
    expect(b).toHaveBeenCalledWith("o", "r", "n", "a");
    expect(
      await GithubIntegrationService.inviteTeamCollaborators("tm", "o/r", "i"),
    ).toEqual({ invited: ["x"], skipped: [] });
    expect(c).toHaveBeenCalledWith("tm", "o/r", "i");
  });
});

describe("GithubIntegrationService.createBranchForTask", () => {
  const result = {
    branchName: "feat/1-x",
    alreadyExisted: false,
    checkoutCommand: "c",
    issueNumber: 1,
  };

  test("creates the issue before the branch", async () => {
    const order: string[] = [];
    const i = track(
      spyOn(GithubIssueService, "createIssueForTask").mockImplementation(
        async () => {
          order.push("issue");
          return { number: 1, url: "u" };
        },
      ),
    );
    const b = track(
      spyOn(GithubBranchService, "createBranchForTask").mockImplementation(
        async () => {
          order.push("branch");
          return result;
        },
      ),
    );
    expect(
      await GithubIntegrationService.createBranchForTask("t", "fix/x", "u1"),
    ).toBe(result);
    expect(order).toEqual(["issue", "branch"]);
    expect(i).toHaveBeenCalledWith("t", "u1");
    expect(b).toHaveBeenCalledWith("t", "fix/x", "u1");
  });

  test("still creates the branch when issue creation returns null or rejects", async () => {
    const i = track(
      spyOn(GithubIssueService, "createIssueForTask").mockResolvedValue(null),
    );
    const b = track(
      spyOn(GithubBranchService, "createBranchForTask").mockResolvedValue(
        result,
      ),
    );
    await GithubIntegrationService.createBranchForTask("t", undefined, "u1");
    i.mockRejectedValue(new Error("boom"));
    expect(
      await GithubIntegrationService.createBranchForTask("t", undefined, "u1"),
    ).toBe(result);
    expect(b).toHaveBeenCalledTimes(2);
  });

  test("propagates GithubBranchError", async () => {
    track(
      spyOn(GithubIssueService, "createIssueForTask").mockResolvedValue(null),
    );
    track(
      spyOn(GithubBranchService, "createBranchForTask").mockRejectedValue(
        new GithubBranchError("not_linked", "nope"),
      ),
    );
    await expect(
      GithubIntegrationService.createBranchForTask("t", undefined, "u1"),
    ).rejects.toMatchObject({ code: "not_linked" });
  });
});

describe("end to end with mocked fetch", () => {
  const realFetch = globalThis.fetch;
  let calls: string[] = [];
  beforeEach(() => {
    calls = [];
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      calls.push(`${method} ${url}`);
      if (method === "POST" && /\/repos\/octo\/repo\/issues$/.test(url))
        return Response.json(
          { number: 42, html_url: "https://github.com/octo/repo/issues/42" },
          { status: 201 },
        );
      if (method === "POST" && /\/git\/refs$/.test(url))
        return Response.json({}, { status: 201 });
      if (method === "GET" && /\/git\/(ref|refs)\//.test(url))
        return Response.json({ object: { sha: "abc" } });
      if (method === "GET" && /\/repos\/octo\/repo$/.test(url))
        return Response.json({ default_branch: "main" });
      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("branch name carries the new issue number", async () => {
    const [u] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "N",
        email: `n-${crypto.randomUUID()}@example.com`,
      })
      .returning();
    try {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: "12345",
        providerId: "github",
        userId: u.id,
        accessToken: "gho_test",
      });
      const team = await TeamService.createTeam({
        name: `T ${Date.now()}`,
        ownerId: u.id,
      });
      const project = await ProjectService.createProject({
        name: "P",
        teamId: team.id,
        githubRepo: "octo/repo",
      });
      const t = await TaskService.createTask({
        title: "Add sync",
        teamId: team.id,
        projectId: project.id,
        creatorId: u.id,
        status: "todo",
        priority: "medium",
      });
      const res = await GithubIntegrationService.createBranchForTask(
        t.id,
        undefined,
        u.id,
      );
      expect(res.branchName).toBe("feat/42-add-sync");
      expect(res.issueNumber).toBe(42);
    } finally {
      await db
        .delete(user)
        .where((await import("drizzle-orm")).eq(user.id, u.id));
    }
  });
});
