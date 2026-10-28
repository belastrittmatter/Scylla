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
import { CheckSquare, MoreVertical, Edit2, Trash2 } from "lucide-react";
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

  return (
    <Card className="hover:shadow-xs flex flex-col justify-between transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <Link href={`/tasks/${teamSlug}/${project.slug}`} className="hover:underline">
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
              render={<Button variant="ghost" size="icon" className="size-8 text-neutral-400" />}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEdit(project)} className="cursor-pointer gap-2">
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
        <div className="flex items-center justify-between">
          <ProjectStatusBadge
            status={project.status}
            onStatusChange={(newStatus) => onStatusChange(project.id, newStatus)}
          />
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
