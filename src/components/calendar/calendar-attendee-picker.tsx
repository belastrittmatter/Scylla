"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { EntityInputCombobox } from "@/components/ui/entity-input-combobox";
import { TeammateOption } from "@/components/teams/teammate-option";
import {
  INVITE_ID_PREFIX,
  useTeammateOptions,
} from "@/hooks/use-teammate-options";
import type { Teammate } from "@/services/user";
import type { SelectedAttendee } from "./calendar-attendee-types";

interface CalendarAttendeePickerProps {
  value: SelectedAttendee[];
  onChange: (attendees: SelectedAttendee[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Multi-select attendee search (directory users or a typed external email). */
export function CalendarAttendeePicker({
  value,
  onChange,
  placeholder = "Search colleagues or enter email...",
  disabled,
}: CalendarAttendeePickerProps) {
  const [query, setQuery] = React.useState("");
  const { items, isLoading } = useTeammateOptions(query, { showEmpty: true });
  const email = (a: { email: string }) => a.email.toLowerCase();
  const selectedUsers = value.map((a) => ({
    ...a,
    id: a.id ?? a.email,
    name: a.name ?? a.email,
  }));

  return (
    <EntityInputCombobox
      items={items}
      getKey={(u: Teammate) => email(u)}
      getLabel={(u) => u.email}
      query={query}
      onQueryChange={setQuery}
      selected={selectedUsers}
      autoHighlight
      disabled={disabled}
      placeholder={value.length ? "Add more attendees..." : placeholder}
      emptyText={
        isLoading
          ? "Searching..."
          : query.trim()
            ? "No colleagues found."
            : "Type to search colleagues"
      }
      renderChip={(u) => u.name || u.email}
      renderItem={(u) =>
        u.id.startsWith(INVITE_ID_PREFIX) ? (
          <span className="text-primary flex items-center gap-2 text-xs font-medium">
            <Plus className="size-3.5 shrink-0" />
            Add external guest: <span className="underline">{u.email}</span>
          </span>
        ) : (
          <TeammateOption user={u} />
        )
      }
      onToggle={(u) => {
        const exists = value.some((a) => email(a) === email(u));
        onChange(
          exists
            ? value.filter((a) => email(a) !== email(u))
            : [
                ...value,
                {
                  name: u.id.startsWith(INVITE_ID_PREFIX)
                    ? u.email.split("@")[0]
                    : u.name,
                  email: u.email,
                  avatarUrl: u.avatarUrl || u.image || undefined,
                },
              ],
        );
        setQuery("");
      }}
    />
  );
}
