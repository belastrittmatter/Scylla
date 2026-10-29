"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { TeamItem, TeamMemberItem } from "@/hooks/use-teams";
import { ROLE_PRIORITY, type TeamRole } from "@/services/team/team-types";
import type { Teammate } from "@/services/user";

interface UseTeamMembersEditorProps {
  team: TeamItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useTeamMembersEditor({
  team,
  open,
  onOpenChange,
}: UseTeamMembersEditorProps) {
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [initialMembers, setInitialMembers] = useState<TeamMemberItem[]>([]);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !team) return;
    let ignore = false;

    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/teams/${team.id}/members`);
        const json = await res.json();
        if (ignore) return;
        if (res.ok) {
          const data: TeamMemberItem[] = Array.isArray(json)
            ? json
            : json.data || [];
          const sorted = [...data].sort(
            (a, b) =>
              (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99),
          );
          setMembers(sorted);
          setInitialMembers(sorted);
          setDeletedUserIds([]);
          setEmailInput("");
          setError(null);
        } else {
          setError(json.error || "Failed to load members");
        }
      } catch {
        if (!ignore) setError("Failed to load members");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchMembers();
    return () => {
      ignore = true;
    };
  }, [open, team]);

  const handleAddMember = (userToAdd?: Teammate) => {
    if (!team) return;
    const targetEmail = (userToAdd?.email || emailInput).trim();
    if (!targetEmail) return;

    const existing = members.find(
      (m) =>
        m.user?.email?.toLowerCase() === targetEmail.toLowerCase() ||
        m.userId?.toLowerCase() === targetEmail.toLowerCase() ||
        (userToAdd?.id && m.userId === userToAdd.id),
    );
    if (existing) {
      setError("This user is already in the team list");
      return;
    }

    const newMember: TeamMemberItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      teamId: team.id,
      userId:
        userToAdd?.id && !userToAdd.id.startsWith("invite-")
          ? userToAdd.id
          : targetEmail,
      role: "member",
      joinedAt: new Date().toISOString(),
      isNew: true,
      user: {
        id: userToAdd?.id || `temp-user-${Date.now()}`,
        name: userToAdd?.name || targetEmail,
        email: targetEmail,
        image: userToAdd?.image || userToAdd?.avatarUrl || null,
      },
    };

    setMembers((prev) => [...prev, newMember]);
    setEmailInput("");
    setError(null);
  };

  const handleUpdateRole = (userId: string, role: TeamRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
    );
  };

  const handleRemoveMember = (userId: string) => {
    const memberToRemove = members.find((m) => m.userId === userId);
    if (!memberToRemove) return;
    if (!memberToRemove.isNew) setDeletedUserIds((prev) => [...prev, userId]);
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const hasChanges = useMemo(() => {
    return (
      deletedUserIds.length > 0 ||
      members.some((m) => m.isNew) ||
      members.some((m) => {
        const initial = initialMembers.find((im) => im.userId === m.userId);
        return initial && initial.role !== m.role;
      })
    );
  }, [deletedUserIds.length, members, initialMembers]);

  const sortedMembers = useMemo(() => {
    return [...members].sort(
      (a, b) => (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99),
    );
  }, [members]);

  const handleSave = async () => {
    if (!team) return;
    setIsSaving(true);
    setError(null);

    try {
      for (const userId of deletedUserIds) {
        const res = await fetch(`/api/teams/${team.id}/members/${userId}`, {
          method: "DELETE",
        });
        if (!res.ok)
          throw new Error(
            (await res.json()).error || "Failed to remove member",
          );
      }

      for (const member of members.filter((m) => m.isNew)) {
        const body = JSON.stringify({
          email: member.user?.email || member.userId,
          role: member.role,
        });
        const res = await fetch(`/api/teams/${team.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok)
          throw new Error((await res.json()).error || `Failed to add member`);
      }

      for (const member of members.filter((m) => !m.isNew)) {
        const initial = initialMembers.find(
          (im) => im.userId === member.userId,
        );
        if (initial && initial.role !== member.role) {
          const res = await fetch(
            `/api/teams/${team.id}/members/${member.userId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role: member.role }),
            },
          );
          if (!res.ok)
            throw new Error(
              (await res.json()).error || `Failed to update role`,
            );
        }
      }

      toast.success("Team members saved successfully");
      onOpenChange(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to save team members",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    members: sortedMembers,
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
  };
}
