"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Plus, Search } from "lucide-react";
import { TeamCard } from "@/components/teams/team-card";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { EditTeamDialog } from "@/components/teams/edit-team-dialog";
import { TeamMembersDialog } from "@/components/teams/team-members-dialog";
import type { TeamItem } from "@/hooks/use-teams";

interface TeamListProps {
  teams: TeamItem[];
  isLoading: boolean;
  onCreateTeam: (data: {
    name: string;
    slug?: string;
    description?: string;
  }) => Promise<TeamItem>;
  onUpdateTeam: (
    id: string,
    data: { name?: string; slug?: string; description?: string },
  ) => Promise<TeamItem>;
  onDeleteTeam: (id: string) => Promise<void>;
}

export function TeamList({
  teams,
  isLoading,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
}: TeamListProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamItem | null>(null);
  const [membersTeam, setMembersTeam] = useState<TeamItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }, [teams, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-neutral-400" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="size-4" />
          <span>Create Team</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <Users className="mx-auto mb-3 size-10 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {search ? "No matching teams found" : "No teams yet"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">
            {search
              ? "Try adjusting your search query."
              : "Create your first team to organize projects, share access, and collaborate."}
          </p>
          {!search && (
            <Button
              onClick={() => setCreateOpen(true)}
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
            >
              <Plus className="size-3.5" />
              Create Team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={(t) => setEditingTeam(t)}
              onManageMembers={(t) => setMembersTeam(t)}
              onDelete={onDeleteTeam}
            />
          ))}
        </div>
      )}

      <CreateTeamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateTeam={onCreateTeam}
      />
      <EditTeamDialog
        team={editingTeam}
        open={!!editingTeam}
        onOpenChange={(open) => !open && setEditingTeam(null)}
        onUpdateTeam={onUpdateTeam}
      />
      <TeamMembersDialog
        team={membersTeam}
        open={!!membersTeam}
        onOpenChange={(open) => !open && setMembersTeam(null)}
      />
    </div>
  );
}
