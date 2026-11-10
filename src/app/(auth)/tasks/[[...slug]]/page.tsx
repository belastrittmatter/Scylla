import * as React from "react";
import { TaskDashboard } from "@/components/tasks/task-dashboard";
import { TaskWorkspaceSkeleton } from "@/components/tasks/task-workspace-skeleton";

// Scope, team and project are derived from the URL inside TaskDashboard.
export default function TasksSlugPage() {
  return (
    <React.Suspense fallback={<TaskWorkspaceSkeleton />}>
      <TaskDashboard />
    </React.Suspense>
  );
}
