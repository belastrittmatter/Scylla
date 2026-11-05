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
import { CalendarPanelCard } from "./calendar-panel-card";
import { CalendarSelectableRow } from "./calendar-selectable-row";
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
  currentUserEmail?: string;
  defaultOpen?: boolean;
}

export function CalendarTeamPanel({
  selectedAttendees,
  onToggleAttendee,
  currentUserEmail,
  defaultOpen,
}: CalendarTeamPanelProps): React.ReactElement | null {
  const { teams } = useTeams();
  const [pickedTeamId, setPickedTeamId] = React.useState("");
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const teamId = pickedTeamId || teams[0]?.id || "";
  const selectedTeam = teams.find((team) => team.id === teamId);

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

  const currentEmail = currentUserEmail?.trim().toLowerCase();
  const visibleMembers = members.filter(
    (member) => member.user.email.trim().toLowerCase() !== currentEmail,
  );

  // The card is absent for a user who belongs to no team.
  if (teams.length === 0) return null;

  return (
    <CalendarPanelCard
      title="Team"
      meta={`${visibleMembers.length} members`}
      icon={UsersRound}
      defaultOpen={defaultOpen}
      bodyClassName="max-h-[220px] overflow-y-auto"
    >
      <Select
        value={teamId}
        onValueChange={(value) => setPickedTeamId(value ?? "")}
      >
        <SelectTrigger className="h-8 w-full text-xs" aria-label="Team">
          <SelectValue placeholder="Select a team">
            {selectedTeam ? teamDisplayName(selectedTeam.name) : undefined}
          </SelectValue>
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
        {visibleMembers.map((member) => {
          const name = formatPersonName(member.user.name, member.user.email);
          const item: CalendarAttendeeItem = {
            id: member.user.id,
            name,
            email: member.user.email,
            image: member.user.image,
            type: "user",
            details: member.role,
          };

          return (
            <CalendarSelectableRow
              key={member.id}
              label={name}
              sublabel={<span className="capitalize">{member.role}</span>}
              checked={selectedIds.has(item.id)}
              onToggle={() => onToggleAttendee(item)}
              avatar={
                <Avatar size="sm">
                  {member.user.image && (
                    <AvatarImage src={member.user.image} alt={name} />
                  )}
                  <AvatarFallback>{getPersonInitials(name)}</AvatarFallback>
                </Avatar>
              }
            />
          );
        })}
      </div>
    </CalendarPanelCard>
  );
}
