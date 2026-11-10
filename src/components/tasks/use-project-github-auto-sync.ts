"use client";

import * as React from "react";
import { getWorkspaceDataAction } from "@/actions";
import type { Project, TaskItem } from "./task-types";

interface UseProjectGithubAutoSyncArgs {
  project?: Project | null;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}

/**
 * Automatically synchronizes GitHub issues for a project linked to a GitHub repo
 * when the user enters or views the project. Includes in-memory deduplication
 * so repeated navigations don't flood the GitHub API.
 */
const syncedProjects = new Set<string>();

export function useProjectGithubAutoSync({
  project,
  setTasks,
}: UseProjectGithubAutoSyncArgs) {
  const projectId = project?.id;
  const githubRepo = project?.githubRepo?.trim();

  React.useEffect(() => {
    if (!projectId || !githubRepo) return;

    // Only auto-sync once per project session to remain calm and responsive
    if (syncedProjects.has(projectId)) return;
    syncedProjects.add(projectId);

    let isMounted = true;

    async function triggerAutoSync() {
      try {
        const res = await fetch(`/api/projects/${projectId}/github-sync`, {
          method: "POST",
        });
        if (!res.ok) return;

        // Fetch fresh workspace tasks and update local state smoothly
        const fresh = await getWorkspaceDataAction();
        if (isMounted && fresh.success && fresh.data?.tasks) {
          setTasks(fresh.data.tasks);
        }
      } catch (err) {
        console.warn("Auto-sync GitHub issues background error:", err);
      }
    }

    void triggerAutoSync();

    return () => {
      isMounted = false;
    };
  }, [projectId, githubRepo, setTasks]);
}
