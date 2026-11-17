import {
  GITHUB_REPO_FORMAT_ERROR,
  isValidGithubRepo,
  validateGithubRepoName,
} from "@/lib/github-validation";

export type GithubRepoSelection =
  | { mode: "none" }
  | { mode: "existing"; githubRepo: string }
  | { mode: "new"; name: string; isPrivate: boolean };

export const NO_GITHUB_REPO: GithubRepoSelection = { mode: "none" };

export interface GithubRepoOption {
  fullName: string;
  isPrivate: boolean;
  description: string | null;
}

export function getGithubRepoSelectionError(
  selection: GithubRepoSelection,
): string | null {
  switch (selection.mode) {
    case "none":
      return null;
    case "existing": {
      const value = selection.githubRepo.trim();
      if (!value) return "Enter a repository as owner/repo";
      return isValidGithubRepo(value) ? null : GITHUB_REPO_FORMAT_ERROR;
    }
    case "new": {
      const result = validateGithubRepoName(selection.name);
      return result.valid ? null : (result.error ?? null);
    }
  }
}

export function toProjectRepoPayload(selection: GithubRepoSelection): {
  githubRepo?: string;
  createNewRepo?: { name: string; isPrivate: boolean };
} {
  switch (selection.mode) {
    case "none":
      return {};
    case "existing":
      return { githubRepo: selection.githubRepo.trim() };
    case "new":
      return {
        createNewRepo: {
          name: selection.name.trim(),
          isPrivate: selection.isPrivate,
        },
      };
  }
}

export function filterGithubRepoOptions(
  options: readonly GithubRepoOption[],
  query: string,
  limit = 8,
): GithubRepoOption[] {
  const needle = query.trim().toLowerCase();
  return options
    .filter((option) => option.fullName.toLowerCase().includes(needle))
    .slice(0, limit);
}
