"use client";

import { useState, useEffect, useCallback } from "react";
import type { TeamRole } from "@/services/team/team-types";

export interface TeamMemberItem {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string | Date;
  isNew?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export interface TeamItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  role?: TeamRole;
}

export function useTeams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teams");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed  to fetch teams");
      }
      setTeams(Array.isArray(json) ? json : json.data || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch("/api/teams");
        const json = await res.json();
        if (ignore) return;
        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch teams");
        }
        setTeams(Array.isArray(json) ? json : json.data || []);
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const createTeam = async (data: {
    name: string;
    slug?: string;
    description?: string;
  }) => {
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to create team");
    }
    const created = json.data ?? json;
    setTeams((prev) => [created, ...prev]);
    return created as TeamItem;
  };

  const updateTeam = async (
    id: string,
    data: { name?: string; slug?: string; description?: string },
  ) => {
    const res = await fetch(`/api/teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to update team");
    }
    const updated = json.data ?? json;
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    );
    return updated as TeamItem;
  };

  const deleteTeam = async (id: string) => {
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to delete team");
    }
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    teams,
    isLoading,
    error,
    refresh: fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}
