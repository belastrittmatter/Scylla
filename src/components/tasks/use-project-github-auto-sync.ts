"use client";

import * as React from "react";
import { getWorkspaceDataAction } from "@/actions";
import type { Project, TaskItem } from "./task-types";

/** Project ids already synced during this page session (survives remounts). */
const syncedProjects = new Set<string>();

export function shouldAutoSyncProject(
  project: Pick<Project, "id" | "githubRepo"> | null | undefined,
  alreadySynced: ReadonlySet<string>,
): boolean {
  return Boolean(
    project && project.githubRepo?.trim() && !alreadySynced.has(project.id),
  );
}

/** Syncs a GitHub-linked project's issues once per page load, then refreshes tasks. */
export function useProjectGithubAutoSync({
  project,
  setTasks,
}: {
  project?: Project | null;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}): void {
  const projectId = project?.id;
  const githubRepo = project?.githubRepo;

  React.useEffect(() => {
    if (!shouldAutoSyncProject(project, syncedProjects)) return;
    if (!projectId) return;
    syncedProjects.add(projectId);
    let isMounted = true;

    async function run() {
      try {
        const res = await fetch(`/api/projects/${projectId}/github-sync`, {
          method: "POST",
        });
        if (!res.ok) return;
        const fresh = await getWorkspaceDataAction();
        if (isMounted && fresh.success && fresh.data?.tasks) {
          setTasks(fresh.data.tasks as TaskItem[]);
        }
      } catch (err) {
        console.warn("GitHub auto-sync failed:", err);
      }
    }
    void run();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on id and repo only
  }, [projectId, githubRepo, setTasks]);
}
