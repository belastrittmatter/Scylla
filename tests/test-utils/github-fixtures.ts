import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, task, user } from "@/db/schema";
import type { Task } from "@/db/schema";
import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";

export interface GithubFixture {
  userId: string;
  teamId: string;
  projectId: string;
  repo: string | null;
  cleanup: () => Promise<void>;
}

export async function createGithubFixture(
  options: {
    repo?: string | null;
    githubAccount?: boolean;
    accessToken?: string;
  } = {},
): Promise<GithubFixture> {
  const repo = options.repo === undefined ? "acme/widgets" : options.repo;
  const userId = crypto.randomUUID();
  await db.insert(user).values({
    id: userId,
    name: "Github Fixture User",
    email: `gh-fixture-${userId}@example.com`,
  });
  const team = await TeamService.createTeam({
    name: `Github Team ${userId.slice(0, 8)}`,
    ownerId: userId,
  });
  const project = await ProjectService.createProject({
    name: "Github Project",
    teamId: team.id,
    githubRepo: repo,
  });
  if (options.githubAccount !== false) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "1001",
      providerId: "github",
      userId,
      accessToken: options.accessToken ?? "gho_test_token",
      updatedAt: new Date(),
    });
  }
  return {
    userId,
    teamId: team.id,
    projectId: project.id,
    repo,
    cleanup: async () => {
      await db.delete(user).where(eq(user.id, userId));
    },
  };
}

export async function insertTask(
  values: {
    teamId: string;
    projectId: string | null;
    creatorId: string;
  } & Partial<typeof task.$inferInsert>,
): Promise<Task> {
  const [row] = await db
    .insert(task)
    .values({
      title: "Fixture task",
      status: "todo",
      priority: "medium",
      ...values,
    })
    .returning();
  return row;
}
