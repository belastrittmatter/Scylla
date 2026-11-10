"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useTeams, type TeamItem } from "@/hooks/use-teams";
import { CreateTeamDialog } from "./create-team-dialog";
import { TeamRow } from "./team-row";

export function TeamsView({ initialTeams }: { initialTeams: TeamItem[] }) {
  const router = useRouter();
  const { teams, createTeam } = useTeams(initialTeams);
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Teams</h1>
          <p className="text-muted-foreground text-sm">
            Manage members and projects for the teams you belong to.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus />
          New team
        </Button>
      </div>

      {teams.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>You are not in any team yet.</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => setCreating(true)}>
              Create your first team
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
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
