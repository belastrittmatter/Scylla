"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NO_GITHUB_REPO,
  filterGithubRepoOptions,
  getGithubRepoSelectionError,
  type GithubRepoOption,
  type GithubRepoSelection,
} from "./github-repo-selection";

export interface GithubRepoSelectorProps {
  value: GithubRepoSelection;
  onChange: (value: GithubRepoSelection) => void;
  repositories: GithubRepoOption[];
  connected: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

const MODES: Array<{
  mode: GithubRepoSelection["mode"];
  label: string;
  initial: GithubRepoSelection;
}> = [
  { mode: "none", label: "No repository", initial: NO_GITHUB_REPO },
  {
    mode: "existing",
    label: "Use existing",
    initial: { mode: "existing", githubRepo: "" },
  },
  {
    mode: "new",
    label: "Create new",
    initial: { mode: "new", name: "", isPrivate: true },
  },
];

function ExistingPanel({
  githubRepo,
  onChange,
  repositories,
  isLoading,
  disabled,
}: {
  githubRepo: string;
  onChange: (value: GithubRepoSelection) => void;
  repositories: GithubRepoOption[];
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const options = filterGithubRepoOptions(repositories, githubRepo);
  return (
    <div className="grid gap-1.5">
      <Input
        id="github-repo-input"
        placeholder="owner/repo"
        value={githubRepo}
        disabled={disabled}
        onChange={(e) =>
          onChange({ mode: "existing", githubRepo: e.target.value })
        }
      />
      {isLoading ? (
        <p className="text-muted-foreground text-xs">Loading repositories…</p>
      ) : (
        options.length > 0 && (
          <div className="grid max-h-36 gap-0.5 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.fullName}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({ mode: "existing", githubRepo: option.fullName })
                }
                className="hover:bg-muted flex items-center justify-between rounded px-2 py-1 text-left text-xs disabled:opacity-50"
              >
                <span>{option.fullName}</span>
                {option.isPrivate && (
                  <span className="text-muted-foreground">Private</span>
                )}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function NewPanel({
  name,
  isPrivate,
  onChange,
  disabled,
}: {
  name: string;
  isPrivate: boolean;
  onChange: (value: GithubRepoSelection) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Input
        id="github-repo-name"
        placeholder="new-repository-name"
        value={name}
        disabled={disabled}
        onChange={(e) =>
          onChange({ mode: "new", name: e.target.value, isPrivate })
        }
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="github-repo-private"
          checked={isPrivate}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChange({ mode: "new", name, isPrivate: checked === true })
          }
        />
        <Label htmlFor="github-repo-private" className="text-xs">
          Private repository
        </Label>
      </div>
    </div>
  );
}

export function GithubRepoSelector({
  value,
  onChange,
  repositories,
  connected,
  isLoading,
  disabled,
}: GithubRepoSelectorProps) {
  const error = getGithubRepoSelectionError(value);
  return (
    <div className="grid gap-1.5">
      <Label>GitHub repository</Label>
      <div className="flex flex-wrap gap-1.5">
        {MODES.map(({ mode, label, initial }) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={value.mode === mode ? "default" : "outline"}
            aria-pressed={value.mode === mode}
            disabled={disabled}
            onClick={() => onChange(initial)}
          >
            {label}
          </Button>
        ))}
      </div>
      {value.mode === "existing" && (
        <ExistingPanel
          githubRepo={value.githubRepo}
          onChange={onChange}
          repositories={repositories}
          isLoading={isLoading}
          disabled={disabled}
        />
      )}
      {value.mode === "new" && (
        <NewPanel
          name={value.name}
          isPrivate={value.isPrivate}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {value.mode !== "none" && !connected && (
        <p className="text-muted-foreground text-xs">
          <Link href="/account/settings" className="underline">
            Connect your GitHub account in Account Settings to link a
            repository.
          </Link>
        </p>
      )}
    </div>
  );
}
