"use client";

import * as React from "react";
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

/** Members listed before "Show all"; selected members always stay visible. */
const COLLAPSED_MEMBER_COUNT = 8;

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
  const [showAll, setShowAll] = React.useState(false);
  const teamId = pickedTeamId || teams[0]?.id || "";
  const selectedTeam = teams.find((team) => team.id === teamId);

  React.useEffect(() => {
    if (!teamId) return;
    let active = true;
    apiClient.teams
      .members(teamId)
      .then((list) => {
        if (!active) return;
        setMembers(list);
        setShowAll(false);
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

  const hasSelection = visibleMembers.some((member) =>
    selectedIds.has(member.user.id),
  );
  const listedMembers = showAll
    ? visibleMembers
    : visibleMembers.filter(
        (member, index) =>
          index < COLLAPSED_MEMBER_COUNT || selectedIds.has(member.user.id),
      );
  const hiddenCount = visibleMembers.length - listedMembers.length;

  // The card is absent for a user who belongs to no team.
  if (teams.length === 0) return null;

  return (
    <CalendarPanelCard
      title="Team"
      meta={`${visibleMembers.length} members`}
      active={hasSelection}
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
        {listedMembers.map((member) => {
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
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-left text-xs text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Show all members
            <span className="font-code text-[11px] tabular-nums">
              +{hiddenCount}
            </span>
          </button>
        )}
      </div>
    </CalendarPanelCard>
  );
}
