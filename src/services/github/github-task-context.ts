import { eq } from "drizzle-orm";
import { db } from "@/db";
import { project, task, type Project, type Task } from "@/db/schema";
import { parseGithubRepo } from "@/lib/github-validation";

export interface TaskGithubContext {
  task: Task;
  project: Project;
  owner: string;
  repo: string;
  fullName: string;
}

/** Loads a task with its project and the project's parsed GitHub repository. */
export async function getTaskGithubContext(
  taskId: string,
): Promise<TaskGithubContext | null> {
  const [foundTask] = await db
    .select()
    .from(task)
    .where(eq(task.id, taskId))
    .limit(1);
  if (!foundTask?.projectId) return null;

  const [foundProject] = await db
    .select()
    .from(project)
    .where(eq(project.id, foundTask.projectId))
    .limit(1);
  if (!foundProject) return null;

  const parsed = parseGithubRepo(foundProject.githubRepo);
  if (!parsed) return null;

  return { task: foundTask, project: foundProject, ...parsed };
}
