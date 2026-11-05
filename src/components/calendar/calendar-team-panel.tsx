"use client";

import * as React from "react";
import { UsersRound } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useTeams } from "@/hooks/use-teams";
import { formatPersonName, getPersonInitials } from "@/lib/format-person-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarPanelCard } from "./calendar-panel-card";
import type { CalendarAttendeeItem } from "./calendar-attendee-types";

type TeamMember = Awaited<ReturnType<typeof apiClient.teams.members>>[number];

function teamDisplayName(name: string): string {
  if (!/^[a-z0-9_-]+$/.test(name)) return name;
  return name
    .split(/[-_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface CalendarTeamPanelProps {
  selectedAttendees: CalendarAttendeeItem[];
  onToggleAttendee: (item: CalendarAttendeeItem) => void;
  defaultOpen?: boolean;
}

export function CalendarTeamPanel({
  selectedAttendees,
  onToggleAttendee,
  defaultOpen,
}: CalendarTeamPanelProps): React.ReactElement | null {
  const { teams } = useTeams();
  const [pickedTeamId, setPickedTeamId] = React.useState("");
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const teamId = pickedTeamId || teams[0]?.id || "";

  React.useEffect(() => {
    if (!teamId) return;
    let active = true;
    apiClient.teams
      .members(teamId)
      .then((list) => {
        if (active) setMembers(list);
      })
      .catch(() => {
        if (active) setMembers([]);
      });
    return () => {
      active = false;
    };
  }, [teamId]);

  const selectedIds = React.useMemo(
    () => new Set(selectedAttendees.map((item) => item.id)),
    [selectedAttendees],
  );

  // The card is absent for a user who belongs to no team.
  if (teams.length === 0) return null;

  return (
    <CalendarPanelCard
      title="Team"
      meta={`${members.length} members`}
      icon={UsersRound}
      defaultOpen={defaultOpen}
    >
      <Select
        value={teamId}
        onValueChange={(value) => setPickedTeamId(value ?? "")}
      >
        <SelectTrigger className="h-8 w-full text-xs" aria-label="Team">
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {teamDisplayName(team.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-2 space-y-0.5">
        {members.map((member) => {
          const name = formatPersonName(member.user.name, member.user.email);
          const item: CalendarAttendeeItem = {
            id: member.user.id,
            name,
            email: member.user.email,
            image: member.user.image,
            type: "user",
            details: member.role,
          };
          const isSelected = selectedIds.has(item.id);

          return (
            <div
              key={member.id}
              className={`flex items-center gap-2.5 rounded-lg p-2 ${
                isSelected ? "bg-accent/60" : "hover:bg-muted/60"
              }`}
            >
              <Avatar
                size="sm"
                className={isSelected ? "ring-2 ring-background" : undefined}
              >
                {member.user.image && (
                  <AvatarImage src={member.user.image} alt={name} />
                )}
                <AvatarFallback>{getPersonInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${
                    isSelected ? "font-semibold" : "font-medium"
                  }`}
                >
                  {name}
                </p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {member.role}
                </p>
              </div>
              <Switch
                checked={isSelected}
                onCheckedChange={() => onToggleAttendee(item)}
                aria-label={`Include ${name}`}
              />
            </div>
          );
        })}
      </div>
    </CalendarPanelCard>
  );
}
