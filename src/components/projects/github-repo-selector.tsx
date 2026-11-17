"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { GithubRepositorySummary } from "@/services/github/github-repo-service";
import {
  getGithubRepoSelectionError,
  type GithubRepoSelection,
} from "./github-repo-selection";

type Props = {
  value: GithubRepoSelection;
  onChange: (next: GithubRepoSelection) => void;
  disabled?: boolean;
};

type ReposState = {
  connected: boolean;
  repositories: GithubRepositorySummary[];
};

const CHOICES: { mode: GithubRepoSelection["mode"]; label: string }[] = [
  { mode: "none", label: "No repository" },
  { mode: "existing", label: "Link existing repository" },
  { mode: "new", label: "Create new repository" },
];

function initialSelection(mode: GithubRepoSelection["mode"]) {
  if (mode === "existing") return { mode, fullName: "" } as const;
  if (mode === "new") return { mode, name: "", isPrivate: true } as const;
  return { mode } as const;
}

/** Repositories of the signed-in user; loaded once the mode is first needed. */
function useUserRepos(enabled: boolean) {
  const [state, setState] = useState<ReposState | null>(null);
  useEffect(() => {
    if (!enabled || state) return;
    let ignore = false;
    fetch("/api/github/repos")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: ReposState | null) => {
        if (!ignore && json) setState(json);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [enabled, state]);
  return state;
}

export function GithubRepoSelector({ value, onChange, disabled }: Props) {
  const repos = useUserRepos(value.mode !== "none");
  const hasInput =
    value.mode === "existing"
      ? value.fullName.trim() !== ""
      : value.mode === "new"
        ? value.name.trim() !== ""
        : false;
  const error = hasInput ? getGithubRepoSelectionError(value) : null;

  return (
    <div className="grid gap-2">
      <Label>GitHub Repository</Label>
      <div
        className="grid gap-1"
        role="radiogroup"
        aria-label="GitHub Repository"
      >
        {CHOICES.map(({ mode, label }) => (
          <label key={mode} className="flex items-center gap-2 text-xs">
            <input
              type="radio"
              name="github-repo-mode"
              checked={value.mode === mode}
              disabled={disabled}
              onChange={() =>
                value.mode !== mode && onChange(initialSelection(mode))
              }
            />
            {label}
          </label>
        ))}
      </div>

      {value.mode !== "none" && repos && !repos.connected && (
        <p className="text-muted-foreground text-xs">
          Connect GitHub in{" "}
          <Link href="/account/settings" className="underline">
            Account Settings
          </Link>{" "}
          to pick or create a repository.
        </p>
      )}

      {value.mode === "existing" && (
        <>
          <Input
            placeholder="owner/repo"
            value={value.fullName}
            disabled={disabled}
            onChange={(e) =>
              onChange({ mode: "existing", fullName: e.target.value })
            }
          />
          {repos && repos.repositories.length > 0 && (
            <ul className="max-h-32 overflow-y-auto rounded-md border text-xs">
              {repos.repositories.map((repo) => (
                <li key={repo.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    className="hover:bg-muted w-full px-2 py-1 text-left"
                    onClick={() =>
                      onChange({ mode: "existing", fullName: repo.fullName })
                    }
                  >
                    {repo.fullName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {value.mode === "new" && (
        <>
          <Input
            placeholder="repository-name"
            aria-label="Repository name"
            value={value.name}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={value.isPrivate}
              disabled={disabled}
              onCheckedChange={(isPrivate) => onChange({ ...value, isPrivate })}
            />
            Private repository
          </label>
        </>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
