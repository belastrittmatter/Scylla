import { afterEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { project, user } from "../../src/db/schema";
import { getTaskGithubContext } from "../../src/services/github/github-task-context";
import { TaskService } from "../../src/services/task/task-service";
import { TeamService } from "../../src/services/team/team-service";

const userIds: string[] = [];

async function setup(githubRepo?: string, withProject = true) {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Ctx",
      email: `ctx-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  const team = await TeamService.createTeam({
    name: `T ${crypto.randomUUID()}`,
    ownerId: u.id,
  });
  // Inserted directly: other test files replace ProjectService with a mock.
  const [proj] = withProject
    ? await db
        .insert(project)
        .values({
          name: "P",
          slug: `p-${crypto.randomUUID()}`,
          teamId: team.id,
          githubRepo: githubRepo ?? null,
        })
        .returning()
    : [null];
  const task = await TaskService.createTask({
    title: "Task",
    teamId: team.id,
    projectId: proj?.id,
    creatorId: u.id,
    status: "todo",
    priority: "medium",
  });
  return { task, proj };
}

afterEach(async () => {
  for (const id of userIds.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
});

describe("getTaskGithubContext", () => {
  test("returns the parsed repository with task and project", async () => {
    const { task, proj } = await setup("octo/repo");
    const ctx = await getTaskGithubContext(task.id);
    expect(ctx?.owner).toBe("octo");
    expect(ctx?.repo).toBe("repo");
    expect(ctx?.fullName).toBe("octo/repo");
    expect(ctx?.task.id).toBe(task.id);
    expect(ctx?.project.id).toBe(proj!.id);
  });

  test("null for an unknown task", async () => {
    expect(await getTaskGithubContext(crypto.randomUUID())).toBeNull();
  });

  test("null for a task without a project", async () => {
    const { task } = await setup(undefined, false);
    expect(await getTaskGithubContext(task.id)).toBeNull();
  });

  test("null when the project has no repository", async () => {
    const { task } = await setup(undefined);
    expect(await getTaskGithubContext(task.id)).toBeNull();
  });
});
