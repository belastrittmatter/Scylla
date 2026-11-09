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
import { GithubSyncService } from "../../src/services/github/github-sync-service";

describe("GithubSyncService & Issue Synchronization", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("syncs GitHub issues to project tasks", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "GitHub Sync User",
        email: `gh-sync-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "9999",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_sync_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `Sync Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: "GitHub Linked Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    // Mock GitHub issues API response
    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (
        urlStr.includes(
          "api.github.com/repos/octocat/Hello-World/collaborators",
        )
      ) {
        return new Response(
          JSON.stringify([
            {
              id: 9999,
              login: "octocat",
              avatar_url: "https://github.com/octocat.png",
              html_url: "https://github.com/octocat",
              permissions: { admin: true },
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      if (urlStr.includes("api.github.com/repos/octocat/Hello-World/issues")) {
        return new Response(
          JSON.stringify([
            {
              id: 101,
              number: 42,
              title: "Fix responsive calendar layout bug",
              body:
                "The layout breaks on mobile viewport < 375px\n\n" +
                "x".repeat(8000),
              state: "open",
              html_url: "https://github.com/octocat/Hello-World/issues/42",
              assignee: { login: "octocat", id: 9999 },
            },
            {
              id: 102,
              number: 43,
              title: "Add dark mode toggle to navigation",
              body: "Completed in latest release",
              state: "closed",
              html_url: "https://github.com/octocat/Hello-World/issues/43",
            },
            {
              // Pull Request (should be skipped)
              id: 103,
              number: 44,
              title: "PR: Bump dependencies",
              pull_request: {},
              state: "open",
              html_url: "https://github.com/octocat/Hello-World/pull/44",
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(url);
    }) as unknown as typeof fetch;

    const result = await GithubSyncService.syncProjectIssues(
      newProject.id,
      testOwner.id,
    );

    expect(result.createdCount).toBe(2);
    expect(result.totalIssues).toBe(2);
    expect(result.collaboratorsCount).toBe(1);
    expect(result.repository).toBe("octocat/Hello-World");

    // Verify tasks in database
    const tasks = await db
      .select()
      .from(task)
      .where(inArray(task.projectId, [newProject.id]));

    expect(tasks.length).toBe(2);

    const openTask = tasks.find((t) => t.githubIssueNumber === 42);
    expect(openTask).toBeDefined();
    expect(openTask?.title).toBe("Fix responsive calendar layout bug");
    expect(openTask?.status).toBe("todo");
    expect(openTask?.githubIssueUrl).toBe(
      "https://github.com/octocat/Hello-World/issues/42",
    );
    expect(openTask?.assigneeId).not.toBeNull();

    const closedTask = tasks.find((t) => t.githubIssueNumber === 43);
    expect(closedTask).toBeDefined();
    expect(closedTask?.status).toBe("done");

    // Verify collaborator was added to teamMember
    const members = await db
      .select()
      .from(teamMember)
      .where(eq(teamMember.teamId, newTeam.id));
    expect(members.length).toBeGreaterThanOrEqual(1);

    // Clean up
    await db.delete(task).where(inArray(task.projectId, [newProject.id]));
    await db.delete(project).where(inArray(project.id, [newProject.id]));
    await db.delete(teamMember).where(eq(teamMember.teamId, newTeam.id));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(account).where(inArray(account.userId, [testOwner.id]));
    await db.delete(user).where(inArray(user.id, [testOwner.id]));

    const [collabUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, "octocat@users.noreply.github.com"));
    if (collabUser) {
      await db.delete(account).where(eq(account.userId, collabUser.id));
      await db.delete(user).where(eq(user.id, collabUser.id));
    }
  });

  test("synchronizes branches and pull requests linked to issues during sync", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Branch & PR Sync User",
        email: `branch-sync-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "branch-pr-123",
      providerId: "github",
      userId: testOwner.id,
      accessToken: "gho_mock_branch_sync_token",
    });

    const newTeam = await TeamService.createTeam({
      name: `Branch PR Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const newProject = await ProjectService.createProject({
      name: "Branch PR Linked Project",
      teamId: newTeam.id,
      githubRepo: "octocat/Hello-World",
    });

    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (
        urlStr.includes(
          "api.github.com/repos/octocat/Hello-World/collaborators",
        )
      ) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("api.github.com/repos/octocat/Hello-World/issues")) {
        return new Response(
          JSON.stringify([
            {
              id: 991,
              number: 10,
              title: "Implement real-time sync with WebSockets",
              body: "Details of real-time sync",
              state: "open",
              html_url: "https://github.com/octocat/Hello-World/issues/10",
            },
            {
              id: 992,
              number: 11,
              title: "Standalone task without PR",
              body: "Has only a branch",
              state: "open",
              html_url: "https://github.com/octocat/Hello-World/issues/11",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (
        urlStr.includes("api.github.com/repos/octocat/Hello-World/branches")
      ) {
        return new Response(
          JSON.stringify([
            { name: "main" },
            { name: "feat/#10-real-time-sync" },
            { name: "feat/#11-standalone-branch" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("api.github.com/repos/octocat/Hello-World/pulls")) {
        return new Response(
          JSON.stringify([
            {
              number: 55,
              html_url: "https://github.com/octocat/Hello-World/pull/55",
              title: "feat: Add real-time sync (#10)",
              body: "Closes #10",
              state: "open",
              draft: false,
              head: { ref: "feat/#10-real-time-sync" },
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(url);
    }) as unknown as typeof fetch;

    const result = await GithubSyncService.syncProjectIssues(
      newProject.id,
      testOwner.id,
    );

    expect(result.createdCount).toBe(2);

    const tasks = await db
      .select()
      .from(task)
      .where(eq(task.projectId, newProject.id));

    // Task #10 has an open PR -> in_review with PR and branch details
    const task10 = tasks.find((t) => t.githubIssueNumber === 10);
    expect(task10).toBeDefined();
    expect(task10?.githubBranch).toBe("feat/#10-real-time-sync");
    expect(task10?.githubPrNumber).toBe(55);
    expect(task10?.githubPrUrl).toBe(
      "https://github.com/octocat/Hello-World/pull/55",
    );
    expect(task10?.githubPrStatus).toBe("open");
    expect(task10?.status).toBe("in_review");

    // Task #11 has a branch but no PR -> in_progress with branch details
    const task11 = tasks.find((t) => t.githubIssueNumber === 11);
    expect(task11).toBeDefined();
    expect(task11?.githubBranch).toBe("feat/#11-standalone-branch");
    expect(task11?.githubPrNumber).toBeNull();
    expect(task11?.status).toBe("in_progress");

    // Clean up
    await db.delete(task).where(eq(task.projectId, newProject.id));
    await db.delete(project).where(eq(project.id, newProject.id));
    await db.delete(teamMember).where(eq(teamMember.teamId, newTeam.id));
    await db.delete(team).where(eq(team.id, newTeam.id));
    await db.delete(account).where(eq(account.userId, testOwner.id));
    await db.delete(user).where(eq(user.id, testOwner.id));
  });

  test("ignores outside contributors who are not team members", async () => {
    const [teamOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Team Leader",
        email: `leader-${Date.now()}@example.com`,
      })
      .returning();

    const teamRecord = await TeamService.createTeam({
      name: `Security Team ${Date.now()}`,
      ownerId: teamOwner.id,
    });

    // Mock GitHub collaborators returning an outsider who does NOT belong to this team
    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("collaborators")) {
        return new Response(
          JSON.stringify([
            {
              id: 88888,
              login: "outside-stranger",
              avatar_url: "https://github.com/stranger.png",
              html_url: "https://github.com/outside-stranger",
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(url);
    }) as unknown as typeof fetch;

    const memberMap = await GithubSyncService.syncCollaborators(
      teamRecord.id,
      "owner",
      "repo",
      "mock_token",
      teamOwner.id,
    );

    // Outsider should not be mapped
    expect(memberMap.has("outside-stranger")).toBe(false);

    // Outsider should not have an account created in Scylla database
    const [strangerUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, "outside-stranger@users.noreply.github.com"));
    expect(strangerUser).toBeUndefined();

    // Clean up
    await db.delete(teamMember).where(eq(teamMember.teamId, teamRecord.id));
    await db.delete(team).where(inArray(team.id, [teamRecord.id]));
    await db.delete(user).where(inArray(user.id, [teamOwner.id]));
  });

  test("throws error when project has no linked GitHub repository", async () => {
    const [testOwner] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "No Repo User",
        email: `no-repo-${Date.now()}@example.com`,
      })
      .returning();

    const newTeam = await TeamService.createTeam({
      name: `No Repo Team ${Date.now()}`,
      ownerId: testOwner.id,
    });

    const unlinkedProject = await ProjectService.createProject({
      name: "Unlinked Project",
      teamId: newTeam.id,
    });

    await expect(
      GithubSyncService.syncProjectIssues(unlinkedProject.id),
    ).rejects.toThrow("Project is not linked to any GitHub repository");

    // Clean up
    await db.delete(project).where(inArray(project.id, [unlinkedProject.id]));
    await db.delete(team).where(inArray(team.id, [newTeam.id]));
    await db.delete(user).where(inArray(user.id, [testOwner.id]));
  });

  test("returns disconnected state when user has no linked GitHub account", async () => {
    const randomUserId = crypto.randomUUID();
    const result = await GithubSyncService.listUserRepositories(randomUserId);
    expect(result.connected).toBe(false);
    expect(result.repositories).toEqual([]);
  });

  test("queries and maps repository list when user has linked GitHub account", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Repo List User",
        email: `repo-list-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "gh-acc-12345",
      providerId: "github",
      userId: testUser.id,
      accessToken: "gho_mock_access_token_secret",
    });

    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("api.github.com/user/repos")) {
        return new Response(
          JSON.stringify([
            {
              id: 111,
              name: "awesome-web-app",
              full_name: "testuser/awesome-web-app",
              description: "A super awesome Next.js web application",
              private: false,
              html_url: "https://github.com/testuser/awesome-web-app",
              updated_at: "2026-11-05T00:00:00Z",
              default_branch: "main",
            },
            {
              id: 222,
              name: "secret-backend",
              full_name: "testuser/secret-backend",
              description: null,
              private: true,
              html_url: "https://github.com/testuser/secret-backend",
              updated_at: "2026-11-04T00:00:00Z",
              default_branch: "master",
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(url);
    }) as unknown as typeof fetch;

    const result = await GithubSyncService.listUserRepositories(testUser.id);

    expect(result.connected).toBe(true);
    expect(result.repositories.length).toBe(2);
    expect(result.repositories[0]?.fullName).toBe("testuser/awesome-web-app");
    expect(result.repositories[0]?.isPrivate).toBe(false);
    expect(result.repositories[1]?.fullName).toBe("testuser/secret-backend");
    expect(result.repositories[1]?.isPrivate).toBe(true);

    // Clean up
    await db.delete(account).where(inArray(account.userId, [testUser.id]));
    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });

  test("createAndSetupRepository creates repository and configures Scylla labels & template", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Repo Creator User",
        email: `repo-creator-${Date.now()}@example.com`,
      })
      .returning();

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "gh-creator-999",
      providerId: "github",
      userId: testUser.id,
      accessToken: "gho_mock_repo_create_token",
    });

    const labelsCreated: string[] = [];
    let templateCommitted = false;

    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const urlStr = url.toString();
      const method = init?.method?.toUpperCase() || "GET";

      if (urlStr.includes("api.github.com/user/repos") && method === "POST") {
        return new Response(
          JSON.stringify({
            id: 888,
            name: "scylla-mobile-redesign",
            full_name: "testuser/scylla-mobile-redesign",
            private: true,
            html_url: "https://github.com/testuser/scylla-mobile-redesign",
            default_branch: "main",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/labels") && method === "POST") {
        const body = JSON.parse(init?.body as string);
        labelsCreated.push(body.name);
        return new Response(JSON.stringify({ name: body.name }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (
        urlStr.includes("/contents/.github/ISSUE_TEMPLATE/scylla_task.yml") &&
        method === "PUT"
      ) {
        templateCommitted = true;
        return new Response(JSON.stringify({ content: {} }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      return originalFetch(url);
    }) as unknown as typeof fetch;

    const result = await GithubSyncService.createAndSetupRepository(
      {
        name: "Scylla Mobile Redesign",
        description: "Mobile app redesign project",
        isPrivate: true,
        projectName: "Scylla Mobile Redesign",
      },
      testUser.id,
    );

    expect(result).toBeDefined();
    expect(result.fullName).toBe("testuser/scylla-mobile-redesign");
    expect(result.isPrivate).toBe(true);
    expect(result.defaultBranch).toBe("main");
    expect(result.labelsCreated).toBeGreaterThanOrEqual(9);

    // Verify all Scylla status and priority labels were configured
    expect(labelsCreated).toContain("status:todo");
    expect(labelsCreated).toContain("status:in-progress");
    expect(labelsCreated).toContain("status:in-review");
    expect(labelsCreated).toContain("status:done");
    expect(labelsCreated).toContain("priority:low");
    expect(labelsCreated).toContain("priority:medium");
    expect(labelsCreated).toContain("priority:high");
    expect(labelsCreated).toContain("priority:urgent");

    expect(templateCommitted).toBe(true);

    // Clean up
    await db.delete(account).where(inArray(account.userId, [testUser.id]));
    await db.delete(user).where(inArray(user.id, [testUser.id]));
  });
});
