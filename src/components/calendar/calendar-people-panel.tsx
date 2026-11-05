"use client";

import * as React from "react";
import { Search, SearchX, Users } from "lucide-react";
import { useUserSearch } from "@/hooks/use-user-search";
import { formatPersonName, getPersonInitials } from "@/lib/format-person-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPanelCard } from "./calendar-panel-card";
import { CalendarSelectableRow } from "./calendar-selectable-row";
import type { CalendarAttendeeItem } from "./calendar-attendee-types";

interface CalendarPeoplePanelProps {
  selectedAttendees: CalendarAttendeeItem[];
  onToggleAttendee: (item: CalendarAttendeeItem) => void;
  currentUserEmail?: string;
}

function PeoplePanelSkeleton(): React.ReactElement {
  return (
    <div className="space-y-1" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-2.5 px-2 py-1.5">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarPeoplePanel({
  selectedAttendees,
  onToggleAttendee,
  currentUserEmail,
}: CalendarPeoplePanelProps): React.ReactElement {
  const { query, setQuery, results, isLoading, hasLoaded } = useUserSearch({
    limit: 20,
  });

  const selectedIds = React.useMemo(
    () => new Set(selectedAttendees.map((item) => item.id)),
    [selectedAttendees],
  );
  const selectedPeople = selectedAttendees.filter(
    (item) => item.type === "user",
  );

  const currentEmail = currentUserEmail?.trim().toLowerCase();

  const items = results
    .filter((user) => user.email.trim().toLowerCase() !== currentEmail)
    .map((user) => {
      const name = formatPersonName(user.name, user.email);
      const item: CalendarAttendeeItem = {
        id: user.id || user.email,
        name,
        email: user.email,
        image: user.image,
        type: "user",
        details: user.title || user.department || "Teammate",
      };
      return { item, name };
    })
    .filter(({ item }) => !selectedIds.has(item.id));

  const showSkeleton =
    selectedPeople.length === 0 &&
    (!hasLoaded || (isLoading && query.trim() !== "" && items.length === 0));

  return (
    <CalendarPanelCard
      title="People"
      meta={`${selectedPeople.length} selected`}
      icon={Users}
      bodyClassName={
        selectedPeople.length > 0
          ? "max-h-[420px] overflow-y-auto"
          : "max-h-[240px] overflow-y-auto"
      }
    >
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people"
          aria-label="Search people"
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="mt-2 space-y-0.5">
        {selectedPeople.map((person) => (
          <CalendarSelectableRow
            key={`selected-${person.id}`}
            label={person.name}
            sublabel={person.email}
            checked
            onToggle={() => onToggleAttendee(person)}
            avatar={
              <Avatar size="sm">
                {person.image && (
                  <AvatarImage src={person.image} alt={person.name} />
                )}
                <AvatarFallback>
                  {getPersonInitials(person.name)}
                </AvatarFallback>
              </Avatar>
            }
          />
        ))}

        {showSkeleton ? (
          <PeoplePanelSkeleton />
        ) : items.length === 0 ? (
          selectedPeople.length === 0 && (
            <div className="flex flex-col items-center gap-1.5 py-8 text-center text-xs text-muted-foreground">
              <SearchX aria-hidden className="size-4" />
              <span>No teammates found</span>
            </div>
          )
        ) : (
          items.map(({ item, name }) => (
            <CalendarSelectableRow
              key={item.id}
              label={name}
              sublabel={item.email}
              checked={false}
              onToggle={() => onToggleAttendee(item)}
              avatar={
                <Avatar size="sm">
                  {item.image && <AvatarImage src={item.image} alt={name} />}
                  <AvatarFallback>{getPersonInitials(name)}</AvatarFallback>
                </Avatar>
              }
            />
          ))
        )}
      </div>
    </CalendarPanelCard>
  );
}
