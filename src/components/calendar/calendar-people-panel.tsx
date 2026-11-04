"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useUserSearch } from "@/hooks/use-user-search";
import { formatPersonName, getPersonInitials } from "@/lib/format-person-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CalendarPanelCard } from "./calendar-panel-card";
import type { CalendarAttendeeItem } from "./calendar-attendee-stack";

interface CalendarPeoplePanelProps {
  selectedAttendees: CalendarAttendeeItem[];
  onToggleAttendee: (item: CalendarAttendeeItem) => void;
}

export function CalendarPeoplePanel({
  selectedAttendees,
  onToggleAttendee,
}: CalendarPeoplePanelProps): React.ReactElement {
  const { query, setQuery, results, isLoading } = useUserSearch({
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

  return (
    <CalendarPanelCard title="People" meta={`${selectedPeople} selected`}>
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
        {items.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            {isLoading ? "Searching..." : "No teammates found"}
          </p>
        ) : (
          items.map(({ item, name }) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-muted/60"
            >
              <Avatar size="sm">
                {item.image && <AvatarImage src={item.image} alt={name} />}
                <AvatarFallback>{getPersonInitials(name)}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => onToggleAttendee(item)}
                className="min-w-0 flex-1 cursor-pointer text-left"
              >
                <span className="block truncate text-sm font-medium">
                  {name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.email}
                </span>
              </button>
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => onToggleAttendee(item)}
                aria-label={`Include ${name}`}
              />
            </div>
          ))
        )}
      </div>
    </CalendarPanelCard>
  );
}
