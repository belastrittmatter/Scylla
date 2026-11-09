"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Archive, Trash2 } from "lucide-react";
import type { ProjectStatus } from "@/services/project/project-types";

interface ProjectDangerZoneCardProps {
  projectName: string;
  status: ProjectStatus;
  isSaving: boolean;
  isDeleting: boolean;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ProjectDangerZoneCard({
  projectName,
  status,
  isSaving,
  isDeleting,
  onArchive,
  onDelete,
}: ProjectDangerZoneCardProps) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">
          Danger Zone
        </CardTitle>
        <CardDescription className="text-xs">
          Irreversible actions that affect this project and all associated
          tasks.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              Archive Project
            </p>
            <p className="text-[11px] text-muted-foreground">
              Mark project as archived. Tasks will become read-only.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onArchive}
            disabled={status === "archived" || isSaving}
            className="h-8 text-xs gap-1.5"
          >
            <Archive className="size-3.5" />
            <span>{status === "archived" ? "Archived" : "Archive"}</span>
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 p-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-destructive">
              Delete Project
            </p>
            <p className="text-[11px] text-muted-foreground">
              Permanently delete this project and all of its tasks.
            </p>
          </div>

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <strong>{projectName}</strong>
                  ? This will permanently delete all tasks, branches, and
                  tracked time associated with this project.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
