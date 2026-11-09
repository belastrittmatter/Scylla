"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import { slugify } from "@/lib/utils";
import type { ProjectStatus } from "@/services/project/project-types";
import {
  COLOR_PRESETS,
  fetchProjectTeamMembers,
  type ProjectDetail,
  type TeamMemberItem,
} from "./project-settings-types";

export function useProjectSettings(projectId: string) {
  const router = useRouter();
  const { setLabel } = useBreadcrumb();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Member state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  const loadTeamMembers = useCallback(async (teamId: string) => {
    const members = await fetchProjectTeamMembers(teamId);
    setTeamMembers(members);
  }, []);

  useEffect(() => {
    if (!projectId) return;

    let ignore = false;
    async function loadProjectAndTeam() {
      setIsLoading(true);
      try {
        const projRes = await fetch(`/api/projects/${projectId}`);
        if (!projRes.ok) throw new Error("Failed to load project");
        const data = await projRes.json();
        if (ignore) return;

        setProject(data);
        setName(data.name || "");
        setSlug(data.slug || "");
        setDescription(data.description || "");
        setStatus(data.status || "active");
        setColor(data.color || COLOR_PRESETS[0]);

        setLabel(projectId, data.name);
        setLabel(projectId.toLowerCase(), data.name);

        if (data.teamId) {
          try {
            const teamRes = await fetch(`/api/teams/${data.teamId}`);
            if (teamRes.ok) {
              const teamData = await teamRes.json();
              setTeamName(teamData.name || "");
              setTeamSlug(teamData.slug || "");
            }
          } catch {
            // Ignore team fetch errors
          }
          await loadTeamMembers(data.teamId);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load project",
        );
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadProjectAndTeam();
    return () => {
      ignore = true;
    };
  }, [projectId, setLabel, loadTeamMembers]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() ? slugify(slug.trim()) : slugify(name.trim()),
          description: description.trim() || null,
          status,
          color,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update project");

      setProject((prev) => (prev ? { ...prev, ...json } : json));
      setLabel(projectId, json.name);
      setLabel(projectId.toLowerCase(), json.name);
      toast.success("Project settings saved successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncGithub = async () => {
    if (!project?.githubRepo) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/github-sync`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "GitHub sync failed");
      toast.success(
        `Synchronized ${json.data?.createdCount || 0} new issues from GitHub`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "GitHub sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !project?.teamId) {
      toast.error("Email is required");
      return;
    }

    setIsAddingMember(true);
    try {
      const res = await fetch(`/api/teams/${project.teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add member");

      toast.success("Member added to team");
      setNewMemberEmail("");
      setNewMemberRole("member");
      setAddMemberOpen(false);
      await loadTeamMembers(project.teamId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!project?.teamId) return;
    setRemovingMemberId(userId);
    try {
      const res = await fetch(
        `/api/teams/${project.teamId}/members/${userId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to remove member");
      toast.success(`Removed ${memberName} from team`);
      setTeamMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleArchiveProject = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to archive project");
      }
      setStatus("archived");
      toast.success("Project has been archived");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to archive project",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete project");
      }
      toast.success("Project deleted successfully");
      router.push("/tasks");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete project",
      );
      setIsDeleting(false);
    }
  };

  const boardUrl =
    teamSlug && project?.slug ? `/tasks/${teamSlug}/${project.slug}` : "/tasks";

  return {
    project,
    teamMembers,
    teamName,
    isLoading,
    isSaving,
    isSyncing,
    isDeleting,
    boardUrl,
    name,
    setName,
    slug,
    setSlug,
    description,
    setDescription,
    status,
    setStatus,
    color,
    setColor,
    addMemberOpen,
    setAddMemberOpen,
    newMemberEmail,
    setNewMemberEmail,
    newMemberRole,
    setNewMemberRole,
    isAddingMember,
    removingMemberId,
    handleSaveGeneral,
    handleSyncGithub,
    handleAddMember,
    handleRemoveMember,
    handleArchiveProject,
    handleDeleteProject,
  };
}
