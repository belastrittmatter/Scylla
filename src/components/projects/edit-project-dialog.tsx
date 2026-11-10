"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { slugify } from "@/lib/utils";
import { PROJECT_STATUS_CONFIG } from "@/components/projects/project-status-badge";
import { GitHubRepoSelector } from "@/components/projects/github-repo-selector";
import type { ProjectStatus } from "@/services/project/project-types";
import type { ProjectItem } from "@/hooks/use-projects";

const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
];

interface EditProjectDialogProps {
  project: ProjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProject: (
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      status?: ProjectStatus;
      color?: string | null;
      githubRepo?: string | null;
    },
  ) => Promise<ProjectItem>;
}

interface EditProjectFormProps {
  project: ProjectItem;
  onOpenChange: (open: boolean) => void;
  onUpdateProject: EditProjectDialogProps["onUpdateProject"];
}

function EditProjectForm({
  project,
  onOpenChange,
  onUpdateProject,
}: EditProjectFormProps) {
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [description, setDescription] = useState(project.description || "");
  const [githubRepo, setGithubRepo] = useState(project.githubRepo || "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [color, setColor] = useState(project.color || PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onUpdateProject(project.id, {
        name: name.trim(),
        slug: slug.trim() ? slugify(slug.trim()) : undefined,
        description: description.trim() || null,
        githubRepo: githubRepo.trim() || null,
        status,
        color,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Project</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3.5 py-4">
        {error && (
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="grid gap-1">
          <Label htmlFor="edit-proj-name">Project Name</Label>
          <Input
            id="edit-proj-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="edit-proj-slug">Project Slug</Label>
          <Input
            id="edit-proj-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label htmlFor="edit-proj-status">Status</Label>
            <Select
              value={status}
              onValueChange={(val) => val && setStatus(val as ProjectStatus)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Status">
                  {PROJECT_STATUS_CONFIG[status]?.label || "Active"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Theme Color</Label>
            <div className="flex items-center gap-1.5 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-6 cursor-pointer rounded-full transition-transform ${
                    color === c
                      ? "scale-110 ring-2 ring-neutral-400 ring-offset-1"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-1">
          <Label
            htmlFor="edit-proj-github"
            className="flex items-center gap-1.5"
          >
            <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
            GitHub Repository (Optional)
          </Label>
          <GitHubRepoSelector
            value={githubRepo}
            onChange={setGithubRepo}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="edit-proj-desc">Description</Label>
          <Textarea
            id="edit-proj-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onUpdateProject,
}: EditProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        {project && (
          <EditProjectForm
            key={project.id}
            project={project}
            onOpenChange={onOpenChange}
            onUpdateProject={onUpdateProject}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
