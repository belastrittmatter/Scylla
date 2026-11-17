import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { TaskService } from "@/services/task/task-service";
import { mockGithubApi } from "../test-utils/mock-github-api";
import {
  createGithubFixture,
  insertTask,
  type GithubFixture,
} from "../test-utils/github-fixtures";

const ISSUES = "/repos/acme/widgets/issues";
const issueCreated = {
  method: "POST",
  path: ISSUES,
  status: 201,
  body: { number: 7, html_url: "https://github.com/acme/widgets/issues/7" },
};

describe("TaskService push sync to GitHub", () => {
  let linked: GithubFixture;
  let unlinked: GithubFixture;
  let restore: (() => void) | undefined;

  beforeAll(async () => {
    delete process.env.GITHUB_TOKEN;
    linked = await createGithubFixture();
    unlinked = await createGithubFixture({ repo: null });
  });
  afterEach(() => restore?.());
  afterAll(async () => {
    await linked.cleanup();
    await unlinked.cleanup();
  });

  it("creates an issue when a task is created in a linked project", async () => {
    const mock = mockGithubApi([issueCreated]);
    restore = mock.restore;
    const created = await TaskService.createTask({
      title: "Ship it",
      status: "todo",
      priority: "medium",
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
    });
    expect(
      mock.calls.some((c) => c.method === "POST" && c.path === ISSUES),
    ).toBe(true);
    expect(created.githubIssueNumber).toBe(7);
    expect(created.githubIssueUrl).toBe(
      "https://github.com/acme/widgets/issues/7",
    );
  });

  it("still creates the task when GitHub answers 500", async () => {
    const mock = mockGithubApi([{ ...issueCreated, status: 500, body: {} }]);
    restore = mock.restore;
    const created = await TaskService.createTask({
      title: "Ship it",
      status: "todo",
      priority: "medium",
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
    });
    expect(created.id).toBeTruthy();
    expect(created.githubIssueNumber).toBeNull();
  });

  it("makes no GitHub call for an unlinked project", async () => {
    const mock = mockGithubApi([issueCreated]);
    restore = mock.restore;
    await TaskService.createTask({
      title: "Local",
      status: "todo",
      priority: "medium",
      teamId: unlinked.teamId,
      projectId: unlinked.projectId,
      creatorId: unlinked.userId,
    });
    expect(mock.calls).toHaveLength(0);
  });

  async function linkedTask() {
    return insertTask({
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
      title: "Old title",
      githubRepo: "acme/widgets",
      githubIssueNumber: 5,
      githubIssueUrl: "https://github.com/acme/widgets/issues/5",
    });
  }

  it("pushes title and status changes to the linked issue", async () => {
    const mock = mockGithubApi([
      { method: "PATCH", path: `${ISSUES}/5`, body: { number: 5 } },
      { method: "GET", path: `${ISSUES}/5`, body: { number: 5, labels: [] } },
    ]);
    restore = mock.restore;
    const row = await linkedTask();
    const updated = await TaskService.updateTask(
      row.id,
      { title: "New title", status: "done" },
      linked.userId,
    );
    expect(updated.title).toBe("New title");
    const patch = mock.calls.find(
      (c) => c.method === "PATCH" && c.path === `${ISSUES}/5`,
    );
    expect(patch).toBeDefined();
    const body = patch!.body as { title?: string; state?: string };
    expect(body.title).toBe("New title");
    expect(body.state).toBe("closed");
  });

  it("makes no GitHub call when only dueDate changes", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const row = await linkedTask();
    await TaskService.updateTask(
      row.id,
      { dueDate: new Date("2030-01-01T00:00:00Z") },
      linked.userId,
    );
    expect(mock.calls).toHaveLength(0);
  });

  it("returns the updated task when GitHub answers 500", async () => {
    const mock = mockGithubApi([
      { method: "PATCH", path: `${ISSUES}/5`, status: 500, body: {} },
      { method: "GET", path: `${ISSUES}/5`, status: 500, body: {} },
    ]);
    restore = mock.restore;
    const row = await linkedTask();
    const updated = await TaskService.updateTask(
      row.id,
      { title: "Survives" },
      linked.userId,
    );
    expect(updated.title).toBe("Survives");
  });

  it("pushes description and priority changes", async () => {
    const mock = mockGithubApi([
      { method: "PATCH", path: `${ISSUES}/5`, body: { number: 5 } },
      { method: "GET", path: `${ISSUES}/5`, body: { number: 5, labels: [] } },
    ]);
    restore = mock.restore;
    const row = await linkedTask();
    await TaskService.updateTask(
      row.id,
      { description: "Brand new text", priority: "high" },
      linked.userId,
    );
    const sent = mock.calls.filter((c) => c.path === `${ISSUES}/5`);
    expect(sent.length).toBeGreaterThan(0);
    expect(JSON.stringify(sent.map((c) => c.body))).toContain("Brand new text");
  });

  it("makes no GitHub call when the title is re-sent unchanged", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const row = await linkedTask();
    await TaskService.updateTask(
      row.id,
      { title: "Old title", status: "todo", priority: "medium" },
      linked.userId,
    );
    expect(mock.calls).toHaveLength(0);
  });

  it("makes no GitHub call when a task without an issue changes title", async () => {
    const mock = mockGithubApi([]);
    restore = mock.restore;
    const row = await insertTask({
      teamId: linked.teamId,
      projectId: linked.projectId,
      creatorId: linked.userId,
    });
    const updated = await TaskService.updateTask(
      row.id,
      { title: "Changed" },
      linked.userId,
    );
    expect(updated.title).toBe("Changed");
    expect(mock.calls).toHaveLength(0);
  });
});
