import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { project, task, taskComment, user } from "@/db/schema";
import { createDraftTask } from "@/components/tasks/task-utils";
import { toTaskItem } from "@/components/mcp-ui/task-board-mapping";
import { TeamService } from "@/services/team/team-service";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";

describe("GitHub columns", () => {
  const expected: [string, string, string, string][] = [
    ["project", "githubRepo", "github_repo", "text"],
    ["task", "githubIssueNumber", "github_issue_number", "integer"],
    ["task", "githubIssueUrl", "github_issue_url", "text"],
    ["task", "githubBranch", "github_branch", "text"],
    ["task", "githubPrNumber", "github_pr_number", "integer"],
    ["task", "githubPrUrl", "github_pr_url", "text"],
    ["task", "githubPrStatus", "github_pr_status", "text"],
    ["taskComment", "githubCommentId", "github_comment_id", "text"],
  ];
  const tables = { project, task, taskComment };

  it.each(expected)("%s.%s is a nullable %s column", (t, prop, sql) => {
    const cols = getTableColumns(tables[t as keyof typeof tables]) as Record<
      string,
      { name: string; notNull: boolean }
    >;
    expect(cols[prop]?.name).toBe(sql);
    expect(cols[prop]?.notNull).toBe(false);
  });

  it("round-trips the values and keeps relations", async () => {
    const [u] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "N",
        email: `n-${crypto.randomUUID()}@example.com`,
      })
      .returning();
    try {
      const team = await TeamService.createTeam({
        name: `T ${Date.now()}`,
        ownerId: u.id,
      });
      const proj = await ProjectService.createProject({
        name: "P",
        teamId: team.id,
        githubRepo: "octo/repo",
      });
      const t = await TaskService.createTask({
        title: "t",
        teamId: team.id,
        projectId: proj.id,
        creatorId: u.id,
        status: "todo",
        priority: "medium",
      });
      expect(t.githubIssueNumber).toBeNull();
      expect(t.githubIssueUrl).toBeNull();
      expect(t.githubBranch).toBeNull();
      expect(t.githubPrNumber).toBeNull();
      expect(t.githubPrUrl).toBeNull();
      expect(t.githubPrStatus).toBeNull();

      await db
        .update(task)
        .set({
          githubIssueNumber: 42,
          githubIssueUrl: "https://github.com/octo/repo/issues/42",
          githubBranch: "feat/42-x",
          githubPrNumber: 7,
          githubPrUrl: "https://github.com/octo/repo/pull/7",
          githubPrStatus: "open",
        })
        .where(eq(task.id, t.id));
      const [row] = await db.select().from(task).where(eq(task.id, t.id));
      expect(row.githubIssueNumber).toBe(42);
      expect(row.githubIssueUrl).toBe("https://github.com/octo/repo/issues/42");
      expect(row.githubBranch).toBe("feat/42-x");
      expect(row.githubPrNumber).toBe(7);
      expect(row.githubPrUrl).toBe("https://github.com/octo/repo/pull/7");
      expect(row.githubPrStatus).toBe("open");

      const [c] = await db
        .insert(taskComment)
        .values({
          taskId: t.id,
          userId: u.id,
          content: "hi",
          githubCommentId: "991",
        })
        .returning();
      const [cRow] = await db
        .select()
        .from(taskComment)
        .where(eq(taskComment.id, c.id));
      expect(cRow.githubCommentId).toBe("991");

      const found = await db.query.task.findFirst({
        where: eq(task.id, t.id),
        with: { project: true, creator: true },
      });
      expect(found?.project?.githubRepo).toBe("octo/repo");
      expect(found?.creator?.id).toBe(u.id);
    } finally {
      await db.delete(user).where(eq(user.id, u.id));
    }
  });

  it("keeps the schema barrel exports", () => {
    for (const name of [
      "user",
      "oauthClient",
      "agent",
      "booking",
      "task",
      "taskRelations",
      "userRelations",
    ]) {
      expect(name in schema).toBe(true);
    }
  });

  it("keeps every file under src/db at 300 lines or fewer", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? walk(join(dir, e.name))
          : e.name.endsWith(".ts")
            ? [join(dir, e.name)]
            : [],
      );
    for (const file of walk(join(process.cwd(), "src/db"))) {
      const lines = readFileSync(file, "utf8").split("\n").length - 1;
      expect({ file, ok: lines <= 300 }).toEqual({ file, ok: true });
    }
  });
});

describe("GitHub task fields in client builders", () => {
  const keys = [
    "githubIssueNumber",
    "githubIssueUrl",
    "githubBranch",
    "githubPrNumber",
    "githubPrUrl",
    "githubPrStatus",
  ] as const;

  it("createDraftTask returns null for every github property", () => {
    const draft = createDraftTask("todo", "team-1", "user-1", null);
    for (const key of keys) expect(draft[key]).toBeNull();
  });

  it("toTaskItem returns null for every github property", () => {
    const item = toTaskItem({ id: "t1", title: "T", status: "todo" });
    for (const key of keys) expect(item[key]).toBeNull();
  });

  it("keeps every table and relation export of the old schema", () => {
    const names = [
      "user",
      "session",
      "account",
      "verification",
      "apikey",
      "jwks",
      "oauthClient",
      "oauthResource",
      "oauthClientResource",
      "oauthRefreshToken",
      "oauthAccessToken",
      "oauthConsent",
      "oauthClientAssertion",
      "agentHost",
      "agent",
      "agentCapabilityGrant",
      "approvalRequest",
      "meetingRoom",
      "eventType",
      "schedule",
      "scheduleRule",
      "booking",
      "bookingAttendee",
      "meetingInvite",
      "team",
      "teamMember",
      "project",
      "task",
      "taskComment",
      "taskTimeSession",
      "userRelations",
      "meetingInviteRelations",
      "oauthClientRelations",
      "oauthConsentRelations",
      "teamRelations",
      "taskTimeSessionRelations",
      "taskRelations",
    ];
    for (const name of names) expect(name in schema).toBe(true);
  });
});
