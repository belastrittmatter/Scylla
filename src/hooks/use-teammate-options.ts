"use client";

import * as React from "react";
import { useUserSearch } from "@/hooks/use-user-search";
import { isFullEmail } from "@/lib/format-person-name";
import type { Teammate } from "@/services/user";

export const INVITE_ID_PREFIX = "invite-";

/** Server-searched teammates for `query`, plus an "invite" row for an unknown full email. */
export function useTeammateOptions(query: string, { showEmpty = false } = {}) {
  const { setQuery, results, isLoading } = useUserSearch({ limit: 8 });

  React.useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  const items = React.useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return showEmpty ? results : [];
    const list = results.filter((u) => !u.id.startsWith("email-"));
    if (
      isFullEmail(trimmed) &&
      !list.some((u) => u.email.toLowerCase() === trimmed.toLowerCase())
    ) {
      list.unshift({
        email: trimmed,
        name: trimmed,
        id: INVITE_ID_PREFIX + trimmed,
      } satisfies Teammate);
    }
    return list;
  }, [results, query, showEmpty]);

  return { items, isLoading };
}
