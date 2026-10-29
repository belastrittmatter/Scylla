"use client";

import * as React from "react";
import type { TaskUser, Team } from "./task-types";
import type { WorkspaceTeamMember } from "@/services/task/workspace-types";

interface UseTeamAssigneesProps {
  selectedTeamId?: string;
  taskTeamId?: string;
  teams: Team[];
  allUsers: TaskUser[];
  initialTeamMembers?: WorkspaceTeamMember[];
}

const inflightMemberFetches = new Map<string, Promise<unknown>>();

export function useTeamAssignees({
  selectedTeamId,
  taskTeamId,
  teams,
  allUsers,
  initialTeamMembers = [],
}: UseTeamAssigneesProps) {
  const activeTeamId = taskTeamId || selectedTeamId;
  const [fetchedTeamMembers, setFetchedTeamMembers] = React.useState<
    WorkspaceTeamMember[]
  >([]);
  const [fetchedUsers, setFetchedUsers] = React.useState<TaskUser[]>([]);

  React.useEffect(() => {
    if (!activeTeamId) return;
    let isCancelled = false;

    let req = inflightMemberFetches.get(activeTeamId);
    if (!req) {
      req = fetch(`/api/teams/${activeTeamId}/members`)
        .then((res) => (res.ok ? res.json() : null))
        .finally(() => {
          inflightMemberFetches.delete(activeTeamId);
        });
      inflightMemberFetches.set(activeTeamId, req);
    }

    req
      .then((data) => {
        if (isCancelled || !Array.isArray(data)) return;
        const freshMembers: WorkspaceTeamMember[] = [];
        const extraUsers: TaskUser[] = [];

        for (const item of data) {
          const uid = item.userId || item.user?.id;
          if (uid) {
            freshMembers.push({
              id: item.id,
              teamId: activeTeamId,
              userId: uid,
              role: item.role || "member",
            });
            if (item.user) {
              extraUsers.push({
                id: item.user.id,
                name: item.user.name || "Member",
                email: item.user.email || "",
                role: item.role || "member",
                image: item.user.image,
                avatarUrl: item.user.image || "",
              });
            }
          }
        }

        setFetchedTeamMembers((prev) => {
          const rest = prev.filter((m) => m.teamId !== activeTeamId);
          return [...rest, ...freshMembers];
        });

        if (extraUsers.length > 0) {
          setFetchedUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const newOnes = extraUsers.filter((u) => !existingIds.has(u.id));
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch team members for assignee picker:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeTeamId]);

  const teamMembers = React.useMemo(() => {
    const map = new Map<string, WorkspaceTeamMember>();
    for (const m of initialTeamMembers) {
      map.set(`${m.teamId}-${m.userId}`, m);
    }
    for (const m of fetchedTeamMembers) {
      map.set(`${m.teamId}-${m.userId}`, m);
    }
    return Array.from(map.values());
  }, [initialTeamMembers, fetchedTeamMembers]);

  const assignees = React.useMemo(() => {
    if (!activeTeamId) return [];

    const combinedUsers = [...allUsers];
    const seenUserIds = new Set(combinedUsers.map((u) => u.id));
    for (const fu of fetchedUsers) {
      if (!seenUserIds.has(fu.id)) {
        combinedUsers.push(fu);
        seenUserIds.add(fu.id);
      }
    }

    const memberUserIds = new Set<string>();
    for (const m of teamMembers) {
      if (m.teamId === activeTeamId && m.userId) {
        memberUserIds.add(m.userId);
      }
    }

    const activeTeam = teams.find((t) => t.id === activeTeamId);
    if (activeTeam?.ownerId) {
      memberUserIds.add(activeTeam.ownerId);
    }

    return combinedUsers.filter((u) => memberUserIds.has(u.id));
  }, [activeTeamId, teamMembers, teams, allUsers, fetchedUsers]);

  return { assignees };
}
