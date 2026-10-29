"use client";

import * as React from "react";
import { useUserSearch } from "@/hooks/use-user-search";
import type { Teammate } from "@/services/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Check, Search, Plus, Loader2 } from "lucide-react";

export interface SelectedAttendee {
  id?: string;
  name?: string;
  email: string;
  avatarUrl?: string;
}

interface UserAutocompletePickerProps {
  value: SelectedAttendee[];
  onChange: (attendees: SelectedAttendee[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserAutocompletePicker({
  value,
  onChange,
  placeholder = "Search colleagues or enter email...",
  disabled = false,
}: UserAutocompletePickerProps) {
  const userSearch = useUserSearch({ limit: 8 });
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const query = userSearch.query;
  const setQuery = userSearch.setQuery;
  const isLoading = userSearch.isLoading;
  const results = userSearch.results;

  // Reset selected index when results change
  React.useEffect(() => {
    queueMicrotask(() => {
      setSelectedIndex(0);
    });
  }, [results]);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isValidEmail = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim());
  }, [query]);

  const isAlreadySelected = (email: string) => {
    return value.some((a) => a.email.toLowerCase() === email.toLowerCase());
  };

  const handleSelectUser = (user: Teammate) => {
    if (isAlreadySelected(user.email)) {
      handleRemove(user.email);
    } else {
      onChange([
        ...value,
        {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || user.image || undefined,
        },
      ]);
    }
    setQuery("");
  };

  const handleAddCustomEmail = () => {
    const trimmed = query.trim();
    if (isValidEmail && !isAlreadySelected(trimmed)) {
      onChange([
        ...value,
        {
          name: trimmed.split("@")[0],
          email: trimmed,
        },
      ]);
      setQuery("");
    }
  };

  const handleRemove = (email: string) => {
    onChange(
      value.filter((a) => a.email.toLowerCase() !== email.toLowerCase()),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectUser(results[selectedIndex]);
      } else if (isValidEmail) {
        handleAddCustomEmail();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      handleRemove(value[value.length - 1].email);
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Selected attendees chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((att) => {
            const initials = (att.name || att.email)
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <Badge
                key={att.email}
                variant="secondary"
                className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-normal"
              >
                <Avatar className="size-4">
                  <AvatarImage src={att.avatarUrl} />
                  <AvatarFallback className="text-[9px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[140px] truncate">
                  {att.name || att.email}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(att.email)}
                    className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-center">
        <Search className="text-muted-foreground pointer-events-none absolute left-2.5 size-3.5" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            value.length === 0 ? placeholder : "Add more attendees..."
          }
          className="h-9 pl-8 pr-8 text-xs"
        />
        {isLoading && (
          <Loader2 className="text-muted-foreground absolute right-2.5 size-3.5 animate-spin" />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="bg-popover text-popover-foreground border-border absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border p-1 text-xs shadow-md">
          {/* Custom guest email option */}
          {isValidEmail &&
            !results.some(
              (r) => r.email.toLowerCase() === query.trim().toLowerCase(),
            ) && (
              <button
                type="button"
                onClick={handleAddCustomEmail}
                className="border-border hover:bg-accent hover:text-accent-foreground text-primary mb-1 flex w-full cursor-pointer items-center gap-2 rounded border-b px-2 py-1.5 text-left text-xs font-medium"
              >
                <Plus className="size-3.5 shrink-0" />
                <span>
                  Add external guest:{" "}
                  <span className="underline">{query.trim()}</span>
                </span>
              </button>
            )}

          {/* Results list */}
          {results.length > 0
            ? results.map((u, idx) => {
                const selected = isAlreadySelected(u.email);
                const isFocused = idx === selectedIndex;
                const initials = (u.name || u.email)
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <button
                    key={u.id || u.email}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-left transition-colors ${
                      isFocused
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="size-5 shrink-0">
                        <AvatarImage
                          src={u.avatarUrl || u.image || undefined}
                        />
                        <AvatarFallback className="text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <div className="text-foreground truncate font-medium">
                          {u.name}
                        </div>
                        <div className="text-muted-foreground truncate text-[11px]">
                          {u.email} {u.department ? `• ${u.department}` : ""}
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <Check className="text-primary size-3.5 shrink-0" />
                    )}
                  </button>
                );
              })
            : !isLoading && (
                <div className="text-muted-foreground px-3 py-2 text-center text-xs">
                  {query.trim()
                    ? "No colleagues found."
                    : "Type to search colleagues"}
                </div>
              )}
        </div>
      )}
    </div>
  );
}
