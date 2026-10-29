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
import { slugify } from "@/lib/utils";
import type { TeamItem } from "@/hooks/use-teams";

interface EditTeamDialogProps {
  team: TeamItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTeam: (
    id: string,
    data: { name?: string; slug?: string; description?: string },
  ) => Promise<TeamItem>;
}

interface EditTeamFormProps {
  team: TeamItem;
  onOpenChange: (open: boolean) => void;
  onUpdateTeam: (
    id: string,
    data: { name?: string; slug?: string; description?: string },
  ) => Promise<TeamItem>;
}

function EditTeamForm({ team, onOpenChange, onUpdateTeam }: EditTeamFormProps) {
  const [name, setName] = useState(team.name);
  const [slug, setSlug] = useState(team.slug);
  const [description, setDescription] = useState(team.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onUpdateTeam(team.id, {
        name: name.trim(),
        slug: slug.trim() ? slugify(slug.trim()) : undefined,
        description: description.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Team</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {error && (
          <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="edit-team-name">Team Name</Label>
          <Input
            id="edit-team-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="edit-team-slug">Team Slug</Label>
          <Input
            id="edit-team-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="edit-team-desc">Description</Label>
          <Textarea
            id="edit-team-desc"
            rows={3}
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

export function EditTeamDialog({
  team,
  open,
  onOpenChange,
  onUpdateTeam,
}: EditTeamDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        {team && (
          <EditTeamForm
            key={team.id}
            team={team}
            onOpenChange={onOpenChange}
            onUpdateTeam={onUpdateTeam}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
