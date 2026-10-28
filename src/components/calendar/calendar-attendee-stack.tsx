"use client";

import * as React from "react";
import { Search, Plus, Check, Building2, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { useUserSearch } from "@/hooks/use-user-search";

export interface CalendarAttendeeItem {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  type: "user" | "room";
  details?: string;
}

interface CalendarAttendeeStackProps {
  currentUser?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  selectedAttendees: CalendarAttendeeItem[];
  onToggleAttendee: (item: CalendarAttendeeItem) => void;
  onRemoveAttendee: (id: string) => void;
  onClearAll?: () => void;
  isCalculatingSlots?: boolean;
}

export function CalendarAttendeeStack({
  currentUser,
  selectedAttendees,
  onToggleAttendee,
  onRemoveAttendee,
  onClearAll,
  isCalculatingSlots = false,
}: CalendarAttendeeStackProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "users" | "rooms">("all");

  const userSearch = useUserSearch({ enabled: isOpen, limit: 20 });
  const [availableRooms, setAvailableRooms] = React.useState<CalendarAttendeeItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = React.useState(false);

  // Load available rooms ONCE when popover opens
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingRooms(true);

    apiClient.rooms
      .list()
      .then((rooms) => {
        if (!isMounted) return;
        const mappedRooms: CalendarAttendeeItem[] = rooms.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          image: null,
          type: "room",
          details: `${r.building || "Main Office"}${r.floor ? ` • Floor ${r.floor}` : ""} • ${r.capacity} seats`,
        }));
        setAvailableRooms(mappedRooms);
      })
      .catch(() => {
        if (isMounted) setAvailableRooms([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRooms(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const searchQuery = userSearch.query;
  const setSearchQuery = userSearch.setQuery;
  const isLoadingData = userSearch.isLoading || isLoadingRooms;

  const availableUsers = React.useMemo(() => {
    return userSearch.results
      .filter((u) => u.email !== currentUser?.email)
      .map((u): CalendarAttendeeItem => ({
        id: u.id || u.email,
        name: u.name || u.email.split("@")[0],
        email: u.email,
        image: u.image,
        type: "user",
        details: u.title || u.department || "Teammate",
      }));
  }, [userSearch.results, currentUser?.email]);

  // Filtered lists for the popover picker
  const filteredList = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let items: CalendarAttendeeItem[] = [];
    if (activeFilter === "all" || activeFilter === "users") {
      items = items.concat(availableUsers);
    }
    if (activeFilter === "all" || activeFilter === "rooms") {
      items = items.concat(availableRooms);
    }

    let result = items;
    if (q) {
      result = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          (item.details && item.details.toLowerCase().includes(q))
      );
    }

    // If query is an email address and not yet in the list, allow direct selection
    if (q.includes("@") && !result.some((it) => it.email.toLowerCase() === q)) {
      const isRoom = q.includes("resource.calendar.google.com") || q.includes("room");
      result = [
        {
          id: q,
          name: q.split("@")[0],
          email: searchQuery.trim(),
          image: null,
          type: isRoom ? "room" : "user",
          details: `Direct Google Workspace ${isRoom ? "Room" : "Email"}`,
        },
        ...result,
      ];
    }

    return result;
  }, [availableUsers, availableRooms, activeFilter, searchQuery]);

  const selectedIds = React.useMemo(
    () => new Set(selectedAttendees.map((a) => a.id)),
    [selectedAttendees]
  );

  return (
    <div className="flex items-center gap-2">
      {/* Stack of Avatars */}
      <div className="flex items-center -space-x-2 overflow-visible">
        {/* Current user's avatar (Always first) */}
        <div className="group relative z-30">
          <div
            className="group relative flex cursor-pointer items-center justify-center rounded-full hover:z-40 focus:outline-none"
            title={`${currentUser?.name || "You"} (${currentUser?.email || "No email"})`}
          >
            <UserAvatar
              user={currentUser}
              className="size-8.5 shadow-2xs border-2 border-white dark:border-neutral-900"
            />
          </div>
        </div>

        {/* Selected Attendees Avatars */}
        {selectedAttendees.map((att, idx) => {
          const zIndex = 25 - idx;

          return (
            <div key={att.id} className="group relative" style={{ zIndex: Math.max(1, zIndex) }}>
              <button
                type="button"
                onClick={() => onRemoveAttendee(att.id)}
                className="group relative flex cursor-pointer items-center justify-center rounded-full transition-transform hover:z-40 focus:outline-none group-hover:scale-105"
                title={`${att.name} (${att.email}) - Click to remove`}
              >
                {att.type === "room" ? (
                  <div className="size-8.5 shadow-2xs relative flex items-center justify-center rounded-full border-2 border-white bg-purple-600 text-white dark:border-neutral-900">
                    <Building2 className="size-4" />
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-purple-500 dark:border-neutral-900" />
                  </div>
                ) : (
                  <UserAvatar
                    user={{
                      name: att.name,
                      email: att.email,
                      image: att.image,
                    }}
                    className="size-8.5 shadow-2xs border-2 border-white dark:border-neutral-900"
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* (+) Add Button & Popover Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="size-8.5 shadow-2xs relative flex cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-neutral-300 bg-white p-0 text-neutral-600 hover:border-orange-500 hover:bg-neutral-50 hover:text-orange-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-orange-500 dark:hover:bg-neutral-800 dark:hover:text-orange-400"
              title="Add teammates or meeting rooms to compare busy schedules"
            >
              {isCalculatingSlots ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              ) : (
                <Plus className="size-4" />
              )}
              {selectedAttendees.length > 0 && (
                <span className="shadow-2xs absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                  {selectedAttendees.length}
                </span>
              )}
            </Button>
          }
        />

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-84 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-orange-600 dark:text-orange-400" />
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Check Busy Schedules
              </h3>
            </div>
            {selectedAttendees.length > 0 && onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="cursor-pointer text-[11px] text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50/70 pl-8 pr-3 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200 dark:focus:border-orange-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="mt-2 flex items-center gap-1.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "users", label: "Teammates" },
                { id: "rooms", label: "Meeting Rooms" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  activeFilter === tab.id
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-0.5">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-6 text-xs text-neutral-400">
                <span>Loading from Google...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                No teammates or rooms found.
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleAttendee(item)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg p-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-orange-500/10 text-neutral-900 dark:bg-orange-950/40 dark:text-neutral-100"
                        : "text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800/70"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {/* Avatar */}
                      {item.type === "room" ? (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                          <Building2 className="size-3.5" />
                        </div>
                      ) : (
                        <UserAvatar
                          user={{
                            name: item.name,
                            email: item.email,
                            image: item.image,
                          }}
                          className="size-7 shrink-0"
                        />
                      )}

                      {/* Info */}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{item.name}</span>
                        <span className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                          {item.type === "room" ? item.details : item.email}
                        </span>
                        {item.type !== "room" && item.details && (
                          <span className="truncate text-[10px] text-neutral-400 dark:text-neutral-500">
                            {item.details}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Checkmark or Plus */}
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? "border-orange-500 bg-orange-500 text-white dark:border-orange-500 dark:bg-orange-500"
                          : "border-neutral-300 bg-white text-transparent dark:border-neutral-700 dark:bg-neutral-800"
                      }`}
                    >
                      <Check className="size-3.5" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer status */}
          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <span className="text-[11px]">
              Selected:{" "}
              <strong className="text-neutral-800 dark:text-neutral-200">
                {selectedAttendees.length + 1}
              </strong>{" "}
              (you + {selectedAttendees.length})
            </span>
            <Button
              type="button"
              size="xs"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer text-xs font-medium"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
