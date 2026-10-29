"use client";

import * as React from "react";
import { apiClient } from "@/lib/api-client";
import type { Teammate } from "@/services/user";

export interface UseUserSearchOptions {
  limit?: number;
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseUserSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: Teammate[];
  isLoading: boolean;
  error: Error | null;
  clear: () => void;
}

export function useUserSearch({
  limit = 8,
  debounceMs = 200,
  enabled = true,
}: UseUserSearchOptions = {}): UseUserSearchResult {
  const [query, setQueryState] = React.useState("");
  const [results, setResults] = React.useState<Teammate[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Cache known users client-side so keystrokes produce instant synchronous filtering
  const knownUsersRef = React.useRef<Map<string, Teammate>>(new Map());

  const filterKnown = React.useCallback(
    (q: string): Teammate[] => {
      const trimmed = q.trim().toLowerCase();
      const all = Array.from(knownUsersRef.current.values());
      if (!trimmed) return all.slice(0, limit);
      return all
        .filter(
          (u) =>
            u.name.toLowerCase().includes(trimmed) ||
            u.email.toLowerCase().includes(trimmed),
        )
        .slice(0, limit);
    },
    [limit],
  );

  const setQuery = React.useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);
      // Synchronously perform client-side filtering on all previously seen users
      const filtered = filterKnown(newQuery);
      if (filtered.length > 0) {
        setResults(filtered);
      }
    },
    [filterKnown],
  );

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const trimmed = query.trim();
    let active = true;

    const timer = setTimeout(async () => {
      // Only set isLoading if we have no client-side matches to display, avoiding UI flicker
      const currentFiltered = filterKnown(trimmed);
      if (currentFiltered.length === 0) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await apiClient.users.search(trimmed, limit);
        if (!active) return;

        let list: Teammate[] = Array.isArray(data)
          ? data
          : Array.isArray((data as { data?: Teammate[] })?.data)
            ? (data as { data: Teammate[] }).data
            : [];

        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        if (
          isValidEmail &&
          !list.some((u) => u.email.toLowerCase() === trimmed.toLowerCase())
        ) {
          list = [
            ...list,
            {
              id: "email-" + trimmed.toLowerCase(),
              name: trimmed.split("@")[0],
              email: trimmed,
            },
          ];
        }

        // Add newly returned users to known users cache
        for (const u of list) {
          const key = (u.email || u.id).toLowerCase();
          if (key) {
            knownUsersRef.current.set(key, u);
          }
        }

        setResults(list);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err : new Error("Failed to search users"),
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, limit, debounceMs, enabled, filterKnown]);

  const clear = React.useCallback(() => {
    setQueryState("");
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clear,
  };
}
