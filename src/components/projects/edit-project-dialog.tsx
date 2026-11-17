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
import { FormError } from "@/components/ui/form-error";
import { PROJECT_STATUS_CONFIG } from "@/components/projects/project-status-badge";
import {
  DEFAULT_PROJECT_COLOR,
  ProjectColorPicker,
} from "@/components/projects/project-color-picker";
import type { ProjectStatus } from "@/services/project/project-types";
import type { ProjectItem } from "@/hooks/use-projects";

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
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [color, setColor] = useState(project.color || DEFAULT_PROJECT_COLOR);
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
        <DialogTitle>Edit project</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3.5 py-4">
        <FormError>{error}</FormError>
        <div className="grid gap-1">
          <Label htmlFor="edit-proj-name">Name</Label>
          <Input
            id="edit-proj-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="edit-proj-slug">Slug</Label>
          <Input
            id="edit-proj-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
          <div className="grid gap-1">
            <Label htmlFor="edit-proj-status">Status</Label>
            <Select
              value={status}
              onValueChange={(val) => val && setStatus(val as ProjectStatus)}
            >
              <SelectTrigger
                id="edit-proj-status"
                className="h-9 w-full text-xs"
              >
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
            <Label id="edit-proj-color-label">Color</Label>
            <ProjectColorPicker
              value={color}
              onChange={setColor}
              labelledBy="edit-proj-color-label"
            />
          </div>
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

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? "Saving…" : "Save changes"}
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
