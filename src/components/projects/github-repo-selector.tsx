"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn, slugify } from "@/lib/utils";
import { validateGithubRepoName } from "@/lib/github-validation";
import type { GitHubRepositoryItem } from "@/services/github/github-sync-service";
import { GitHubRepoCreateForm } from "./github-repo-create-form";
import { GitHubRepoPopoverList } from "./github-repo-popover-list";
import {
  GitHubRepoModeToggle,
  GitHubRepoSelectTrigger,
} from "./github-repo-select-mode";
import { GitHubRepoLinkedChip } from "./github-repo-linked-chip";

export interface GitHubRepoCreationConfig {
  mode: "select" | "create";
  newRepoName: string;
  isPrivate: boolean;
  isValid: boolean;
  error?: string;
}

export interface GitHubRepoSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectRepo?: (repo: GitHubRepositoryItem | null) => void;
  disabled?: boolean;
  suggestedName?: string;
  projectDescription?: string;
  onCreationConfigChange?: (config: GitHubRepoCreationConfig) => void;
}

export function GitHubRepoSelector({
  value,
  onChange,
  onSelectRepo,
  disabled = false,
  suggestedName = "",
  projectDescription: _projectDescription = "",
  onCreationConfigChange,
}: GitHubRepoSelectorProps) {
  const [repositories, setRepositories] = useState<GitHubRepositoryItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Mode: "select" (existing repo) | "create" (unified new repo on submit)
  const [mode, setMode] = useState<"select" | "create">("select");
  const [newRepoName, setNewRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState<boolean>(true);

  // Derive owner login from existing repos if available
  const ownerLogin = useMemo(() => {
    if (repositories.length > 0) {
      const first = repositories[0].fullName;
      const parts = first.split("/");
      if (parts.length === 2) return parts[0];
    }
    return "github";
  }, [repositories]);

  // Real-time validation of repository name
  const effectiveName = useMemo(() => {
    if (newRepoName.trim()) return newRepoName.trim();
    if (suggestedName.trim()) return slugify(suggestedName);
    return "";
  }, [newRepoName, suggestedName]);

  const validation = useMemo(
    () => validateGithubRepoName(effectiveName),
    [effectiveName],
  );

  // Notify parent component of creation config changes for unified form submission
  useEffect(() => {
    if (mode === "create") {
      onCreationConfigChange?.({
        mode: "create",
        newRepoName: validation.cleanName,
        isPrivate,
        isValid: validation.valid,
        error: validation.error,
      });
    } else {
      onCreationConfigChange?.({
        mode: "select",
        newRepoName: "",
        isPrivate: true,
        isValid: true,
      });
    }
  }, [mode, validation, isPrivate, onCreationConfigChange]);

  const loadRepos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/github/repos");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setIsConnected(Boolean(json.data.connected));
          setRepositories(json.data.repositories || []);
        } else {
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch("/api/github/repos");
        if (ignore) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setIsConnected(Boolean(json.data.connected));
            setRepositories(json.data.repositories || []);
          } else {
            setIsConnected(false);
          }
        } else {
          setIsConnected(false);
        }
      } catch {
        if (!ignore) setIsConnected(false);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void init();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredRepos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return repositories;
    return repositories.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)),
    );
  }, [repositories, searchQuery]);

  const selectedRepo = useMemo(
    () => repositories.find((r) => r.fullName === value) || null,
    [repositories, value],
  );

  const handleSelect = (repoFullName: string) => {
    onChange(repoFullName);
    if (onSelectRepo) {
      const found =
        repositories.find((r) => r.fullName === repoFullName) || null;
      onSelectRepo(found);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange("");
    if (onSelectRepo) {
      onSelectRepo(null);
    }
    setSearchQuery("");
  };

  const handleSwitchMode = (newMode: "select" | "create") => {
    setMode(newMode);
    if (newMode === "create") {
      onChange("");
      if (onSelectRepo) onSelectRepo(null);
      if (!newRepoName && suggestedName) {
        setNewRepoName(slugify(suggestedName));
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <GitHubRepoModeToggle
        mode={mode}
        isConnected={isConnected}
        onSwitchMode={handleSwitchMode}
      />

      {/* Mode: Select Existing Repo */}
      {mode === "select" ? (
        <div className="flex items-center gap-1.5">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <GitHubRepoSelectTrigger
              disabled={disabled}
              isLoading={isLoading}
              isConnected={isConnected}
              value={value}
              selectedRepo={selectedRepo}
              onClear={handleClear}
            />

            <PopoverContent className="w-[340px] p-0 shadow-md" align="start">
              {/* Quick switch to create from within popover */}
              <div className="border-b border-border/80 p-1.5 bg-muted/20">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-7 text-xs font-medium text-primary hover:text-primary gap-1.5"
                  onClick={() => {
                    setIsOpen(false);
                    handleSwitchMode("create");
                  }}
                >
                  <Plus className="size-3.5" />
                  <span>Create new repository on GitHub...</span>
                </Button>
              </div>

              {/* Search & Repositories List */}
              <GitHubRepoPopoverList
                value={value}
                searchQuery={searchQuery}
                filteredRepos={filteredRepos}
                onSearchChange={setSearchQuery}
                onSelect={handleSelect}
              />
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            title="Refresh repositories from GitHub"
            disabled={isLoading || isConnected === false}
            onClick={() => void loadRepos()}
          >
            <RefreshCw
              className={cn("size-3.5", isLoading && "animate-spin")}
            />
          </Button>
        </div>
      ) : (
        /* Mode: Create New Repo (Unified on form submit) */
        <GitHubRepoCreateForm
          ownerLogin={ownerLogin}
          newRepoName={newRepoName}
          suggestedName={suggestedName}
          isPrivate={isPrivate}
          disabled={disabled}
          effectiveName={effectiveName}
          validation={validation}
          onNewRepoNameChange={setNewRepoName}
          onIsPrivateChange={setIsPrivate}
        />
      )}

      {/* Currently Selected Repository Chip & Notices */}
      <GitHubRepoLinkedChip
        value={value}
        mode={mode}
        isConnected={isConnected}
        isLoading={isLoading}
        repoCount={repositories.length}
      />
    </div>
  );
}
