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
import { createProjectAction } from "@/actions";
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
  const [color, setColor] = React.useState(COLOR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createProjectAction({
        teamId,
        name: name.trim(),
        description: description.trim() || null,
        color,
      });

      if (res?.success && res.data) {
        onProjectCreated(res.data);
        setName("");
        setDescription("");
        setColor(COLOR_PRESETS[0]);
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
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
