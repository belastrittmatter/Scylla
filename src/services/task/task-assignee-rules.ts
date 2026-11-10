import { db } from "@/db";
import { account, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Validates that an assignee has connected their GitHub account if the target project is linked to GitHub.
 */
export async function assertAssigneeGithubLinked(
  assigneeId: string,
  githubRepo?: string | null,
): Promise<void> {
  if (!githubRepo?.trim()) return;

  const [ghAcc] = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(eq(account.userId, assigneeId), eq(account.providerId, "github")),
    )
    .limit(1);

  if (!ghAcc) {
    const [assigneeUser] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, assigneeId))
      .limit(1);
    const name = assigneeUser?.name || "The selected member";
    throw new Error(
      `Cannot assign task: ${name} has not connected their GitHub account yet. Members must connect GitHub in Settings to be assigned to this project.`,
    );
  }
}
