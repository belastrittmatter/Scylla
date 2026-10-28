"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { TeamMemberSearchInput } from "./team-member-search-input";
import { TeamMemberRow } from "./team-member-row";
import { useTeamMembersEditor } from "./use-team-members-editor";
import type { TeamItem } from "@/hooks/use-teams";

interface TeamMembersDialogProps {
  team: TeamItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamMembersDialog({ team, open, onOpenChange }: TeamMembersDialogProps) {
  const {
    members,
    emailInput,
    setEmailInput,
    isLoading,
    isSaving,
    error,
    hasChanges,
    handleAddMember,
    handleUpdateRole,
    handleRemoveMember,
    handleSave,
  } = useTeamMembersEditor({ team, open, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Team Members — {team?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 pt-1">
          <Label className="text-xs font-medium">Add Team Member</Label>
          <div className="flex items-center gap-2">
            <TeamMemberSearchInput
              value={emailInput}
              onChange={setEmailInput}
              onSelectUser={(u) => handleAddMember(u)}
              onEnterPress={() => handleAddMember()}
              disabled={isSaving}
              placeholder="Search or enter colleague email..."
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 gap-1 text-xs"
              disabled={!emailInput.trim() || isSaving}
              onClick={() => handleAddMember()}
            >
              <UserPlus className="size-3.5" />
              Add
            </Button>
          </div>
        </div>

        {error && (
          <p className="bg-destructive/10 text-destructive rounded-md p-2 text-xs">{error}</p>
        )}

        <div className="max-h-64 space-y-1.5 overflow-y-auto pt-2">
          {isLoading ? (
            <p className="text-muted-foreground py-4 text-center text-xs">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">No members yet.</p>
          ) : (
            members.map((m) => (
              <TeamMemberRow
                key={m.id}
                member={m}
                onUpdateRole={handleUpdateRole}
                onRemoveMember={handleRemoveMember}
              />
            ))
          )}
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
