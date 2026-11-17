import {
  GITHUB_REPO_FORMAT_ERROR,
  isValidGithubRepoFullName,
  validateGithubRepoName,
} from "@/lib/github-validation";

export type GithubRepoSelection =
  | { mode: "none" }
  | { mode: "existing"; fullName: string }
  | { mode: "new"; name: string; isPrivate: boolean };

export function getGithubRepoSelectionError(
  selection: GithubRepoSelection,
): string | null {
  switch (selection.mode) {
    case "none":
      return null;
    case "existing":
      return isValidGithubRepoFullName(selection.fullName.trim())
        ? null
        : GITHUB_REPO_FORMAT_ERROR;
    case "new":
      return validateGithubRepoName(selection.name).error ?? null;
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
      return { githubRepo: selection.fullName.trim() };
    case "new":
      return {
        createNewRepo: {
          name: selection.name.trim(),
          isPrivate: selection.isPrivate,
        },
      };
  }
}
