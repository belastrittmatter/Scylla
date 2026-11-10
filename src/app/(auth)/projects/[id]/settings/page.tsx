"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderKanban, RefreshCw } from "lucide-react";
import { useProjectSettings } from "@/components/projects/settings/use-project-settings";
import { ProjectGeneralCard } from "@/components/projects/settings/project-general-card";
import { ProjectGithubCard } from "@/components/projects/settings/project-github-card";
import { ProjectMembersCard } from "@/components/projects/settings/project-members-card";
import { ProjectDangerZoneCard } from "@/components/projects/settings/project-danger-zone-card";

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "";

  const {
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
  } = useProjectSettings(projectId);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          <span>Loading project settings...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-border p-8 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">
            Project not found
          </p>
          <Button variant="outline" size="sm" render={<Link href="/tasks" />}>
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            render={<Link href={boardUrl} />}
            title="Back to Board"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color || "#3b82f6" }}
              />
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {project.name} Settings
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage project preferences, view GitHub integration, and team
              members.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          render={<Link href={boardUrl} />}
        >
          <FolderKanban className="size-3.5" />
          <span>Go to Board</span>
        </Button>
      </div>

      <ProjectGeneralCard
        name={name}
        setName={setName}
        slug={slug}
        setSlug={setSlug}
        description={description}
        setDescription={setDescription}
        status={status}
        setStatus={setStatus}
        color={color}
        setColor={setColor}
        isSaving={isSaving}
        onSave={handleSaveGeneral}
      />

      <ProjectGithubCard
        githubRepo={project.githubRepo}
        isSyncing={isSyncing}
        onSync={handleSyncGithub}
      />

      <ProjectMembersCard
        teamName={teamName}
        teamMembers={teamMembers}
        hasGithubRepo={!!project.githubRepo}
        addMemberOpen={addMemberOpen}
        setAddMemberOpen={setAddMemberOpen}
        newMemberEmail={newMemberEmail}
        setNewMemberEmail={setNewMemberEmail}
        newMemberRole={newMemberRole}
        setNewMemberRole={setNewMemberRole}
        isAddingMember={isAddingMember}
        onAddMember={handleAddMember}
        removingMemberId={removingMemberId}
        onRemoveMember={handleRemoveMember}
      />

      <ProjectDangerZoneCard
        projectName={project.name}
        status={status}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onArchive={handleArchiveProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
