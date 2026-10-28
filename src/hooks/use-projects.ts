"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProjectStatus } from "@/services/project/project-types";

export interface ProjectItem {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  color: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function useProjects(teamId?: string) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = teamId ? `/api/projects?teamId=${encodeURIComponent(teamId)}` : "/api/projects";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch projects");
      }
      setProjects(Array.isArray(json) ? json : json.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const url = teamId ? `/api/projects?teamId=${encodeURIComponent(teamId)}` : "/api/projects";
        const res = await fetch(url);
        const json = await res.json();
        if (ignore) return;
        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch projects");
        }
        setProjects(Array.isArray(json) ? json : json.data || []);
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
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
  }, [teamId]);

  const createProject = async (data: {
    name: string;
    teamId: string;
    slug?: string;
    description?: string;
    status?: ProjectStatus;
    color?: string;
  }) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to create project");
    }
    const created = json.data ?? json;
    setProjects((prev) => [created, ...prev]);
    return created as ProjectItem;
  };

  const updateProject = async (
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      status?: ProjectStatus;
      color?: string | null;
    }
  ) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to update project");
    }
    const updated = json.data ?? json;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    return updated as ProjectItem;
  };

  const deleteProject = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to delete project");
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    projects,
    isLoading,
    error,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
