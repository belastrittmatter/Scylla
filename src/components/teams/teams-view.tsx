"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useTeams, type TeamItem } from "@/hooks/use-teams";
import { CreateTeamDialog } from "./create-team-dialog";
import { TeamRow } from "./team-row";

export function TeamsView({ initialTeams }: { initialTeams: TeamItem[] }) {
  const router = useRouter();
  const { teams, createTeam } = useTeams(initialTeams);
  const [creating, setCreating] = React.useState(false);
  // The empty state carries its own "New team"; don't show it twice.
  const isEmpty = teams.length === 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Teams</h1>
          <p className="text-muted-foreground text-sm">
            Manage members and projects for the teams you belong to.
          </p>
        </div>
        {!isEmpty && (
          <Button onClick={() => setCreating(true)}>
            <Plus />
            New team
          </Button>
        )}
      </div>

      {isEmpty ? (
        <Empty className="border p-6 md:p-8">
          <EmptyHeader>
            <EmptyTitle className="text-sm">
              You are not in any team yet.
            </EmptyTitle>
            <EmptyDescription>
              Create a team, or ask a teammate to add you to theirs.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus />
              New team
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="divide-border divide-y overflow-hidden rounded-lg border">
          {teams.map((t) => (
            <TeamRow key={t.id} team={t} />
          ))}
        </ul>
      )}

      <CreateTeamDialog
        open={creating}
        onOpenChange={setCreating}
        onCreateTeam={async (data) => {
          const created = await createTeam(data);
          router.push(`/teams/${created.slug}`);
          return created;
        }}
      />
    </div>
  );
}
