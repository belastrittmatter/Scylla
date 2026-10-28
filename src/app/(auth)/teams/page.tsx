"use client";

import * as React from "react";
import { useTeams } from "@/hooks/use-teams";
import { TeamList } from "@/components/teams";
import { Users } from "lucide-react";

export default function TeamsPage() {
  const { teams, isLoading, error, createTeam, updateTeam, deleteTeam } = useTeams();

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-8 p-6 md:p-8">
      {/* Header section */}
      <div className="flex flex-col gap-1 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
            <Users className="size-4.5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Teams
          </h1>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Manage your organization&apos;s workspaces, team memberships, and access team-scoped
          projects.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main team content */}
      <TeamList
        teams={teams}
        isLoading={isLoading}
        onCreateTeam={createTeam}
        onUpdateTeam={updateTeam}
        onDeleteTeam={deleteTeam}
      />
    </div>
  );
}
