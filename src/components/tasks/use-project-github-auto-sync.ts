"use client";

import * as React from "react";
import { getWorkspaceDataAction } from "@/actions";
import type { Project, TaskItem } from "./task-types";

interface UseProjectGithubAutoSyncArgs {
  project: Project | null | undefined;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}

/** Project ids already synced during this page session. */
const syncedProjects = new Set<string>();

/** Imports GitHub issues once per project per page session, then refreshes tasks. */
export function useProjectGithubAutoSync({
  project,
  setTasks,
}: UseProjectGithubAutoSyncArgs) {
  const projectId = project?.id;
  const githubRepo = project?.githubRepo?.trim();

  React.useEffect(() => {
    if (!projectId || !githubRepo || syncedProjects.has(projectId)) return;
    syncedProjects.add(projectId);
    let active = true;

    async function run() {
      try {
        const res = await fetch(`/api/projects/${projectId}/github-sync`, {
          method: "POST",
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          data?: { createdCount?: number; updatedCount?: number };
        };
        const changed =
          (body.data?.createdCount ?? 0) + (body.data?.updatedCount ?? 0);
        if (changed <= 0) return;
        const fresh = await getWorkspaceDataAction();
        if (active && fresh.success && fresh.data?.tasks) {
          setTasks(fresh.data.tasks);
        }
      } catch (err) {
        console.warn("GitHub auto-sync failed:", err);
      }
    }
    void run();

    return () => {
      active = false;
    };
  }, [projectId, githubRepo, setTasks]);
}
