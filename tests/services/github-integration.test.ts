import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { inArray, eq } from "drizzle-orm";
import { db } from "../../src/db";
import {
  user,
  project,
  team,
  task,
  account,
  teamMember,
} from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import { TaskService } from "../../src/services/task/task-service";
import {
  GithubIntegrationService,
  isPrLinkedToIssue,
} from "../../src/services/github/github-integration-service";

describe("GithubIntegrationService (Jira-grade Git Linking)", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("generateBranchName formats standard Git branch conventions", () => {
    const branch1 = GithubIntegrationService.generateBranchName(
      42,
      "Fix responsive calendar bug on mobile",
      "fix",
    );
    expect(branch1).toBe("fix/#42-fix-responsive-calendar-bug-on-mobi");

    const branch2 = GithubIntegrationService.generateBranchName(
      105,
      "Add Stripe checkout payment",
      "feat",
    );
    expect(branch2).toBe("feat/#105-add-stripe-checkout-payment");

    const branchWithoutIssue = GithubIntegrationService.generateBranchName(
      null,
      "Refactor auth logic",
      "chore",
    );
    expect(branchWithoutIssue).toBe("chore/refactor-auth-logic");
  });

  test("isPrLinkedToIssue strictly verifies genuine issue references and rejects random matches", () => {
    // 1. Same number rejection: PR #5 cannot link to Issue #5
    expect(isPrLinkedToIssue({ number: 5, title: "PR #5" }, 5)).toBe(false);

    // 2. Reject merge pull request commit messages
    expect(
      isPrLinkedToIssue(
        { number: 2, title: "Merge pull request #1 from some-branch" },
        1,
      ),
    ).toBe(false);

    // 3. Reject numbers without hash symbol
    expect(
      isPrLinkedToIssue(
        { number: 12, title: "Update 5 items in inventory database" },
        5,
      ),
    ).toBe(false);

    // 4. Reject branch names with suffix numbers (e.g. page-15 should not match 5)
    expect(
      isPrLinkedToIssue({ number: 12, head: { ref: "feat/page-15" } }, 5),
    ).toBe(false);

    // 5. Accept exact closing keywords
    expect(isPrLinkedToIssue({ number: 12, title: "Closes #5" }, 5)).toBe(true);

    expect(
      isPrLinkedToIssue({ number: 12, body: "This PR fixes #5 thoroughly" }, 5),
    ).toBe(true);

    // 6. Accept bracketed issues (#5)
    expect(
      isPrLinkedToIssue(
        { number: 12, title: "feat: research game engine (#5)" },
        5,
      ),
    ).toBe(true);

    // 7. Accept matching branch naming conventions
    expect(
      isPrLinkedToIssue(
        { number: 12, head: { ref: "feat/#5-research-game-engine" } },
        5,
      ),
    ).toBe(true);

    expect(
      isPrLinkedToIssue({ number: 12, head: { ref: "fix/5-bug" } }, 5),
    ).toBe(true);

    // 8. Accept task branch exact match
    expect(
      isPrLinkedToIssue(
        { number: 12, head: { ref: "custom-task-branch" } },
        99,
        "custom-task-branch",
      ),
    ).toBe(true);
  });

  test("createIssueForTask calls GitHub API and stores issue number and branch on task", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Jira User",
        email: `jira-user-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "jira-gh-123",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_jira_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `Jira Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: "Jira Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    const newTask = await TaskService.createTask({
      title: "Implement bi-directional Jira issue linking",
      description: "Allow creating issues on GitHub directly from Scylla",
      status: "todo",
      priority: "high",
      teamId: newTeam.id,
      projectId: newProject.id,
      creatorId: testOwner.id,
    });

    // Mock GitHub Issues creation API
    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.includes("api.github.com/repos/octocat/Hello-World/issues")) {
        return new Response(
          JSON.stringify({
            number: 99,
            html_url: "https://github.com/octocat/Hello-World/issues/99",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const result = await GithubIntegrationService.createIssueForTask(
      newTask.id,
      testOwner.id,
    );

    expect(result).not.toBeNull();
    expect(result?.number).toBe(99);
    expect(result?.url).toBe(
      "https://github.com/octocat/Hello-World/issues/99",
    );
    expect(result?.branchName).toContain("feat/#99-implement-bi-directional");

    // Verify database record updated
    const [refreshedTask] = await db
      .select()
      .from(task)
      .where(inArray(task.id, [newTask.id]));

    expect(refreshedTask.githubIssueNumber).toBe(99);
    expect(refreshedTask.githubIssueUrl).toBe(
      "https://github.com/octocat/Hello-World/issues/99",
    );
    // Issue creation generates suggested branchName but does not claim branch exists until createBranchForTask is called
    expect(refreshedTask.githubBranch).toBeNull();

    // Clean up
    await db.delete(task).where(inArray(task.id, [newTask.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(account).where(inArray(account.userId, [testOwner.id]));
    await db.delete(user).where(inArray(user.id, [testOwner.id]));
  });

  test("createBranchForTask creates git branch ref on GitHub and auto-transitions task to in_progress", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Branch User",
        email: `branch-user-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "branch-gh-456",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_branch_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `Branch Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: "Branch Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    const newTask = await TaskService.createTask({
      title: "Setup OAuth token flow",
      status: "todo",
      priority: "medium",
      teamId: newTeam.id,
      projectId: newProject.id,
      creatorId: testOwner.id,
      githubIssueNumber: 55,
    });

    // Mock GitHub APIs for branch creation
    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.endsWith("/repos/octocat/Hello-World")) {
        return new Response(JSON.stringify({ default_branch: "main" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/git/ref/heads/main")) {
        return new Response(
          JSON.stringify({ object: { sha: "abc1234567890def" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/git/refs") && init?.method === "POST") {
        return new Response(
          JSON.stringify({ ref: "refs/heads/feat/#55-setup" }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const result = await GithubIntegrationService.createBranchForTask(
      newTask.id,
      undefined,
      testOwner.id,
    );

    expect(result.branchName).toContain("feat/#55-setup-oauth-token-flow");
    expect(result.checkoutCommand).toBe(`git checkout -b ${result.branchName}`);
    expect(result.alreadyExisted).toBe(false);

    // Verify task status moved from 'todo' to 'in_progress'
    const [refreshedTask] = await db
      .select()
      .from(task)
      .where(inArray(task.id, [newTask.id]));

    expect(refreshedTask.status).toBe("in_progress");
    expect(refreshedTask.githubBranch).toBe(result.branchName);
    expect(result.linkedToIssue).toBe(true);
    expect(result.issueNumber).toBe(55);

    // Clean up
    await db.delete(task).where(inArray(task.id, [newTask.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(account).where(inArray(account.userId, [testOwner.id]));
    await db.delete(user).where(inArray(user.id, [testOwner.id]));
  });

  test("createBranchForTask links branch directly to GitHub issue using GraphQL createLinkedBranch mutation", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "GraphQL Branch User",
        email: `gql-branch-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "gql-gh-101",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_gql_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `GraphQL Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: "GraphQL Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    const newTask = await TaskService.createTask({
      title: "Add GraphQL linked branch support",
      status: "todo",
      priority: "high",
      teamId: newTeam.id,
      projectId: newProject.id,
      creatorId: testOwner.id,
      githubIssueNumber: 77,
    });

    let graphqlCalled = false;
    let commentCalled = false;

    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.endsWith("/repos/octocat/Hello-World")) {
        return new Response(
          JSON.stringify({
            default_branch: "main",
            node_id: "R_kgDOHelloWorld",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/git/ref/heads/main")) {
        return new Response(
          JSON.stringify({ object: { sha: "def4567890abcdef" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.endsWith("/issues/77")) {
        return new Response(
          JSON.stringify({ node_id: "I_kwDOHelloIssue77", number: 77 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (
        urlStr.includes("api.github.com/graphql") &&
        init?.method === "POST"
      ) {
        graphqlCalled = true;
        return new Response(
          JSON.stringify({
            data: {
              createLinkedBranch: {
                linkedBranch: {
                  id: "LB_kwDOHelloLB",
                  ref: { name: "feat/#77-add-graphql-linked-branch" },
                },
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/issues/77/comments") && init?.method === "POST") {
        commentCalled = true;
        return new Response(
          JSON.stringify({ id: 1001, body: "Linked branch comment" }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const result = await GithubIntegrationService.createBranchForTask(
      newTask.id,
      undefined,
      testOwner.id,
    );

    expect(graphqlCalled).toBe(true);
    expect(commentCalled).toBe(true);
    expect(result.linkedToIssue).toBe(true);
    expect(result.issueNumber).toBe(77);

    // Clean up
    await db.delete(task).where(inArray(task.id, [newTask.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(account).where(inArray(account.userId, [testOwner.id]));
    await db.delete(user).where(inArray(user.id, [testOwner.id]));
  });

  test("getTaskDevelopmentInfo returns PR info and auto-completes task if PR merged", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "DevInfo User",
        email: `devinfo-user-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "devinfo-gh-789",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_devinfo_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `DevInfo Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: "DevInfo Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    const newTask = await TaskService.createTask({
      title: "Add Stripe webhooks",
      status: "in_progress",
      priority: "medium",
      teamId: newTeam.id,
      projectId: newProject.id,
      creatorId: testOwner.id,
      githubIssueNumber: 77,
      githubBranch: "feat/#77-add-stripe-webhooks",
    });

    // Mock GitHub PR search and git ref API returning merged PR and active branch
    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("api.github.com/search/issues")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                number: 12,
                html_url: "https://github.com/octocat/Hello-World/pull/12",
                title: "feat: add stripe webhooks #77",
                state: "closed",
                pull_request: { merged_at: "2026-11-05T12:00:00Z" },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/branches/") || urlStr.includes("/git/ref/heads/")) {
        return new Response(
          JSON.stringify({ ref: "refs/heads/branch", name: "branch" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(url);
    }) as unknown as typeof fetch;

    const devInfo = await GithubIntegrationService.getTaskDevelopmentInfo(
      newTask.id,
      testOwner.id,
    );

    expect(devInfo.issueNumber).toBe(77);
    expect(devInfo.branch).toBe("feat/#77-add-stripe-webhooks");
    expect(devInfo.pullRequest?.number).toBe(12);
    expect(devInfo.pullRequest?.state).toBe("merged");

    // Task should be automatically completed because PR is merged
    const [refreshedTask] = await db
      .select()
      .from(task)
      .where(inArray(task.id, [newTask.id]));

    expect(refreshedTask.status).toBe("done");
    expect(refreshedTask.githubPrNumber).toBe(12);

    // Clean up
    await db.delete(task).where(inArray(task.id, [newTask.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(account).where(inArray(account.userId, [testOwner.id]));
    await db.delete(user).where(inArray(user.id, [testOwner.id]));
  });

  test("getTaskDevelopmentInfo rejects unrelated search results and clears stale PR", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "DevInfo Stale User",
        email: `stale-pr-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "stale-gh-789",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_stale_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `Stale PR Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: `Stale PR Project ${Date.now()}`,
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    // Task previously had stale/wrong PR #99 stored
    const newTask = await TaskService.createTask({
      projectId: newProject.id,
      teamId: newTeam.id,
      creatorId: testOwner.id,
      title: "Research caching layer",
      status: "todo",
      priority: "medium",
      githubIssueNumber: 88,
      githubIssueUrl: "https://github.com/octocat/Hello-World/issues/88",
      githubBranch: "feat/#88-research-caching",
      githubPrNumber: 99,
      githubPrUrl: "https://github.com/octocat/Hello-World/pull/99",
      githubPrStatus: "open",
    });

    // Mock GitHub search returning an unrelated PR (e.g. PR #99 that does NOT match issue 88)
    globalThis.fetch = ((url: string | URL | Request) => {
      const urlStr =
        typeof url === "string"
          ? url
          : url instanceof Request
            ? url.url
            : url.toString();
      if (urlStr.includes("/search/issues")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                number: 99,
                html_url: "https://github.com/octocat/Hello-World/pull/99",
                title: "Unrelated PR without any issue reference",
                body: "Just mentions 88 in a commit hash",
                state: "open",
                pull_request: {},
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/pulls") || urlStr.includes("/timeline")) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/branches/")) {
        return new Response(
          JSON.stringify({ name: "feat/#88-research-caching" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(url);
    }) as unknown as typeof fetch;

    const devInfo = await GithubIntegrationService.getTaskDevelopmentInfo(
      newTask.id,
      testOwner.id,
    );

    // Should NOT attach unrelated PR #99
    expect(devInfo.pullRequest).toBeNull();

    // Stale PR #99 in the database should have been cleared
    const [refreshedTask] = await db
      .select()
      .from(task)
      .where(inArray(task.id, [newTask.id]));

    expect(refreshedTask.githubPrNumber).toBeNull();
    expect(refreshedTask.githubPrUrl).toBeNull();

    // Clean up
    await db.delete(task).where(inArray(task.id, [newTask.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(account).where(inArray(account.userId, [testOwner.id]));
    await db.delete(user).where(inArray(user.id, [testOwner.id]));
  });

  test("updateIssueAssignee and updateIssueState sync assignee and issue status to GitHub", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Assignee Owner",
        email: `assignee-owner-${Date.now()}@example.com`,
      })
      .returning();

    await db
      .delete(user)
      .where(eq(user.email, "testdev@users.noreply.github.com"));

    const [testAssignee] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "testdev",
        email: "testdev@users.noreply.github.com",
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "assignee-gh-999",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_assignee_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `Assignee Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: "Assignee Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    const newTask = await TaskService.createTask({
      title: "Sync assignee test",
      status: "todo",
      priority: "medium",
      teamId: newTeam.id,
      projectId: newProject.id,
      creatorId: testOwner.id,
      githubIssueNumber: 88,
    });

    let assignedUsers: string[] = [];
    let patchedState = "";

    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.includes("/issues/88/assignees") && init?.method === "POST") {
        const body = JSON.parse(init.body as string);
        assignedUsers = body.assignees;
        return new Response(JSON.stringify({ ok: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/issues/88") && init?.method === "PATCH") {
        const body = JSON.parse(init.body as string);
        patchedState = body.state;
        return new Response(JSON.stringify({ state: patchedState }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    // Test assignee sync
    await GithubIntegrationService.updateIssueAssignee(
      newTask.id,
      testAssignee.id,
      testOwner.id,
    );
    expect(assignedUsers).toEqual(["testdev"]);

    // Test status sync (e.g. close issue)
    await GithubIntegrationService.updateIssueState(
      newTask.id,
      "closed",
      testOwner.id,
    );
    expect(patchedState).toBe("closed");

    // Clean up
    await db.delete(task).where(inArray(task.id, [newTask.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(account).where(inArray(account.userId, [testOwner.id]));
    await db
      .delete(user)
      .where(inArray(user.id, [testOwner.id, testAssignee.id]));
  });

  test("syncTaskToGitHub synchronizes title, description, priority, status and assignee", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Sync Tester",
        email: `synctest-${Date.now()}@example.com`,
      })
      .returning();

    await db
      .delete(user)
      .where(eq(user.email, "syncdev@users.noreply.github.com"));

    const [testAssignee] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Sync Assignee",
        email: "syncdev@users.noreply.github.com",
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "sync-gh-123",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_sync_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `Sync Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: "Sync Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    const newTask = await TaskService.createTask({
      title: "Initial Title",
      description: "Initial description",
      status: "todo",
      priority: "medium",
      teamId: newTeam.id,
      projectId: newProject.id,
      creatorId: testOwner.id,
      githubIssueNumber: 123,
    });

    let lastPatchBody: Record<string, unknown> = {};

    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.includes("/issues/123/assignees") && init?.method === "POST") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/issues/123") && init?.method === "PATCH") {
        lastPatchBody = JSON.parse(init.body as string);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const result = await GithubIntegrationService.syncTaskToGitHub(
      newTask.id,
      {
        title: "Updated Title on Scylla",
        description: "New updated markdown description",
        status: "done",
        priority: "urgent",
        assigneeId: testAssignee.id,
      },
      testOwner.id,
    );

    expect(result).toBe(true);
    expect(lastPatchBody.title).toBe("Updated Title on Scylla");
    expect(lastPatchBody.body).toContain("New updated markdown description");
    expect(lastPatchBody.state).toBe("closed");
    expect(lastPatchBody.state_reason).toBe("completed");
    expect(lastPatchBody.labels).toEqual(["priority:urgent"]);
    expect(lastPatchBody.assignees).toEqual(["syncdev"]);

    // Clean up
    await db.delete(task).where(inArray(task.id, [newTask.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(account).where(inArray(account.userId, [testOwner.id]));
    await db
      .delete(user)
      .where(inArray(user.id, [testOwner.id, testAssignee.id]));
  });

  test("createIssueForTask automatically invites and links assignees on creation", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Issue Owner",
        email: `issue-owner-${Date.now()}@example.com`,
      })
      .returning();

    const [testDev] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Issue Dev",
        email: `issue-dev-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "owner-gh-token",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_owner_token",
    });

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "dev-gh-login",
      providerId: "github",
      userId: testDev.id,
    });

    const newTeam = await TeamService.createTeam({
      name: `Issue Link Team ${Date.now()}`,
      ownerId: testOwner.id,
    });
    await TeamService.addTeamMember({
      teamId: newTeam.id,
      userId: testDev.id,
      role: "member",
    });

    const newProject = await ProjectService.createProject({
      name: "Issue Link Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    const newTask = await TaskService.createTask({
      title: "Task with Assignee on Creation",
      description: "Should link assignee to GitHub issue immediately",
      status: "todo",
      priority: "high",
      teamId: newTeam.id,
      projectId: newProject.id,
      creatorId: testOwner.id,
      assigneeId: testDev.id,
    });

    let collaboratorInvitedUser = "";
    let issueRequestBody: Record<string, unknown> = {};

    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.includes("/collaborators/") && init?.method === "PUT") {
        const parts = urlStr.split("/collaborators/");
        collaboratorInvitedUser = parts[1] || "";
        return new Response(JSON.stringify({ ok: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/issues") && init?.method === "POST") {
        issueRequestBody = JSON.parse(init.body as string);
        return new Response(
          JSON.stringify({
            number: 142,
            html_url: "https://github.com/octocat/Hello-World/issues/142",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const result = await GithubIntegrationService.createIssueForTask(
      newTask.id,
      testOwner.id,
    );

    expect(result).not.toBeNull();
    expect(result?.number).toBe(142);
    expect(collaboratorInvitedUser).toBe("dev-gh-login");
    expect(issueRequestBody.assignees).toEqual(["dev-gh-login"]);

    // Clean up
    await db.delete(task).where(inArray(task.id, [newTask.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db
      .delete(account)
      .where(inArray(account.userId, [testOwner.id, testDev.id]));
    await db.delete(user).where(inArray(user.id, [testOwner.id, testDev.id]));
  });

  test("inviteTeamCollaborators invites all team members to the GitHub repository", async () => {
    const [owner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Repo Owner",
        email: `repo-owner-${Date.now()}@example.com`,
      })
      .returning();

    const [member1] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Member One",
        email: `member1-${Date.now()}@example.com`,
      })
      .returning();

    const [member2] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Member Two",
        email: `member2-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "owner-login",
      providerId: "github",
      userId: owner.id,
      accessToken: "gho_mock_owner_token",
    });

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "gh-member-1",
      providerId: "github",
      userId: member1.id,
    });

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "gh-member-2",
      providerId: "github",
      userId: member2.id,
    });

    const newTeam = await TeamService.createTeam({
      name: `Collab Team ${Date.now()}`,
      ownerId: owner.id,
    });

    await db.insert(teamMember).values({
      teamId: newTeam.id,
      userId: member1.id,
      role: "member",
    });

    await db.insert(teamMember).values({
      teamId: newTeam.id,
      userId: member2.id,
      role: "member",
    });

    const invitedUsers: string[] = [];
    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      if (urlStr.includes("/collaborators/") && init?.method === "PUT") {
        const username = urlStr.split("/collaborators/")[1];
        invitedUsers.push(username);
        return new Response(JSON.stringify({ ok: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      return originalFetch(url, init);
    }) as unknown as typeof fetch;

    const res = await GithubIntegrationService.inviteTeamCollaborators(
      newTeam.id,
      "octocat/Hello-World",
      owner.id,
    );

    expect(res.invited).toContain("gh-member-1");
    expect(res.invited).toContain("gh-member-2");
    expect(invitedUsers).toContain("gh-member-1");
    expect(invitedUsers).toContain("gh-member-2");

    // Clean up
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db
      .delete(account)
      .where(inArray(account.userId, [owner.id, member1.id, member2.id]));
    await db
      .delete(user)
      .where(inArray(user.id, [owner.id, member1.id, member2.id]));
  });
});
