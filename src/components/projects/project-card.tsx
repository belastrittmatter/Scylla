"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CheckSquare,
  MoreVertical,
  Edit2,
  Trash2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import type { ProjectItem } from "@/hooks/use-projects";
import type { ProjectStatus } from "@/services/project/project-types";

interface ProjectCardProps {
  project: ProjectItem;
  teamSlug: string;
  onEdit: (project: ProjectItem) => void;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({
  project,
  teamSlug,
  onEdit,
  onStatusChange,
  onDelete,
}: ProjectCardProps) {
  const color = project.color || "#3b82f6";
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSyncIssues = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/github-sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to sync GitHub issues");
      } else {
        toast.success(
          `Successfully synchronized ${data.data?.totalIssues || 0} issues from GitHub!`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="hover:shadow-xs flex flex-col justify-between transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <Link
                href={`/tasks/${teamSlug}/${project.slug}`}
                className="hover:underline"
              >
                <CardTitle className="text-base font-semibold leading-none">
                  {project.name}
                </CardTitle>
              </Link>
            </div>
            <Link
              href={`/tasks/${teamSlug}/${project.slug}`}
              className="font-mono text-xs text-neutral-400 hover:text-neutral-700 hover:underline dark:hover:text-neutral-200"
            >
              /{project.slug}
            </Link>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-neutral-400"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                render={<Link href={`/projects/${project.id}/settings`} />}
                className="cursor-pointer gap-2"
              >
                <Settings className="size-3.5" />
                <span>Project Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(project)}
                className="cursor-pointer gap-2"
              >
                <Edit2 className="size-3.5" />
                <span>Edit Project</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(project.id)}
                className="cursor-pointer gap-2 text-red-600 dark:text-red-400"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardDescription className="mt-1 line-clamp-2 min-h-[32px] text-xs">
          {project.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <ProjectStatusBadge
            status={project.status}
            onStatusChange={(newStatus) =>
              onStatusChange(project.id, newStatus)
            }
          />
          {project.githubRepo && (
            <div className="flex items-center gap-1">
              <a
                href={`https://github.com/${project.githubRepo}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/80 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                title={`Linked to GitHub repository ${project.githubRepo}`}
              >
                <svg
                  className="size-3 shrink-0 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                </svg>
                <span className="max-w-[110px] truncate">
                  {project.githubRepo}
                </span>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                onClick={handleSyncIssues}
                disabled={isSyncing}
                title="Sync GitHub issues"
              >
                <RefreshCw
                  className={`size-3 ${isSyncing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300"
          render={<Link href={`/tasks/${teamSlug}/${project.slug}`} />}
        >
          <CheckSquare className="size-3.5 text-neutral-400" />
          <span>Open Task Board</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
