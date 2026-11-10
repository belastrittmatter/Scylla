"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { TeamMemberItem } from "@/hooks/use-teams";
import { ROLE_PRIORITY, type TeamRole } from "@/services/team/team-types";

const byRole = (a: TeamMemberItem, b: TeamMemberItem) =>
  ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];

async function call<T = unknown>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

/** Members of a team; each mutation hits the API at once (the API enforces admin/owner). */
export function useTeamMembers(teamId: string) {
  const base = `/api/teams/${teamId}/members`;
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    call<TeamMemberItem[]>(base, "GET")
      .then((data) => !ignore && setMembers([...data].sort(byRole)))
      .catch((e: Error) => !ignore && toast.error(e.message))
      .finally(() => !ignore && setIsLoading(false));
    return () => {
      ignore = true;
    };
  }, [base]);

  const addMember = async (email: string, role: TeamRole) => {
    const added = await call<TeamMemberItem>(base, "POST", { email, role });
    setMembers((prev) => [...prev, added].sort(byRole));
  };

  const updateRole = async (userId: string, role: TeamRole) => {
    await call(`${base}/${userId}`, "PATCH", { role });
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role } : m)).sort(byRole),
    );
  };

  const removeMember = async (userId: string) => {
    await call(`${base}/${userId}`, "DELETE");
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  return { members, isLoading, addMember, updateRole, removeMember };
}
