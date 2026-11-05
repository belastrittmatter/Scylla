"use client";

import * as React from "react";
import { Search, SearchX, Users } from "lucide-react";
import { useUserSearch } from "@/hooks/use-user-search";
import { formatPersonName, getPersonInitials } from "@/lib/format-person-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPanelCard } from "./calendar-panel-card";
import type { CalendarAttendeeItem } from "./calendar-attendee-types";

interface CalendarPeoplePanelProps {
  selectedAttendees: CalendarAttendeeItem[];
  onToggleAttendee: (item: CalendarAttendeeItem) => void;
}

function PeoplePanelSkeleton(): React.ReactElement {
  return (
    <div className="space-y-1" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-2.5 p-2">
          <Skeleton className="size-7 shrink-0 rounded-full" />
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
  ).length;

  const items = results.map((user) => {
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
  });

  const showSkeleton =
    !hasLoaded || (isLoading && query.trim() !== "" && items.length === 0);

  return (
    <CalendarPanelCard
      title="People"
      meta={`${selectedPeople} selected`}
      icon={Users}
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
        {showSkeleton ? (
          <PeoplePanelSkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-8 text-center text-xs text-muted-foreground">
            <SearchX aria-hidden className="size-4" />
            <span>No teammates found</span>
          </div>
        ) : (
          items.map(({ item, name }) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 rounded-lg p-2 ${
                  isSelected ? "bg-accent/60" : "hover:bg-muted/60"
                }`}
              >
                <Avatar
                  size="sm"
                  className={isSelected ? "ring-2 ring-background" : undefined}
                >
                  {item.image && <AvatarImage src={item.image} alt={name} />}
                  <AvatarFallback>{getPersonInitials(name)}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => onToggleAttendee(item)}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <span
                    className={`block truncate text-sm ${
                      isSelected ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.email}
                  </span>
                </button>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleAttendee(item)}
                  aria-label={`Include ${name}`}
                />
              </div>
            );
          })
        )}
      </div>
    </CalendarPanelCard>
  );
}
