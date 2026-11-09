"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  GitHubRepoSelector,
  type GitHubRepoCreationConfig,
} from "@/components/projects/github-repo-selector";
import { createProjectAction } from "@/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Project } from "@/db/schema";

const COLOR_PRESETS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
];

interface ProjectCreateDialogProps {
  isOpen: boolean;
  teamId: string;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export function ProjectCreateDialog({
  isOpen,
  teamId,
  onClose,
  onProjectCreated,
}: ProjectCreateDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [githubRepo, setGithubRepo] = React.useState("");
  const [color, setColor] = React.useState(COLOR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [gitCreationConfig, setGitCreationConfig] =
    React.useState<GitHubRepoCreationConfig>({
      mode: "select",
      newRepoName: "",
      isPrivate: true,
      isValid: true,
    });

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
      const res = await createProjectAction({
        teamId,
        name: name.trim(),
        description: description.trim() || null,
        githubRepo:
          gitCreationConfig.mode === "select"
            ? githubRepo.trim() || null
            : null,
        createNewRepo:
          gitCreationConfig.mode === "create"
            ? {
                name: gitCreationConfig.newRepoName,
                isPrivate: gitCreationConfig.isPrivate,
                description: description.trim() || null,
              }
            : undefined,
        color,
      });

      if (res?.success && res.data) {
        onProjectCreated(res.data);
        setName("");
        setDescription("");
        setGithubRepo("");
        setColor(COLOR_PRESETS[0]);
        toast.success(
          gitCreationConfig.mode === "create"
            ? `Project & GitHub repository "${res.data.githubRepo}" created successfully!`
            : "Project created successfully!",
        );
        onClose();
      } else {
        setError(res?.error || "Failed to create project");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a project to organize tasks for this team.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup className="gap-3.5">
            <Field>
              <FieldLabel htmlFor="proj-name">Project Name</FieldLabel>
              <Input
                id="proj-name"
                placeholder="e.g. Mobile App Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-sm"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                </svg>
                GitHub Repository (Optional)
              </FieldLabel>
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
                  }
                  if (!description.trim() && repo.description) {
                    setDescription(repo.description);
                  }
                }}
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="proj-desc">
                Description (optional)
              </FieldLabel>
              <Input
                id="proj-desc"
                placeholder="Brief summary of project scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 text-sm"
              />
            </Field>

            <Field>
              <FieldLabel>Theme Color</FieldLabel>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`size-6 rounded-full transition-transform ${
                      color === c
                        ? "scale-110 ring-2 ring-neutral-900 ring-offset-2 dark:ring-white"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
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
