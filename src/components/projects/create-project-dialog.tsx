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
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [color, setColor] = useState(DEFAULT_PROJECT_COLOR);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugCustomized) setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateProject({
        teamId,
        name: name.trim(),
        slug: slug.trim() ? slugify(slug.trim()) : undefined,
        description: description.trim() || undefined,
        status,
        color,
      });
      setName("");
      setSlug("");
      setDescription("");
      setIsSlugCustomized(false);
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
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3.5 py-4">
            <FormError>{error}</FormError>
            <div className="grid gap-1">
              <Label htmlFor="proj-name">Name</Label>
              <Input
                id="proj-name"
                placeholder="e.g. Mobile App Redesign"
                value={name}
                onChange={handleNameChange}
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="proj-slug">Slug</Label>
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
            <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
              <div className="grid gap-1">
                <Label htmlFor="proj-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) =>
                    val && setStatus(val as ProjectStatus)
                  }
                >
                  <SelectTrigger
                    id="proj-status"
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
                <Label id="proj-color-label">Color</Label>
                <ProjectColorPicker
                  value={color}
                  onChange={setColor}
                  labelledBy="proj-color-label"
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="proj-desc">Description (optional)</Label>
              <Textarea
                id="proj-desc"
                placeholder="Brief summary of project goals…"
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
              {isSubmitting ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
