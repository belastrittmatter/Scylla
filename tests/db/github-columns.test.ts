import { afterAll, describe, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "../../src/db";
import { project, task, taskComment, user } from "../../src/db/schema";
import { TeamService } from "../../src/services/team/team-service";

const userId = crypto.randomUUID();

afterAll(async () => {
  await db.delete(user).where(eq(user.id, userId));
});

describe("GitHub columns", () => {
  test("project, task and task_comment persist GitHub fields", async () => {
    await db.insert(user).values({
      id: userId,
      name: "Gh Columns",
      email: `gh-columns-${userId}@example.com`,
    });
    const team = await TeamService.createTeam({
      name: `Gh Team ${userId}`,
      ownerId: userId,
    });
    const [p] = await db
      .insert(project)
      .values({
        name: "P",
        slug: `p-${userId}`,
        teamId: team.id,
        githubRepo: "acme/widgets",
      })
      .returning();
    expect(p.githubRepo).toBe("acme/widgets");

    const [t] = await db
      .insert(task)
      .values({
        title: "T",
        teamId: team.id,
        projectId: p.id,
        creatorId: userId,
        githubRepo: "acme/widgets",
        githubIssueNumber: 7,
        githubIssueUrl: "https://github.com/acme/widgets/issues/7",
        githubBranch: "feat/7-x",
        githubPrNumber: 9,
        githubPrUrl: "https://github.com/acme/widgets/pull/9",
        githubPrStatus: "open",
      })
      .returning();
    const [read] = await db.select().from(task).where(eq(task.id, t.id));
    expect(read.githubRepo).toBe("acme/widgets");
    expect(read.githubIssueNumber).toBe(7);
    expect(read.githubIssueUrl).toBe(
      "https://github.com/acme/widgets/issues/7",
    );
    expect(read.githubBranch).toBe("feat/7-x");
    expect(read.githubPrNumber).toBe(9);
    expect(read.githubPrUrl).toBe("https://github.com/acme/widgets/pull/9");
    expect(read.githubPrStatus).toBe("open");

    const [bare] = await db
      .insert(task)
      .values({ title: "B", teamId: team.id, creatorId: userId })
      .returning();
    expect(bare.githubRepo).toBeNull();
    expect(bare.githubIssueNumber).toBeNull();
    expect(bare.githubIssueUrl).toBeNull();
    expect(bare.githubBranch).toBeNull();
    expect(bare.githubPrNumber).toBeNull();
    expect(bare.githubPrUrl).toBeNull();
    expect(bare.githubPrStatus).toBeNull();

    const [c] = await db
      .insert(taskComment)
      .values({
        taskId: t.id,
        userId,
        content: "hi",
        githubCommentId: "123",
      })
      .returning();
    expect(c.githubCommentId).toBe("123");
  });
});

describe("schema split", () => {
  const dir = join(import.meta.dir, "../../src/db");
  test("every schema module stays at 300 lines or fewer", () => {
    for (const f of readdirSync(dir).filter((n) => n.startsWith("schema"))) {
      const lines = readFileSync(join(dir, f), "utf8").split("\n").length;
      expect(lines).toBeLessThanOrEqual(301);
    }
  });

  test("barrel still exports tables, relations and types' tables", async () => {
    const schema = await import("../../src/db/schema");
    for (const name of [
      "user",
      "session",
      "account",
      "verification",
      "apikey",
      "jwks",
      "oauthClient",
      "oauthAccessToken",
      "agentHost",
      "agent",
      "approvalRequest",
      "meetingRoom",
      "booking",
      "meetingInvite",
      "team",
      "teamMember",
      "project",
      "task",
      "taskComment",
      "taskTimeSession",
    ]) {
      expect(name in schema).toBe(true);
    }
  });

  test("task_github_issue_idx exists on the database", async () => {
    const rows = await db.execute(
      sql`select indexdef from pg_indexes where indexname = 'task_github_issue_idx'`,
    );
    expect(rows.rows.length).toBe(1);
  });
});
