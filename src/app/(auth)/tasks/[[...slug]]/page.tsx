"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { TaskDashboard } from "@/components/tasks/task-dashboard";
import { TaskWorkspaceSkeleton } from "@/components/tasks/task-workspace-skeleton";

function TasksSlugContent() {
  const params = useParams<{ slug?: string[] }>();
  const slug = params?.slug;
  const teamSlug = Array.isArray(slug) ? slug[0] : slug;
  const projectSlug = Array.isArray(slug) ? slug[1] : undefined;

  return (
    <TaskDashboard
      initialTeamSlug={teamSlug}
      initialProjectSlug={projectSlug}
    />
  );
}

export default function TasksSlugPage() {
  return (
    <React.Suspense fallback={<TaskWorkspaceSkeleton />}>
      <TasksSlugContent />
    </React.Suspense>
  );
}
