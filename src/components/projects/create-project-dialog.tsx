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
import {
  GitHubRepoSelector,
  type GitHubRepoCreationConfig,
} from "@/components/projects/github-repo-selector";
import { ProjectColorPicker, PRESET_COLORS } from "./project-color-picker";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ProjectStatus } from "@/services/project/project-types";
import type { ProjectItem } from "@/hooks/use-projects";

interface CreateProjectDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (data: {
    teamId: string;
    name: string;
    slug?: string;
    description?: string;
    status?: ProjectStatus;
    color?: string;
    githubRepo?: string | null;
    createNewRepo?: {
      name: string;
      isPrivate?: boolean;
      description?: string | null;
    };
  }) => Promise<ProjectItem>;
}

export function CreateProjectDialog({
  teamId,
  open,
  onOpenChange,
  onCreateProject,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gitCreationConfig, setGitCreationConfig] =
    useState<GitHubRepoCreationConfig>({
      mode: "select",
      newRepoName: "",
      isPrivate: true,
      isValid: true,
    });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugCustomized) setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (gitCreationConfig.mode === "create") {
      if (!gitCreationConfig.isValid || !gitCreationConfig.newRepoName) {
        setError(
          gitCreationConfig.error ||
            "Please enter a valid GitHub repository name",
        );
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await onCreateProject({
        teamId,
        name: name.trim(),
        slug: slug.trim() ? slugify(slug.trim()) : undefined,
        description: description.trim() || undefined,
        githubRepo:
          gitCreationConfig.mode === "select"
            ? githubRepo.trim() || undefined
            : undefined,
        createNewRepo:
          gitCreationConfig.mode === "create"
            ? {
                name: gitCreationConfig.newRepoName,
                isPrivate: gitCreationConfig.isPrivate,
                description: description.trim() || undefined,
              }
            : undefined,
        status,
        color,
      });
      setName("");
      setSlug("");
      setDescription("");
      setGithubRepo("");
      setIsSlugCustomized(false);
      toast.success(
        gitCreationConfig.mode === "create"
          ? `Project & GitHub repository "${created.githubRepo}" created successfully!`
          : "Project created successfully!",
      );
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3.5 py-4">
            {error && (
              <div className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="grid gap-1">
              <Label htmlFor="proj-name">Project Name</Label>
              <Input
                id="proj-name"
                placeholder="e.g. Mobile App Redesign"
                value={name}
                onChange={handleNameChange}
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="proj-slug">Project Slug</Label>
              <Input
                id="proj-slug"
                placeholder="mobile-app-redesign"
                value={slug}
                onChange={(e) => {
                  setIsSlugCustomized(true);
                  setSlug(e.target.value);
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="proj-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) =>
                    val && setStatus(val as ProjectStatus)
                  }
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
              <ProjectColorPicker color={color} onColorChange={setColor} />
            </div>
            <div className="grid gap-1">
              <Label
                htmlFor="proj-github"
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
                suggestedName={name}
                projectDescription={description}
                onCreationConfigChange={setGitCreationConfig}
                onSelectRepo={(repo) => {
                  if (!repo) return;
                  if (!name.trim()) {
                    setName(repo.name);
                    if (!isSlugCustomized) {
                      setSlug(slugify(repo.name));
                    }
                  }
                  if (!description.trim() && repo.description) {
                    setDescription(repo.description);
                  }
                }}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="proj-desc">Description (Optional)</Label>
              <Textarea
                id="proj-desc"
                placeholder="Brief summary of project goals..."
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
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !name.trim() ||
                (gitCreationConfig.mode === "create" &&
                  !gitCreationConfig.isValid)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>
                    {gitCreationConfig.mode === "create"
                      ? "Creating project & GitHub repo..."
                      : "Creating project..."}
                  </span>
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
