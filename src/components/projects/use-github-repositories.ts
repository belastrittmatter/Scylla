"use client";

import { useEffect, useState } from "react";
import type { GithubRepoOption } from "./github-repo-selection";

interface GithubRepositoriesState {
  repositories: GithubRepoOption[];
  connected: boolean;
  isLoading: boolean;
}

const IDLE: GithubRepositoriesState = {
  repositories: [],
  connected: false,
  isLoading: false,
};

interface ReposResponse {
  connected?: boolean;
  repositories?: Array<{
    fullName: string;
    isPrivate: boolean;
    description: string | null;
  }>;
}

export function useGithubRepositories(
  enabled: boolean,
): GithubRepositoriesState {
  const [result, setResult] = useState<GithubRepositoriesState | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    const load = async () => {
      let next = IDLE;
      try {
        const res = await fetch("/api/github/repos");
        if (res.ok) {
          const json = (await res.json()) as ReposResponse;
          next = {
            connected: json.connected === true,
            isLoading: false,
            repositories: (json.repositories ?? []).map((r) => ({
              fullName: r.fullName,
              isPrivate: r.isPrivate,
              description: r.description ?? null,
            })),
          };
        }
      } catch {
        next = IDLE;
      }
      if (!ignore) setResult(next);
    };
    void load();
    return () => {
      ignore = true;
      setResult(null);
    };
  }, [enabled]);

  if (!enabled) return IDLE;
  return result ?? { ...IDLE, isLoading: true };
}
