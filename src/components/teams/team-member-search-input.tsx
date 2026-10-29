"use client";

import * as React from "react";
import { useUserSearch } from "@/hooks/use-user-search";
import type { Teammate } from "@/services/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";

export interface TeamMemberSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelectUser?: (user: Teammate) => void;
  onEnterPress?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TeamMemberSearchInput({
  value,
  onChange,
  onSelectUser,
  onEnterPress,
  placeholder = "Search teammate by name or email...",
  disabled = false,
}: TeamMemberSearchInputProps) {
  const userSearch = useUserSearch({ limit: 8 });

  React.useEffect(() => {
    userSearch.setQuery(value);
  }, [value, userSearch.setQuery]);

  const results = userSearch.results;
  const isLoading = userSearch.isLoading;

  const items = React.useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const list = [...results];
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (
      isValidEmail &&
      !list.some((u) => u.email.toLowerCase() === trimmed.toLowerCase())
    ) {
      list.unshift({ email: trimmed, name: trimmed, id: "invite-" + trimmed });
    }
    return list;
  }, [results, value]);

  const selectedItem = React.useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;
    return items.find((u) => u.email.toLowerCase() === trimmed) ?? null;
  }, [items, value]);

  return (
    <div className="relative flex-1">
      <Combobox
        items={items}
        filter={null}
        value={selectedItem}
        inputValue={value}
        onInputValueChange={(newVal) => onChange(newVal)}
        onValueChange={(selected: Teammate | null) => {
          if (selected) {
            onSelectUser?.(selected);
            onChange("");
          }
        }}
        isItemEqualToValue={(a: Teammate, b: Teammate) =>
          a?.email?.toLowerCase() === b?.email?.toLowerCase() || a?.id === b?.id
        }
        itemToStringLabel={(u: Teammate) => u?.email || u?.name || ""}
        itemToStringValue={(u: Teammate) => u?.email || ""}
      >
        <ComboboxInput
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.defaultPrevented) {
              onEnterPress?.();
            }
          }}
        />

        <ComboboxContent>
          <ComboboxEmpty>
            {isLoading ? "Searching teammates..." : "No teammates found."}
          </ComboboxEmpty>
          <ComboboxList>
            {(u: Teammate) => {
              const initials = (u.name || u.email)
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <ComboboxItem key={u.id || u.email} value={u}>
                  <Avatar>
                    <AvatarImage
                      src={u.image || u.avatarUrl || undefined}
                      alt={u.name || u.email}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="truncate">
                    <p className="text-foreground truncate text-xs font-medium leading-tight">
                      {u.name || u.email}
                    </p>
                    {u.name &&
                      u.email &&
                      u.name.toLowerCase() !== u.email.toLowerCase() && (
                        <p className="text-muted-foreground truncate text-[10px] leading-tight">
                          {u.email}
                        </p>
                      )}
                  </div>
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
